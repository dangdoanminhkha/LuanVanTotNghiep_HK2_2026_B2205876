-- =====================================================================
-- Kiểm tra trạng thái dữ liệu hiện tại
-- =====================================================================

USE shoestore;

-- 1. Kiểm tra bảng colors
SELECT '========== BẢNG COLORS ==========' as check_point;
SELECT COUNT(*) as total_colors FROM colors;
SELECT * FROM colors LIMIT 10;

-- 2. Kiểm tra bảng sizes
SELECT '========== BẢNG SIZES ==========' as check_point;
SELECT COUNT(*) as total_sizes FROM sizes;
SELECT * FROM sizes ORDER BY CAST(size AS DECIMAL);

-- 3. Kiểm tra product_variants - có bao nhiêu rows đã được populate FK?
SELECT '========== PRODUCT_VARIANTS STATUS ==========' as check_point;
SELECT 
    COUNT(*) as total_rows,
    COUNT(CASE WHEN color_id IS NOT NULL THEN 1 END) as color_id_filled,
    COUNT(CASE WHEN size_id IS NOT NULL THEN 1 END) as size_id_filled,
    COUNT(CASE WHEN color_id IS NULL OR size_id IS NULL THEN 1 END) as missing_fk
FROM product_variants;

-- 4. Xem mẫu dữ liệu nguyên gốc vs FK
SELECT '========== SAMPLE DATA ==========' as check_point;
SELECT 
    id,
    product_id,
    color,
    size,
    color_id,
    size_id,
    quantity,
    stock
FROM product_variants 
LIMIT 20;

-- 5. Kiểm tra có NULL nào không
SELECT '========== NULL VALUES ==========' as check_point;
SELECT 
    COUNT(*) as rows_with_color_null,
    COUNT(*) as rows_with_size_null
FROM product_variants
WHERE color_id IS NULL OR size_id IS NULL;

-- 6. Kiểm tra có mismatch không (color_id không tìm thấy trong bảng colors)
SELECT '========== MISMATCH CHECK ==========' as check_point;
SELECT COUNT(*) as orphaned_colors
FROM product_variants pv
WHERE pv.color_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM colors c WHERE c.id = pv.color_id);

SELECT COUNT(*) as orphaned_sizes
FROM product_variants pv
WHERE pv.size_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM sizes s WHERE s.id = pv.size_id);

-- 7. Xem dữ liệu với JOIN (để thấy rõ hơn)
SELECT '========== DATA WITH JOIN ==========' as check_point;
SELECT 
    pv.id,
    pv.product_id,
    pv.color,
    c.color as color_from_table,
    c.hex_code,
    pv.size,
    s.size as size_from_table,
    pv.color_id,
    pv.size_id
FROM product_variants pv
LEFT JOIN colors c ON pv.color_id = c.id
LEFT JOIN sizes s ON pv.size_id = s.id
LIMIT 20;
