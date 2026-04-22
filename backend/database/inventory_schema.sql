-- =====================================================
-- INVENTORY MANAGEMENT MODULE
-- Database Schema (Stock Ledger Pattern)
-- =====================================================

-- Drop table if exists (for development/reseed)
-- DROP TABLE IF EXISTS inventory_logs;

-- =====================================================
-- CREATE TABLE inventory_logs
-- Mô tả: Ghi nhận mọi biến động kho hàng
-- Mô hình: Stock Ledger (Sổ cái tồn kho)
-- =====================================================
--
-- TRƯỜNG DÙNG QUẢN LÝ SỐ LƯỢNG:
-- =============================
-- 
-- Trong product_variants table:
--   • quantity (INT): Tổng nhập vào = SUM(quantity_changed WHERE action_type IN 'IMPORT', 'INITIAL_SYNC')
--   • stock (INT): Số lượng còn sẵn = SUM(quantity_changed FROM inventory_logs)
--   • sold (INT): DEPRECATED - Chỉ dùng tracking, không dùng trong công thức
--
-- Trong inventory_logs table:
--   • quantity_changed (INT): Biến động số lượng 
--       - Dương (+): Nhập hàng (IMPORT, INITIAL_SYNC)
--       - Âm (-): Bán hàng (ORDER), hoặc chỉnh sửa âm (ADJUST)
--   • action_type: IMPORT | ORDER | ADJUST | INITIAL_SYNC
--
-- CÔNG THỨC TÍNH TOÁN:
-- =====================
-- quantity = SUM(quantity_changed) 
--            WHERE action_type IN ('IMPORT', 'INITIAL_SYNC')
-- 
-- stock = SUM(quantity_changed) 
--         FROM ALL entries (IMPORT + ORDER + ADJUST)
--
-- QUYỂN TẮC KHI CÓ ĐƠN HÀNG:
-- ===========================
-- ✓ KHI ĐƠNHÀNG THÀNH CÔNG -> INSERT vào inventory_logs
--   - action_type = 'ORDER'
--   - quantity_changed = -X (âm)
--   -> stock ↓, quantity KHÔNG ĐỔI
-- 
-- ✓ KHI NHẬP HÀNG -> INSERT vào inventory_logs
--   - action_type = 'IMPORT'
--   - quantity_changed = +Y (dương)
--   -> stock ↑, quantity ↑
--
-- =====================================================

CREATE TABLE inventory_logs (
  -- Khóa chính
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID duy nhất của mỗi bản ghi',
  
  -- Khóa ngoại
  variant_id INT NOT NULL COMMENT 'ID biến thể giày (FK tới product_variants)',
  
  -- Dữ liệu biến động
  quantity_changed INT NOT NULL COMMENT 'Số lượng thay đổi (dương: nhập, âm: xuất)',
  import_price DECIMAL(10, 2) COMMENT 'Giá nhập vốn (nullable cho ORDER, ADJUST)',
  
  -- Phân loại giao dịch
  action_type VARCHAR(20) NOT NULL DEFAULT 'IMPORT' COMMENT 'Loại giao dịch: IMPORT, ORDER, ADJUST, INITIAL_SYNC',
  
  -- Thông tin tham chiếu
  reference_code VARCHAR(50) NOT NULL COMMENT 'Mã đối chiếu (PN-001, ORD-999, ADJ-001)',
  note TEXT COMMENT 'Ghi chú thêm',
  
  -- Thời gian
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo bản ghi',
  
  -- Khóa ngoại (Tạm comment để tránh FK constraint error)
  -- CONSTRAINT fk_inventory_logs_variant 
  --   FOREIGN KEY (variant_id) 
  --   REFERENCES product_variants(id) 
  --   ON DELETE RESTRICT 
  --   ON UPDATE CASCADE,
  
  -- Chỉ mục tối ưu hóa truy vấn
  INDEX idx_variant_id (variant_id) COMMENT 'Tìm kiếm nhanh theo variant',
  INDEX idx_reference_code (reference_code) COMMENT 'Tìm kiếm theo mã đối chiếu (cho phép nhiều items cùng refCode)',
  INDEX idx_action_type (action_type) COMMENT 'Lọc theo loại giao dịch',
  INDEX idx_created_at (created_at) COMMENT 'Sắp xếp theo thời gian'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
  COMMENT='Stock Ledger - Ghi nhận mọi biến động tồn kho';


-- =====================================================
-- SAMPLE DATA (Tùy chọn - để test)
-- =====================================================
INSERT INTO inventory_logs 
(variant_id, quantity_changed, import_price, action_type, reference_code, note, created_at)
VALUES 
  -- Import 1: Nhập lúc 2026-04-01
  (101, 50, 500000, 'IMPORT', 'PN-20260401', 'Nhập hàng Nike Air Max 90', '2026-04-01 10:30:00'),
  (102, 30, 520000, 'IMPORT', 'PN-20260401', 'Nhập hàng Nike Air Max 95', '2026-04-01 10:30:00'),
  
  -- Order 1: Khách mua
  (101, -5, NULL, 'ORDER', 'ORD-20260402-001', '', '2026-04-02 14:15:00'),
  
  -- Adjust: Chỉnh sửa kho
  (102, -3, NULL, 'ADJUST', 'ADJ-20260403-001', 'Hết hạn - xóa khỏi kho', '2026-04-03 09:00:00');


-- =====================================================
-- KIỂM TRA TỒN KHO HIỆN TẠI (Chạy để verify)
-- =====================================================
-- SELECT 
--   variant_id,
--   SUM(quantity_changed) as current_stock
-- FROM inventory_logs
-- GROUP BY variant_id
-- ORDER BY variant_id ASC;
-- Kết quả mong đợi:
-- | variant_id | current_stock |
-- |------------|--------------|
-- |    101     |      45       |  (50 - 5)
-- |    102     |      27       |  (30 - 3)
