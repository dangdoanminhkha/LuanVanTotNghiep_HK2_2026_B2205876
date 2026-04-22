SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
USE shoestore;

-- Thêm cột sold (đã bán) vào bảng products
ALTER TABLE products ADD COLUMN sold INT DEFAULT 0;

-- Tạo bảng product_variants để lưu size, màu sắc, stock của mỗi sản phẩm
CREATE TABLE IF NOT EXISTS product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  size VARCHAR(10),
  color VARCHAR(50),
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_variant (product_id, size, color)
);

-- Tạo chỉ mục để tìm kiếm nhanh
CREATE INDEX idx_product_variants ON product_variants(product_id);
CREATE INDEX idx_product_size_color ON product_variants(product_id, size, color);

-- Xác nhận tạo bảng
DESCRIBE product_variants;
DESCRIBE products;
