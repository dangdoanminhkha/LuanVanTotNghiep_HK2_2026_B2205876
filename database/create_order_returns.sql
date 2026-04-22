-- Migration: Tạo bảng order_returns đơn giản (1-1 với orders)
-- Mục đích: Lưu thông tin chi tiết hoàn hàng (evidence, reason, rejection reason)
-- Status và lịch sử thay đổi status đã lưu ở orders + order_status_logs

USE shoestore;

-- 1. Tạo bảng order_returns
CREATE TABLE IF NOT EXISTS order_returns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL UNIQUE,
  
  return_reason VARCHAR(500) NOT NULL,
  return_evidence JSON NULL COMMENT 'Danh sách URL ảnh/video minh chứng',
  return_rejected_reason VARCHAR(500) NULL COMMENT 'Lý do admin từ chối hoàn hàng',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_id (order_id)
);

-- 2. Migrate dữ liệu từ orders → order_returns (nếu cột return_* tồn tại)
-- Câu lệnh này sẽ insert thành công nếu cột tồn tại, hoặc skip nếu cột đã bị xóa
INSERT INTO order_returns (order_id, return_reason, return_evidence, return_rejected_reason, created_at)
SELECT 
  id,
  return_reason,
  return_evidence,
  return_rejection_reason,
  NOW()
FROM orders
WHERE return_reason IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM order_returns WHERE order_returns.order_id = orders.id)
ON DUPLICATE KEY UPDATE 
  return_reason = VALUES(return_reason),
  return_evidence = VALUES(return_evidence),
  return_rejected_reason = VALUES(return_rejected_reason);

-- 3. Cleanup: Drop cột return_* khỏi orders (tùy chọn, do cột có thể đã xóa trước đó)
-- Bỏ comment nếu cần
/*
ALTER TABLE orders
  DROP COLUMN IF EXISTS return_reason,
  DROP COLUMN IF EXISTS return_evidence,
  DROP COLUMN IF EXISTS return_requested_at,
  DROP COLUMN IF EXISTS return_approved_at,
  DROP COLUMN IF EXISTS return_rejected_at,
  DROP COLUMN IF EXISTS return_rejection_reason,
  DROP COLUMN IF EXISTS return_received_at;
*/
