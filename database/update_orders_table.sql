USE shoestore;

-- Thêm các cột mới cho bảng orders (chạy từng lệnh riêng)
ALTER TABLE orders ADD COLUMN recipient_name VARCHAR(100) AFTER phone;
ALTER TABLE orders ADD COLUMN province VARCHAR(100) AFTER recipient_name;
ALTER TABLE orders ADD COLUMN district VARCHAR(100) AFTER province;
ALTER TABLE orders ADD COLUMN ward VARCHAR(100) AFTER district;
ALTER TABLE orders ADD COLUMN address_detail VARCHAR(255) AFTER ward;
ALTER TABLE orders ADD COLUMN payment_method ENUM('cod', 'bank') DEFAULT 'cod' AFTER address_detail;
ALTER TABLE orders ADD COLUMN note TEXT AFTER payment_method;

-- Thêm variant_id vào order_items
ALTER TABLE order_items ADD COLUMN variant_id INT AFTER product_id;
