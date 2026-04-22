-- Migration: Chuyển từ brand VARCHAR sang brand_id FOREIGN KEY
-- Bước 1: Thêm cột brand_id vào bảng products
ALTER TABLE products ADD COLUMN brand_id INT AFTER brand;

-- Bước 2: Cập nhật brand_id dựa trên brand name hiện tại
UPDATE products p
JOIN brands b ON p.brand = b.name
SET p.brand_id = b.id
WHERE p.brand IS NOT NULL;

-- Bước 3: Thêm foreign key constraint
ALTER TABLE products 
ADD FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;

-- Bước 4: (Optional) Xóa cột brand cũ sau khi kiểm tra dữ liệu
-- ALTER TABLE products DROP COLUMN brand;