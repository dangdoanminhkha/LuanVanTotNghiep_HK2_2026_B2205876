"""
train.py – Script huấn luyện (train) và lưu model Hybrid Recommender v2.

Cách dùng:
    python train.py

Lưu file model tại: ml/models/hybrid_recommender.pkl
Đọc cấu hình DB từ file .env (hoặc biến môi trường).

Optimizations (v2):
  1. Price weight amplification (PRICE_WEIGHT=5.0)
  2. Gender preference ratio >= 0.80
  3. AlternatingLeastSquares (ALS) thay TruncatedSVD
  4. Trending Products fallback cho cold start
"""

import sys
import io

# Set stdout/stderr to UTF-8 để fix lỗi encoding tiếng Việt trên Windows PowerShell
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import os
import time
import json

import mysql.connector
import pandas as pd

# Đọc .env: ưu tiên ml/.env, fallback về root project .env
try:
    from dotenv import load_dotenv
    ml_env  = os.path.join(os.path.dirname(__file__), ".env")
    root_env = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(ml_env):
        load_dotenv(ml_env)
    elif os.path.exists(root_env):
        load_dotenv(root_env)
except ImportError:
    pass

from recommender import HybridRecommender
from image_search import ImageSearcher, HAS_CLIP

# ── Cấu hình Database ─────────────────────────────────────────────────────────
DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     int(os.getenv("DB_PORT", 3306)),
    "user":     os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "admin123"),
    "database": os.getenv("DB_NAME", "shoestore"),
    "charset":  "utf8mb4",
}

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "hybrid_recommender.pkl")

# ── Trọng số Hybrid (có thể điều chỉnh) ──────────────────────────────────────
CF_WEIGHT  = float(os.getenv("CF_WEIGHT",  0.7))
CBF_WEIGHT = float(os.getenv("CBF_WEIGHT", 0.3))
N_COMPONENTS = int(os.getenv("SVD_COMPONENTS", 50))

# ── Tham số ALS (AlternatingLeastSquares) ────────────────────────────────────
ALS_FACTORS = int(os.getenv("ALS_FACTORS", 50))        # Số feature factors
ALS_ITERATIONS = int(os.getenv("ALS_ITERATIONS", 15))  # Số lần lặp


# ── Load dữ liệu từ MySQL ─────────────────────────────────────────────────────

def load_products(conn) -> pd.DataFrame:
    """Load bảng products với tên brand/category đầy đủ qua JOIN."""
    # Thử query với JOIN (DB đã chuẩn hoá dùng FK)
    # Schema hiện tại: brand_id (FK) + category_id (FK)
    query_fk = """
        SELECT
            p.id,
            p.name,
            p.price,
            p.gender,
            p.tags,
            p.specification,
            b.name AS brand,
            c.name AS category
        FROM products p
        LEFT JOIN brands     b ON p.brand_id    = b.id
        LEFT JOIN categories c ON p.category_id = c.id
    """
    # Fallback 1: brand text + category_id FK (schema hỗn hợp)
    query_mixed = """
        SELECT
            p.id,
            p.name,
            p.price,
            p.gender,
            p.tags,
            p.specification,
            p.brand,
            c.name AS category
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
    """
    # Fallback 2: hoàn toàn dùng text columns (schema cũ nhất)
    query_text = """
        SELECT
            id,
            name,
            price,
            brand,
            category,
            gender,
            tags,
            specification
        FROM products
    """

    for query in (query_fk, query_mixed, query_text):
        try:
            df = pd.read_sql(query, conn)
            print(f"  Products query OK. Columns: {list(df.columns)}")
            return df
        except Exception as e:
            print(f"  Products query failed ({e}), thử fallback...")

    raise RuntimeError("Không thể load bảng products!")


def load_behavior(conn) -> pd.DataFrame:
    """Load bảng user_behavior_logs, lấy các action có trọng số cho recommender."""
    query = """
        SELECT
            user_id,
            product_id,
            action,
            CASE
                WHEN action = 'review_rating'
                    THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(extra_info, '$.rating')) AS DECIMAL(4,2))
                ELSE NULL
            END AS rating
        FROM user_behavior_logs
        WHERE product_id IS NOT NULL
          AND action IN ('view', 'add_to_cart', 'like', 'purchase', 'return', 'review_rating')
    """
    try:
        df = pd.read_sql(query, conn)
        return df
    except Exception:
        # Thử tên bảng cũ (không có 's' ở cuối – được dùng trong mock script)
        query_alt = query.replace("user_behavior_logs", "user_behavior_log")
        df = pd.read_sql(query_alt, conn)
        return df


def load_products_for_image_cache(conn) -> list:
    """Load products với image URL để cache embeddings."""
    query = """
        SELECT id, image FROM products WHERE image IS NOT NULL AND image != ''
    """
    try:
        df = pd.read_sql(query, conn)
        products = [{"id": row["id"], "image": row["image"]} for _, row in df.iterrows()]
        return products
    except Exception as e:
        print(f"  [WARN] Không thể load products để cache embeddings: {e}")
        return []


def load_variant_images_for_cache(conn) -> list:
    """Load variant images (chỉ 1 variant per color, không lấy hết size).
    
    Cấu trúc: Product -> Colors -> Sizes
    Chúng ta chỉ lấy 1 variant đại diện per color (size nhỏ nhất)
    Kết quả: ~48 products × 3 colors = ~144 ảnh unique
    """
    try:
        cursor = conn.cursor(dictionary=True)
        # Load all variants, will GROUP in Python to avoid MySQL only_full_group_by mode
        cursor.execute("""
            SELECT 
                pv.id,
                pv.product_id,
                pv.color,
                pv.size,
                pv.images
            FROM product_variants pv
            WHERE pv.images IS NOT NULL 
                AND pv.images != ''
                AND pv.color IS NOT NULL 
                AND pv.color != ''
            ORDER BY pv.product_id, pv.color, pv.size ASC
        """)
        result = cursor.fetchall()
        cursor.close()
        
        # Lấy 1 variant per color (first/smallest size)
        seen = {}  # Key: (product_id, color)
        variant_images = []
        
        for row in result:
            product_id = row['product_id']
            variant_id = row['id']
            color = row['color']
            images_json = row['images']
            
            # Skip nếu đã lấy color này rồi
            key = (product_id, color)
            if key in seen:
                continue
            seen[key] = True
            
            # Parse JSON images
            try:
                if isinstance(images_json, str):
                    images = json.loads(images_json)
                else:
                    images = images_json
                
                if isinstance(images, list):
                    for idx, img_url in enumerate(images):
                        if img_url and isinstance(img_url, str):
                            # Unique ID: var_{color}_{product_id}_{image_index}
                            unique_id = f"var_{product_id}_{color}_{idx}"
                            variant_images.append({
                                "id": unique_id,
                                "product_id": product_id,
                                "variant_id": variant_id,
                                "color": color,
                                "image_index": idx,
                                "image": img_url
                            })
            except (json.JSONDecodeError, TypeError):
                # Nếu images không phải JSON array, skip
                continue
        
        return variant_images
    except Exception as e:
        print(f"  [WARN] Không thể load variant images để cache embeddings: {e}")
        return []


def load_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    print("Kết nối đến database...")
    conn = mysql.connector.connect(**DB_CONFIG)
    try:
        products_df  = load_products(conn)
        behavior_df  = load_behavior(conn)
    finally:
        conn.close()
    return products_df, behavior_df


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    start = time.time()

    print("=" * 60)
    print("  HYBRID RECOMMENDER – TRAINING")
    print("=" * 60)

    # 1. Load dữ liệu
    products_df, behavior_df = load_data()
    print(f"  Sản phẩm: {len(products_df)} | Hành vi: {len(behavior_df)}")

    if len(behavior_df) == 0:
        print("  CẢNH BÁO: Không có dữ liệu hành vi. CF sẽ bị vô hiệu hoá.")
    if len(products_df) == 0:
        print("  LỖI: Không có sản phẩm. Dừng training.")
        sys.exit(1)

    # 2. Kiểm tra trọng số
    if round(CF_WEIGHT + CBF_WEIGHT, 6) != 1.0:
        print(f"  LỖI: CF_WEIGHT ({CF_WEIGHT}) + CBF_WEIGHT ({CBF_WEIGHT}) ≠ 1.0")
        sys.exit(1)

    print(f"\n  Cấu hình: CF={CF_WEIGHT}, CBF={CBF_WEIGHT}, ALS_factors={ALS_FACTORS}, ALS_iter={ALS_ITERATIONS}")

    # 3. Train
    recommender = HybridRecommender(
        cf_weight=CF_WEIGHT,
        cbf_weight=CBF_WEIGHT,
        n_components=N_COMPONENTS,
        als_factors=ALS_FACTORS,
        als_iterations=ALS_ITERATIONS,
    )
    recommender.fit(products_df, behavior_df)

    # 4. Lưu model
    recommender.save(MODEL_PATH)

    # 4b. Cache embeddings cho variant images (nếu CLIP có sẵn)
    if HAS_CLIP:
        print("\n  Caching variant image embeddings...")
        try:
            cache_start = time.time()
            conn = mysql.connector.connect(**DB_CONFIG)
            try:
                # Thử load variant images trước
                variant_images = load_variant_images_for_cache(conn)
                
                # Fallback về base product images nếu không có variants
                if not variant_images:
                    print("    Không tìm thấy variant images, fallback to product base images...")
                    variant_images = load_products_for_image_cache(conn)
            finally:
                conn.close()

            if variant_images:
                searcher = ImageSearcher()
                print(f"    Caching {len(variant_images)} variant image embeddings...")
                searcher.cache_product_embeddings(variant_images)
                cache_elapsed = time.time() - cache_start
                print(f"    Embedding cache hoàn tất trong {cache_elapsed:.2f}s")
            else:
                print("    Không có images để cache.")
        except Exception as e:
            print(f"    [WARN] Không thể cache embeddings: {e}")

        # 4c. Cache product descriptions/names embeddings cho text search
        print("\n  Caching description embeddings...")
        try:
            desc_start = time.time()
            conn = mysql.connector.connect(**DB_CONFIG)
            try:
                # Get all products with name, brand, specification (join with brands table)
                cursor = conn.cursor(dictionary=True)
                cursor.execute("""
                    SELECT p.id, p.name, COALESCE(b.name, 'Unknown') AS brand, p.specification
                    FROM products p
                    LEFT JOIN brands b ON p.brand_id = b.id
                """)
                products_for_desc = cursor.fetchall()
                cursor.close()
            finally:
                conn.close()

            if products_for_desc:
                searcher = ImageSearcher()
                print(f"    Caching {len(products_for_desc)} product descriptions...")
                searcher.cache_product_descriptions(products_for_desc)
                desc_elapsed = time.time() - desc_start
                print(f"    Description cache hoàn tất trong {desc_elapsed:.2f}s")
            else:
                print("    Không có products để cache descriptions.")
        except Exception as e:
            print(f"    [WARN] Không thể cache descriptions: {e}")
    else:
        print("\n  [INFO] CLIP không được cài đặt. Skip embedding cache.")

    elapsed = time.time() - start
    print(f"\n  Tổng thời gian training: {elapsed:.2f}s")
    print("=" * 60)

    # 5. Quick smoke test
    print("\n  Smoke test với 3 user đầu tiên...")
    sample_users = behavior_df["user_id"].dropna().unique()[:3]
    sample_product = int(products_df["id"].iloc[0])
    for uid in sample_users:
        recs = recommender.recommend(int(uid), current_product_id=sample_product, top_n=5)
        print(f"    User {uid}: gợi ý = {recs}")

    print("\nTraining hoàn tất!")


if __name__ == "__main__":
    main()
