-- =============================================================================
-- DEMO PRODUCTS INSERTION SCRIPT
-- Sử dụng brand_id (FK) và category_id (FK) thay vì text fields
-- =============================================================================

-- Định nghĩa biến cho category_id
SET @cat_sneaker = (SELECT id FROM categories WHERE slug = 'sneaker' LIMIT 1);
SET @cat_sandal = (SELECT id FROM categories WHERE slug = 'sandal' LIMIT 1);
SET @cat_giay_tay = (SELECT id FROM categories WHERE slug = 'giay-tay' LIMIT 1);
SET @cat_giay_da = (SELECT id FROM categories WHERE slug = 'giay-da' LIMIT 1);
SET @cat_cao_got = (SELECT id FROM categories WHERE slug = 'giay-cao-got' LIMIT 1);

-- Định nghĩa biến cho brand_id
SET @br_nike = (SELECT id FROM brands WHERE slug = 'nike' LIMIT 1);
SET @br_adidas = (SELECT id FROM brands WHERE slug = 'adidas' LIMIT 1);
SET @br_puma = (SELECT id FROM brands WHERE slug = 'puma' LIMIT 1);
SET @br_bitis = (SELECT id FROM brands WHERE slug = 'bitis' LIMIT 1);
SET @br_skechers = (SELECT id FROM brands WHERE slug = 'skechers' LIMIT 1);
SET @br_birkenstock = (SELECT id FROM brands WHERE slug = 'birkenstock' LIMIT 1);
SET @br_clarks = (SELECT id FROM brands WHERE slug = 'clarks' LIMIT 1);

-- ====== SNEAKER NAM ======
INSERT INTO products (name, brand_id, category_id, gender, price, discount, description, tags, specification, created_at, updated_at)
VALUES 
('Nike Revolution 7 Nam', @br_nike, @cat_sneaker, 'Nam', 280000, 0, 'Giày chạy bộ nhẹ, thoáng khí, thiết kế tối giản', '["Sport", "Running", "Casual", "Comfort"]', '{"material": "Vải tổng hợp", "style": "Sneaker", "sole": "EVA", "technology": "Lightweight", "lace_type": "Dây thừng", "heel_type": "Flat"}', NOW(), NOW()),
('Adidas Lite Racer Nam', @br_adidas, @cat_sneaker, 'Nam', 320000, 5, 'Giày mềm với đế bền, phù hợp tập luyện', '["Sport", "Training", "Casual", "Comfort"]', '{"material": "Vải tổng hợp", "style": "Sneaker", "sole": "Cao su tổng hợp", "technology": "Breathable", "lace_type": "Dây thừng", "heel_type": "Flat"}', NOW(), NOW()),
('Puma Flex Control Nam', @br_puma, @cat_sneaker, 'Nam', 300000, 0, 'Thiết kế thể thao năng động, đi hàng ngày', '["Sport", "Running", "Casual"]', '{"material": "Canvas", "style": "Sneaker", "sole": "EVA", "technology": "Anti-slip", "lace_type": "Dây thừng", "heel_type": "Flat"}', NOW(), NOW()),
('Nike Air Max 90 Nam', @br_nike, @cat_sneaker, 'Nam', 650000, 10, 'Giày thể thao kinh điển, cushion tuyệt vời, phong cách', '["Sport", "Casual", "Fashion", "Comfort"]', '{"material": "Da PU", "style": "Sneaker", "sole": "EVA", "technology": "Cushion", "lace_type": "Dây thừng", "heel_type": "Flat"}', NOW(), NOW()),
('Nike Air Jordan 1 Retro Nam', @br_nike, @cat_sneaker, 'Nam', 1500000, 15, 'Huyền thoại bóng rổ, chất lượng cao, đôi sưu tầm', '["Sport", "Fashion", "Casual", "Party"]', '{"material": "Da thật", "style": "Sneaker", "sole": "Cao su tự nhiên", "technology": "Cushion", "lace_type": "Dây thừng", "heel_type": "Flat"}', NOW(), NOW());

-- ====== SANDAL NAM ======
INSERT INTO products (name, brand_id, category_id, gender, price, discount, description, tags, specification, created_at, updated_at)
VALUES 
('Biti''s Sandal Nam Nâu', @br_bitis, @cat_sandal, 'Nam', 250000, 0, 'Sandal da, mềm mại, thoáng khí', '["Casual", "Comfort", "Fashion"]', '{"material": "Da PU", "style": "Sandal", "sole": "Cao su tổng hợp", "technology": "Anti-slip", "lace_type": "Không", "heel_type": "Flat"}', NOW(), NOW()),
('Skechers Sandal Nam Đen', @br_skechers, @cat_sandal, 'Nam', 300000, 5, 'Sandal thể thao, quai dén, êm chân', '["Casual", "Comfort", "Sport"]', '{"material": "Vải tổng hợp", "style": "Sandal", "sole": "EVA", "technology": "Cushion", "lace_type": "Velcro", "heel_type": "Flat"}', NOW(), NOW()),
('Adidas Sandal Nam Xanh', @br_adidas, @cat_sandal, 'Nam', 280000, 0, 'Sandal công thái học, đế chiếc, bền bỉ', '["Casual", "Comfort"]', '{"material": "EVA", "style": "Sandal", "sole": "EVA", "technology": "Lightweight", "lace_type": "Velcro", "heel_type": "Flat"}', NOW(), NOW()),
('Puma Sandal Nam Premium', @br_puma, @cat_sandal, 'Nam', 550000, 10, 'Sandal chất liệu da thật, thiết kế sang trọng', '["Casual", "Comfort", "Fashion"]', '{"material": "Da thật", "style": "Sandal", "sole": "Cao su tự nhiên", "technology": "Breathable", "lace_type": "Không", "heel_type": "Flat"}', NOW(), NOW()),
('Birkenstock Sandal Nam Classic', @br_birkenstock, @cat_sandal, 'Nam', 1200000, 0, 'Sandal chính hãng Đức, chỉnh hình chân', '["Casual", "Comfort", "Fashion", "Party"]', '{"material": "Da thật", "style": "Sandal", "sole": "Cao su tự nhiên", "technology": "Orthopedic", "lace_type": "Không", "heel_type": "Flat"}', NOW(), NOW());

-- Tương tự cho các cụm khác (Giày Tây, Giày Da, Cao Gót nữ, v.v.)
-- Bạn có thể copy/paste pattern trên và thay @br_*, @cat_* tương ứng
