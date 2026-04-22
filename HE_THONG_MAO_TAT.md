# 📋 BÁO CÁO TỔNG QUAN HỆ THỐNG

## I. GIỚI THIỆU CHUNG

### Tên dự án
**Hệ thống bán giày trực tuyến tích hợp Machine Learning** (E-commerce Shoe Store with ML Recommendations)

### Mô tả
Nền tảng thương mại điện tử chuyên bán giày thể thao, với tính năng gợi ý sản phẩm thông minh dựa trên Machine Learning. Hệ thống hỗ trợ hai loại khách hàng:
- **Khách hàng đã đăng ký** (user): Nhận gợi ý cá nhân hóa dựa trên hành vi
- **Khách hàng ẩn danh** (guest): Tìm kiếm và mua hàng mà không cần tài khoản

### Công nghệ stack chính
| Lớp | Công nghệ |
|-----|-----------|
| **Frontend** | React 19 + Vite + Tailwind CSS + React Router |
| **Backend** | Node.js + Express + MySQL |
| **Authentication** | JWT + Google OAuth |
| **Payment** | VNPay |
| **ML** | Python + Flask + Scikit-learn + implicit (ALS) + CLIP |
| **Deployment** | NGROK (testing), Vercel (frontend considerations) |

---

## II. CẤU TRÚC HỆ THỐNG

```
luanvan/
├── backend/               # Express API Server
│   ├── routes/            # API endpoints (23 route files)
│   ├── middleware/        # Auth, rate limiting, file upload, etc.
│   ├── jobs/              # Background jobs (order hold watcher)
│   ├── utils/             # Helper functions
│   ├── uploads/           # User uploaded files
│   ├── db.js              # MySQL connection pool
│   ├── index.js           # Server entry point
│   └── package.json       # Dependencies
│
├── frontend/              # React SPA
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── pages/admin/   # Admin dashboard pages
│   │   ├── components/    # Reusable React components
│   │   ├── context/       # State management (AuthContext, CartContext)
│   │   ├── services/      # API client (Axios)
│   │   ├── App.jsx        # Root component + routing
│   │   └── main.jsx       # React entry
│   ├── public/            # Static assets
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── database/              # Database schema
│   ├── schema.sql         # Base tables
│   ├── *.sql              # Migration files (40+ files)
│   ├── init.bat/sh        # Setup scripts
│   └── README.md          # ERD documentation
│
├── ml/                    # Machine Learning
│   ├── train.py           # Model training script
│   ├── recommender.py     # Recommendation engine
│   ├── image_search.py    # Image-based search
│   ├── api.py             # ML API server
│   └── models/            # Trained models
│
└── scripts/               # Utility scripts
```

---

## III. CÁC TÍNH NĂNG CHÍNH

### A. TÍNH NĂNG KHÁCH HÀNG (Customer)

#### 1. **Xác thực & Tài khoản**
- ✅ Đăng ký tài khoản với email + password
- ✅ Xác thực email (confirmation token 24h)
- ✅ Đăng nhập / Đăng xuất
- ✅ Đăng nhập bằng Google OAuth
- ✅ Quên mật khẩu (reset token)
- ✅ Hỗ trợ guest (ẩn danh) - không cần đăng ký

#### 2. **Duyệt & Tìm kiếm sản phẩm**
- ✅ Xem tất cả sản phẩm
- ✅ Tìm kiếm theo tên sản phẩm
- ✅ Lọc theo:
  - Thương hiệu (brand)
  - Danh mục (category)
  - Giới tính (gender: Nam/Nữ/Unisex)
  - Màu sắc (color)
  - Khoảng giá (price range)
  - Giảm giá (on sale)
- ✅ Sắp xếp (price ASC/DESC, newest, best-selling)
- ✅ Phân trang (20 items/page)

#### 3. **Xem chi tiết sản phẩm**
- ✅ Hình ảnh variant (nhiều hình, xem theo size/color)
- ✅ Mô tả + thông số kỹ thuật (sole, heel, material, etc.)
- ✅ Giá, discount, rating trung bình
- ✅ Chọn size/color trước khi thêm vào giỏ
- ✅ Lịch sử giá (price history)
- ✅ Đánh giá & bình luận từ khách khác

#### 4. **Giỏ hàng**
- ✅ Thêm/xóa/sửa số lượng sản phẩm
- ✅ Xem tổng tiền
- ✅ Lưu giỏ cho guest (session-based)
- ✅ Chuyển giỏ guest → user khi đăng ký
- ✅ Kiểm tra tồn kho trước checkout

#### 5. **Thanh toán**
- ✅ Hỗ trợ COD (Payment on Delivery)
- ✅ Hỗ trợ VNPay (online payment)
- ✅ Trang demo thanh toán (UI mô phỏng ngân hàng)
- ✅ Xác nhận đơn hàng sau thanh toán
- ✅ Giảm giá tự động (voucher)

#### 6. **Quản lý đơn hàng**
- ✅ Xem danh sách đơn hàng
- ✅ Xem chi tiết đơn hàng (items, tracking, status)
- ✅ Cập nhật trạng thái: pending → processing → shipping → delivered
- ✅ Hoàn trả sản phẩm (return flow)
- ✅ Theo dõi trạng thái giao hàng

#### 7. **Đánh giá & Bình luận**
- ✅ Để lại đánh giá ⭐ (1-5 sao)
- ✅ Viết bình luận chi tiết
- ✅ Upload hình ảnh trong review
- ✅ Like/unlike review
- ✅ Reply comment từ seller

#### 8. **Gợi ý sản phẩm (ML Recommendations)**
- 🤖 **Content-based**: Gợi ý dựa trên tương tự sản phẩm
  - Cùng thương hiệu, thể loại, giới tính, màu sắc
- 🤖 **Collaborative Filtering**: Dựa trên hành vi người dùng
  - Người dùng tương tự thích gì
  - Sản phẩm thường được mua kèm
- 🤖 **Image Search**: Tìm giày từ hình ảnh
- 🤖 **Personalized Feed**: Homepage gợi ý cho từng user

#### 9. **Tính năng bổ trợ khách hàng**
- ✅ Danh sách yêu thích (wishlist)
- ✅ Thông báo (notification) - sắp hết hàng, đơn hàng ship
- ✅ Lịch sử xem sản phẩm
- ✅ Chính sách bảo hành, trả hàng

---

### B. TÍNH NĂNG ADMIN (Admin Dashboard)

#### 1. **Dashboard Tổng hợp**
- 📊 Thống kê doanh thu (ngày/tháng/năm)
- 📊 Tăng trưởng doanh thu (%)
- 📊 Số đơn hàng
- 📊 Tỷ lệ chuyển đổi guest → user
- 📊 Biểu đồ doanh thu theo thời gian
- 📊 Tỷ lệ doanh thu AI vs thường
- 📊 Sản phẩm bán chạy nhất
- 📊 Sản phẩm sắp hết / hết hàng
- 📊 Những sản phẩm thường được mua kèm

#### 2. **Quản lý sản phẩm**
- ✅ CRUD sản phẩm (tạo, đọc, cập nhật, xóa)
- ✅ Nhập thông tin: tên, giá, mô tả, hình ảnh
- ✅ Quản lý biến thể (variant):
  - Size (40-47)
  - Màu sắc (100+ màu)
  - SKU (mã sản phẩm)
  - Số lượng nhập, tồn kho

#### 3. **Quản lý kho hàng (Inventory)**
- 📦 Xem tồn kho hiện tại (real-time)
- 📦 Nhập hàng mới (tạo phiếu nhập)
  - Chọn size/color/quantity
  - Nhập giá vốn
  - Tự động cập nhật database
- 📦 Lọc sản phẩm:
  - Đủ tồn kho
  - Sắp hết (< 5 cái)
  - Hết hàng (= 0)
- 📦 Theo dõi chi tiết từng variant:
  - Tổng nhập
  - Tồn kho
  - Đã bán
  - Giá nhập
- 📦 Lịch sử nhập/xuất:
  - Import: Nhập hàng mới
  - Order: Bán hàng
  - Return: Hoàn hàng
  - Adjust: Điều chỉnh

#### 4. **Quản lý đơn hàng**
- 📋 Xem danh sách đơn hàng
- 📋 Lọc theo:
  - Trạng thái (pending, processing, shipping, etc.)
  - Thời gian (hôm nay, tuần này, tháng này)
  - Kiểu thanh toán
- 📋 Chi tiết đơn hàng:
  - Thông tin khách hàng
  - Danh sách sản phẩm
  - Địa chỉ giao hàng
  - Cập nhật trạng thái
- 📋 Xử lý hoàn trả (return flow):
  - Yêu cầu hoàn hàng
  - Xác nhận nhận hàng
  - Hoàn tiền

#### 5. **Quản lý người dùng**
- 👥 Danh sách tất cả khách hàng
- 👥 Thông tin chi tiết:
  - Email, số điện thoại
  - Địa chỉ giao hàng
  - Lịch sử mua hàng
  - Tổng chi tiêu
- 👥 Lọc theo hành động:
  - Người chỉ xem (browser)
  - Người có trong giỏ (add to cart)
  - Người đã mua (purchaser)

#### 6. **Quản lý mã giảm giá (Voucher)**
- 🎟️ Tạo voucher mới
  - Loại: % giảm hoặc tiền giảm cố định
  - Điều kiện: tối thiểu đơn, loại sản phẩm
  - Số lượng sử dụng
  - Ngày hết hạn
- 🎟️ Chỉnh sửa / xóa voucher
- 🎟️ Xem lịch sử sử dụng

#### 7. **Quản lý thương hiệu & danh mục**
- 🏷️ CRUD Brand (thương hiệu)
  - Tên, slug, logo, sort order
- 🏷️ CRUD Category (danh mục)
  - Tên, slug, hình ảnh, mô tả
  - Giới tính áp dụng
- 🏷️ CRUD Color (màu sắc)
  - Tên, hex code

#### 8. **Quản lý đánh giá**
- ⭐ Xem tất cả review
- ⭐ Lọc theo:
  - Rating (1-5 sao)
  - Sản phẩm
  - Trạng thái (approved, pending)
- ⭐ Duyệt review trước khi hiển thị
- ⭐ Trả lời review

#### 9. **Thống kê doanh thu & chi phí**
- 💰 Doanh thu theo thời gian (ngày/tháng/năm)
- 💰 Chia nhỏ by payment method: COD, VNPay, AI
- 💰 Chi phí: Chi phí nhập hàng (tính từ giá vốn)
- 💰 Lợi nhuận: Doanh thu - Chi phí
- 💰 Biểu đồ trendline

---

### C. TÍNH NĂNG SHIPPER

#### 1. **Nhận đơn giao hàng**
- 🚚 Danh sách đơn cần giao
- 🚚 Chi tiết đơn hàng
- 🚚 Địa chỉ giao hàng

#### 2. **Cập nhật trạng thái**
- 🚚 Đã nhận
- 🚚 Đang vận chuyển
- 🚚 Đã giao

---

## IV. CÁC API ENDPOINTS (THEO SOURCE HIỆN TẠI)

### 1. Authentication (`/api/auth`)
```
POST   /register
POST   /resend-verification
POST   /login
POST   /forgot-password
POST   /reset-password
GET    /verify-reset-token/:token
GET    /verify?token=...              # mount tại /api/auth/verify
POST   /google-login
```

### 2. Products (`/api/products`)
```
GET    /                              # danh sách variants
GET    /all                           # danh sách base products
GET    /base/:id
GET    /product/:product_id
GET    /variant/:id
POST   /base                          # admin
PUT    /base/:id                      # admin
DELETE /base/:id                      # admin
POST   /                              # admin - tạo variant
PUT    /:id                           # admin - sửa variant
DELETE /:id                           # admin - xóa variant
POST   /search-by-image
GET    /colors/list
```

### 3. Cart (`/api/cart`)
```
GET    /
POST   /
PUT    /:id
DELETE /:id
DELETE /
```

### 4. Orders (`/api/orders`)
```
POST   /                              # tạo đơn
PUT    /:id/cancel
GET    /my-orders
GET    /                              # admin
GET    /shipper
PUT    /:id/status
GET    /unsettled                     # admin
GET    /:id
POST   /:id/return-request
POST   /:id/return-review             # admin
POST   /:id/approve-return            # admin
POST   /:id/reject-return             # admin
POST   /:id/receive-return            # admin
POST   /:id/process-refund            # admin
```

### 5. Payment (`/api/payment`)
```
POST   /vnpay/create
POST   /vnpay/retry
GET    /vnpay/return
GET    /vnpay/ipn
POST   /vnpay/ipn
GET    /vnpay/banks
POST   /demo/confirm
```

### 6. Vouchers (`/api/vouchers`)
```
POST   /admin/create                  # admin
GET    /admin/list                    # admin
PUT    /admin/:id/update              # admin
PUT    /admin/:id/deactivate          # admin
GET    /available
POST   /validate
POST   /apply-to-order
```

### 7. Reviews (`/api/reviews`)
```
GET    /product/:productId
GET    /product/:productId/stats
GET    /reviewable
POST   /upload-images
POST   /
POST   /:id/reply                     # admin
GET    /my
GET    /admin/all                     # admin
POST   /:id/like
DELETE /:id/like
```

### 8. Inventory (`/api/inventory`)
```
GET    /stock
GET    /logs
POST   /import
POST   /adjust
GET    /check
GET    /init
POST   /init
GET    /sync-initial
POST   /sync-initial
```

### 9. Users (`/api/users`)
```
GET    /                              # admin
GET    /profile
PUT    /profile
PUT    /change-password
PUT    /:id/role                      # admin
GET    /:id                           # admin
GET    /:id/orders                    # admin
PATCH  /:id                           # admin
DELETE /:id                           # admin
```

### 10. Addresses (`/api/addresses`)
```
GET    /
GET    /default
POST   /
PUT    /:id
DELETE /:id
PUT    /:id/default
```

### 11. Favorites (`/api/favorites`)
```
POST   /add
DELETE /remove/:product_id
GET    /list
POST   /check
```

### 12. Notifications (`/api/notifications`)
```
GET    /
PATCH  /mark-all-read
PATCH  /:id/read
GET    /unread-count
DELETE /:id
```

### 13. Behavior (`/api/behavior`)
```
POST   /log
GET    /recommendations
GET    /viewed
GET    /similar/:productId
GET    /frequently-bought/:productId
GET    /trending
GET    /stats
```

### 14. Danh mục khác
```
GET/POST/PUT/DELETE /api/brands
GET/POST/PUT/DELETE /api/categories (alias từ /api/categories-new)
GET/POST/PUT/DELETE /api/colors      # admin
GET                  /api/admin/dashboard
GET                  /api/admin/revenue
GET                  /api/admin/expenses
POST/GET/DELETE      /api/upload
GET                  /api/provinces ...
```

---

## V. CẤU TRÚC CƠ SỞ DỮ LIỆU

### Bảng chính

| Bảng | Mô tả | Ghi chú |
|------|-------|---------|
| **users** | Thông tin người dùng | email, password, role (customer/admin/shipper) |
| **products** | Thông tin sản phẩm cơ sở | name, price, brand, category, description |
| **product_variants** | Biến thể sản phẩm | size, color, quantity, stock, sold |
| **colors** | Bảng màu sắc | color, hex_code |
| **brands** | Thương hiệu | name, slug, logo |
| **categories** | Danh mục sản phẩm | name, slug, gender_applicable |
| **cart_items** | Giỏ hàng | user_id, variant_id, quantity |
| **orders** | Đơn hàng | user_id, total, status, address, phone |
| **order_items** | Chi tiết đơn hàng | order_id, variant_id, quantity, price |
| **reviews** | Đánh giá sản phẩm | user_id, product_id, rating, comment |
| **review_replies** | Trả lời review | review_id, user_id, text |
| **user_addresses** | Địa chỉ giao hàng | user_id, full_address, is_default |
| **favorites** | Danh sách yêu thích | user_id, product_id |
| **user_behavior_logs** | Log hành vi user | user_id, action (view/search/like/purchase), product_id |
| **inventory_logs** | Lịch sử nhập/xuất kho | variant_id, quantity_changed, import_price, action_type |
| **vouchers** | Mã giảm giá | code, discount_type, discount_value, conditions |
| **user_voucher_usage** | Lịch sử sử dụng voucher | user_id, voucher_id, order_id |
| **notifications** | Thông báo | user_id, type, message, is_read |
| **email_verifications** | Token xác thực email | user_id, token, expires_at |
| **password_resets** | Token reset password | user_id, token, expires_at |

---

## VI. QUY TRÌNH HOẠT ĐỘNG CHÍNH

### 1. Quy trình mua hàng (Customer Journey)

```
[Browse Products] 
    ↓
[Add to Cart] (guest data saved)
    ↓
[Checkout]
    ↓
    ├─→ [Guest] → [Complete Payment (COD/VNPay)] → [Order Created]
    │
    └─→ [User] → [Login/Register] → [Complete Payment] → [Order Created]
    
[Order Processing] → [Shipping] → [Delivered] → [Review & Rating]
```

### 2. Quy trình nhập kho (Inventory Flow)

```
[Admin: Create Import Voucher]
    ↓
[Select Product Variants]
    ↓
[Enter Size, Color, Quantity, Import Price]
    ↓
[Submit Import]
    ↓
[Database Updated: inventory_logs + product_variants]
    ↓
[Inventory Dashboard: Show Stock Real-time]
```

### 3. Quy trình đơn hàng (Order Flow)

```
[Place Order]
    ↓
[Inventory Deduction: stock - qty]
    ↓
[Payment Processing]
    ├─→ [VNPay] → [Redirect to Bank] → [IPN Callback]
    └─→ [COD] → [Manual Confirmation]
    
[Order: pending → processing → shipping → delivered]
    ↓
[Generate Return Flow] (if customer requests return)
```

### 4. Quy trình hoàn hàng (Return Flow)

```
[Customer: Request Return] (status: return_requested)
    ↓
[Admin: Receive & Review]
    ├─→ [Approve] → [Inventory Restored: stock + qty, sold - qty]
    │              → [Refund Money]
    │              → [Status: return_approved]
    │
    └─→ [Reject] → [Notify Customer]
                 → [Status: return_rejected]
```

### 5. Quy trình gợi ý ML (ML Recommendation Flow)

```
[User Action: View/Search/Like Product]
    ↓
[Log to user_behavior_logs]
    ↓
[Trigger ML Model: run training (if needed)]
    ↓
[Generate Recommendations:
  - Content-based (similar products)
  - Collaborative Filtering (users bought together)
  - Image Search (AI image recognition)
]
    ↓
[Cache & Return to Frontend]
```

---

## VII. CÁC TÍNH NĂNG CÔNG NGHỆ

### A. Machine Learning

#### 1. **Content-Based Recommendations**
- Tính toán độ tương tự dựa trên:
  - Thương hiệu, danh mục, giới tính
  - Màu sắc, kiểu giày
  - Giá tiền
- Trả về sản phẩm giống nhất

#### 2. **Collaborative Filtering**
- Tìm người dùng có hành vi tương tự
- Gợi ý sản phẩm mà những người này thích
- Sản phẩm thường được mua kèm

#### 3. **Image Search**
- Upload hình ảnh giày
- Model nhận diện đặc trưng
- Tìm các sản phẩm giống nhất
- Tương tự tìm ảnh Google

#### 4. **Personalized Homepage**
- Mỗi user có homepage khác nhau
- Hiển thị sản phẩm gợi ý dựa trên:
  - Lịch sử xem
  - Danh sách yêu thích
  - Lịch sử mua hàng

---

### B. Hệ thống thanh toán

#### 1. **COD (Cash on Delivery)**
- Thanh toán khi nhận hàng
- Admin xác nhận đơn
- Đơn hàng → processing

#### 2. **VNPay Integration**
- Tạo link thanh toán động
- Chuyển hướng đến trang VNPay
- IPN callback xác nhận
- Tự động xử lý inventory
- Tạo order + history

---

### C. Kiểm soát truy cập

#### 1. **Authentication**
- JWT tokens (access + refresh)
- Google OAuth 2.0
- Email verification
- Rate limiting trên register

#### 2. **Authorization**
- Role-based access control
  - customer: Can view, review, manage own orders
  - admin: Full access
  - shipper: Can view assigned orders
- Protected routes (middleware)

#### 3. **Session Management**
- Guest session (UUID stored in headers)
- Tự động migrate guest data khi register
- Session expires tự động

---

### D. Xử lý dữ liệu & Bảo mật

#### 1. **Data Validation**
- Server-side validation trên tất cả input
- SQL parameterization qua placeholders (`?`)
- XSS protection

#### 2. **File Upload**
- Chỉ cho phép image files (JPEG, PNG, GIF, WebP)
- Max size: 10MB per file
- Lưu trong `/uploads` folder
- Static serve through `/uploads` route

#### 3. **Rate Limiting**
- Register: 5 requests/15 minutes/IP
- Resend email: 3 requests/hour
- Prevent brute force attacks

---

## VIII. BẢO VỆ THÔNG TIN CÁ NHÂN

### Privacy & Compliance

- ✅ Chính sách quyền riêng tư (Privacy Policy)
- ✅ Điều khoản sử dụng (Terms of Service)
- ✅ Chính sách bảo hành (Warranty Policy)
- ✅ Chính sách trả hàng (Return Policy)
- ✅ GDPR-like data handling

---

## IX. KỸ THUẬT TRIỂN KHAI

### Development Setup
```bash
# Backend
cd backend
npm install
npm start

# Frontend  
cd frontend
npm install
npm run dev

# ML Server (optional)
cd ml
pip install -r requirements.txt
python api.py
```

### Database Setup
```bash
# Windows
cd database
init.bat

# Linux/Mac
cd database
chmod +x init.sh
./init.sh
```

### Environment Variables
```
# Backend
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=***
DB_NAME=shoestore
PORT=5000
JWT_SECRET=***
GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***
FRONTEND_URL=http://localhost:5173
ML_SERVICE_URL=http://localhost:5001
```

---

## X. HIỆU SUẤT & TỐI ƯU HÓA

### Frontend
- ✅ Lazy loading components
- ✅ Code splitting with React.lazy()
- ✅ Vite for fast build
- ✅ Tailwind CSS purging

### Backend
- ✅ Connection pooling (MySQL)
- ✅ Query optimization (indexes)
- ✅ Caching layer (planned)
- ✅ Pagination (20 items/page)

### Database
- ✅ Indexes on foreign keys
- ✅ Denormalized stock tracking
- ✅ Partitioning (future)

---

## XI. PHIÊN BẢN & LỊCH SỬ THAY ĐỔI

### Current Version: v1.0

#### Major Features
- ✅ E-commerce core (browse, cart, checkout)
- ✅ User authentication + OAuth
- ✅ Payment integration (VNPay)
- ✅ Admin dashboard
- ✅ ML recommendations
- ✅ Inventory management

#### Known Issues
- [ ] ML model tuning (can improve accuracy)
- [ ] Mobile optimization (works but not perfect)
- [ ] Performance at scale (needs caching)

#### Planned Features (v1.1)
- [ ] Live chat support
- [ ] Product reviews with media
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Internationalization (i18n)

---

## XII. KẾT LUẬN

Hệ thống bán giày trực tuyến này là một nền tảng **thương mại điện tử hoàn chỉnh** kết hợp:

1. **Commerce Core**: Quản lý sản phẩm, giỏ hàng, đơn hàng, thanh toán
2. **User Management**: Đăng ký, xác thực, quản lý tài khoản
3. **Admin Tools**: Dashboard, quản lý kho, thống kê
4. **AI/ML**: Gợi ý cá nhân hóa, tìm kiếm ảnh
5. **Scalability**: Hỗ trợ nhiều người dùng, transaction safety

Hệ thống được thiết kế với **best practices** về:
- Security (JWT, rate limiting, validation)
- Performance (indexing, caching, pagination)
- User Experience (responsive, intuitive)
- Maintainability (clean code, modular architecture)

---

**Tài liệu đã được hiệu chỉnh theo source code hiện tại.**
**Cập nhật lần cuối: 12/04/2026**

