-- =====================================================================
-- Migration: Fix NULL color_id in product_variants
-- =====================================================================
USE shoestore;

-- 1. Check current status
SELECT 
    'Before migration' as status,
    COUNT(*) as total,
    SUM(CASE WHEN color_id IS NULL THEN 1 ELSE 0 END) as null_count
FROM product_variants;

-- 2. Update color_id từ colors table dựa vào color text
UPDATE product_variants pv
SET pv.color_id = (SELECT c.id FROM colors c WHERE c.color = pv.color LIMIT 1)
WHERE pv.color_id IS NULL AND pv.color IS NOT NULL;

-- 3. Nếu vẫn có NULL (color mismatch), tìm kiếm với LIKE (case-insensitive)
UPDATE product_variants pv
SET pv.color_id = (
    SELECT c.id FROM colors c 
    WHERE LOWER(c.color) = LOWER(pv.color) 
    LIMIT 1
)
WHERE pv.color_id IS NULL AND pv.color IS NOT NULL;

-- 4. Nếu vẫn có NULL (không tìm thấy color trong colors table), assign to first available color
UPDATE product_variants pv
SET pv.color_id = (SELECT id FROM colors LIMIT 1)
WHERE pv.color_id IS NULL;

-- 5. Update pv.color text từ colors table để đồng bộ
UPDATE product_variants pv
JOIN colors c ON pv.color_id = c.id
SET pv.color = c.color
WHERE pv.color IS NULL OR pv.color != c.color;

-- 6. Check kết quả sau migration
SELECT 
    'After migration' as status,
    COUNT(*) as total,
    SUM(CASE WHEN color_id IS NULL THEN 1 ELSE 0 END) as null_count,
    SUM(CASE WHEN color IS NULL THEN 1 ELSE 0 END) as null_color_text
FROM product_variants;

-- 7. Show stats by color
SELECT '===== STATS BY COLOR =====' as info;
SELECT 
    c.color,
    COUNT(pv.id) as variant_count
FROM product_variants pv
JOIN colors c ON pv.color_id = c.id
GROUP BY pv.color_id, c.color
ORDER BY variant_count DESC;

-- 8. Verify total variants now visible with JOIN
SELECT '===== TOTAL VISIBLE VARIANTS =====' as info;
SELECT COUNT(*) as total_variants_with_valid_color
FROM product_variants pv
JOIN colors c ON pv.color_id = c.id;
