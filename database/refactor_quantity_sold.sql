-- Migration: Refactor quantity/sold logic
-- Bỏ quantity, sold khỏi products
-- Thêm quantity, sold vào product_variants

-- 1. Bỏ cột quantity, sold khỏi bảng products
ALTER TABLE products DROP COLUMN IF EXISTS quantity;
ALTER TABLE products DROP COLUMN IF EXISTS sold;

-- 2. Thêm cột quantity vào product_variants
ALTER TABLE product_variants ADD COLUMN quantity INT DEFAULT 0 AFTER size;

-- 3. Thêm cột sold vào product_variants
ALTER TABLE product_variants ADD COLUMN sold INT DEFAULT 0 AFTER quantity;

-- 4. stock sẽ được tính ở application: stock = quantity - sold

-- 5. Xác nhận thay đổi
DESCRIBE products;
DESCRIBE product_variants;
