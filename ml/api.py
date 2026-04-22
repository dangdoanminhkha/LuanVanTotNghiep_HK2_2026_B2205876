"""
api.py – Flask REST API phục vụ gợi ý sản phẩm từ model đã train.

Endpoints:
  GET  /health                     Health check
  GET  /recommend                  Gợi ý cá nhân hoá (CF + CBF Hybrid)
  GET  /similar                    Sản phẩm tương tự (CBF only)
  POST /retrain                    Kích hoạt retrain model
  POST /search-by-image            Tìm kiếm sản phẩm bằng hình ảnh (CLIP)

Model Optimizations (v2):
  1. Price Weight: Giá cả được khuếch đại 5x trong CBF → tiếng nói tương đương text
  2. Gender Preference: ratio >= 0.8 (80%) thay vì 1.0 (100%) → sớm phát hiện preference
  3. CF Algorithm: AlternatingLeastSquares (implicit) thay TruncatedSVD → tối ưu hơn sparse data
  4. Cold Start: Trending Products fallback cho user mới không xem sản phẩm → UX tốt hơn

Cài đặt thư viện bắt buộc:
  pip install python-dotenv flask numpy pandas scikit-learn scipy implicit==0.6.2

Cách chạy:
  python api.py
  # Mặc định: http://localhost:5001
"""

import os
import subprocess
import sys
import threading

from flask import Flask, jsonify, request
import numpy as np

# Đọc .env nếu có python-dotenv
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass

from recommender import HybridRecommender
from image_search import ImageSearcher

# CLIP imports cho text search
try:
    import torch
    import open_clip
    from open_clip import tokenize
    HAS_CLIP = True
except ImportError:
    HAS_CLIP = False
    print("[WARN] CLIP dependencies chưa cài đầy đủ. Text search sẽ disable.")

# ── Config ───────────────────────────────────────────────────────────────────
ML_PORT    = int(os.getenv("ML_PORT", 5001))
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "hybrid_recommender.pkl")
TRAIN_SCRIPT = os.path.join(os.path.dirname(__file__), "train.py")

# ── Flask App ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
recommender: HybridRecommender | None = None
image_searcher: ImageSearcher | None = None
clip_model = None
clip_device = None
_retrain_lock = threading.Lock()


def load_model() -> None:
    global recommender, image_searcher, clip_model, clip_device
    if os.path.exists(MODEL_PATH):
        recommender = HybridRecommender.load(MODEL_PATH)
        print(f"✓ Model sẵn sàng. {len(recommender.product_ids)} sản phẩm, "
              f"{len(recommender.user_ids)} users trong CF.")
    else:
        print(f"[WARN] Chưa có model tại '{MODEL_PATH}'. Hãy chạy train.py trước.")

    # Load Image Searcher
    try:
        image_searcher = ImageSearcher()
        print("✓ CLIP Image Searcher khởi tạo thành công")
    except Exception as e:
        print(f"[WARN] Failed to load ImageSearcher: {e}")
        image_searcher = None

    # Load CLIP for text search
    if HAS_CLIP:
        try:
            clip_device = "cuda" if torch.cuda.is_available() else "cpu"
            clip_model, _, _ = open_clip.create_model_and_transforms(
                'ViT-B-32', pretrained='openai', device=clip_device
            )
            clip_model.eval()
            print(f"✓ CLIP Text Model khởi tạo thành công (device: {clip_device})")
        except Exception as e:
            print(f"[WARN] Failed to load CLIP model: {e}")
            clip_model = None
    else:
        print("[INFO] CLIP không được cài đặt. Text search sẽ disable.")


def _run_retrain():
    """Chạy train.py trong process riêng và reload model sau khi xong."""
    global recommender
    try:
        result = subprocess.run(
            [sys.executable, TRAIN_SCRIPT],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            timeout=600,
        )
        if result.returncode == 0:
            load_model()
            print("[Retrain] ✓ Hoàn tất và đã reload model mới.")
        else:
            print(f"[Retrain] ✗ Thất bại:\n{result.stderr}")
    except Exception as e:
        print(f"[Retrain] ✗ Lỗi: {e}")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Kiểm tra trạng thái service."""
    model_info = {}
    if recommender:
        model_info = {
            "products": len(recommender.product_ids),
            "cf_users": len(recommender.user_ids),
            "cf_weight": recommender.cf_weight,
            "cbf_weight": recommender.cbf_weight,
            "price_weight": recommender.PRICE_WEIGHT,
            "trending_products": len(recommender.trending_product_ids),
        }
    return jsonify({
        "status": "ok",
        "model_loaded": recommender is not None,
        "model_info": model_info,
        "optimizations": {
            "price_weight": "5.0x amplification",
            "gender_preference": "ratio >= 0.8",
            "cf_algorithm": "AlternatingLeastSquares (ALS)",
            "cold_start": "Trending Products fallback"
        }
    })


@app.route("/recommend", methods=["GET"])
def recommend():
    """Gợi ý sản phẩm cá nhân hoá (CF + CBF Hybrid).

    Query params:
        user_id    (int, required): ID người dùng.
        product_id (int, optional): ID sản phẩm đang xem.
        top_n      (int, optional): Số lượng gợi ý (mặc định 10).

    Returns:
        {
            "user_id": ...,
            "product_id": ...,
            "recommendations": [product_id, ...],
            "is_cold_start": bool,
            "method": "trending" | "cbf" | "hybrid"
        }
    """
    if recommender is None:
        return jsonify({"error": "Model chưa được load. Hãy chạy train.py trước."}), 503

    user_id    = request.args.get("user_id",    type=int)
    product_id = request.args.get("product_id", type=int)
    top_n      = request.args.get("top_n", default=10, type=int)

    if user_id is None:
        return jsonify({"error": "Thiếu tham số user_id."}), 400

    if top_n < 1 or top_n > 50:
        return jsonify({"error": "top_n phải trong khoảng [1, 50]."}), 400

    try:
        is_cold_start = user_id not in recommender.user_id_to_idx
        has_cf = recommender.cf_predictions is not None
        
        # Xác định method được sử dụng
        if is_cold_start and not product_id:
            method = "trending"
        elif is_cold_start or not has_cf:
            method = "cbf"
        else:
            method = "hybrid"
        
        product_ids = recommender.recommend(
            user_id=user_id,
            current_product_id=product_id,
            top_n=top_n,
        )
        return jsonify({
            "user_id":         user_id,
            "product_id":      product_id,
            "recommendations": product_ids,
            "is_cold_start":   is_cold_start,
            "method":          method,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/similar", methods=["GET"])
def similar():
    """Lấy sản phẩm tương tự dựa trên nội dung (CBF only).

    Query params:
        product_id (int, required): ID sản phẩm gốc.
        top_n      (int, optional): Số lượng (mặc định 10).
    """
    if recommender is None:
        return jsonify({"error": "Model chưa được load."}), 503

    product_id = request.args.get("product_id", type=int)
    top_n      = request.args.get("top_n", default=10, type=int)

    if product_id is None:
        return jsonify({"error": "Thiếu tham số product_id."}), 400

    try:
        product_ids = recommender.get_similar_products(product_id=product_id, top_n=top_n)
        return jsonify({
            "product_id": product_id,
            "similar":    product_ids,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/retrain", methods=["POST"])
def retrain():
    """Kích hoạt retrain model bất đồng bộ (non-blocking).
    
    Để tránh abuse, nếu đang có lần retrain trước đó, trả về 409.
    """
    if not _retrain_lock.acquire(blocking=False):
        return jsonify({"message": "Đang có quá trình retrain đang chạy, vui lòng đợi."}), 409

    def retrain_and_release():
        try:
            _run_retrain()
        finally:
            _retrain_lock.release()

    thread = threading.Thread(target=retrain_and_release, daemon=True)
    thread.start()
    return jsonify({"message": "✓ Đã bắt đầu retrain. Model sẽ được cập nhật tự động."})


@app.route("/search-by-image", methods=["POST"])
def search_by_image():
    """Tìm kiếm sản phẩm bằng hình ảnh sử dụng CLIP model.

    Request:
        - File: image file (multipart/form-data, key='image')
        - threshold (optional, float): Min similarity [0-1], mặc định 0.5
        - top_n (optional, int): Số kết quả trả về, mặc định 1

    Returns:
        {
            "status": "success" | "not_found" | "error",
            "results": [
                {"product_id": int, "similarity": float},
                ...
            ],
            "threshold": float,
            "message": str
        }
    """
    if image_searcher is None:
        return jsonify({
            "status": "error",
            "message": "CLIP Image Searcher chưa được khởi tạo."
        }), 503

    # Check file upload
    if "image" not in request.files:
        return jsonify({
            "status": "error",
            "message": "Thiếu file 'image' trong request."
        }), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({
            "status": "error",
            "message": "File không hợp lệ."
        }), 400

    threshold = request.form.get("threshold", default=0.5, type=float)
    top_n = request.form.get("top_n", default=1, type=int)

    # Validate params
    if not (0 <= threshold <= 1):
        return jsonify({
            "status": "error",
            "message": "threshold phải trong [0, 1]"
        }), 400

    if top_n < 1 or top_n > 500:
        return jsonify({
            "status": "error",
            "message": "top_n phải trong [1, 500]"
        }), 400

    try:
        # Save to temp file
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            file.save(tmp.name)
            temp_path = tmp.name

        # Search
        results = image_searcher.search(temp_path, threshold=threshold, top_n=top_n)

        # Clean up
        os.unlink(temp_path)

        # Format response
        if not results:
            return jsonify({
                "status": "not_found",
                "results": [],
                "threshold": threshold,
                "message": f"Không tìm thấy sản phẩm với độ khớp >= {threshold*100:.0f}%"
            })

        return jsonify({
            "status": "success",
            "results": [
                {"product_id": int(pid), "similarity": float(sim)}
                for pid, sim in results
            ],
            "threshold": threshold,
            "message": f"Tìm thấy {len(results)} sản phẩm phù hợp"
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Lỗi xử lý ảnh: {str(e)}"
        }), 500




# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    load_model()
    print(f"ML Service đang chạy tại http://localhost:{ML_PORT}")
    print("📚 Optimizations enabled:")
    print("  ✓ Price weight amplification (5.0x)")
    print("  ✓ Gender preference ratio >= 0.80")
    print("  ✓ AlternatingLeastSquares (ALS) algorithm")
    print("  ✓ Trending Products cold start fallback")
    app.run(host="0.0.0.0", port=ML_PORT, debug=False)
