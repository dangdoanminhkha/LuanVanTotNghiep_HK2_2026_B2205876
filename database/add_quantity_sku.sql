USE shoestore;

-- Thêm cột quantity vào products
ALTER TABLE products 
ADD COLUMN quantity INT DEFAULT 0 AFTER discount,
ADD COLUMN sku VARCHAR(50) UNIQUE AFTER quantity;

-- Update quantity mặc định cho tất cả sản phẩm
UPDATE products SET quantity = 50 WHERE id > 0;
