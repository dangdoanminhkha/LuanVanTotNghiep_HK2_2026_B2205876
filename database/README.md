# Database Schema - Hệ thống bán giày trực tuyến

## Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ PK id           │
│    username     │
│    password     │
│    role         │──┐
│    created_at   │  │
└─────────────────┘  │
        │            │
        │ 1          │ 1
        │            │
        │ *          │ *
┌─────────────────┐  │  ┌──────────────────┐
│  cart_items     │  │  │  orders          │
├─────────────────┤  │  ├──────────────────┤
│ PK id           │  │  │ PK id            │
│ FK user_id      │──┘  │ FK user_id       │──┐
│ FK product_id   │─┐   │    total         │  │
│    quantity     │ │   │    status        │  │
│    created_at   │ │   │    shipping_addr │  │
└─────────────────┘ │   │    phone         │  │
                    │   │    created_at    │  │
                    │   └──────────────────┘  │
                    │           │             │
                    │           │ 1           │ 1
                    │           │             │
                    │           │ *           │ *
        ┌───────────┴────┐  ┌──────────────────┐
        │                │  │  order_items     │
┌───────▼──────────┐     │  ├──────────────────┤
│   products       │     │  │ PK id            │
├──────────────────┤     │  │ FK order_id      │
│ PK id            │     │  │ FK product_id    │
│    name          │◄────┘  │    quantity      │
│    price         │        │    price         │
│    brand         │        │    created_at    │
│    type          │        └──────────────────┘
│    image         │
│    description   │
│    created_at    │
│    updated_at    │
└──────────────────┘
        │
        │
        │ *
        │
┌───────▼──────────────────┐
│ user_behavior_logs       │
├──────────────────────────┤
│ PK id                    │
│ FK user_id               │
│    action                │
│ FK product_id            │
│    extra_info (JSON)     │
│    timestamp             │
└──────────────────────────┘
```

## Các bảng và mối quan hệ

### 1. users (Người dùng)

- **PK:** id
- **Chức năng:** Lưu thông tin tài khoản người dùng
- **Role:** customer (khách hàng), admin (quản trị), shipper (giao hàng)
- **Quan hệ:**
  - 1 user có nhiều cart_items (giỏ hàng)
  - 1 user có nhiều orders (đơn hàng)
  - 1 user có nhiều user_behavior_logs (log hành vi)

### 2. products (Sản phẩm giày)

- **PK:** id
- **Chức năng:** Lưu thông tin sản phẩm giày
- **Thuộc tính:** name, price, brand, type, image, description
- **Quan hệ:**
  - 1 product trong nhiều cart_items
  - 1 product trong nhiều order_items
  - 1 product trong nhiều user_behavior_logs

### 3. cart_items (Giỏ hàng)

- **PK:** id
- **FK:** user_id, product_id
- **Chức năng:** Lưu sản phẩm trong giỏ hàng của user
- **Quan hệ:**
  - Nhiều cart_items thuộc 1 user
  - Nhiều cart_items tham chiếu 1 product

### 4. orders (Đơn hàng)

- **PK:** id
- **FK:** user_id
- **Chức năng:** Lưu thông tin đơn hàng
- **Status:** pending, processing, shipping, delivered, cancelled
- **Quan hệ:**
  - Nhiều orders thuộc 1 user
  - 1 order có nhiều order_items

### 5. order_items (Chi tiết đơn hàng)

- **PK:** id
- **FK:** order_id, product_id
- **Chức năng:** Lưu chi tiết sản phẩm trong đơn hàng
- **Quan hệ:**
  - Nhiều order_items thuộc 1 order
  - Nhiều order_items tham chiếu 1 product

### 6. user_behavior_logs (Log hành vi - phục vụ ML)

- **PK:** id
- **FK:** user_id, product_id
- **Chức năng:** Ghi log hành vi người dùng để huấn luyện model ML
- **Action:** search, view, add_to_cart, like, purchase, return, review_rating
- **Quan hệ:**
  - Nhiều logs thuộc 1 user
  - Nhiều logs tham chiếu 1 product (nullable)

## Index và Optimization

Các index đã được tạo để tối ưu hiệu suất:

- `users`: username, role
- `products`: brand, type, name
- `cart_items`: user_id, product_id
- `orders`: user_id, status, created_at
- `order_items`: order_id, product_id
- `user_behavior_logs`: user_id, action, product_id, timestamp

## Khởi tạo Database

```bash
# Tạo database và schema
mysql -u root -p < database/schema.sql

# Thêm dữ liệu mẫu
mysql -u root -p < database/seed.sql

# Seed bổ sung behavior logs cho recommender v2 (an toàn chạy lại)
node database/run_migration.js seed_user_behavior_v2.sql
```

## Lưu ý cho Machine Learning

Bảng `user_behavior_logs` lưu trữ:

- Lịch sử tìm kiếm (action='search')
- Sản phẩm đã xem (action='view')
- Sản phẩm thêm vào giỏ (action='add_to_cart')
- Sản phẩm được yêu thích (action='like')
- Sản phẩm đã mua (action='purchase')
- Đơn hàng bị hoàn trả (action='return')
- Điểm đánh giá sao sau khi review (action='review_rating')

Dữ liệu này sẽ được ML service sử dụng để:

1. Phân tích hành vi người dùng
2. Xây dựng user profile
3. Tính similarity giữa users (Collaborative Filtering)
4. Tính similarity giữa products (Content-based Filtering)
5. Đưa ra gợi ý sản phẩm phù hợp
