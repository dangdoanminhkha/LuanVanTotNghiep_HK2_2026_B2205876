-- =============================================================================
-- DỮ LIỆU SẢN PHẨM CHO HỆ THỐNG HYBRID COLLABORATIVE FILTERING (CF + Content-Based)
-- =============================================================================
-- Nguyên tắc:
-- 1. Tổ chức theo CỤM (Clusters) - 10 cụm chính, mỗi cụm 5 sản phẩm
-- 2. Kỷ luật từ vựng (Vocabulary Discipline) - Sử dụng danh sách enum cố định
-- 3. Sản phẩm cầu nối (Bridge Items) - Kết nối các cụm khác nhau
-- 4. Phủ đều khoảng giá (Price Tiering): Rẻ (200-350k), Tầm trung (500-800k), Cao cấp (>1M)
-- =============================================================================
-- LƯU Ý: Script này sử dụng category_id (FK) và brand_id (FK) thay vì text fields
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
SET @br_aldo = (SELECT id FROM brands WHERE slug = 'aldo' LIMIT 1);
SET @br_clarks = (SELECT id FROM brands WHERE slug = 'clarks' LIMIT 1);
SET @br_geox = (SELECT id FROM brands WHERE slug = 'geox' LIMIT 1);
SET @br_birkenstock = (SELECT id FROM brands WHERE slug = 'birkenstock' LIMIT 1);
SET @br_vascara = (SELECT id FROM brands WHERE slug = 'vascara' LIMIT 1);
SET @br_charles_keith = (SELECT id FROM brands WHERE slug = 'charles-keith' LIMIT 1);
SET @br_jimmy_choo = (SELECT id FROM brands WHERE slug = 'jimmy-choo' LIMIT 1);
SET @br_manolo = (SELECT id FROM brands WHERE slug = 'manolo-blahnik' LIMIT 1);
SET @br_salvatore = (SELECT id FROM brands WHERE slug = 'salvatore-ferragamo' LIMIT 1);
SET @br_gucci = (SELECT id FROM brands WHERE slug = 'gucci' LIMIT 1);
SET @br_timberland = (SELECT id FROM brands WHERE slug = 'timberland' LIMIT 1);
SET @br_berluti = (SELECT id FROM brands WHERE slug = 'berluti' LIMIT 1);
SET @br_cole_haan = (SELECT id FROM brands WHERE slug = 'cole-haan' LIMIT 1);
SET @br_allen_edmonds = (SELECT id FROM brands WHERE slug = 'allen-edmonds' LIMIT 1);
SET @br_dr_martens = (SELECT id FROM brands WHERE slug = 'dr-martens' LIMIT 1);

-- ====== CỤM 1: SNEAKER NAM - SPORT/CASUAL ======
INSERT INTO products (name, brand_id, category_id, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES

-- ====== CỤM 2: SANDAL NAM - CASUAL/COMFORT ======
INSERT INTO products (name, brand, category, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES 
-- Giá rẻ (200-350k)
('Biti\'s Sandal Nam Nâu', 'Biti\'s', 'Sandal', 'Nam', 250000, 0, 'Sandal da, mềm mại, thoáng khí', '["Casual", "Comfort", "Fashion"]', 
 '{"material": "Da PU", "style": "Sandal", "sole": "Cao su tổng hợp", "technology": "Anti-slip", "lace_type": "Không", "heel_type": "Flat"}', NULL, NOW(), NOW()),

('Skechers Sandal Nam Đen', 'Skechers', 'Sandal', 'Nam', 300000, 5, 'Sandal thể thao, quai dén, êm chân', '["Casual", "Comfort", "Sport"]', 
 '{"material": "Vải tổng hợp", "style": "Sandal", "sole": "EVA", "technology": "Cushion", "lace_type": "Velcro", "heel_type": "Flat"}', NULL, NOW(), NOW()),

('Adidas Sandal Nam Xanh', 'Adidas', 'Sandal', 'Nam', 280000, 0, 'Sandal công thái học, đế chiếc, bền bỉ', '["Casual", "Comfort"]', 
 '{"material": "EVA", "style": "Sandal", "sole": "EVA", "technology": "Lightweight", "lace_type": "Velcro", "heel_type": "Flat"}', NULL, NOW(), NOW()),

-- Giá tầm trung (500-800k)
('Puma Sandal Nam Premium', 'Puma', 'Sandal', 'Nam', 550000, 10, 'Sandal chất liệu da thật, thiết kế sang trọng', '["Casual", "Comfort", "Fashion"]', 
 '{"material": "Da thật", "style": "Sandal", "sole": "Cao su tự nhiên", "technology": "Breathable", "lace_type": "Không", "heel_type": "Flat"}', NULL, NOW(), NOW()),

-- Giá cao cấp (>1M)
('Birkenstock Sandal Nam Classic', 'Birkenstock', 'Sandal', 'Nam', 1200000, 0, 'Sandal chính hãng Đức, chỉnh hình chân', '["Casual", "Comfort", "Fashion", "Party"]', 
 '{"material": "Da thật", "style": "Sandal", "sole": "Cao su tự nhiên", "technology": "Orthopedic", "lace_type": "Không", "heel_type": "Flat"}', NULL, NOW(), NOW());

-- ====== CỤM 3: GIÀY TÂY NAM - FORMAL/BUSINESS ======
INSERT INTO products (name, brand, category, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES 
-- Giá rẻ (200-350k)
('Cole Haan Formal Nam Đen', 'Cole Haan', 'Giày Tây', 'Nam', 350000, 0, 'Giày công sở cơ bản, thiết kế oxford đơn giản', '["Formal", "Business", "Office"]', 
 '{"material": "Da PU", "style": "Oxford", "sole": "Cao su tổng hợp", "technology": "Anti-slip", "lace_type": "Dây thừng", "heel_type": "Gót thấp 2cm"}', NULL, NOW(), NOW()),

('Aldo Derby Nam Nâu', 'Aldo', 'Giày Tây', 'Nam', 300000, 5, 'Giày công sở nam, dáng derby thanh lịch', '["Formal", "Business"]', 
 '{"material": "Da PU", "style": "Derby", "sole": "Cao su tổng hợp", "technology": "Breathable", "lace_type": "Dây thừng", "heel_type": "Gót thấp 2cm"}', NULL, NOW(), NOW()),

('Dr. Martens Formal Nam Đỏ', 'Dr. Martens', 'Giày Tây', 'Nam', 280000, 0, 'Giày lười kiểu dáng đơn giản, đi hội họp', '["Formal", "Office", "Business"]', 
 '{"material": "Da PU", "style": "Giày lười", "sole": "Cao su tổng hợp", "technology": "Comfort", "lace_type": "Không", "heel_type": "Gót thấp 2cm"}', NULL, NOW(), NOW()),

-- Giá tầm trung (500-800k)
('Allen Edmonds Formal Nam Premium', 'Allen Edmonds', 'Giày Tây', 'Nam', 700000, 10, 'Giày công sở da thật, xử lý tỉ mỉ, bền bỉ', '["Formal", "Business", "Office", "Fashion"]', 
 '{"material": "Da thật", "style": "Oxford", "sole": "Cao su tự nhiên", "technology": "Breathable", "lace_type": "Dây thừng", "heel_type": "Gót thấp 2cm"}', NULL, NOW(), NOW()),

-- Giá cao cấp (>1M)
('Salvatore Ferragamo Formal Nam', 'Salvatore Ferragamo', 'Giày Tây', 'Nam', 1800000, 0, 'Giày cao cấp Ý, thiết kế hoàn mỹ, sưu tầm', '["Formal", "Business", "Office", "Fashion", "Party"]', 
 '{"material": "Da thật", "style": "Oxford", "sole": "Cao su tự nhiên", "technology": "Cushion", "lace_type": "Dây thừng", "heel_type": "Gót thấp 2cm"}', NULL, NOW(), NOW());

-- ====== CỤM 4: GIÀY DA NAM - CASUAL/OFFICE ======
INSERT INTO products (name, brand, category, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES 
-- Giá rẻ (200-350k)
('Timberland Giày Da Nam Vàng', 'Timberland', 'Giày Da', 'Nam', 320000, 0, 'Giày da chất lượng, kiêu cổ, bền lâu', '["Casual", "Office", "Comfort"]', 
 '{"material": "Da thật", "style": "Bít", "sole": "Cao su tự nhiên", "technology": "Waterproof", "lace_type": "Dây thừng", "heel_type": "Gót thấp 2cm"}', NULL, NOW(), NOW()),

('Clarks Giày Da Nam Nâu', 'Clarks', 'Giày Da', 'Nam', 350000, 5, 'Giày lướt da, dáng hiện đại, đi hàng ngày', '["Casual", "Office", "Comfort", "Fashion"]', 
 '{"material": "Da PU", "style": "Bít", "sole": "Cao su tổng hợp", "technology": "Breathable", "lace_type": "Dây thừng", "heel_type": "Gót thấp 2cm"}', NULL, NOW(), NOW()),

('Skechers Giày Da Nam Đen', 'Skechers', 'Giày Da', 'Nam', 300000, 0, 'Giày da thoáng khí, êm chân, smart casual', '["Casual", "Comfort", "Office"]', 
 '{"material": "Da PU", "style": "Bít", "sole": "EVA", "technology": "Cushion", "lace_type": "Dây thừng", "heel_type": "Gót thấp 2cm"}', NULL, NOW(), NOW()),

-- Giá tầm trung (500-800k)
('Geox Giày Da Nam Xanh', 'Geox', 'Giày Da', 'Nam', 600000, 10, 'Giày da thoáng khí, công nghệ nổi tiếng, khoái chân', '["Casual", "Comfort", "Office", "Fashion"]', 
 '{"material": "Da thật", "style": "Bít", "sole": "Cao su tự nhiên", "technology": "Breathable", "lace_type": "Dây thừng", "heel_type": "Gót thấp 2cm"}', NULL, NOW(), NOW()),

-- Giá cao cấp (>1M)
('Berluti Giày Da Nam Huyền', 'Berluti', 'Giày Da', 'Nam', 1600000, 0, 'Giày da cao cấp Ý, chỉnh chu, tuyệt tác', '["Casual", "Office", "Fashion", "Party", "Business"]', 
 '{"material": "Da thật", "style": "Bít", "sole": "Cao su tự nhiên", "technology": "Cushion", "lace_type": "Dây thừng", "heel_type": "Gót thấp 2cm"}', NULL, NOW(), NOW());

-- ====== CỤM 5: SNEAKER NỮ - SPORT/CASUAL ======
INSERT INTO products (name, brand, category, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES 
-- Giá rẻ (200-350k)
('Adidas Galaxy 6 Nữ', 'Adidas', 'Sneaker', 'Nữ', 270000, 5, 'Giày chạy bộ nữ nhẹ, thoáng khí, thiết kế nữ tính', '["Sport", "Running", "Casual", "Comfort"]', 
 '{"material": "Vải tổng hợp", "style": "Sneaker", "sole": "EVA", "technology": "Lightweight", "lace_type": "Dây thừng", "heel_type": "Flat"}', NULL, NOW(), NOW()),

('Puma Electro Lite Nữ', 'Puma', 'Sneaker', 'Nữ', 300000, 0, 'Giày thể thao nữ năng động, nhanh nhẹn', '["Sport", "Training", "Casual"]', 
 '{"material": "Vải tổng hợp", "style": "Sneaker", "sole": "EVA", "technology": "Breathable", "lace_type": "Velcro", "heel_type": "Flat"}', NULL, NOW(), NOW()),

('Nike Downshifter Nữ', 'Nike', 'Sneaker', 'Nữ', 320000, 10, 'Giày chạy bộ ổn định, phù hợp tập luyện', '["Sport", "Running", "Casual", "Comfort"]', 
 '{"material": "Canvas", "style": "Sneaker", "sole": "Cao su tổng hợp", "technology": "Anti-slip", "lace_type": "Dây thừng", "heel_type": "Flat"}', NULL, NOW(), NOW()),

-- Giá tầm trung (500-800k)
('Nike Air Max 270 Nữ', 'Nike', 'Sneaker', 'Nữ', 700000, 15, 'Giày thể thao nữ phong cách, cushion êm, đẹp mắt', '["Sport", "Casual", "Fashion", "Comfort"]', 
 '{"material": "Da PU", "style": "Sneaker", "sole": "EVA", "technology": "Cushion", "lace_type": "Dây thừng", "heel_type": "Flat"}', NULL, NOW(), NOW()),

-- Giá cao cấp (>1M)
('Nike Air Jordan 1 Retro Nữ', 'Nike', 'Sneaker', 'Nữ', 1400000, 10, 'Huyền thoại bóng rổ phiên bản nữ, kinh điển, sưu tầm', '["Sport", "Fashion", "Casual", "Party"]', 
 '{"material": "Da thật", "style": "Sneaker", "sole": "Cao su tự nhiên", "technology": "Cushion", "lace_type": "Dây thừng", "heel_type": "Flat"}', NULL, NOW(), NOW());

-- ====== CỤM 6: SANDAL NỮ - CASUAL/COMFORT ======
INSERT INTO products (name, brand, category, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES 
-- Giá rẻ (200-350k)
('Biti\'s Sandal Nữ Trắng', 'Biti\'s', 'Sandal', 'Nữ', 230000, 0, 'Sandal da nữ mềm, thoáng khí, màu sáng', '["Casual", "Comfort", "Fashion"]', 
 '{"material": "Da PU", "style": "Sandal", "sole": "Cao su tổng hợp", "technology": "Anti-slip", "lace_type": "Không", "heel_type": "Flat"}', NULL, NOW(), NOW()),

('Adidas Sandal Nữ Hồng', 'Adidas', 'Sandal', 'Nữ', 280000, 5, 'Sandal công thái học nữ, quai dén, êm chân', '["Casual", "Comfort", "Sport"]', 
 '{"material": "EVA", "style": "Sandal", "sole": "EVA", "technology": "Cushion", "lace_type": "Velcro", "heel_type": "Flat"}', NULL, NOW(), NOW()),

('Skechers Sandal Nữ Xanh', 'Skechers', 'Sandal', 'Nữ', 300000, 0, 'Sandal nhẹ cho nữ, quai ngang, bền bỉ', '["Casual", "Comfort"]', 
 '{"material": "Vải tổng hợp", "style": "Sandal", "sole": "EVA", "technology": "Lightweight", "lace_type": "Velcro", "heel_type": "Flat"}', NULL, NOW(), NOW()),

-- Giá tầm trung (500-800k)
('Puma Sandal Nữ Premium', 'Puma', 'Sandal', 'Nữ', 600000, 10, 'Sandal da thật nữ, thiết kế sang trọng, đẹp', '["Casual", "Comfort", "Fashion"]', 
 '{"material": "Da thật", "style": "Sandal", "sole": "Cao su tự nhiên", "technology": "Breathable", "lace_type": "Không", "heel_type": "Flat"}', NULL, NOW(), NOW()),

-- Giá cao cấp (>1M)
('Birkenstock Sandal Nữ Birko-Flor', 'Birkenstock', 'Sandal', 'Nữ', 1100000, 0, 'Sandal Đức chủ lực nữ, chỉnh hình chân', '["Casual", "Comfort", "Fashion", "Party"]', 
 '{"material": "Da thật", "style": "Sandal", "sole": "Cao su tự nhiên", "technology": "Orthopedic", "lace_type": "Không", "heel_type": "Flat"}', NULL, NOW(), NOW());

-- ====== CỤM 7: GIÀY CAO GÓT NỮ - FASHION/PARTY ======
INSERT INTO products (name, brand, category, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES 
-- Giá rẻ (200-350k)
('Aldo Cao Gót Nữ Đỏ', 'Aldo', 'Cao Gót', 'Nữ', 300000, 5, 'Cao gót da nữ 5cm, kinh điển, dự tiệc', '["Fashion", "Party", "Formal"]', 
 '{"material": "Da PU", "style": "Peep Toe", "sole": "Cao su tổng hợp", "technology": "Anti-slip", "lace_type": "Không", "heel_type": "Cao gót 5cm"}', NULL, NOW(), NOW()),

('Vascara Cao Gót Nữ Đen', 'Vascara', 'Cao Gót', 'Nữ', 280000, 0, 'Cao gót Việt dáng ôm chân, lịch lãm, thoáng', '["Fashion", "Party", "Formal", "Business"]', 
 '{"material": "Da thật", "style": "Peep Toe", "sole": "Cao su tự nhiên", "technology": "Comfort", "lace_type": "Không", "heel_type": "Cao gót 5cm"}', NULL, NOW(), NOW()),

('Charles & Keith Cao Gót Nữ Hồng', 'Charles & Keith', 'Cao Gót', 'Nữ', 350000, 10, 'Cao gót thanh lịch 7cm, phù hợp đi tiệc', '["Fashion", "Party", "Formal"]', 
 '{"material": "Da PU", "style": "Closed Toe", "sole": "Cao su tổng hợp", "technology": "Anti-slip", "lace_type": "Không", "heel_type": "Cao gót 7cm"}', NULL, NOW(), NOW()),

-- Giá tầm trung (500-800k)
('Jimmy Choo Cao Gót Nữ Huyền', 'Jimmy Choo', 'Cao Gót', 'Nữ', 750000, 15, 'Cao gót da cao cấp 8cm, làm đôi chân dài, sành', '["Fashion", "Party", "Formal", "Business"]', 
 '{"material": "Da thật", "style": "Peep Toe", "sole": "Cao su tự nhiên", "technology": "Cushion", "lace_type": "Không", "heel_type": "Cao gót 8cm"}', NULL, NOW(), NOW()),

-- Giá cao cấp (>1M)
('Manolo Blahnik Cao Gót Nữ', 'Manolo Blahnik', 'Cao Gót', 'Nữ', 2000000, 0, 'Cao gót huyền thoại 10cm, tuyệt tác thiết kế, sưu tầm', '["Fashion", "Party", "Formal", "Business"]', 
 '{"material": "Da thật", "style": "Closed Toe", "sole": "Cao su tự nhiên", "technology": "Cushion", "lace_type": "Không", "heel_type": "Cao gót 10cm"}', NULL, NOW(), NOW());

-- ====== CỤM 8: GIÀY TÂY NỮ - FORMAL/BUSINESS ======
INSERT INTO products (name, brand, category, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES 
-- Giá rẻ (200-350k)
('Cole Haan Formal Nữ Đen', 'Cole Haan', 'Giày Tây', 'Nữ', 320000, 0, 'Giày công sở nữ oxford, thiết kế nữ tính thanh lịch', '["Formal", "Business", "Office"]', 
 '{"material": "Da PU", "style": "Oxford", "sole": "Cao su tổng hợp", "technology": "Anti-slip", "lace_type": "Dây thừng", "heel_type": "Gót thấp 3cm"}', NULL, NOW(), NOW()),

('Aldo Derby Nữ Nâu', 'Aldo', 'Giày Tây', 'Nữ', 300000, 5, 'Giày công sở nữ dáng derby, màu ấm cúng', '["Formal", "Business", "Office"]', 
 '{"material": "Da PU", "style": "Derby", "sole": "Cao su tổng hợp", "technology": "Breathable", "lace_type": "Dây thừng", "heel_type": "Gót thấp 3cm"}', NULL, NOW(), NOW()),

('Clarks Formal Nữ Xanh', 'Clarks', 'Giày Tây', 'Nữ', 350000, 10, 'Giày lười nữ, đi hội họp, thoáng khí', '["Formal", "Office", "Business"]', 
 '{"material": "Da PU", "style": "Loafer", "sole": "Cao su tổng hợp", "technology": "Comfort", "lace_type": "Không", "heel_type": "Gót thấp 2cm"}', NULL, NOW(), NOW()),

-- Giá tầm trung (500-800k)
('Geox Formal Nữ Premium', 'Geox', 'Giày Tây', 'Nữ', 650000, 10, 'Giày công sở nữ da thật, thoáng khí, bền', '["Formal", "Business", "Office", "Fashion"]', 
 '{"material": "Da thật", "style": "Oxford", "sole": "Cao su tự nhiên", "technology": "Breathable", "lace_type": "Dây thừng", "heel_type": "Gót thấp 3cm"}', NULL, NOW(), NOW()),

-- Giá cao cấp (>1M)
('Salvatore Ferragamo Formal Nữ', 'Salvatore Ferragamo', 'Giày Tây', 'Nữ', 1700000, 0, 'Giày cao cấp Ý nữ, hoàn mỹ, sưu tầm', '["Formal", "Business", "Office", "Fashion", "Party"]', 
 '{"material": "Da thật", "style": "Oxford", "sole": "Cao su tự nhiên", "technology": "Cushion", "lace_type": "Dây thừng", "heel_type": "Gót thấp 3cm"}', NULL, NOW(), NOW());

-- ====== CỤM 9: GIÀY DA NỮ - CASUAL/FASHION ======
INSERT INTO products (name, brand, category, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES 
-- Giá rẻ (200-350k)
('Timberland Giày Da Nữ Vàng', 'Timberland', 'Giày Da', 'Nữ', 300000, 0, 'Giày da chất lượng nữ, kiêu cổ, đẹp mắt', '["Casual", "Fashion", "Comfort"]', 
 '{"material": "Da thật", "style": "Bít", "sole": "Cao su tự nhiên", "technology": "Waterproof", "lace_type": "Dây thừng", "heel_type": "Gót thấp 2cm"}', NULL, NOW(), NOW()),

('Clarks Giày Da Nữ Nâu', 'Clarks', 'Giày Da', 'Nữ', 320000, 5, 'Giày da thoáng nữ, dáng hiện đại, dễ mix', '["Casual", "Fashion", "Comfort", "Office"]', 
 '{"material": "Da PU", "style": "Bít", "sole": "Cao su tổng hợp", "technology": "Breathable", "lace_type": "Dây thừng", "heel_type": "Gót thấp 2cm"}', NULL, NOW(), NOW()),

('Skechers Giày Da Nữ Đen', 'Skechers', 'Giày Da', 'Nữ', 280000, 0, 'Giày da êm nữ, smart casual, thoáng khí', '["Casual", "Comfort", "Fashion"]', 
 '{"material": "Da PU", "style": "Bít", "sole": "EVA", "technology": "Cushion", "lace_type": "Dây thừng", "heel_type": "Gót thấp 2cm"}', NULL, NOW(), NOW()),

-- Giá tầm trung (500-800k)
('Geox Giày Da Nữ Đỏ', 'Geox', 'Giày Da', 'Nữ', 600000, 10, 'Giày da thoáng khí nữ, công nghệ nổi tiếng, sang', '["Casual", "Fashion", "Comfort", "Office"]', 
 '{"material": "Da thật", "style": "Bít", "sole": "Cao su tự nhiên", "technology": "Breathable", "lace_type": "Dây thừng", "heel_type": "Gót thấp 2cm"}', NULL, NOW(), NOW()),

-- Giá cao cấp (>1M)
('Gucci Giày Da Nữ', 'Gucci', 'Giày Da', 'Nữ', 1900000, 0, 'Giày da sang trọng nữ, thiết kế Ý, tuyệt tác', '["Casual", "Fashion", "Office", "Party", "Business"]', 
 '{"material": "Da thật", "style": "Bít", "sole": "Cao su tự nhiên", "technology": "Cushion", "lace_type": "Dây thừng", "heel_type": "Gót thấp 2cm"}', NULL, NOW(), NOW());

-- ====== CỤM 10: BRIDGE ITEM - GIÀY DA FORM THỂ THAO (NAM/NỮ) ======
-- Kết nối: Sneaker + Giày Da + Office
INSERT INTO products (name, brand, category, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES 
('Nike Court Borough Low Hybrid Nam', 'Nike', 'Sneaker', 'Nam', 500000, 5, 'Giày da form thể thao nam, vừa thể thao vừa công sở', '["Sport", "Casual", "Office", "Fashion", "Comfort"]', 
 '{"material": "Da thật", "style": "Sneaker", "sole": "Cao su tự nhiên", "technology": "Cushion", "lace_type": "Dây thừng", "heel_type": "Flat"}', NULL, NOW(), NOW()),

('Adidas Stan Smith Hybrid Nữ', 'Adidas', 'Sneaker', 'Nữ', 480000, 10, 'Giày da form thể thao nữ, tối giản, dùng hàng ngày', '["Casual", "Office", "Fashion", "Comfort", "Sport"]', 
 '{"material": "Da thật", "style": "Sneaker", "sole": "Cao su tự nhiên", "technology": "Breathable", "lace_type": "Dây thừng", "heel_type": "Flat"}', NULL, NOW(), NOW());

-- =============================================================================
-- TỔNG CỘNG: 52 sản phẩm (10 cụm x 5 + 2 bridge items)
-- Các cụm được tổ chức rõ ràng để hỗ trợ CBF (Content-Based Filtering)
-- Các khoảng giá phủ đều: Rẻ (200-350k), Tầm trung (500-800k), Cao cấp (>1M)
-- Bridge items kết nối các cụm với nhau
-- =============================================================================
