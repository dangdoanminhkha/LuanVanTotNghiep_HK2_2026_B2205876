# 🤖 HỆ THỐNG MACHINE LEARNING & GỢI Ý SẢN PHẨM

## I. TỔNG QUAN

Hệ thống ML hiện tại gồm 3 khối chính đang chạy trong source code:

1. **Content-Based Filtering (CBF)**
2. **Collaborative Filtering (CF - ALS)**
3. **Image Search bằng CLIP (OpenAI ViT-B-32)**

ML service chạy độc lập bằng Flask tại cổng mặc định `5001`, backend Node.js gọi sang qua HTTP.

---

## II. CONTENT-BASED FILTERING (CBF)

### A. Triển khai thực tế

- File chính: `ml/recommender.py`
- Sử dụng `TfidfVectorizer` để mã hoá text feature.
- Kết hợp thêm numeric feature giá với hệ số khuếch đại.
- Tính độ tương tự bằng cosine similarity.

### B. Điểm tối ưu đang có

- `PRICE_WEIGHT = 5.0` để tăng ảnh hưởng của giá.
- Hỗ trợ lọc hậu kỳ theo lịch sử mua và giới tính sản phẩm.

---

## III. COLLABORATIVE FILTERING (CF)

### A. Triển khai thực tế

- File chính: `ml/recommender.py`
- Thuật toán chính: **AlternatingLeastSquares (ALS)** từ thư viện `implicit`.
- Fallback khi thiếu thư viện: `TruncatedSVD`.

### B. Trọng số hành vi đang dùng

| Action | Weight |
|--------|--------|
| `view` | 1 |
| `add_to_cart` | 3 |
| `like` | 3 |
| `purchase` | 5 |
| `return` | -4 |
| `review_rating` | tính từ số sao |

`review_rating` được map sang điểm theo khoảng rating trong code backend/ML.

---

## IV. IMAGE SEARCH (CLIP)

### A. Triển khai thực tế

- File chính: `ml/image_search.py`
- Model: **CLIP ViT-B-32**
- Pretrained: **openai**
- Thư viện: `open-clip-torch`, `torch`, `Pillow`

### B. Luồng xử lý

1. Nhận ảnh truy vấn từ API `/search-by-image`.
2. Encode ảnh thành embedding bằng CLIP.
3. So sánh cosine similarity với embedding cache của ảnh sản phẩm.
4. Gom theo `product_id`, lấy điểm cao nhất mỗi sản phẩm.
5. Trả về Top-N nếu vượt `threshold`.

### C. Cache embeddings

Trong thư mục `ml/models/`:

- `image_features.pkl`: embedding ảnh variant
- `image_metadata.pkl`: mapping item embedding -> product/variant
- `description_features.pkl`: embedding text mô tả sản phẩm

---

## V. BEHAVIOR TRACKING & INPUT CHO ML

### A. Endpoint ghi log

- Backend endpoint: `POST /api/behavior/log`
- File xử lý: `backend/routes/behavior.js`
- Hỗ trợ cả user đăng nhập (`user_id`) và guest (`session_id`).

### B. Action hợp lệ

- `search`
- `view`
- `add_to_cart`
- `like`
- `purchase`
- `return`
- `review_rating`

### C. Trigger retrain

Backend có bộ đếm và gọi `POST /retrain` sang ML service theo ngưỡng cấu hình trong `behavior.js`.

---

## VI. TRAINING PIPELINE

### A. Script train

- File: `ml/train.py`
- Load dữ liệu từ MySQL (`products`, `user_behavior_logs`, variants...).
- Train hybrid recommender (CBF + CF).
- Lưu model: `ml/models/hybrid_recommender.pkl`.

### B. Cache CLIP khi train

Nếu CLIP dependencies có sẵn:

1. Cache embedding ảnh variant.
2. Cache embedding text mô tả sản phẩm.

---

## VII. ML API (FLASK)

Các endpoint thực tế trong `ml/api.py`:

| Method | Endpoint | Mục đích |
|--------|----------|----------|
| GET | `/health` | Health check + model info |
| GET | `/recommend` | Gợi ý hybrid cho user |
| GET | `/similar` | Sản phẩm tương tự (CBF) |
| POST | `/retrain` | Kích hoạt train bất đồng bộ |
| POST | `/search-by-image` | Tìm kiếm bằng ảnh CLIP |

---

## VIII. BACKEND - ML INTEGRATION

### A. Behavior routes gọi ML

- `GET /api/behavior/recommendations` -> gọi ML `/recommend`
- `GET /api/behavior/similar/:productId` -> gọi ML `/similar`

### B. Product image search

- `POST /api/products/search-by-image`
- Backend nhận file ảnh và forward sang ML endpoint `/search-by-image`.

---

## IX. CẤU TRÚC THƯ MỤC ML

```text
ml/
├── api.py
├── train.py
├── recommender.py
├── image_search.py
├── requirements.txt
└── models/
    ├── hybrid_recommender.pkl
    ├── image_features.pkl
    ├── image_metadata.pkl
    └── description_features.pkl
```

---

## X. GHI CHÚ CHÍNH XÁC

- Hệ thống **không dùng VGG-16** trong implementation hiện tại.
- Image search đang dùng **CLIP ViT-B-32 (OpenAI)**.
- CF hiện tại là **ALS (implicit)**, không phải mô hình user-user cosine đơn giản.

---

**Tài liệu đã được hiệu chỉnh theo source code hiện tại (backend + ml).**

