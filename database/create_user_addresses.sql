USE shoestore;

-- Bảng lưu địa chỉ giao hàng của người dùng
CREATE TABLE IF NOT EXISTS user_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,          -- Tên người nhận
    phone VARCHAR(20) NOT NULL,               -- SĐT người nhận
    province_code VARCHAR(10) NOT NULL,       -- Mã tỉnh/thành
    province_name VARCHAR(100) NOT NULL,      -- Tên tỉnh/thành
    district_code VARCHAR(10) NOT NULL,       -- Mã quận/huyện
    district_name VARCHAR(100) NOT NULL,      -- Tên quận/huyện
    ward_code VARCHAR(10) NOT NULL,           -- Mã phường/xã
    ward_name VARCHAR(100) NOT NULL,          -- Tên phường/xã
    address_detail TEXT NOT NULL,             -- Địa chỉ cụ thể (số nhà, đường, khóm...)
    is_default BOOLEAN DEFAULT FALSE,         -- Địa chỉ mặc định
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_default (is_default)
);

-- Cập nhật bảng orders để lưu snapshot địa chỉ
ALTER TABLE orders 
ADD COLUMN recipient_name VARCHAR(100) AFTER user_id,
ADD COLUMN recipient_phone VARCHAR(20) AFTER recipient_name,
ADD COLUMN province_name VARCHAR(100) AFTER shipping_address,
ADD COLUMN district_name VARCHAR(100) AFTER province_name,
ADD COLUMN ward_name VARCHAR(100) AFTER district_name;
