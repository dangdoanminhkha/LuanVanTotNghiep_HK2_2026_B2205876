-- =====================================================
-- MIGRATION: Add stock column to product_variants
-- Purpose: Separate inventory tracking
-- =====================================================
-- 
-- LÝ THUYẾT:
-- ========
-- quantity = SUM(quantity_changed) từ inventory_logs [NHẬP HÀNG]
-- stock = quantity - (tổng order quantities) [SỐ LƯỢNG CÒN]
-- 
-- KHI NHẬP HÀNG (IMPORT):
--   - quantity ↑, stock ↑ (cùng lượng)
--
-- KHI BÁN HÀNG (ORDER THÀNH CÔNG):
--   - stock ↓ (trừ theo số lượng đơn)
--   - quantity KHÔNG ĐỔI (vẫn giữ lịch sử nhập)
--
-- CÔNG THỨC:
--   stock = quantity - (tổng quantity_changed âm từ orders trong inventory_logs)
--
-- =====================================================

USE shoestore;

-- Thêm cột stock vào product_variants
ALTER TABLE product_variants 
  ADD COLUMN stock INT DEFAULT 0 AFTER quantity 
  COMMENT 'Số lượng còn lại = quantity - (tổng order quantities)';

-- Khởi tạo giá trị stock = quantity (giả định không có order logs nào)
-- Nếu có inventory_logs thì sẽ recalculate sau
UPDATE product_variants 
  SET stock = quantity 
  WHERE stock = 0;

-- Chỉ mục để tối ưu truy vấn
CREATE INDEX idx_product_variants_stock ON product_variants(stock);

-- Xác nhận cột mới
DESCRIBE product_variants;

-- =====================================================
-- KIỂM TRA DỮ LIỆU (Optional)
-- =====================================================
-- SELECT 
--   id, 
--   product_id, 
--   size, 
--   quantity, 
--   stock, 
--   sold
-- FROM product_variants 
-- LIMIT 10;
