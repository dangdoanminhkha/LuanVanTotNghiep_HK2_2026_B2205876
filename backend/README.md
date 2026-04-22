# Backend - API bán giày trực tuyến

## Cấu trúc thư mục

```
backend/
├── index.js              # Entry point, khởi tạo Express server
├── db.js                 # Kết nối MySQL database
├── .env                  # Biến môi trường (DB config, JWT secret)
├── middleware/
│   └── auth.js           # Middleware xác thực JWT, phân quyền
└── routes/
    ├── auth.js           # Đăng ký, đăng nhập
    ├── products.js       # CRUD sản phẩm, tìm kiếm, lọc
    ├── cart.js           # Quản lý giỏ hàng
    ├── orders.js         # Tạo đơn hàng, xem đơn, cập nhật trạng thái
    ├── users.js          # Quản lý người dùng (admin)
    └── behavior.js       # Ghi log hành vi, gợi ý sản phẩm (ML)
```

## API Routes

### Auth

- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập (trả về JWT token)

### Products

- `GET /api/products` - Lấy danh sách sản phẩm (hỗ trợ search, filter)
- `GET /api/products/:id` - Chi tiết sản phẩm
- `POST /api/products` - Thêm sản phẩm (admin)
- `PUT /api/products/:id` - Cập nhật sản phẩm (admin)
- `DELETE /api/products/:id` - Xóa sản phẩm (admin)

### Cart

- `GET /api/cart` - Xem giỏ hàng
- `POST /api/cart` - Thêm sản phẩm vào giỏ
- `PUT /api/cart/:id` - Cập nhật số lượng
- `DELETE /api/cart/:id` - Xóa sản phẩm khỏi giỏ
- `DELETE /api/cart` - Xóa toàn bộ giỏ hàng

### Orders

- `POST /api/orders` - Tạo đơn hàng (COD)
- `GET /api/orders/my-orders` - Xem đơn hàng của user
- `GET /api/orders` - Xem tất cả đơn hàng (admin)
- `GET /api/orders/:id` - Chi tiết đơn hàng
- `PUT /api/orders/:id/status` - Cập nhật trạng thái (admin/shipper)

### Users

- `GET /api/users` - Danh sách người dùng (admin)
- `GET /api/users/profile` - Thông tin profile
- `PUT /api/users/:id/role` - Cập nhật role (admin)
- `DELETE /api/users/:id` - Xóa người dùng (admin)

### Behavior (ML)

- `POST /api/behavior/log` - Ghi log hành vi (search, view, add_to_cart, purchase)
- `GET /api/behavior/recommendations` - Lấy gợi ý sản phẩm (ML)

## Cấu hình

Tạo file `.env` trong thư mục `backend/`:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=shoestore
JWT_SECRET=your_jwt_secret_key_here
```

## Chạy backend

```bash
# Từ thư mục gốc
npm start

# Hoặc với nodemon (auto-reload)
npm run dev
```

Server sẽ chạy tại: `http://localhost:5000`
