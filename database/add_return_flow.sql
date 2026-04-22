-- Migration: Thêm luồng hoàn hàng (customer-initiated return)
-- Chạy file này một lần để cập nhật schema

-- 1. Mở rộng ENUM status của bảng orders
ALTER TABLE orders MODIFY COLUMN status ENUM(
  'pending', 'confirmed', 'shipping', 'delivered', 'cancelled',
  'failed_delivery_retry', 'failed_delivery',
  'return', 'refund_pending', 'refund',
  'return_requested', 'return_approved', 'return_rejected', 'return_received'
) DEFAULT 'pending';

-- 2. Thêm các cột cho quản lý hoàn hàng
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS return_reason VARCHAR(500) NULL COMMENT 'Lý do hoàn hàng của khách' AFTER note,
  ADD COLUMN IF NOT EXISTS return_evidence JSON NULL COMMENT 'Danh sách URL ảnh minh chứng' AFTER return_reason,
  ADD COLUMN IF NOT EXISTS return_requested_at DATETIME NULL AFTER return_evidence,
  ADD COLUMN IF NOT EXISTS return_approved_at DATETIME NULL AFTER return_requested_at,
  ADD COLUMN IF NOT EXISTS return_rejected_at DATETIME NULL AFTER return_approved_at,
  ADD COLUMN IF NOT EXISTS return_rejection_reason VARCHAR(500) NULL AFTER return_rejected_at,
  ADD COLUMN IF NOT EXISTS return_received_at DATETIME NULL AFTER return_rejection_reason;
