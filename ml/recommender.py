"""
Hybrid Recommendation System (CF + CBF) - REFACTORED v2
========================================================
Kết hợp:
  - Content-Based Filtering (CBF): TF-IDF trên Item Soup + Price Weight (PRICE_WEIGHT=5.0)
  - Collaborative Filtering (CF): AlternatingLeastSquares (ALS) từ implicit library

Flow logic:
  Cold Start + No current_product → Trending Products (Top N hot nhất)
  Cold Start + Has current_product → CBF only
  Known user → Hybrid(CF * cf_weight + CBF * cbf_weight) → Post-filter
  
Tối ưu hoá:
  1. PRICE_WEIGHT: Tăng tiếng nói của giá trong CBF
  2. Gender Preference: ratio >= 0.8 (nới lỏng từ 1.0)
  3. CF Algorithm: ALS thay TruncatedSVD (sparse matrix support)
  4. Cold Start: Trending Products cho user mới không xem sản phẩm
"""

import json
import pickle

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix, hstack
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler

try:
    from implicit.als import AlternatingLeastSquares
    HAS_IMPLICIT = True
except ImportError:
    HAS_IMPLICIT = False
    print("[WARN] implicit library chưa cài. Sẽ sử dụng fallback SVD.")
    from sklearn.decomposition import TruncatedSVD


class HybridRecommender:
    """Hybrid Recommender: ALS Collaborative Filtering + Content-Based Filtering."""

    # ═══════════════════════════════════════════════════════════════════════════
    # [YC-1] TỐI ƯU CBF: Hệ số khuếch đại giá cả
    # ═══════════════════════════════════════════════════════════════════════════
    PRICE_WEIGHT: float = 5.0  # Giá cả được phóng đại lên 5x so với text features

    # Trọng số hành vi (Implicit Feedback)
    ACTION_WEIGHTS = {
        "view": 1,
        "add_to_cart": 3,
        "like": 3,
        "purchase": 5,
        "return": -4,
        "review_rating": 0,
    }

    def __init__(
        self,
        cf_weight: float = 0.7,
        cbf_weight: float = 0.3,
        n_components: int = 50,
        als_factors: int = 50,
        als_iterations: int = 15,
    ):
        """
        Args:
            cf_weight: Trọng số nhánh CF (mặc định 0.7).
            cbf_weight: Trọng số nhánh CBF (mặc định 0.3).
            n_components: Số chiều ẩn (fallback SVD, không dùng với ALS).
            als_factors: Số feature factors cho ALS.
            als_iterations: Số lần lặp cho ALS.
        """
        if round(cf_weight + cbf_weight, 6) != 1.0:
            raise ValueError(
                f"cf_weight + cbf_weight phải bằng 1.0, nhận được: {cf_weight + cbf_weight}"
            )

        self.cf_weight = cf_weight
        self.cbf_weight = cbf_weight
        self.n_components = n_components
        self.als_factors = als_factors
        self.als_iterations = als_iterations

        # State sau khi fit()
        self.products_df: pd.DataFrame | None = None
        self.product_ids: list = []
        self.product_id_to_idx: dict = {}

        # CBF
        self.cbf_similarity_matrix: np.ndarray | None = None

        # CF (ALS hoặc SVD fallback)
        self.user_ids: list = []
        self.user_id_to_idx: dict = {}
        self.cf_predictions: np.ndarray | None = None  # (n_users, n_items)

        # Post-filter: lịch sử đã mua
        self.user_purchased: dict[int, set] = {}

        # ═══════════════════════════════════════════════════════════════════════
        # [YC-2] NỚI LỎNG GENDER: ratio >= 0.8 (thay vì 1.0)
        # ═══════════════════════════════════════════════════════════════════════
        # Gender preference: giới tính ưa thích nếu >= 80% hành vi thuộc 1 giới
        self.user_gender_pref: dict[int, str] = {}  # {user_id: 'male'/'female'/None}
        self._gender_indices: dict[str, set] = {}

        # ═════════════════════════════════════════════════════════════════════════
        # [YC-4] COLD START: Trending Products
        # ═════════════════════════════════════════════════════════════════════════
        # Top N sản phẩm hot nhất (dựa trên tổng điểm tương tác)
        self.trending_product_ids: list[int] = []
        self.trending_top_n: int = 20  # Lưu top 20 trending products

    @staticmethod
    def _review_rating_to_score(rating_value) -> float:
        """Map review rating (1-5 sao) thành điểm hành vi cho recommender."""
        try:
            rating = float(rating_value)
        except (TypeError, ValueError):
            return 0.0

        if rating >= 4.5:
            return 4.0
        if rating >= 3.5:
            return 2.0
        if rating >= 2.5:
            return 0.0
        if rating >= 1.5:
            return -2.0
        return -4.0

    def _compute_behavior_scores(self, behavior_df: pd.DataFrame) -> pd.DataFrame:
        """Tính score cho từng hành vi, hỗ trợ review_rating dùng rating động."""
        df = behavior_df.copy()

        if "rating" not in df.columns:
            df["rating"] = np.nan

        def _row_to_score(row: pd.Series) -> float:
            action = row.get("action")
            if action == "review_rating":
                return self._review_rating_to_score(row.get("rating"))
            return float(self.ACTION_WEIGHTS.get(action, 0))

        df["score"] = df.apply(_row_to_score, axis=1)
        return df

    # ------------------------------------------------------------------
    # CBF helpers
    # ------------------------------------------------------------------

    def _build_item_soup(self, row: pd.Series) -> str:
        """Tạo chuỗi đặc trưng văn bản cho một sản phẩm."""
        parts = []

        for col in ("brand", "category", "gender"):
            val = row.get(col)
            if pd.notna(val) and str(val).strip():
                parts.append(str(val).lower().replace(" ", "_"))

        # Tags: JSON array hoặc chuỗi
        tags_raw = row.get("tags")
        if pd.notna(tags_raw) and tags_raw:
            try:
                tags = json.loads(tags_raw) if isinstance(tags_raw, str) else tags_raw
                if isinstance(tags, list):
                    parts.extend(str(t).lower().replace(" ", "_") for t in tags if t)
            except (json.JSONDecodeError, TypeError):
                pass

        # Specification: JSON object với 6 keys cố định
        spec_raw = row.get("specification")
        if pd.notna(spec_raw) and spec_raw:
            try:
                spec = json.loads(spec_raw) if isinstance(spec_raw, str) else spec_raw
                if isinstance(spec, dict):
                    parts.extend(
                        str(v).lower().replace(" ", "_")
                        for v in spec.values()
                        if v and pd.notna(v)
                    )
            except (json.JSONDecodeError, TypeError):
                pass

        return " ".join(parts) if parts else "unknown"

    def _build_cbf(self) -> None:
        """Xây dựng ma trận cosine similarity từ đặc trưng sản phẩm.
        
        [YC-1] Tối ưu hoá: Nhân price_scaled với PRICE_WEIGHT trước khi hstack.
        Điều này cho phép giá cả có tiếng nói tương đương text features.
        """
        df = self.products_df.copy()

        # 1. Item Soup → TF-IDF
        df["item_soup"] = df.apply(self._build_item_soup, axis=1)
        tfidf = TfidfVectorizer(analyzer="word", ngram_range=(1, 2), min_df=1)
        tfidf_matrix = tfidf.fit_transform(df["item_soup"])

        # 2. Price → MinMaxScaler + PRICE_WEIGHT amplification + concat với TF-IDF
        if "price" in df.columns and df["price"].notna().any():
            scaler = MinMaxScaler()
            price_scaled = scaler.fit_transform(df[["price"]].fillna(0))
            
            # ═════════════════════════════════════════════════════════════════════
            # [YC-1] TỐI ƯU: Nhân price với PRICE_WEIGHT để tăng ảnh hưởng
            # ═════════════════════════════════════════════════════════════════════
            price_amplified = price_scaled * self.PRICE_WEIGHT
            
            feature_matrix = hstack([tfidf_matrix, csr_matrix(price_amplified)])
            print(f"      Price weight amplification: {self.PRICE_WEIGHT}x")
        else:
            feature_matrix = tfidf_matrix

        # 3. Cosine similarity (n_items × n_items)
        self.cbf_similarity_matrix = cosine_similarity(feature_matrix)

    # ------------------------------------------------------------------
    # CF helpers
    # ------------------------------------------------------------------

    def _build_cf(self, behavior_df: pd.DataFrame) -> None:
        """Xây dựng ma trận dự đoán bằng AlternatingLeastSquares (ALS).
        
        [YC-3] Sử dụng implicit.AlternatingLeastSquares thay TruncatedSVD.
        ALS tối ưu tốt hơn cho sparse implicit feedback data.
        """
        df = self._compute_behavior_scores(behavior_df)

        # Chỉ giữ product_id tồn tại trong catalog
        valid_pids = set(self.product_ids)
        df = df[df["product_id"].isin(valid_pids)]

        if df.empty:
            self.cf_predictions = None
            return

        # Aggregation: (user_id, product_id) → tổng điểm
        interaction = (
            df.groupby(["user_id", "product_id"])["score"]
            .sum()
            .reset_index()
        )

        # Pivot → User-Item matrix
        user_item = interaction.pivot_table(
            index="user_id", columns="product_id", values="score", fill_value=0
        )
        # Reindex để đảm bảo tất cả sản phẩm đều có mặt
        user_item = user_item.reindex(columns=self.product_ids, fill_value=0)

        self.user_ids = list(user_item.index)
        self.user_id_to_idx = {uid: i for i, uid in enumerate(self.user_ids)}

        # ═════════════════════════════════════════════════════════════════════════
        # [YC-3] TÍCH HỢP ALS (Alternating Least Squares)
        # ═════════════════════════════════════════════════════════════════════════
        if HAS_IMPLICIT:
            print(f"      Sử dụng AlternatingLeastSquares (implicit library)")
            
            # Chuyển đổi sang csr_matrix (sparse format) cho implicit library
            user_item_sparse = csr_matrix(user_item.values, dtype=np.float32)
            
            # Tạo và train ALS model
            als_model = AlternatingLeastSquares(
                factors=self.als_factors,
                iterations=self.als_iterations,
                random_state=42,
                calculate_training_loss=False,
                num_threads=4,
            )
            als_model.fit(user_item_sparse)
            
            # Trích xuất user_factors và item_factors
            user_factors = als_model.user_factors        # (n_users, factors)
            item_factors = als_model.item_factors.T      # (n_items, factors)
            
            # Tính toán ma trận dự đoán đầy đủ
            # Tự động xoay ma trận cho khớp kích thước
            if item_factors.shape[0] == user_factors.shape[1]:
                self.cf_predictions = np.dot(user_factors, item_factors)
            else:
                self.cf_predictions = np.dot(user_factors, item_factors.T)
        else:
            # Fallback: TruncatedSVD (nếu implicit chưa cài)
            print(f"      Fallback: TruncatedSVD (implicit library không cài)")
            n_comp = min(self.n_components, min(user_item.shape) - 1)
            if n_comp < 1:
                self.cf_predictions = user_item.values.astype(float)
                return

            from sklearn.decomposition import TruncatedSVD
            svd = TruncatedSVD(n_components=n_comp, random_state=42)
            user_factors = svd.fit_transform(user_item.values)
            item_factors = svd.components_
            self.cf_predictions = np.dot(user_factors, item_factors)

    # ──────────────────────────────────────────────────────────────────────────
    # Trending Products
    # ──────────────────────────────────────────────────────────────────────────

    def _build_trending_products(self, behavior_df: pd.DataFrame) -> None:
        """Xây dựng danh sách Trending Products dựa tổng điểm tương tác.
        
        [YC-4] Hàm mới: Tính tổng score cho từng product, lưu Top N hot nhất.
        Được gọi trong fit() để chuẩn bị fallback cho cold start users.
        """
        df = self._compute_behavior_scores(behavior_df)

        # Chỉ tính các product hợp lệ
        valid_pids = set(self.product_ids)
        df = df[df["product_id"].isin(valid_pids)]

        if df.empty:
            # Nếu không có hành vi, sử dụng toàn bộ products theo thứ tự
            self.trending_product_ids = self.product_ids[:self.trending_top_n]
            return

        # Tính tổng score cho từng product
        product_scores = df.groupby("product_id")["score"].sum().sort_values(ascending=False)
        
        # Lấy top N products trending
        self.trending_product_ids = list(product_scores.head(self.trending_top_n).index)
        print(f"      Trending Products: {len(self.trending_product_ids)} sản phẩm hot")

    # ──────────────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────────────

    def fit(self, products_df: pd.DataFrame, behavior_df: pd.DataFrame) -> "HybridRecommender":
        """Train model từ dữ liệu sản phẩm và hành vi người dùng.

        Args:
            products_df: DataFrame với cột: id, name, price, brand, category, gender, tags, specification.
            behavior_df: DataFrame với cột: user_id, product_id, action, rating(optional).

        Returns:
            self (để chain .fit().save())
        """
        self.products_df = products_df.reset_index(drop=True)
        self.product_ids = list(self.products_df["id"])
        self.product_id_to_idx = {pid: i for i, pid in enumerate(self.product_ids)}

        # Lưu lịch sử purchase để post-filter
        purchased = behavior_df[behavior_df["action"] == "purchase"]
        for uid, gdf in purchased.groupby("user_id"):
            self.user_purchased[int(uid)] = set(int(p) for p in gdf["product_id"])

        # Xác định gender preference của từng user
        self._build_gender_preference(behavior_df)

        # ═════════════════════════════════════════════════════════════════════
        # [YC-4] COLD START: Xây dựng Trending Products
        # ═════════════════════════════════════════════════════════════════════
        print("  [Trending] Đang xây dựng danh sách Trending Products...")
        self._build_trending_products(behavior_df)

        print("  [CBF] Đang xây dựng ma trận Content-Based...")
        self._build_cbf()
        print(f"  [CBF] Hoàn thành. Ma trận: {self.cbf_similarity_matrix.shape}")

        print("  [CF] Đang xây dựng ma trận Collaborative Filtering (ALS)...")
        self._build_cf(behavior_df)
        if self.cf_predictions is not None:
            print(f"  [CF] Hoàn thành. Ma trận dự đoán: {self.cf_predictions.shape}")
        else:
            print("  [CF] Không đủ dữ liệu hành vi, CF bị tắt.")

        print("✓ Model training hoàn tất!")
        return self

    @staticmethod
    def _normalize(arr: np.ndarray) -> np.ndarray:
        """Chuẩn hoá mảng về [0, 1]."""
        min_v, max_v = arr.min(), arr.max()
        if (max_v - min_v) < 1e-9:
            return np.zeros_like(arr, dtype=float)
        return (arr - min_v) / (max_v - min_v)

    def _build_gender_preference(self, behavior_df: pd.DataFrame) -> None:
        """Xác định giới tính ưa thích từ lịch sử hành vi.
        
        [YC-2] NỚI LỎNG: Chỉ cần ratio >= 0.8 (80%) thay vì 1.0 (100%).
        Điều này giúp detect preference sớm hơn, ngay cả khi user còn exploring.
        """
        if self.products_df is None:
            return

        # Map: product_id → gender
        pid_gender = dict(zip(self.products_df["id"], self.products_df.get("gender", pd.Series(dtype=str))))

        # Xây dựng tập index theo gender
        for gender_val in ("male", "female", "unisex"):
            self._gender_indices[gender_val] = {
                self.product_id_to_idx[pid]
                for pid, g in pid_gender.items()
                if pid in self.product_id_to_idx and str(g).lower() == gender_val
            }
        self._gender_indices["unknown"] = {
            self.product_id_to_idx[pid]
            for pid, g in pid_gender.items()
            if pid in self.product_id_to_idx and (pd.isna(g) or str(g).strip() == "")
        }

        df = self._compute_behavior_scores(behavior_df)
        df["gender"] = df["product_id"].map(pid_gender)
        df["gender"] = df["gender"].apply(lambda g: str(g).lower() if pd.notna(g) else "unknown")

        # Chỉ quan tâm male/female (bỏ unisex/unknown)
        df_gendered = df[df["gender"].isin(["male", "female"])]

        for uid, gdf in df_gendered.groupby("user_id"):
            totals = gdf.groupby("gender")["score"].sum()
            total_sum = totals.sum()
            if total_sum == 0:
                continue
            dominant = totals.idxmax()
            ratio = totals[dominant] / total_sum
            
            # ═══════════════════════════════════════════════════════════════════
            # [YC-2] NỚI LỎNG: ratio >= 0.80 (80%) thay vì == 1.0
            # ═══════════════════════════════════════════════════════════════════
            if ratio >= 0.80:
                self.user_gender_pref[int(uid)] = dominant

    def recommend(
        self,
        user_id: int,
        current_product_id: int | None = None,
        top_n: int = 10,
    ) -> list[int]:
        """Gợi ý sản phẩm cho user.

        Args:
            user_id: ID người dùng.
            current_product_id: ID sản phẩm đang xem (dùng cho CBF).
            top_n: Số lượng gợi ý.

        Returns:
            Danh sách product_id sắp xếp theo điểm giảm dần.
        """
        if self.products_df is None:
            raise RuntimeError("Model chưa được train. Hãy gọi .fit() trước.")

        n_items = len(self.product_ids)
        is_known_user = user_id in self.user_id_to_idx
        has_cf = self.cf_predictions is not None

        # ════════════════════════════════════════════════════════════════════════
        # [YC-4] COLD START FALLBACK: Trending Products (không document & không search)
        # ════════════════════════════════════════════════════════════════════════
        if not is_known_user or not has_cf:
            # Nếu user mới và không xem sản phẩm cụ thể → trả Trending Products
            if not current_product_id:
                # User mới ở trang chủ: trả trending products thay vì ones()
                trending_ids = self.trending_product_ids[:top_n]
                return trending_ids if trending_ids else self.product_ids[:top_n]
            
            # User mới nhưng đang xem sản phẩm → dùng CBF từ current product
            cbf_scores = self._get_cbf_scores(current_product_id, n_items)
            final_scores = self._normalize(cbf_scores)

        else:
            # HYBRID: Đã biết user và có CF data
            user_idx = self.user_id_to_idx[user_id]

            cf_scores_norm = self._normalize(self.cf_predictions[user_idx].copy())
            cbf_scores_norm = self._normalize(self._get_cbf_scores(current_product_id, n_items))

            # Kết hợp weighted
            final_scores = (self.cf_weight * cf_scores_norm) + (self.cbf_weight * cbf_scores_norm)

        # ── Post-Filtering ────────────────────────────────────────────────────
        # Loại bỏ sản phẩm đã mua
        for pid in self.user_purchased.get(user_id, set()):
            if pid in self.product_id_to_idx:
                final_scores[self.product_id_to_idx[pid]] = 0.0

        # Loại bỏ sản phẩm hiện tại
        if current_product_id and current_product_id in self.product_id_to_idx:
            final_scores[self.product_id_to_idx[current_product_id]] = 0.0

        # ── Gender Filter ─────────────────────────────────────────────────────
        pref_gender = self.user_gender_pref.get(user_id)
        if pref_gender in ("male", "female"):
            opposite = "female" if pref_gender == "male" else "male"
            for idx in self._gender_indices.get(opposite, set()):
                final_scores[idx] = 0.0

        # Sắp xếp và trả về top_n
        top_indices = np.argsort(final_scores)[::-1][:top_n]
        return [self.product_ids[i] for i in top_indices if final_scores[i] > 0]

    def get_similar_products(self, product_id: int, top_n: int = 10) -> list[int]:
        """Lấy sản phẩm tương tự theo nội dung (cho phần 'Sản phẩm tương tự').

        Args:
            product_id: ID sản phẩm gốc.
            top_n: Số lượng sản phẩm tương tự.

        Returns:
            Danh sách product_id (không bao gồm sản phẩm gốc).
        """
        if product_id not in self.product_id_to_idx:
            return []

        idx = self.product_id_to_idx[product_id]
        scores = self.cbf_similarity_matrix[idx].copy()
        scores[idx] = 0.0  # Loại chính nó

        # Áp dụng gender filter: chỉ gợi ý cùng giới tính hoặc unisex
        source_gender = str(self.products_df.iloc[idx].get("gender", "")).lower() if self.products_df is not None else ""
        if source_gender in ("male", "female"):
            opposite = "female" if source_gender == "male" else "male"
            for idx_other in self._gender_indices.get(opposite, set()):
                scores[idx_other] = 0.0

        top_indices = np.argsort(scores)[::-1][:top_n]
        return [self.product_ids[i] for i in top_indices if scores[i] > 0]

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get_cbf_scores(self, current_product_id: int | None, n_items: int) -> np.ndarray:
        """Lấy vector CBF score cho sản phẩm hiện tại."""
        if current_product_id and current_product_id in self.product_id_to_idx:
            idx = self.product_id_to_idx[current_product_id]
            scores = self.cbf_similarity_matrix[idx].copy()
            scores[idx] = 0.0
            return scores

        # Không có current_product: trả về điểm đồng đều
        return np.ones(n_items)

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def save(self, path: str) -> None:
        """Lưu model vào file pickle."""
        import os
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump(self, f)
        print(f"✓ Model đã lưu tại: {path}")

    @classmethod
    def load(cls, path: str) -> "HybridRecommender":
        """Tải model từ file pickle."""
        with open(path, "rb") as f:
            model = pickle.load(f)
        print(f"✓ Model đã tải từ: {path}")
        return model
