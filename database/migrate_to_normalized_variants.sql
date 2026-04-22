-- =====================================================================
-- Migration: Normalize product_variants to use separate colors and sizes tables
-- Step 1: Create colors and sizes master tables
-- Step 2: Migrate existing data
-- Step 3: Update product_variants structure with FK
-- =====================================================================

USE shoestore;

-- Step 1: Create colors table
CREATE TABLE IF NOT EXISTS colors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    color VARCHAR(50) NOT NULL UNIQUE,
    hex_code VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_color (color)
);

-- Step 2: Create sizes table with additional info
CREATE TABLE IF NOT EXISTS sizes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    size VARCHAR(10) NOT NULL UNIQUE,
    foot_length_cm DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_size (size)
);

-- Step 3: Drop old UNIQUE constraint before adding new columns
-- (The old constraint uses color and size text columns, we need to replace it with FK-based constraint)
ALTER TABLE product_variants 
DROP INDEX unique_variant;

-- Step 4: Add new columns to product_variants (with FK)
ALTER TABLE product_variants 
ADD COLUMN color_id INT,
ADD COLUMN size_id INT;

-- Step 5: Add Foreign Key constraints
ALTER TABLE product_variants 
ADD CONSTRAINT fk_product_variants_color FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_product_variants_size FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE CASCADE;

-- Step 6: Insert unique colors from existing product_variants
-- (Include hex codes for common colors)
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
WHERE pv.color IS NOT NULL
ORDER BY pv.color;

-- Step 7: Insert unique sizes from existing product_variants
-- (Map common sizes to approximate foot lengths in cm)
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
WHERE pv.size IS NOT NULL
ORDER BY CAST(pv.size AS DECIMAL);

-- Step 8: Update product_variants to populate the new FK columns
UPDATE product_variants pv
SET 
    pv.color_id = (SELECT c.id FROM colors c WHERE c.color = pv.color),
    pv.size_id = (SELECT s.id FROM sizes s WHERE s.size = pv.size);

-- Step 9: Create new UNIQUE constraint using FK columns instead of text
ALTER TABLE product_variants 
ADD CONSTRAINT unique_variant_fk UNIQUE KEY (product_id, color_id, size_id);

-- Step 10: Verify migration - check if all color_id and size_id are populated
SELECT 
    COUNT(*) as total_variants,
    COUNT(CASE WHEN color_id IS NOT NULL THEN 1 END) as color_id_populated,
    COUNT(CASE WHEN size_id IS NOT NULL THEN 1 END) as size_id_populated,
    COUNT(CASE WHEN color_id IS NULL OR size_id IS NULL THEN 1 END) as unpopulated
FROM product_variants;

-- Step 11: Create indexes for better query performance
ALTER TABLE product_variants 
ADD INDEX IF NOT EXISTS idx_color_id (color_id),
ADD INDEX IF NOT EXISTS idx_size_id (size_id),
ADD INDEX IF NOT EXISTS idx_product_color_size (product_id, color_id, size_id);

-- Step 12: (OPTIONAL) Mark old columns as deprecated
-- ALTER TABLE product_variants MODIFY COLUMN color VARCHAR(50) COMMENT 'DEPRECATED: Use color_id instead';
-- ALTER TABLE product_variants MODIFY COLUMN size VARCHAR(10) COMMENT 'DEPRECATED: Use size_id instead';

-- Step 13: (OPTIONAL - Run this AFTER verifying everything works)
-- -- Drop old columns after confirming the new structure works
-- ALTER TABLE product_variants 
-- DROP COLUMN color,
-- DROP COLUMN size;

-- Final verification query
SELECT 
    pv.id,
    pv.product_id,
    c.color,
    c.hex_code,
    s.size,
    s.foot_length_cm,
    pv.stock
FROM product_variants pv
JOIN colors c ON pv.color_id = c.id
JOIN sizes s ON pv.size_id = s.id
LIMIT 10;
