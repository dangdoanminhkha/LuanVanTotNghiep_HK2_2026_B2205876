-- =====================================================================
-- Kiểm tra schema và dữ liệu thực tế bảng product_variants
-- =====================================================================

USE shoestore;

-- 1. Xem cấu trúc bảng
SELECT 'TABLE STRUCTURE:' as check_point;
DESCRIBE product_variants;

-- 2. Xem tất cả columns
SELECT 'COLUMN INFO:' as check_point;
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    EXTRA
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'product_variants' 
AND TABLE_SCHEMA = 'shoestore'
ORDER BY ORDINAL_POSITION;

-- 3. Xem dữ liệu thực tế (10 dòng đầu)
SELECT 'ACTUAL DATA:' as check_point;
SELECT * FROM product_variants LIMIT 10;

-- 4. Xem chi tiết một dòng cụ thể
SELECT 'DETAILED VIEW - ONE ROW:' as check_point;
SELECT * FROM product_variants WHERE id = 219 \G

-- 5. Kiểm tra data types và content
SELECT 'DATA CONTENT CHECK:' as check_point;
SELECT 
    id,
    product_id,
    quantity,
    sold,
    images,
    sku,
    color_id,
    size_id,
    CHAR_LENGTH(images) as images_length,
    CHAR_LENGTH(sold) as sold_length
FROM product_variants
LIMIT 10;
