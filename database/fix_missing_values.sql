-- =====================================================================
-- Fix missing hex_codes và foot_length_cm
-- =====================================================================

USE shoestore;

-- Thêm hex_code cho các màu còn thiếu
UPDATE colors SET hex_code = '#FFB6D9' WHERE color = 'Hồng nhạt'; -- Hồng nhạt
UPDATE colors SET hex_code = '#FFF8DC' WHERE color = 'Kem';       -- Kem (Beige)
UPDATE colors SET hex_code = '#6B4423' WHERE color = 'Nâu bò';    -- Nâu bò (Tan)
UPDATE colors SET hex_code = '#3C2F1D' WHERE color = 'Nâu sẫm';   -- Nâu sẫm (Dark Brown)
UPDATE colors SET hex_code = '#F5DEB3' WHERE color = 'Nude';      -- Nude (Wheat)

-- Thêm foot_length_cm cho size 35
UPDATE sizes SET foot_length_cm = 22.0 WHERE size = '35';

-- Kiểm tra kết quả
SELECT 'After fixing:' as check;
SELECT id, color, hex_code FROM colors WHERE hex_code IS NULL;
SELECT id, size, foot_length_cm FROM sizes WHERE foot_length_cm IS NULL;
