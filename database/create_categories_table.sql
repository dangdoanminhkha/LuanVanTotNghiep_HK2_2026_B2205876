-- Tạo bảng categories với gender filtering
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,                          -- "Sneaker", "Giày cao gót"
    slug VARCHAR(100) NOT NULL UNIQUE,                   -- "sneaker", "giay-cao-got"
    gender_applicable ENUM('nam', 'nu', 'unisex') DEFAULT 'unisex', -- Áp dụng cho giới tính nào
    description TEXT,                                    -- Mô tả category
    image VARCHAR(500),                                  -- Hình ảnh category
    is_active BOOLEAN DEFAULT TRUE,                      -- Hiển thị/ẩn
    sort_order INT DEFAULT 0,                           -- Thứ tự sắp xếp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_gender (gender_applicable),
    INDEX idx_active_sort (is_active, sort_order),
    INDEX idx_slug (slug)
);

-- Dữ liệu categories mẫu
INSERT INTO categories (name, slug, gender_applicable, sort_order, is_active) VALUES
-- Categories cho cả nam và nữ
('Sneaker', 'sneaker', 'unisex', 1, TRUE),
('Sandal', 'sandal', 'unisex', 2, TRUE),
('Boot', 'boot', 'unisex', 3, TRUE),
('Giày thể thao', 'giay-the-thao', 'unisex', 4, TRUE),

-- Categories chỉ dành cho nam
('Giày tây', 'giay-tay', 'nam', 5, TRUE),
('Giày da nam', 'giay-da-nam', 'nam', 6, TRUE),

-- Categories chỉ dành cho nữ
('Giày cao gót', 'giay-cao-got', 'nu', 7, TRUE),
('Giày bệt', 'giay-bet', 'nu', 8, TRUE),
('Giày búp bê', 'giay-bup-be', 'nu', 9, TRUE);