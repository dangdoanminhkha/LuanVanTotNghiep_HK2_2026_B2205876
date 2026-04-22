-- Migration: Tạo bảng order_status_logs và xoá các cột timestamp cồng kềnh
-- Lý do: Giảm kích thước bảng orders từ 39 cột xuống ~22 cột

-- ===== BƯỚC 1: Tạo bảng order_status_logs =====
CREATE TABLE IF NOT EXISTS order_status_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    status_old VARCHAR(50),
    status_new VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_status_new (status_new),
    INDEX idx_created_at (created_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ===== BƯỚC 2: Migrate dữ liệu từ các cột timestamp sang order_status_logs =====
-- Insert cho mỗi status nếu có timestamp tương ứng

-- confirmed status
INSERT INTO order_status_logs (order_id, status_old, status_new, created_at)
SELECT id, 'pending', 'confirmed', COALESCE(confirmed_at, created_at)
FROM orders
WHERE confirmed_at IS NOT NULL AND confirmed_at != created_at;

-- shipping status
INSERT INTO order_status_logs (order_id, status_old, status_new, created_at)
SELECT id, 'confirmed', 'shipping', shipping_at
FROM orders
WHERE shipping_at IS NOT NULL;

-- delivered status
INSERT INTO order_status_logs (order_id, status_old, status_new, created_at)
SELECT id, 'shipping', 'delivered', delivered_at
FROM orders
WHERE delivered_at IS NOT NULL;

-- failed_delivery status
INSERT INTO order_status_logs (order_id, status_old, status_new, created_at)
SELECT id, 'shipping', 'failed_delivery', failed_delivery_at
FROM orders
WHERE failed_delivery_at IS NOT NULL;

-- failed_delivery_final status
INSERT INTO order_status_logs (order_id, status_old, status_new, created_at)
SELECT id, 'failed_delivery', 'failed_delivery', failed_delivery_final_at
FROM orders
WHERE failed_delivery_final_at IS NOT NULL;

-- return status
INSERT INTO order_status_logs (order_id, status_old, status_new, created_at)
SELECT id, 'delivered', 'return', return_at
FROM orders
WHERE return_at IS NOT NULL;

-- return_requested status
INSERT INTO order_status_logs (order_id, status_old, status_new, created_at)
SELECT id, 'return', 'return_requested', return_requested_at
FROM orders
WHERE return_requested_at IS NOT NULL;

-- return_approved status
INSERT INTO order_status_logs (order_id, status_old, status_new, created_at)
SELECT id, 'return_requested', 'return_approved', return_approved_at
FROM orders
WHERE return_approved_at IS NOT NULL;

-- return_rejected status
INSERT INTO order_status_logs (order_id, status_old, status_new, created_at)
SELECT id, 'return_requested', 'return_rejected', return_rejected_at
FROM orders
WHERE return_rejected_at IS NOT NULL;

-- return_received status
INSERT INTO order_status_logs (order_id, status_old, status_new, created_at)
SELECT id, 'return_approved', 'return_received', return_received_at
FROM orders
WHERE return_received_at IS NOT NULL;

-- refund_pending status
INSERT INTO order_status_logs (order_id, status_old, status_new, created_at)
SELECT id, 'return_received', 'refund_pending', refund_pending_at
FROM orders
WHERE refund_pending_at IS NOT NULL;

-- refund status
INSERT INTO order_status_logs (order_id, status_old, status_new, created_at)
SELECT id, 'refund_pending', 'refund', refunded_at
FROM orders
WHERE refunded_at IS NOT NULL;

-- cancelled status
INSERT INTO order_status_logs (order_id, status_old, status_new, created_at)
SELECT id, 'pending', 'cancelled', cancelled_at
FROM orders
WHERE cancelled_at IS NOT NULL;

-- ===== BƯỚC 3: Xoá các cột timestamp từ bảng orders =====
ALTER TABLE orders
DROP COLUMN paid_at,
DROP COLUMN applied_at,
DROP COLUMN confirmed_at,
DROP COLUMN shipping_at,
DROP COLUMN delivered_at,
DROP COLUMN failed_delivery_at,
DROP COLUMN failed_delivery_final_at,
DROP COLUMN return_at,
DROP COLUMN refund_pending_at,
DROP COLUMN refunded_at,
DROP COLUMN cancelled_at,
DROP COLUMN return_requested_at,
DROP COLUMN return_approved_at,
DROP COLUMN return_rejected_at,
DROP COLUMN return_received_at,
DROP COLUMN hold_expires_at,
DROP COLUMN updated_at;

-- ===== BƯỚC 4: Xác minh kết quả =====
SELECT COUNT(*) as total_status_logs FROM order_status_logs;
SELECT 'Orders table structure after migration:' as message;
