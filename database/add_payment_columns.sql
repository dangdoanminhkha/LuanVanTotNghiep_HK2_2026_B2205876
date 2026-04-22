USE shoestore;

-- Thêm các cột payment cho bảng orders
ALTER TABLE orders ADD COLUMN payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending' AFTER payment_method;
ALTER TABLE orders ADD COLUMN payment_ref VARCHAR(100) AFTER payment_status;
ALTER TABLE orders ADD COLUMN payment_bank VARCHAR(50) AFTER payment_ref;
ALTER TABLE orders ADD COLUMN payment_transaction_no VARCHAR(100) AFTER payment_bank;
ALTER TABLE orders ADD COLUMN paid_at DATETIME AFTER payment_transaction_no;
