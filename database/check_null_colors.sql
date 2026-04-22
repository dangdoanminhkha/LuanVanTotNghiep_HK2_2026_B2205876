-- Kiểm tra variants có NULL color_id
USE shoestore;

SELECT '===== NULL COLOR_ID CHECK =====' as status;
SELECT 
    COUNT(*) as total_variants,
    SUM(CASE WHEN color_id IS NULL THEN 1 ELSE 0 END) as null_color_id_count,
    SUM(CASE WHEN color IS NULL THEN 1 ELSE 0 END) as null_color_text_count,
    SUM(CASE WHEN color_id IS NULL OR color IS NULL THEN 1 ELSE 0 END) as missing_color_info
FROM product_variants;

-- Xem mẫu variants có NULL color_id
SELECT '===== SAMPLE NULL COLOR VARIANTS =====' as status;
SELECT 
    id,
    product_id,
    color,
    color_id,
    size,
    size_id,
    quantity,
    stock
FROM product_variants
WHERE color_id IS NULL OR color IS NULL
LIMIT 15;

-- Xem mẫu variants có valid color_id
SELECT '===== SAMPLE VALID COLOR VARIANTS =====' as status;
SELECT 
    id,
    product_id,
    color,
    color_id,
    size,
    size_id,
    quantity,
    stock
FROM product_variants
WHERE color_id IS NOT NULL AND color IS NOT NULL
LIMIT 5;
