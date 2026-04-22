-- =====================================================================
-- HƯỚNG DẪN CHẠY MIGRATION - NORMALIZATION VARIANT TABLE
-- =====================================================================

/*
IMPORTANT: ĐỌC KỸ TRƯỚC KHI CHẠY!

✅ BƯỚC KIỂM TRA TRƯỚC MIGRATION:
1. Backup database hiện tại
   - mysqldump -u root -p shoestore > shoestore_backup.sql

2. Chạy script này từng bước một (không chạy cả 1 lần)

3. Sau mỗi bước lớn, hãy kiểm tra dữ liệu

✅ CÁC BƯỚC:
*/

USE shoestore;

-- ===== BƯỚC 1: Kiểm tra dữ liệu hiện tại =====
-- Xem tất cả colors và sizes có trong product_variants
SELECT 'Current Colors:' as step;
SELECT DISTINCT color FROM product_variants WHERE color IS NOT NULL ORDER BY color;

SELECT 'Current Sizes:' as step;
SELECT DISTINCT size FROM product_variants WHERE size IS NOT NULL ORDER BY CAST(size AS DECIMAL);

SELECT 'Total Variants:' as step;
SELECT COUNT(*) as total FROM product_variants;

-- ===== BƯỚC 2: Tạo bảng colors =====
SELECT 'Creating colors table...' as step;
CREATE TABLE IF NOT EXISTS colors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    color VARCHAR(50) NOT NULL UNIQUE,
    hex_code VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_color (color)
);

-- ===== BƯỚC 3: Tạo bảng sizes =====
SELECT 'Creating sizes table...' as step;
CREATE TABLE IF NOT EXISTS sizes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    size VARCHAR(10) NOT NULL UNIQUE,
    foot_length_cm DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_size (size)
);

-- ===== BƯỚC 4: Drop old UNIQUE constraint =====
SELECT 'Dropping old UNIQUE constraint...' as step;
ALTER TABLE product_variants 
DROP INDEX unique_variant;

-- ===== BƯỚC 5: Thêm columns FK vào product_variants =====
SELECT 'Adding FK columns to product_variants...' as step;
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS color_id INT,
ADD COLUMN IF NOT EXISTS size_id INT;

-- Thêm constraints (nếu chưa có)
ALTER TABLE product_variants 
ADD CONSTRAINT IF NOT EXISTS fk_product_variants_color FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE,
ADD CONSTRAINT IF NOT EXISTS fk_product_variants_size FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE CASCADE;

-- ===== BƯỚC 6: Insert unique colors =====
SELECT 'Inserting colors...' as step;
INSERT INTO colors (color, hex_code) 
SELECT DISTINCT 
    pv.color,
    CASE 
        WHEN LOWER(pv.color) = 'đen' OR LOWER(pv.color) = 'black' THEN '#000000'
        WHEN LOWER(pv.color) = 'trắng' OR LOWER(pv.color) = 'white' THEN '#FFFFFF'
        WHEN LOWER(pv.color) = 'xanh' OR LOWER(pv.color) = 'blue' THEN '#0066FF'
        WHEN LOWER(pv.color) = 'đỏ' OR LOWER(pv.color) = 'red' THEN '#FF0000'
        WHEN LOWER(pv.color) = 'vàng' OR LOWER(pv.color) = 'yellow' THEN '#FFFF00'
        WHEN LOWER(pv.color) = 'xám' OR LOWER(pv.color) = 'gray' THEN '#808080'
        WHEN LOWER(pv.color) = 'hồng' OR LOWER(pv.color) = 'pink' THEN '#FF69B4'
        WHEN LOWER(pv.color) = 'tím' OR LOWER(pv.color) = 'purple' THEN '#800080'
        WHEN LOWER(pv.color) = 'xanh lá' OR LOWER(pv.color) = 'green' THEN '#008000'
        WHEN LOWER(pv.color) = 'nâu' OR LOWER(pv.color) = 'brown' THEN '#A52A2A'
        ELSE NULL
    END
FROM product_variants pv
WHERE pv.color IS NOT NULL AND NOT EXISTS(SELECT 1 FROM colors c WHERE c.color = pv.color)
ORDER BY pv.color;

-- Kiểm tra colors
SELECT 'Colors created:' as step;
SELECT * FROM colors;

-- ===== BƯỚC 7: Insert unique sizes =====
SELECT 'Inserting sizes...' as step;
INSERT INTO sizes (size, foot_length_cm)
SELECT DISTINCT 
    pv.size,
    CASE 
        WHEN CAST(pv.size AS DECIMAL) = 36 THEN 22.5
        WHEN CAST(pv.size AS DECIMAL) = 37 THEN 23.0
        WHEN CAST(pv.size AS DECIMAL) = 38 THEN 23.5
        WHEN CAST(pv.size AS DECIMAL) = 39 THEN 24.0
        WHEN CAST(pv.size AS DECIMAL) = 40 THEN 24.5
        WHEN CAST(pv.size AS DECIMAL) = 41 THEN 25.0
        WHEN CAST(pv.size AS DECIMAL) = 42 THEN 25.5
        WHEN CAST(pv.size AS DECIMAL) = 43 THEN 26.0
        WHEN CAST(pv.size AS DECIMAL) = 44 THEN 26.5
        WHEN CAST(pv.size AS DECIMAL) = 45 THEN 27.0
        ELSE NULL
    END
FROM product_variants pv
WHERE pv.size IS NOT NULL AND NOT EXISTS(SELECT 1 FROM sizes s WHERE s.size = pv.size)
ORDER BY CAST(pv.size AS DECIMAL);

-- Kiểm tra sizes
SELECT 'Sizes created:' as step;
SELECT * FROM sizes ORDER BY CAST(size AS DECIMAL);

-- ===== BƯỚC 8: Populate FK columns =====
SELECT 'Updating product_variants with FK values...' as step;
UPDATE product_variants pv
SET 
    pv.color_id = (SELECT c.id FROM colors c WHERE c.color = pv.color),
    pv.size_id = (SELECT s.id FROM sizes s WHERE s.size = pv.size)
WHERE pv.color_id IS NULL OR pv.size_id IS NULL;

-- ===== BƯỚC 9: Create new UNIQUE constraint using FK =====
SELECT 'Creating new UNIQUE constraint with FK...' as step;
ALTER TABLE product_variants 
ADD CONSTRAINT unique_variant_fk UNIQUE KEY (product_id, color_id, size_id);

-- ===== BƯỚC 10: Kiểm tra kết quả migration =====
SELECT 'Migration verification:' as step;
SELECT 
    COUNT(*) as total_variants,
    COUNT(CASE WHEN color_id IS NOT NULL THEN 1 END) as color_id_populated,
    COUNT(CASE WHEN size_id IS NOT NULL THEN 1 END) as size_id_populated,
    COUNT(CASE WHEN color_id IS NULL OR size_id IS NULL THEN 1 END) as unpopulated
FROM product_variants;

-- Lấy mẫu dữ liệu sau migration
SELECT 'Sample data after migration:' as step;
SELECT 
    pv.id,
    pv.product_id,
    c.color,
    c.hex_code,
    s.size,
    s.foot_length_cm,
    pv.stock
FROM product_variants pv
LEFT JOIN colors c ON pv.color_id = c.id
LEFT JOIN sizes s ON pv.size_id = s.id
LIMIT 20;

-- ===== BƯỚC 12 (OPTIONAL): Xóa các columns cũ =====
-- CHẠY CÂU NÀY CHỈ KHI BẠN ĐÃ CHẮC CHẮN TẤT CẢ HOẠT ĐỘNG BÌNH THƯỜNG
-- ALTER TABLE product_variants 
-- DROP COLUMN color,
-- DROP COLUMN size;

-- ===== BƯỚC 11: Tạo index cho hiệu suất tốt hơn =====
SELECT 'Creating indexes...' as step;
ALTER TABLE product_variants 
ADD INDEX IF NOT EXISTS idx_color_id (color_id),
ADD INDEX IF NOT EXISTS idx_size_id (size_id),
ADD INDEX IF NOT EXISTS idx_product_color_size (product_id, color_id, size_id);

SELECT 'Migration completed successfully!' as step;
