-- Add purpose column to categories table for storing shoe usage purposes
ALTER TABLE categories ADD COLUMN purpose VARCHAR(255) NULL AFTER is_active;

-- Update purpose for each category
UPDATE categories SET purpose = 'Sport, Casual, Fashion' WHERE id = 1 AND name = 'Sneaker';
UPDATE categories SET purpose = 'Casual, Comfort' WHERE id = 2 AND name = 'Sandal';
UPDATE categories SET purpose = 'Sport, Running, Training' WHERE id = 4 AND name = 'Giày thể thao';
UPDATE categories SET purpose = 'Formal, Business' WHERE id = 5 AND name = 'Giày tây';
UPDATE categories SET purpose = 'Formal, Business, Casual' WHERE id = 6 AND name = 'Giày da nam';
UPDATE categories SET purpose = 'Formal, Comfort, Casual' WHERE id = 8 AND name = 'Giày bệt';
UPDATE categories SET purpose = 'Formal, Comfort, Casual' WHERE id = 9 AND name = 'Giày búp bê';

-- Verify the updates
SELECT id, name, purpose FROM categories WHERE id IN (1, 2, 4, 5, 6, 8, 9);
