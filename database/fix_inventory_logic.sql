-- =====================================================
-- FIX INVENTORY LOGIC
-- =====================================================
-- 
-- HIỆN TRẠNG:
-- - quantity = 0 (được reset sau INITIAL_SYNC)
-- - sold = 11 (số đã bán)
-- - Hiển thị stock = quantity - sold = 0 - 11 = -11 ❌ SAI
--
-- CẦN FIX:
-- Bước 1: Khôi phục tổng nhập
--   quantity := quantity + sold
--   = 0 + 11 = 11 (tổng nhập gốc)
--
-- Bước 2: Tính số lượng còn
--   stock := quantity - sold
--   = 11 - 11 = 0 (đã hết hàng) ✓
--
-- =====================================================

USE shoestore;

-- ===== BƯỚC 1: Khôi phục tổng nhập vào cột quantity =====
-- update quantity = quantity + sold
-- Ý nghĩa: Nếu quantity đã bị reset = 0, thì quantity + sold = tổng nhập
UPDATE product_variants 
  SET quantity = quantity + sold;

-- ===== BƯỚC 2: Tính stock = số lượng còn sẵn =====
-- stock = quantity - sold
UPDATE product_variants 
  SET stock = quantity - sold;

-- ===== KIỂM TRA KẾT QUẢ =====
SELECT 
  id,
  product_id,
  quantity,
  sold,
  stock,
  (quantity - sold) as verify_stock
FROM product_variants
LIMIT 20;

-- KỲ VỌNG:
-- quantity | sold | stock | verify_stock
-- ---------|------|-------|-------------
--    50    |  5   |  45   |      45       ✓
--    15    |  0   |  15   |      15       ✓
--    11    |  11  |   0   |       0       ✓
