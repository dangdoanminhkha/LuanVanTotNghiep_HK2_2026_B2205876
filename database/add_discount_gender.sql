USE shoestore;

-- Thêm cột discount và gender vào bảng products
ALTER TABLE products 
ADD COLUMN gender ENUM('nam', 'nữ') DEFAULT 'nam' AFTER type,
ADD COLUMN discount INT DEFAULT 0 AFTER description,
ADD COLUMN category VARCHAR(100) DEFAULT 'other' AFTER gender;

-- Update các sản phẩm hiện có
UPDATE products SET gender = 'nam', category = 'giay-the-thao-nam' WHERE brand IN ('Nike', 'Adidas', 'Puma') AND type = 'Sneakers';
UPDATE products SET gender = 'nam', category = 'giay-the-thao-nam' WHERE brand IN ('Nike', 'Adidas') AND type = 'Running';
UPDATE products SET gender = 'nữ', category = 'giay-the-thao-nu' WHERE name LIKE '%Women%' OR name LIKE '%nữ%';
