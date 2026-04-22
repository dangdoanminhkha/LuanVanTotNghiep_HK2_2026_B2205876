-- Thêm lại trường image vào bảng products
ALTER TABLE products ADD COLUMN image VARCHAR(500) AFTER description;

-- Xác nhận
DESCRIBE products;
