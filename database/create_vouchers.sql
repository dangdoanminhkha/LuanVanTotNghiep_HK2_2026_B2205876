-- Bảng quản lý vouchers
CREATE TABLE IF NOT EXISTS vouchers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    voucher_type ENUM('free_shipping', 'discount') NOT NULL,
    discount_amount INT COMMENT 'Nếu type=discount: mức giảm (VND). Nếu type=free_shipping: NULL',
    min_order_value INT COMMENT 'Giá trị đơn tối thiểu để áp dụng (VND)',
    max_usage_per_user INT DEFAULT 1 COMMENT 'Tối đa mỗi user dùng bao nhiêu lần',
    total_usage_limit INT COMMENT 'Tổng lần dùng toàn bộ (NULL = unlimited)',
    current_usage INT DEFAULT 0 COMMENT 'Lần dùng hiện tại',
    valid_from DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo/bắt đầu',
    valid_until DATETIME COMMENT 'Hết hạn (valid_from + duration)',
    duration_days INT NOT NULL COMMENT 'Thời hạn (ngày)',
    description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_code (code),
    INDEX idx_active (is_active),
    INDEX idx_valid_until (valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng theo dõi sử dụng voucher của user
CREATE TABLE IF NOT EXISTS user_voucher_usage (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    voucher_id INT NOT NULL,
    used_count INT DEFAULT 1,
    last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_voucher (user_id, voucher_id),
    INDEX idx_user (user_id),
    INDEX idx_voucher (voucher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
