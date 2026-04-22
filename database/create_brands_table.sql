-- Tạo bảng brands đơn giản
CREATE TABLE brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,        -- Tên thương hiệu: "Nike", "Adidas"
    slug VARCHAR(100) NOT NULL UNIQUE,        -- URL slug: "nike", "adidas"
    logo VARCHAR(500),                        -- Logo thương hiệu (optional)
    is_active BOOLEAN DEFAULT TRUE,           -- Kích hoạt/ẩn thương hiệu
    sort_order INT DEFAULT 0,                 -- Thứ tự hiển thị
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_slug (slug),
    INDEX idx_active_sort (is_active, sort_order)
);

-- Thêm dữ liệu brands từ products hiện tại
INSERT INTO brands (name, slug, is_active, sort_order) 
SELECT DISTINCT 
    brand as name,
    LOWER(REPLACE(brand, ' ', '-')) as slug,
    TRUE as is_active,
    0 as sort_order
FROM products 
WHERE brand IS NOT NULL AND brand != '';

-- Thêm một số thương hiệu phổ biến khác (nếu chưa có)
INSERT IGNORE INTO brands (name, slug, is_active, sort_order) VALUES
('Nike', 'nike', TRUE, 1),
('Adidas', 'adidas', TRUE, 2),
('Vans', 'vans', TRUE, 3),
('Converse', 'converse', TRUE, 4),
('Puma', 'puma', TRUE, 5),
('New Balance', 'new-balance', TRUE, 6),
('Reebok', 'reebok', TRUE, 7);