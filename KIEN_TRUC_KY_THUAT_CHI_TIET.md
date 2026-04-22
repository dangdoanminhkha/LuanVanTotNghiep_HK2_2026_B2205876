# 🏗️ KIẾN TRÚC KỸ THUẬT CHI TIẾT

## I. KIẾN TRÚC TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React 19)                       │
│  - SPA (Single Page Application) with React Router          │
│  - Real-time UI updates with React hooks                    │
│  - State management: Context API                            │
└─────────────┬───────────────────────────────────────────────┘
              │ HTTP/HTTPS
              │ Axios HTTP Client
              │
┌─────────────▼───────────────────────────────────────────────┐
│           BACKEND (Node.js + Express)                        │
│  - RESTful API Server                                        │
│  - Authentication (JWT + OAuth)                              │
│  - Business Logic                                            │
│  - File uploads                                              │
└──────────────┬─────┬────────────────┬─────────────────────────┘
               │     │                │
        ┌──────▼─┐ ┌─▼──────┐  ┌────▼──────┐
        │ MySQL  │ │ File   │  │ ML Server │
        │ DB     │ │ Storage│  │ (Python)  │
        └────────┘ └────────┘  └───────────┘
```

## II. FRONTEND ARCHITECTURE

### A. Cấu trúc Thư mục
```
frontend/src/
├── App.jsx                 # Root component + routing
├── main.jsx                # Entry point
│
├── pages/
│   ├── Home.jsx           # Homepage
│   ├── Collections.jsx    # Browse all products
│   ├── ProductDetail.jsx  # Product detail page
│   ├── Cart.jsx           # Shopping cart
│   ├── Checkout.jsx       # Order checkout
│   ├── MyOrders.jsx       # Order history
│   ├── MyReviews.jsx      # My reviews
│   ├── Login.jsx          # Login form
│   ├── Register.jsx       # Register form
│   ├── Profile.jsx        # User profile
│   ├── Recommendations.jsx # ML recommendations
│   ├── ImageSearch.jsx    # Image search page
│   ├── PaymentSuccess.jsx
│   ├── PaymentReturn.jsx
│   │
│   └── admin/             # Admin pages
│       ├── Dashboard.jsx      # Dashboard with charts
│       ├── Products.jsx       # Product management
│       ├── InventoryManager.jsx
│       ├── Orders.jsx         # Order management
│       ├── Users.jsx          # User management
│       ├── VoucherManager.jsx
│       ├── Revenue.jsx        # Revenue analytics
│       └── ShipmentManagement.jsx
│
├── components/
│   ├── Navbar.jsx         # Top navigation
│   ├── Footer.jsx         # Footer
│   ├── ProductCard.jsx
│   ├── AdminLayout.jsx    # Admin layout wrapper
│   ├── PrivateRoute.jsx   # Route protection
│   └── ...more components
│
├── context/
│   ├── AuthContext.jsx    # Auth state + functions
│   ├── CartContext.jsx    # Cart state
│   └── useAuth.js         # Auth helper hook
│
├── services/
│   └── api.js             # Axios instance + helpers
│
└── hooks/, utils/, assets/
```

### B. Routing Structure

| Path | Component | Auth Required | Role |
|------|-----------|---------------|------|
| `/` | Home | No | All |
| `/collections/:collection` | Collections | No | All |
| `/collections/brand/:brandSlug` | BrandCollection | No | All |
| `/products/:slug` | ProductDetail | No | All |
| `/cart` | Cart | No | All |
| `/checkout` | Checkout | Yes | customer |
| `/account/orders` | MyOrders | Yes | customer |
| `/my-reviews` | MyReviews | Yes | customer |
| `/login` | Login | No | All |
| `/register` | Register | No | All |
| `/profile` | Profile | Yes | customer |
| `/search-image` | ImageSearch | No | customer/guest |
| `/admin/dashboard` | Dashboard | Yes | admin |
| `/admin/products` | AdminProducts | Yes | admin |
| `/admin/orders` | AdminOrders | Yes | admin |
| `/admin/inventory` | AdminInventory | Yes | admin |

### C. State Management (AuthContext)

```javascript
// Values provided
{
  user: { id, email, fullName, role },
  login: (email, password) => {...},
  register: (data) => {...},
  logout: () => {...},
  isLoggedIn: boolean,
  isAdmin: boolean
}
```

### D. API Integration Pattern

```javascript
import api from '../services/api';

// GET
const response = await api.get('/products/all');

// POST
const response = await api.post('/orders', {
  items: [...],
  address: '...'
});

// Headers automatically include JWT token
```

### E. Danh sách Chức năng Giao diện Theo vai trò

Nguyên tắc thống kê:
- Chỉ tính chức năng có màn hình riêng (route/page riêng).
- Không tách các phần con trong cùng màn hình thành chức năng riêng (ví dụ review hiển thị trong trang chi tiết sản phẩm).

#### 1) User/Customer

**1. Trang chủ**
- Phần giao diện: Banner, menu điều hướng, khối sản phẩm nổi bật/gợi ý, footer.
- Hoạt động: Hiển thị nội dung tổng quan và điều hướng nhanh đến danh mục/sản phẩm.
- Luồng: Người dùng vào `/` → frontend tải dữ liệu cần thiết → chọn danh mục/sản phẩm → điều hướng sang trang tương ứng.
- Thư viện: `react-router-dom`, `axios`, React hooks.

**2. Đăng nhập**
- Phần giao diện: Form email/mật khẩu, link quên mật khẩu, link đăng ký.
- Hoạt động: Gửi thông tin đăng nhập, lưu token/user vào context + localStorage.
- Luồng: Vào `/login` → nhập thông tin → gọi API auth → thành công thì điều hướng theo role.
- Thư viện: `axios`, `react-router-dom`, `react-toastify`, Context API.

**3. Đăng ký + xác minh email**
- Phần giao diện: Form đăng ký, trang check email, trang verify token.
- Hoạt động: Tạo tài khoản mới, gửi email xác thực và xác nhận tài khoản.
- Luồng: `/register` → submit form → `/check-email` → user bấm link verify → `/verify`.
- Thư viện: `axios`, `react-router-dom`, `react-toastify`.

**4. Quên mật khẩu / đặt lại mật khẩu**
- Phần giao diện: Form nhập email nhận link reset, form nhập mật khẩu mới theo token.
- Hoạt động: Gửi yêu cầu reset và xác nhận mật khẩu mới.
- Luồng: `/forgot-password` → gửi email → user mở link `/reset-password/:token` → đổi mật khẩu.
- Thư viện: `axios`, `react-router-dom`, `react-toastify`.

**5. Duyệt sản phẩm (Collections/Brand)**
- Phần giao diện: Danh sách sản phẩm, bộ lọc, sắp xếp, phân trang/hiển thị theo nhóm.
- Hoạt động: Lấy danh sách sản phẩm theo route và query filter.
- Luồng: Vào `/collections/:collection` hoặc `/collections/brand/:brandSlug` → chọn filter/sort → cập nhật danh sách.
- Thư viện: `react-router-dom`, `axios`.

**6. Chi tiết sản phẩm**
- Phần giao diện: Ảnh, thông tin giá/biến thể, mô tả/spec, phần review, thêm giỏ/yêu thích.
- Hoạt động: Tải thông tin sản phẩm + biến thể + review liên quan, hỗ trợ chọn size/màu.
- Luồng: Vào `/products/:slug` → chọn biến thể → thêm giỏ hoặc yêu thích.
- Thư viện: `react-router-dom`, `axios`, React hooks.

**7. Giỏ hàng**
- Phần giao diện: Danh sách item, tăng/giảm số lượng, xóa item, tổng tiền, nút checkout.
- Hoạt động: Quản lý trạng thái giỏ hàng qua `CartContext` và local storage.
- Luồng: Vào `/cart` → cập nhật số lượng/xóa → bấm checkout.
- Thư viện: Context API, `react-router-dom`.

**8. Checkout/Đặt hàng**
- Phần giao diện: Chọn địa chỉ, chọn thanh toán, voucher, tổng kết đơn, xác nhận đặt.
- Hoạt động: Gửi đơn hàng, xử lý điều hướng tới VNPay hoặc trang kết quả.
- Luồng: `/checkout` (bắt buộc đăng nhập) → xác nhận đơn → backend tạo order/payment → chuyển sang luồng thanh toán.
- Thư viện: `axios`, `react-router-dom`, `react-toastify`.

**9. Kết quả thanh toán (VNPay Return/Success/Demo)**
- Phần giao diện: Trạng thái giao dịch, mã giao dịch, nút quay lại.
- Hoạt động: Đọc query params, xác thực trạng thái thanh toán và hiển thị kết quả.
- Luồng: VNPay redirect về `/payment/vnpay-return` (hoặc route success/demo) → hiển thị kết quả cho user.
- Thư viện: `react-router-dom`, `axios`.

**10. Tài khoản người dùng (Profile/Orders/Notifications/MyReviews)**
- Phần giao diện: Layout tài khoản và các tab quản lý thông tin cá nhân/đơn/notification/review.
- Hoạt động: Xem và cập nhật dữ liệu cá nhân, theo dõi đơn hàng, quản lý đánh giá đã gửi.
- Luồng: `/account/*` → chọn mục tương ứng → gọi API và render dữ liệu theo tab.
- Thư viện: `react-router-dom`, `axios`, `react-toastify`.

**11. Favorites**
- Phần giao diện: Danh sách sản phẩm đã yêu thích, bỏ yêu thích, điều hướng chi tiết.
- Hoạt động: Hỗ trợ cả user đăng nhập và guest theo session.
- Luồng: `/favorites` → tải danh sách → thêm/xóa yêu thích từ product card/detail.
- Thư viện: `axios`, `react-router-dom`, session utility.

**12. Recommendations**
- Phần giao diện: Danh sách sản phẩm gợi ý theo hành vi.
- Hoạt động: Lấy gợi ý từ behavior logs/user profile.
- Luồng: `/recommendations` (private) → gọi API gợi ý → render danh sách.
- Thư viện: `axios`, React hooks.

**13. Image Search**
- Phần giao diện: Upload ảnh, nút tìm kiếm, danh sách kết quả tương đồng.
- Hoạt động: Gửi file ảnh lên backend, backend gọi ML service trả về kết quả.
- Luồng: `/search-image` → chọn ảnh → submit → nhận và hiển thị kết quả.
- Thư viện: `axios` (multipart/form-data), React hooks.

#### 2) Admin

**1. Dashboard**
- Phần giao diện: KPI cards, biểu đồ doanh thu/chuyển đổi, top sản phẩm, cảnh báo tồn kho.
- Hoạt động: Tổng hợp dữ liệu nhiều nguồn và lọc theo thời gian.
- Luồng: `/admin/dashboard` → gọi API dashboard → render cards/charts.
- Thư viện: `axios`, `recharts`, `react-router-dom`.

**2. Quản lý sản phẩm**
- Phần giao diện: Bảng/list sản phẩm, tìm kiếm, tạo/sửa/xóa, điều hướng chi tiết.
- Hoạt động: CRUD sản phẩm base và điều hướng sang biến thể.
- Luồng: `/admin/products` → thao tác CRUD → reload danh sách.
- Thư viện: `axios`, `react-router-dom`, `react-toastify`.

**3. Chi tiết sản phẩm admin**
- Phần giao diện: Thông tin đầy đủ sản phẩm, media, biến thể liên quan.
- Hoạt động: Quản lý sâu từng sản phẩm ở mức admin.
- Luồng: `/admin/products/:slug` → xem/sửa thông tin chi tiết.
- Thư viện: `axios`, `react-router-dom`.

**4. Chi tiết biến thể (variant)**
- Phần giao diện: Thông tin variant theo màu/size, ảnh, tồn kho, SKU.
- Hoạt động: Theo dõi và chỉnh sửa dữ liệu variant cụ thể.
- Luồng: `/admin/variant/:id` → update trường cần thiết → lưu.
- Thư viện: `axios`, `react-router-dom`.

**5. Quản lý kho (Inventory)**
- Phần giao diện: Danh sách tồn kho, nhập hàng/điều chỉnh, lịch sử nhập-xuất.
- Hoạt động: Đồng bộ stock với inventory logs.
- Luồng: `/admin/inventory` → thao tác điều chỉnh kho → backend cập nhật logs + stock.
- Thư viện: `axios`, `react-toastify`.

**6. Quản lý đơn hàng admin**
- Phần giao diện: Danh sách đơn, bộ lọc trạng thái, chi tiết đơn, action theo trạng thái.
- Hoạt động: Cập nhật trạng thái, xử lý hoàn trả/hoàn tiền theo nghiệp vụ.
- Luồng: `/admin/orders` → chọn đơn → thực hiện action → cập nhật timeline trạng thái.
- Thư viện: `axios`, `react-router-dom`, `react-toastify`.

**7. Quản lý đánh giá (Admin Reviews)**
- Phần giao diện: Danh sách review, chi tiết review, form phản hồi.
- Hoạt động: Admin phản hồi review và theo dõi review chưa xử lý.
- Luồng: `/admin/reviews` → chọn review → gửi phản hồi.
- Thư viện: `axios`, `react-router-dom`.

**8. Quản lý doanh thu (Revenue Analytics)**
- Phần giao diện: Bộ lọc thời gian, biểu đồ doanh thu/AI revenue, cơ cấu khách.
- Hoạt động: Tổng hợp dữ liệu từ orders/order_items/order_status_logs.
- Luồng: `/admin/revenue` → chọn tháng/năm/custom range → render chart và bảng.
- Thư viện: `axios`, `recharts`.

**9. Quản lý voucher**
- Phần giao diện: Danh sách voucher, form tạo/sửa, trạng thái hiệu lực/số lượt dùng.
- Hoạt động: CRUD voucher và theo dõi usage.
- Luồng: `/admin/vouchers` → thao tác voucher → cập nhật dữ liệu hiển thị.
- Thư viện: `axios`, `react-toastify`.

**10. Quản lý người dùng**
- Phần giao diện: Danh sách user, lọc/tìm kiếm, xem nhanh trạng thái tài khoản.
- Hoạt động: Quản trị user và điều hướng tới trang chi tiết user.
- Luồng: `/admin/users` → chọn user → sang trang detail.
- Thư viện: `axios`, `react-router-dom`.

**11. Chi tiết người dùng**
- Phần giao diện: Hồ sơ user, thông tin liên hệ, hành vi/đơn liên quan (nếu có).
- Hoạt động: Theo dõi dữ liệu tài khoản ở mức chi tiết.
- Luồng: `/admin/users/:id` → tải dữ liệu user theo id → hiển thị chi tiết.
- Thư viện: `axios`, `react-router-dom`.

#### 3) Shipper

**1. Delivery (màn hình giao hàng)**
- Phần giao diện: Header nghiệp vụ shipper, tab trạng thái, danh sách đơn, modal nhập lý do thất bại, action button theo trạng thái.
- Hoạt động: Nhận đơn, cập nhật trạng thái giao (`shipping`, `delivered`, `failed_delivery_retry`, ...), ghi nhận COD/payment status khi cần.
- Luồng: `/shipper/delivery` → shipper nhận đơn → cập nhật trạng thái theo tiến trình giao hàng → backend lưu trạng thái + log.
- Thư viện: `axios`, `react-router-dom`, custom `Modal` + hook `useModal`, React hooks.

#### 4) Thư viện chính dùng xuyên suốt frontend

- `react-router-dom`: Routing, bảo vệ route theo vai trò (`PrivateRoute`).
- `axios`: Gọi REST API, truyền token/session headers.
- `react-toastify`: Thông báo thành công/lỗi cho thao tác nghiệp vụ.
- `recharts`: Biểu đồ dashboard/revenue cho admin.
- React Context + Hooks: Quản lý auth/cart state và lifecycle dữ liệu.

---

## III. BACKEND ARCHITECTURE

### A. Request/Response Pipeline

```
┌──────────────┐
│ HTTP Request │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────┐
│ Express Middleware          │
│ - CORS                      │
│ - Body parser (JSON)        │
│ - Session extraction        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Route Handler               │
│ - Parse params              │
│ - Validate input            │
│ - Query DB / call ML service│
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Database Layer              │
│ - MySQL queries             │
│ - Transaction management    │
└──────────┬──────────────────┘
           │
           ▼
┌──────────────┐
│ JSON Response│
└──────────────┘
```

### B. Middleware Stack

| Middleware | Purpose | Order |
|-----------|---------|-------|
| `cors()` | Enable CORS | 1 |
| `express.json()` | Parse JSON body | 2 |
| `extractSessionId` | Extract guest session | 3 |
| `authenticateToken` | Verify JWT | Per route |
| `isAdmin` | Check admin role | Per route |
| `rateLimiter` | Rate limiting | Per route |
| `upload` | File upload | Per route |

### C. Authentication Flow

#### 1. **Register**
```
POST /api/auth/register
├─ Input validation
├─ Hash password (bcrypt)
├─ Insert user into DB
├─ Create email verification token
├─ Send verification email
└─ Response: confirmation message
```

#### 2. **Login**
```
POST /api/auth/login
├─ Find user by email
├─ Compare password (bcrypt)
├─ Generate JWT token
├─ Return token + user info
└─ Frontend stores in localStorage
```

#### 3. **Verify Token**
```
Protected Route
├─ Extract JWT from header
├─ Verify signature + expiry
├─ Decode user_id
├─ Proceed if valid
└─ Return 401 if invalid
```

### D. Database Connection

```javascript
// db.js - MySQL Connection Pool
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  connectionLimit: 10,
  queueLimit: 0
});

// Usage
const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
```

### E. Error Handling

```javascript
// Standard Error Response
res.status(500).json({
  error: 'Error message',
  details: 'Additional info for debugging'
});

// Try-catch in every route
try {
  // Business logic
} catch (err) {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
}
```

---

## IV. DATABASE SCHEMA DETAILS

### A. Snapshot Từ Database Thật (shoestore)

Đã đọc trực tiếp từ `information_schema` của DB đang chạy.

**Tổng số bảng:** 20

**Danh sách bảng + số bản ghi hiện tại (TABLE_ROWS - ước lượng InnoDB):**

| Bảng | Số bản ghi (ước lượng) |
|------|--------------------------|
| brands | 7 |
| cart_items | 0 |
| categories | 5 |
| colors | 11 |
| email_verifications | 0 |
| favorites | 6 |
| inventory_logs | 667 |
| notifications | 141 |
| order_items | 132 |
| order_returns | 6 |
| order_status_logs | 182 |
| orders | 104 |
| product_variants | 657 |
| products | 48 |
| reviews | 9 |
| user_addresses | 5 |
| user_behavior_logs | 4414 |
| user_voucher_usage | 0 |
| users | 100 |
| vouchers | 1 |

### B. Cột Hiện Tại Theo Bảng

**users**
```sql
id, email, password, is_verified, role, full_name, phone, gender,
created_at, google_id, auth_provider, avatar_url
```

**email_verifications**
```sql
id, user_id, token, expires_at, created_at, type
```

**products**
```sql
id, name, price, brand_id, gender, tags, category_id, description,
specification, discount, created_at, updated_at, image
```

**product_variants**
```sql
id, product_id, quantity, stock, sold, images, sku,
created_at, updated_at, color_id, size
```

**brands**
```sql
id, name, slug, logo, is_active, sort_order, created_at, updated_at
```

**categories**
```sql
id, name, slug, gender_applicable, description, image,
is_active, sort_order, created_at, updated_at
```

**colors**
```sql
id, color, hex_code, created_at, updated_at
```

**orders**
```sql
id, user_id, voucher_id, payment_method, payment_status, payment_ref,
payment_bank, payment_transaction_no, note, total, discount_applied,
status, retry_count, created_at, user_address_id
```

**order_items**
```sql
id, order_id, product_id, variant_id, size, color,
quantity, price, is_ai_suggested, created_at
```

**order_returns**
```sql
id, order_id, return_reason, return_evidence,
return_rejected_reason, created_at, updated_at
```

**order_status_logs**
```sql
id, order_id, status_old, status_new, created_at
```

**inventory_logs**
```sql
id, variant_id, quantity_changed, import_price, action_type,
reference_code, note, created_at
```

**cart_items**
```sql
id, user_id, session_id, product_id, quantity, created_at
```

**favorites**
```sql
id, user_id, session_id, product_id, created_at
```

**reviews**
```sql
id, user_id, admin_user_id, product_id, order_item_id,
overall_rating, general_comment, reply_text, reply_at,
images, liked_user_ids, created_at, updated_at
```

**user_addresses**
```sql
id, user_id, full_name, phone, province_code, province_name,
district_code, district_name, ward_code, ward_name,
address_detail, is_default, created_at, updated_at
```

**user_behavior_logs**
```sql
id, user_id, session_id, action, product_id, extra_info, timestamp
```

**notifications**
```sql
id, user_id, type, title, message, order_id, review_id,
is_read, created_at, updated_at
```

**vouchers**
```sql
id, code, voucher_type, discount_amount, min_order_value,
max_usage_per_user, total_usage_limit, current_usage,
valid_from, valid_until, duration_days, description,
is_active, created_at, updated_at
```

**user_voucher_usage**
```sql
id, user_id, voucher_id, used_count, last_used_at, created_at
```

### C. Quan Hệ Giữa Các Bảng (Foreign Keys thực tế)

| Bảng con.cột | Tham chiếu | Loại quan hệ |
|-------------|------------|--------------|
| cart_items.user_id | users.id | N-1 |
| cart_items.product_id | products.id | N-1 |
| email_verifications.user_id | users.id | N-1 |
| favorites.user_id | users.id | N-1 |
| favorites.product_id | products.id | N-1 |
| notifications.user_id | users.id | N-1 |
| notifications.order_id | orders.id | N-1 |
| notifications.review_id | reviews.id | N-1 |
| order_items.order_id | orders.id | N-1 |
| order_items.product_id | products.id | N-1 |
| order_returns.order_id | orders.id | N-1 (thực tế thường 1-1 theo nghiệp vụ) |
| order_status_logs.order_id | orders.id | N-1 |
| orders.user_id | users.id | N-1 |
| orders.voucher_id | vouchers.id | N-1 |
| orders.user_address_id | user_addresses.id | N-1 |
| product_variants.product_id | products.id | N-1 |
| product_variants.color_id | colors.id | N-1 |
| products.brand_id | brands.id | N-1 |
| products.category_id | categories.id | N-1 |
| reviews.user_id | users.id | N-1 |
| reviews.admin_user_id | users.id | N-1 |
| reviews.product_id | products.id | N-1 |
| reviews.order_item_id | order_items.id | N-1 |
| user_addresses.user_id | users.id | N-1 |
| user_behavior_logs.user_id | users.id | N-1 |
| user_behavior_logs.product_id | products.id | N-1 |
| user_voucher_usage.user_id | users.id | N-1 |
| user_voucher_usage.voucher_id | vouchers.id | N-1 |

### D. Quan Hệ Logic (không ràng buộc FK trong DB)

- `cart_items.session_id` và `favorites.session_id` dùng cho guest session.
- `user_behavior_logs.session_id` dùng theo dõi hành vi khách vãng lai.
- `order_items.variant_id` và `inventory_logs.variant_id` đang dùng nghiệp vụ, nhưng DB hiện tại chưa có FK cứng tới `product_variants.id`.

---

## V. API DESIGN PATTERNS

### A. RESTful Conventions

```
// Products
GET    /api/products/all
GET    /api/products/base/:id
GET    /api/products/product/:product_id
GET    /api/products/variant/:id
POST   /api/products/base         # Create base product (admin)
PUT    /api/products/base/:id     # Update base product (admin)

// Orders
GET    /api/orders/my-orders      # My orders
GET    /api/orders/456            # Order detail
POST   /api/orders                # Create order
PUT    /api/orders/456/status     # Update status (admin)
POST   /api/orders/456/process-refund  # Refund (admin)
```

### B. Request/Response Format

**Request**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success Response (200) - mẫu phổ biến**
```json
{
  "message": "Success",
  "data": {}
}
```

**Error Response (400/500)**
```json
{
  "error": "Error message",
  "details": "Additional context (optional)"
}
```

Lưu ý: response format hiện chưa đồng nhất tuyệt đối giữa tất cả route.

### C. Pagination Pattern

```javascript
// Request
GET /api/products?page=2&limit=20&sort=price_desc

// Response
{
  "data": [/* items */],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## VI. SECURITY MEASURES

### A. Authentication
- ✅ JWT tokens (HS256, login thường: 1 ngày, Google login: 7 ngày)
- ✅ Google OAuth 2.0
- ✅ Password hashing (bcryptjs, 10 rounds)
- ✅ Email verification tokens (24h expiry)

### B. Authorization
- ✅ Role-based access control (RBAC)
  - customer: Own data only
  - admin: Full access
- ✅ Middleware checks on protected routes

### C. Input Validation
- ✅ Server-side validation (đang áp dụng rõ ở auth routes bằng express-validator)
- ✅ Type checking
- ✅ SQL parameterization (prevent injection)

### D. Rate Limiting
- ✅ Register: 5 req/15min per IP
- ✅ Email resend: 3 req/hour per user

### E. CORS
- ✅ Whitelist frontend origins
- ✅ Allow credentials

### F. File Upload Security
- ✅ Whitelist allowed MIME types
- ✅ File size limit: 10MB
- ✅ Rename uploaded files

---

## VII. PERFORMANCE OPTIMIZATION

### A. Database
- ✅ Indexes on FK, unique fields
- ✅ Connection pooling (10 connections)
- ✅ Query optimization (LIMIT pagination)

### B. Backend
- ✅ Async/await (non-blocking)
- ✅ Trigger background jobs (order hold watcher, ML retrain trigger)
- ✅ Tích hợp ML service qua HTTP nội bộ

### C. Frontend
- ✅ Routing bằng React Router + phân tách page components
- ✅ Image optimization
- ✅ Vite for fast loading

---

## VIII. DEPLOYMENT & TESTING

### A. Development Setup

```bash
# Backend
cd backend
npm install
npm start              # PORT 5000

# Frontend
cd frontend
npm install
npm run dev            # PORT 5173

# ML (optional)
cd ml
pip install -r requirements.txt
python api.py          # PORT 5001
```

### B. Environment Variables

**Backend (.env)**
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=***
DB_NAME=shoestore
PORT=5000
JWT_SECRET=***
GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***
SMTP_HOST=***
SMTP_USER=***
SMTP_PASS=***
ML_SERVICE_URL=http://localhost:5001
```

### C. Testing

```bash
# Frontend
npm run lint
npm run build

# Backend
npm run dev

# Manual API testing
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## IX. MONITORING & LOGGING

### A. Backend Logging
```javascript
console.log('✓ Success message');      // Green ✓
console.error('❌ Error message');     // Red ❌
console.warn('⚠️ Warning message');    // Yellow ⚠️
```

### B. Monitoring Points
- API response times
- Database query slowness
- Error rates
- File upload successes/failures

---

**Tài liệu này cung cấp chi tiết kỹ thuật cho developers.**

