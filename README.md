# 🛒 Hệ thống bán giày trực tuyến tích hợp Machine Learning

Hệ thống thương mại điện tử bán giày với chức năng gợi ý sản phẩm thông minh dựa trên Machine Learning, phục vụ mục đích nghiên cứu và luận văn tốt nghiệp CNTT.

## 🎯 Tính năng chính

### Khách hàng

- ✅ Đăng ký / Đăng nhập
- ✅ Tìm kiếm, lọc sản phẩm giày
- ✅ Xem chi tiết sản phẩm
- ✅ Thêm vào giỏ hàng
- ✅ Đặt hàng (COD)
- ✅ Xem lịch sử đơn hàng
- 🤖 **Gợi ý sản phẩm dựa trên ML**

### Admin

- ✅ Quản lý sản phẩm (CRUD)
- ✅ Quản lý đơn hàng
- ✅ Quản lý người dùng
- ✅ Thống kê cơ bản

### Shipper

- ✅ Nhận đơn giao hàng
- ✅ Cập nhật trạng thái giao hàng

## 🛠 Công nghệ sử dụng

### Backend

- Node.js + Express
- MySQL (database)
- JWT (authentication)
- RESTful API

### Frontend

- React 18 + Vite
- React Router v6
- Tailwind CSS
- Axios

### Machine Learning

- Python 3.x
- Scikit-learn
- Content-based Filtering
- Collaborative Filtering

## 📁 Cấu trúc thư mục

```
luanvan/
├── backend/          # Node.js Express API
│   ├── routes/       # API routes
│   ├── middleware/   # Auth middleware
│   ├── db.js         # MySQL connection
│   └── index.js      # Server entry
├── frontend/         # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # State management
│   │   └── services/    # API calls
│   └── public/
├── database/         # SQL schemas & ERD
│   ├── schema.sql    # Database schema
│   ├── seed.sql      # Sample data
│   └── README.md     # ERD documentation
├── ml/               # Machine Learning scripts
│   └── (coming soon)
└── scripts/          # Utility scripts
```

## 🚀 Hướng dẫn cài đặt & chạy demo

### 1. Yêu cầu hệ thống

- Node.js v16+
- MySQL 8.0+
- Python 3.8+
- npm hoặc yarn

### 2. Khởi tạo Database

```bash
# Windows
cd database
init.bat

# Linux/Mac
cd database
chmod +x init.sh
./init.sh
```

Hoặc thủ công:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 3. Cấu hình Backend

```bash
# Cài đặt dependencies
npm install

# Tạo file .env trong thư mục backend/
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=shoestore
JWT_SECRET=your_jwt_secret

# Chạy backend
npm start
```

Backend chạy tại: `http://localhost:5000`

### 4. Cấu hình Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại: `http://localhost:5173`

## 👤 Tài khoản demo

```
Admin:
- Username: admin
- Password: admin123

Shipper:
- Username: shipper1
- Password: admin123

Customer:
- Username: customer1
- Password: admin123
```

**Lưu ý:** Mật khẩu cần được hash bằng bcrypt trước khi sử dụng thực tế.

## 📊 Database Schema (ERD)

Xem chi tiết tại [database/README.md](database/README.md)

7 bảng chính:

- `users` - Người dùng (customer, admin, shipper)
- `products` - Sản phẩm giày
- `cart_items` - Giỏ hàng
- `orders` - Đơn hàng
- `order_items` - Chi tiết đơn hàng
- `user_behavior_logs` - Log hành vi (phục vụ ML)
- `shipping` - Thông tin giao hàng

## 🤖 Machine Learning

**Mục tiêu:** Gợi ý sản phẩm dựa trên:

- Lịch sử tìm kiếm
- Sản phẩm đã xem
- Sản phẩm đã thêm vào giỏ
- Sản phẩm đã mua

**Phương pháp:**

- Content-based Filtering (dựa trên đặc điểm sản phẩm)
- Collaborative Filtering (dựa trên hành vi người dùng tương tự)

## 📝 Tài liệu API

Xem chi tiết tại [backend/README.md](backend/README.md)

### Main Endpoints

- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/products` - Danh sách sản phẩm
- `POST /api/cart` - Thêm vào giỏ
- `POST /api/orders` - Tạo đơn hàng
- `GET /api/behavior/recommendations` - Gợi ý sản phẩm (ML)

## 📦 Dữ liệu mẫu

Database có sẵn 30 sản phẩm giày từ các thương hiệu:

- Nike (5 sản phẩm)
- Adidas (5 sản phẩm)
- Puma (5 sản phẩm)
- Converse (5 sản phẩm)
- Vans (5 sản phẩm)
- New Balance (5 sản phẩm)

## 🎓 Gợi ý trình bày luận văn

1. **Giới thiệu:** Bài toán gợi ý sản phẩm trong thương mại điện tử
2. **Phân tích:** Yêu cầu chức năng, phi chức năng
3. **Thiết kế:** Kiến trúc hệ thống, ERD, API design
4. **Triển khai:** Backend (Node.js), Frontend (React), ML (Python)
5. **Demo:** Các tình huống sử dụng, gợi ý ML hoạt động
6. **Đánh giá:** Kết quả đạt được, hạn chế, hướng phát triển

## 🔧 Phát triển tiếp

- [ ] Hoàn thiện các trang frontend còn lại
- [ ] Triển khai ML service (Python)
- [ ] Tích hợp chatbot hỗ trợ
- [ ] Thêm thống kê chi tiết cho admin
- [ ] Tối ưu hiệu suất gợi ý ML

## 📄 License

MIT License - Dự án phục vụ mục đích học tập và nghiên cứu.

Bước 1: Khởi tạo dự án
1.1. Tạo thư mục dự án gồm 2 phần:

frontend: Next.js + TypeScript + Tailwind CSS
backend: Node.js (Express) + PostgreSQL
Bước 2: Khởi tạo Frontend
Vào thư mục frontend, chạy:
Cấu hình Tailwind trong tailwind.config.js và import vào globals.css.
Bước 3: Khởi tạo Backend
Vào thư mục backend, chạy:
Tạo cấu trúc thư mục: src/, file index.js, .env.
Bước 4: Cài đặt PostgreSQL
Cài đặt PostgreSQL trên máy.
Tạo database, user, password.
Cập nhật thông tin vào file .env của backend.
Bước 5: Thiết kế & tạo bảng CSDL
Tạo các bảng: users, products, orders, order_items, cart_items, user_behavior_logs, shipping.
Có thể dùng file SQL hoặc migration script.
Bước 6: Xây dựng API Backend
Đăng ký, đăng nhập (JWT, phân quyền role).
CRUD sản phẩm, đơn hàng, người dùng.
Ghi log hành vi người dùng.
API gợi ý sản phẩm (kết nối với ML hoặc trả về mẫu).
API cho shipper, admin.
Bước 7: Xây dựng giao diện Frontend
Trang đăng nhập, đăng ký.
Trang danh sách sản phẩm, chi tiết sản phẩm.
Trang giỏ hàng, đặt hàng.
Trang quản trị (admin), shipper.
Trang gợi ý sản phẩm.
Tích hợp chatbot đơn giản.
Bước 8: Tích hợp Machine Learning
Thu thập log hành vi từ backend.
Viết script Python (scikit-learn) huấn luyện & dự đoán gợi ý.
Kết nối backend với script ML (REST API hoặc đọc file kết quả).
Bước 9: Chuẩn bị dữ liệu mẫu & tài khoản demo
Tạo script thêm 20–30 sản phẩm, 5–10 user, 1 admin, 1 shipper.
Tạo dữ liệu hành vi mẫu nếu cần.
Bước 10: Hướng dẫn chạy demo
Hướng dẫn cài đặt, chạy backend, frontend, database, script ML.
Demo các chức năng chính: đăng nhập, mua hàng, gợi ý, quản trị, chatbot
