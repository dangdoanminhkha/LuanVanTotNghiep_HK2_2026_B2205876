-- Cập nhật categories với tiếng Việt đúng encoding
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

UPDATE categories SET name = 'Sneaker' WHERE slug = 'sneaker';
UPDATE categories SET name = 'Sandal' WHERE slug = 'sandal';
UPDATE categories SET name = 'Boot' WHERE slug = 'boot';
UPDATE categories SET name = 'Giày thể thao' WHERE slug = 'giay-the-thao';
UPDATE categories SET name = 'Giày tây' WHERE slug = 'giay-tay';
UPDATE categories SET name = 'Giày da nam' WHERE slug = 'giay-da-nam';
UPDATE categories SET name = 'Giày cao gót' WHERE slug = 'giay-cao-got';
UPDATE categories SET name = 'Giày bệt' WHERE slug = 'giay-bet';
UPDATE categories SET name = 'Giày búp bê' WHERE slug = 'giay-bup-be';

SELECT id, name, slug FROM categories;
