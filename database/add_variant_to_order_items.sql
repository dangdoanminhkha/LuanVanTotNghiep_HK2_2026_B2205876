USE shoestore;

-- Thêm các cột cần thiết để lưu thông tin variant khi đặt hàng
ALTER TABLE order_items 
ADD COLUMN variant_id INT AFTER product_id,
ADD COLUMN size VARCHAR(10) AFTER variant_id,
ADD COLUMN color VARCHAR(50) AFTER size;

-- Thêm foreign key để liên kết variant
ALTER TABLE order_items
ADD CONSTRAINT fk_variant_id FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;

-- Tạo index để tìm kiếm nhanh
CREATE INDEX idx_variant_id ON order_items(variant_id);

-- Xác nhận thay đổi
DESCRIBE order_items;
