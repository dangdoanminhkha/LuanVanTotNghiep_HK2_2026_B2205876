-- =====================================
-- INVENTORY LOGS TABLE (Sổ Cái)
-- =====================================

CREATE TABLE inventory_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  variant_id INT NOT NULL,
  quantity_changed INT NOT NULL COMMENT 'Số lượng thay đổi (dương=nhập, âm=xuất)',
  import_price DECIMAL(12, 2) COMMENT 'Giá nhập vốn (NULL nếu là đơn xuất)',
  action_type VARCHAR(50) NOT NULL COMMENT 'IMPORT (Nhập kho), ORDER (Khách mua), ADJUST (Chỉnh sửa)',
  reference_code VARCHAR(100) NOT NULL COMMENT 'Mã đối chiếu (PN-001, ORD-999)',
  note TEXT COMMENT 'Ghi chú thêm',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  INDEX idx_variant_id (variant_id),
  INDEX idx_reference_code (reference_code),
  INDEX idx_action_type (action_type),
  INDEX idx_created_at (created_at)
);

-- =====================================
-- SAMPLE DATA
-- =====================================

INSERT INTO inventory_logs (variant_id, quantity_changed, import_price, action_type, reference_code, note, created_at) VALUES
(101, 50, 500000, 'IMPORT', 'PN-10234', 'Nhập tết 2026', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(101, -2, NULL, 'ORDER', 'ORD-1001', 'Khách hàng Nguyễn Văn A', DATE_SUB(NOW(), INTERVAL 1.5 DAY)),
(105, 30, 450000, 'IMPORT', 'PN-10235', 'Bổ sung kho', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(105, -1, NULL, 'ORDER', 'ORD-1002', 'Khách hàng Trần Thị B', DATE_SUB(NOW(), INTERVAL 0.5 DAY)),
(102, 40, 520000, 'IMPORT', 'PN-10236', 'Nhập hàng tháng 4', NOW());
