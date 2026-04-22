-- =====================================================================
-- REVERSE MIGRATION: Restore size cột bình thường, xoá bảng sizes
-- =====================================================================

USE shoestore;

-- BƯỚC 1: Kiểm tra dữ liệu hiện tại
SELECT 'BEFORE MIGRATION - Current structure:' as step;
DESCRIBE product_variants;

SELECT 'Total variants before migration:' as info;
SELECT COUNT(*) as total FROM product_variants;

-- BƯỚC 2: ADD cột size (nếu chưa tồn tại)
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS size VARCHAR(10) AFTER color_id;

-- BƯỚC 3: Restore size value từ bảng sizes vào product_variants
SELECT 'Restoring size values from sizes table...' as step;
UPDATE product_variants pv
SET pv.size = (SELECT s.size FROM sizes s WHERE s.id = pv.size_id)
WHERE pv.size_id IS NOT NULL;

-- Kiểm tra đã populate hết chưa
SELECT 'Verification - Check if size column is populated:' as step;
SELECT 
    COUNT(*) as total_variants,
    COUNT(CASE WHEN size IS NOT NULL THEN 1 END) as size_populated,
    COUNT(CASE WHEN size IS NULL THEN 1 END) as size_null,
    COUNT(CASE WHEN size_id IS NOT NULL THEN 1 END) as size_id_still_exists
FROM product_variants;

-- Sample data để kiểm tra
SELECT 'Sample data after restore:' as step;
SELECT id, product_id, size, size_id, color_id FROM product_variants LIMIT 20;

-- BƯỚC 4: Xoá foreign key constraint
SELECT 'Dropping foreign key constraint...' as step;
ALTER TABLE product_variants 
DROP FOREIGN KEY fk_product_variants_size;

-- BƯỚC 5: Xoá cột size_id
SELECT 'Dropping size_id column...' as step;
ALTER TABLE product_variants 
DROP COLUMN size_id;

-- BƯỚC 6: Xoá bảng sizes
SELECT 'Dropping sizes table...' as step;
DROP TABLE IF EXISTS sizes;

-- BƯỚC 7: Xoá bảng colors (nếu cũng muốn denormalize hoàn toàn)
-- (Bỏ comment nếu muốn xoá - nhưng khuyến nghị giữ lại colors vì nó có hex_code)
-- DROP TABLE IF EXISTS colors;

-- BƯỚC 8: Verify hoàn tất
SELECT 'AFTER MIGRATION - Final structure:' as step;
DESCRIBE product_variants;

SELECT 'Migration completed successfully!' as status;

-- Kiểm tra lại dữ liệu cuối cùng
SELECT 'Final data check:' as step;
SELECT 
    COUNT(*) as total_variants,
    COUNT(DISTINCT size) as unique_sizes,
    COUNT(DISTINCT color_id) as unique_color_ids,
    GROUP_CONCAT(DISTINCT size ORDER BY CAST(size AS DECIMAL)) as all_sizes
FROM product_variants;
