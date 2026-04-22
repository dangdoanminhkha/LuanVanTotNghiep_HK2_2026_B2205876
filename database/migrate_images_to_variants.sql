-- Migration: Thêm cột images cho product_variants
-- Giữ lại image trong products làm ảnh đại diện
-- Nếu variant không có images, sẽ lấy ảnh từ products hoặc từ variant đầu tiên

-- Thêm cột images (JSON) vào bảng product_variants
ALTER TABLE product_variants ADD COLUMN images JSON DEFAULT ('[]') AFTER color;

-- Thêm cột sku vào bảng product_variants
ALTER TABLE product_variants ADD COLUMN sku VARCHAR(100) UNIQUE AFTER images;

-- Xác nhận thay đổi
DESCRIBE products;
DESCRIBE product_variants;
