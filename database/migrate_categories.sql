-- Migration: Chuyển từ category VARCHAR sang category_id FOREIGN KEY
-- Bước 1: Tạo bảng categories trước (chạy create_categories_table.sql)

-- Bước 2: Thêm cột category_id vào products
ALTER TABLE products ADD COLUMN category_id INT AFTER category;

-- Bước 3: Map dữ liệu category cũ sang category_id mới
UPDATE products SET category_id = (
    CASE 
        WHEN category = 'sandal-nam' THEN (SELECT id FROM categories WHERE slug = 'sandal' LIMIT 1)
        WHEN category = 'sneaker-nam' THEN (SELECT id FROM categories WHERE slug = 'sneaker' LIMIT 1)
        WHEN category = 'sneaker-nu' THEN (SELECT id FROM categories WHERE slug = 'sneaker' LIMIT 1)
        WHEN category = 'giay-cao-got' THEN (SELECT id FROM categories WHERE slug = 'giay-cao-got' LIMIT 1)
        WHEN category = 'boot' THEN (SELECT id FROM categories WHERE slug = 'boot' LIMIT 1)
        ELSE (SELECT id FROM categories WHERE slug = 'sneaker' LIMIT 1) -- Default fallback
    END
);

-- Bước 4: Thêm foreign key constraint
ALTER TABLE products 
ADD FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Bước 5: (Optional) Xóa cột category cũ sau khi kiểm tra
-- Uncomment dòng dưới sau khi kiểm tra dữ liệu đã đúng
-- ALTER TABLE products DROP COLUMN category;