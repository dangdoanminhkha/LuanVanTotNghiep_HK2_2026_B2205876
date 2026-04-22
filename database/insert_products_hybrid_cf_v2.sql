-- =============================================================================
-- DỮ LIỆU SẢN PHẨM CHO HỆ THỐNG HYBRID COLLABORATIVE FILTERING (CF + Content-Based)
-- Version 2: Sử dụng category_id (Foreign Key) thay vì category (Text)
-- =============================================================================

-- ========== ĐỊNH NGHĨA CATEGORY IDs ==========
-- Biến tạm lưu ID từ các categories hiện tại
SET @sneaker_id = (SELECT id FROM categories WHERE slug = 'sneaker' LIMIT 1);
SET @sandal_id = (SELECT id FROM categories WHERE slug = 'sandal' LIMIT 1);
SET @giay_tay_id = (SELECT id FROM categories WHERE slug = 'giay-tay' LIMIT 1);
SET @giay_da_nam_id = (SELECT id FROM categories WHERE slug = 'giay-da-nam' LIMIT 1);
SET @cao_got_id = (SELECT id FROM categories WHERE slug = 'giay-cao-got' LIMIT 1);

-- ====== CỤM 1: SNEAKER NAM - SPORT/CASUAL ======
INSERT INTO products (name, brand, category_id, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES 
-- Giá rẻ (200-350k)
('Nike Revolution 7 Nam', 'Nike', @sneaker_id, 'Nam', 280000, 0, 'Giày chạy bộ nhẹ, thoáng khí, thiết kế tối giản', JSON_ARRAY('Sport', 'Running', 'Casual', 'Comfort'), 
 JSON_OBJECT('material', 'Vải tổng hợp', 'style', 'Sneaker', 'sole', 'EVA', 'technology', 'Lightweight', 'lace_type', 'Dây thừng', 'heel_type', 'Flat'), NULL, NOW(), NOW()),

('Adidas Lite Racer Nam', 'Adidas', @sneaker_id, 'Nam', 320000, 5, 'Giày mềm với đế bền, phù hợp tập luyện', JSON_ARRAY('Sport', 'Training', 'Casual', 'Comfort'), 
 JSON_OBJECT('material', 'Vải tổng hợp', 'style', 'Sneaker', 'sole', 'Cao su tổng hợp', 'technology', 'Breathable', 'lace_type', 'Dây thừng', 'heel_type', 'Flat'), NULL, NOW(), NOW()),

('Puma Flex Control Nam', 'Puma', @sneaker_id, 'Nam', 300000, 0, 'Thiết kế thể thao năng động, đi hàng ngày', JSON_ARRAY('Sport', 'Running', 'Casual'), 
 JSON_OBJECT('material', 'Canvas', 'style', 'Sneaker', 'sole', 'EVA', 'technology', 'Anti-slip', 'lace_type', 'Dây thừng', 'heel_type', 'Flat'), NULL, NOW(), NOW()),

('Nike Air Max 90 Nam', 'Nike', @sneaker_id, 'Nam', 650000, 10, 'Giày thể thao kinh điển, cushion tuyệt vời, phong cách', JSON_ARRAY('Sport', 'Casual', 'Fashion', 'Comfort'), 
 JSON_OBJECT('material', 'Da PU', 'style', 'Sneaker', 'sole', 'EVA', 'technology', 'Cushion', 'lace_type', 'Dây thừng', 'heel_type', 'Flat'), NULL, NOW(), NOW()),

('Nike Air Jordan 1 Retro Nam', 'Nike', @sneaker_id, 'Nam', 1500000, 15, 'Huyền thoại bóng rổ, chất lượng cao, đôi sưu tầm', JSON_ARRAY('Sport', 'Fashion', 'Casual', 'Party'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Sneaker', 'sole', 'Cao su tự nhiên', 'technology', 'Cushion', 'lace_type', 'Dây thừng', 'heel_type', 'Flat'), NULL, NOW(), NOW());

-- ====== CỤM 2: SANDAL NAM - CASUAL/COMFORT ======
INSERT INTO products (name, brand, category_id, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES 
('Biti\'s Sandal Nam Nâu', 'Biti\'s', @sandal_id, 'Nam', 250000, 0, 'Sandal da, mềm mại, thoáng khí', JSON_ARRAY('Casual', 'Comfort', 'Fashion'), 
 JSON_OBJECT('material', 'Da PU', 'style', 'Sandal', 'sole', 'Cao su tổng hợp', 'technology', 'Anti-slip', 'lace_type', 'Không', 'heel_type', 'Flat'), NULL, NOW(), NOW()),

('Skechers Sandal Nam Đen', 'Skechers', @sandal_id, 'Nam', 300000, 5, 'Sandal thể thao, quai dén, êm chân', JSON_ARRAY('Casual', 'Comfort', 'Sport'), 
 JSON_OBJECT('material', 'Vải tổng hợp', 'style', 'Sandal', 'sole', 'EVA', 'technology', 'Cushion', 'lace_type', 'Velcro', 'heel_type', 'Flat'), NULL, NOW(), NOW()),

('Adidas Sandal Nam Xanh', 'Adidas', @sandal_id, 'Nam', 280000, 0, 'Sandal công thái học, đế chiếc, bền bỉ', JSON_ARRAY('Casual', 'Comfort'), 
 JSON_OBJECT('material', 'EVA', 'style', 'Sandal', 'sole', 'EVA', 'technology', 'Lightweight', 'lace_type', 'Velcro', 'heel_type', 'Flat'), NULL, NOW(), NOW()),

('Puma Sandal Nam Premium', 'Puma', @sandal_id, 'Nam', 550000, 10, 'Sandal chất liệu da thật, thiết kế sang trọng', JSON_ARRAY('Casual', 'Comfort', 'Fashion'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Sandal', 'sole', 'Cao su tự nhiên', 'technology', 'Breathable', 'lace_type', 'Không', 'heel_type', 'Flat'), NULL, NOW(), NOW()),

('Birkenstock Sandal Nam Classic', 'Birkenstock', @sandal_id, 'Nam', 1200000, 0, 'Sandal chính hãng Đức, chỉnh hình chân', JSON_ARRAY('Casual', 'Comfort', 'Fashion', 'Party'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Sandal', 'sole', 'Cao su tự nhiên', 'technology', 'Orthopedic', 'lace_type', 'Không', 'heel_type', 'Flat'), NULL, NOW(), NOW());

-- ====== CỤM 3: GIÀY TÂY NAM - FORMAL/BUSINESS ======
INSERT INTO products (name, brand, category_id, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES 
('Cole Haan Formal Nam Đen', 'Cole Haan', @giay_tay_id, 'Nam', 350000, 0, 'Giày công sở cơ bản, thiết kế oxford đơn giản', JSON_ARRAY('Formal', 'Business', 'Office'), 
 JSON_OBJECT('material', 'Da PU', 'style', 'Oxford', 'sole', 'Cao su tổng hợp', 'technology', 'Anti-slip', 'lace_type', 'Dây thừng', 'heel_type', 'Gót thấp 2cm'), NULL, NOW(), NOW()),

('Aldo Derby Nam Nâu', 'Aldo', @giay_tay_id, 'Nam', 300000, 5, 'Giày công sở nam, dáng derby thanh lịch', JSON_ARRAY('Formal', 'Business'), 
 JSON_OBJECT('material', 'Da PU', 'style', 'Derby', 'sole', 'Cao su tổng hợp', 'technology', 'Breathable', 'lace_type', 'Dây thừng', 'heel_type', 'Gót thấp 2cm'), NULL, NOW(), NOW()),

('Dr. Martens Formal Nam', 'Dr. Martens', @giay_tay_id, 'Nam', 280000, 0, 'Giày lười kiểu dáng đơn giản, đi hội họp', JSON_ARRAY('Formal', 'Office', 'Business'), 
 JSON_OBJECT('material', 'Da PU', 'style', 'Giày lười', 'sole', 'Cao su tổng hợp', 'technology', 'Comfort', 'lace_type', 'Không', 'heel_type', 'Gót thấp 2cm'), NULL, NOW(), NOW()),

('Allen Edmonds Formal Nam Premium', 'Allen Edmonds', @giay_tay_id, 'Nam', 700000, 10, 'Giày công sở da thật, xử lý tỉ mỉ, bền bỉ', JSON_ARRAY('Formal', 'Business', 'Office', 'Fashion'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Oxford', 'sole', 'Cao su tự nhiên', 'technology', 'Breathable', 'lace_type', 'Dây thừng', 'heel_type', 'Gót thấp 2cm'), NULL, NOW(), NOW()),

('Salvatore Ferragamo Formal Nam', 'Salvatore Ferragamo', @giay_tay_id, 'Nam', 1800000, 0, 'Giày cao cấp Ý, thiết kế hoàn mỹ, sưu tầm', JSON_ARRAY('Formal', 'Business', 'Office', 'Fashion', 'Party'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Oxford', 'sole', 'Cao su tự nhiên', 'technology', 'Cushion', 'lace_type', 'Dây thừng', 'heel_type', 'Gót thấp 2cm'), NULL, NOW(), NOW());

-- ====== CỤM 4: GIÀY DA NAM - CASUAL/OFFICE ======
INSERT INTO products (name, brand, category_id, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES 
('Timberland Giày Da Nam Vàng', 'Timberland', @giay_da_nam_id, 'Nam', 320000, 0, 'Giày da chất lượng, kiêu cổ, bền lâu', JSON_ARRAY('Casual', 'Office', 'Comfort'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Bít', 'sole', 'Cao su tự nhiên', 'technology', 'Waterproof', 'lace_type', 'Dây thừng', 'heel_type', 'Gót thấp 2cm'), NULL, NOW(), NOW()),

('Clarks Giày Da Nam Nâu', 'Clarks', @giay_da_nam_id, 'Nam', 350000, 5, 'Giày lướt da, dáng hiện đại, đi hàng ngày', JSON_ARRAY('Casual', 'Office', 'Comfort', 'Fashion'), 
 JSON_OBJECT('material', 'Da PU', 'style', 'Bít', 'sole', 'Cao su tổng hợp', 'technology', 'Breathable', 'lace_type', 'Dây thừng', 'heel_type', 'Gót thấp 2cm'), NULL, NOW(), NOW()),

('Skechers Giày Da Nam Đen', 'Skechers', @giay_da_nam_id, 'Nam', 300000, 0, 'Giày da thoáng khí, êm chân, smart casual', JSON_ARRAY('Casual', 'Comfort', 'Office'), 
 JSON_OBJECT('material', 'Da PU', 'style', 'Bít', 'sole', 'EVA', 'technology', 'Cushion', 'lace_type', 'Dây thừng', 'heel_type', 'Gót thấp 2cm'), NULL, NOW(), NOW()),

('Geox Giày Da Nam Xanh', 'Geox', @giay_da_nam_id, 'Nam', 600000, 10, 'Giày da thoáng khí, công nghệ nổi tiếng, khoái chân', JSON_ARRAY('Casual', 'Comfort', 'Office', 'Fashion'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Bít', 'sole', 'Cao su tự nhiên', 'technology', 'Breathable', 'lace_type', 'Dây thừng', 'heel_type', 'Gót thấp 2cm'), NULL, NOW(), NOW()),

('Berluti Giày Da Nam Huyền', 'Berluti', @giay_da_nam_id, 'Nam', 1600000, 0, 'Giày da cao cấp Ý, chỉnh chu, tuyệt tác', JSON_ARRAY('Casual', 'Office', 'Fashion', 'Party', 'Business'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Bít', 'sole', 'Cao su tự nhiên', 'technology', 'Cushion', 'lace_type', 'Dây thừng', 'heel_type', 'Gót thấp 2cm'), NULL, NOW(), NOW());

-- ====== CỤM 5: SNEAKER NỮ - SPORT/CASUAL ======
INSERT INTO products (name, brand, category_id, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES 
('Adidas Galaxy 6 Nữ', 'Adidas', @sneaker_id, 'Nữ', 270000, 5, 'Giày chạy bộ nữ nhẹ, thoáng khí, thiết kế nữ tính', JSON_ARRAY('Sport', 'Running', 'Casual', 'Comfort'), 
 JSON_OBJECT('material', 'Vải tổng hợp', 'style', 'Sneaker', 'sole', 'EVA', 'technology', 'Lightweight', 'lace_type', 'Dây thừng', 'heel_type', 'Flat'), NULL, NOW(), NOW()),

('Puma Electro Lite Nữ', 'Puma', @sneaker_id, 'Nữ', 300000, 0, 'Giày thể thao nữ năng động, nhanh nhẹn', JSON_ARRAY('Sport', 'Training', 'Casual'), 
 JSON_OBJECT('material', 'Vải tổng hợp', 'style', 'Sneaker', 'sole', 'EVA', 'technology', 'Breathable', 'lace_type', 'Velcro', 'heel_type', 'Flat'), NULL, NOW(), NOW()),

('Nike Downshifter Nữ', 'Nike', @sneaker_id, 'Nữ', 320000, 10, 'Giày chạy bộ ổn định, phù hợp tập luyện', JSON_ARRAY('Sport', 'Running', 'Casual', 'Comfort'), 
 JSON_OBJECT('material', 'Canvas', 'style', 'Sneaker', 'sole', 'Cao su tổng hợp', 'technology', 'Anti-slip', 'lace_type', 'Dây thừng', 'heel_type', 'Flat'), NULL, NOW(), NOW()),

('Nike Air Max 270 Nữ', 'Nike', @sneaker_id, 'Nữ', 700000, 15, 'Giày thể thao nữ phong cách, cushion êm, đẹp mắt', JSON_ARRAY('Sport', 'Casual', 'Fashion', 'Comfort'), 
 JSON_OBJECT('material', 'Da PU', 'style', 'Sneaker', 'sole', 'EVA', 'technology', 'Cushion', 'lace_type', 'Dây thừng', 'heel_type', 'Flat'), NULL, NOW(), NOW()),

('Nike Air Jordan 1 Retro Nữ', 'Nike', @sneaker_id, 'Nữ', 1400000, 10, 'Huyền thoại bóng rổ phiên bản nữ, kinh điển, sưu tầm', JSON_ARRAY('Sport', 'Fashion', 'Casual', 'Party'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Sneaker', 'sole', 'Cao su tự nhiên', 'technology', 'Cushion', 'lace_type', 'Dây thừng', 'heel_type', 'Flat'), NULL, NOW(), NOW());

-- ====== CỤM 6: SANDAL NỮ - CASUAL/COMFORT ======
INSERT INTO products (name, brand, category_id, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES 
('Biti\'s Sandal Nữ Trắng', 'Biti\'s', @sandal_id, 'Nữ', 230000, 0, 'Sandal da nữ mềm, thoáng khí, màu sáng', JSON_ARRAY('Casual', 'Comfort', 'Fashion'), 
 JSON_OBJECT('material', 'Da PU', 'style', 'Sandal', 'sole', 'Cao su tổng hợp', 'technology', 'Anti-slip', 'lace_type', 'Không', 'heel_type', 'Flat'), NULL, NOW(), NOW()),

('Adidas Sandal Nữ Hồng', 'Adidas', @sandal_id, 'Nữ', 280000, 5, 'Sandal công thái học nữ, quai dén, êm chân', JSON_ARRAY('Casual', 'Comfort', 'Sport'), 
 JSON_OBJECT('material', 'EVA', 'style', 'Sandal', 'sole', 'EVA', 'technology', 'Cushion', 'lace_type', 'Velcro', 'heel_type', 'Flat'), NULL, NOW(), NOW()),

('Skechers Sandal Nữ Xanh', 'Skechers', @sandal_id, 'Nữ', 300000, 0, 'Sandal nhẹ cho nữ, quai ngang, bền bỉ', JSON_ARRAY('Casual', 'Comfort'), 
 JSON_OBJECT('material', 'Vải tổng hợp', 'style', 'Sandal', 'sole', 'EVA', 'technology', 'Lightweight', 'lace_type', 'Velcro', 'heel_type', 'Flat'), NULL, NOW(), NOW()),

('Puma Sandal Nữ Premium', 'Puma', @sandal_id, 'Nữ', 600000, 10, 'Sandal da thật nữ, thiết kế sang trọng, đẹp', JSON_ARRAY('Casual', 'Comfort', 'Fashion'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Sandal', 'sole', 'Cao su tự nhiên', 'technology', 'Breathable', 'lace_type', 'Không', 'heel_type', 'Flat'), NULL, NOW(), NOW()),

('Birkenstock Sandal Nữ Birko-Flor', 'Birkenstock', @sandal_id, 'Nữ', 1100000, 0, 'Sandal Đức chủ lực nữ, chỉnh hình chân', JSON_ARRAY('Casual', 'Comfort', 'Fashion', 'Party'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Sandal', 'sole', 'Cao su tự nhiên', 'technology', 'Orthopedic', 'lace_type', 'Không', 'heel_type', 'Flat'), NULL, NOW(), NOW());

-- ====== CỤM 7: GIÀY CAO GÓT NỮ - FASHION/PARTY ======
INSERT INTO products (name, brand, category_id, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES 
('Aldo Cao Gót Nữ Đỏ', 'Aldo', @cao_got_id, 'Nữ', 300000, 5, 'Cao gót da nữ 5cm, kinh điển, dự tiệc', JSON_ARRAY('Fashion', 'Party', 'Formal'), 
 JSON_OBJECT('material', 'Da PU', 'style', 'Peep Toe', 'sole', 'Cao su tổng hợp', 'technology', 'Anti-slip', 'lace_type', 'Không', 'heel_type', 'Cao gót 5cm'), NULL, NOW(), NOW()),

('Vascara Cao Gót Nữ Đen', 'Vascara', @cao_got_id, 'Nữ', 280000, 0, 'Cao gót Việt dáng ôm chân, lịch lãm, thoáng', JSON_ARRAY('Fashion', 'Party', 'Formal', 'Business'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Peep Toe', 'sole', 'Cao su tự nhiên', 'technology', 'Comfort', 'lace_type', 'Không', 'heel_type', 'Cao gót 5cm'), NULL, NOW(), NOW()),

('Charles & Keith Cao Gót Nữ Hồng', 'Charles & Keith', @cao_got_id, 'Nữ', 350000, 10, 'Cao gót thanh lịch 7cm, phù hợp đi tiệc', JSON_ARRAY('Fashion', 'Party', 'Formal'), 
 JSON_OBJECT('material', 'Da PU', 'style', 'Closed Toe', 'sole', 'Cao su tổng hợp', 'technology', 'Anti-slip', 'lace_type', 'Không', 'heel_type', 'Cao gót 7cm'), NULL, NOW(), NOW()),

('Jimmy Choo Cao Gót Nữ Huyền', 'Jimmy Choo', @cao_got_id, 'Nữ', 750000, 15, 'Cao gót da cao cấp 8cm, làm đôi chân dài, sành', JSON_ARRAY('Fashion', 'Party', 'Formal', 'Business'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Peep Toe', 'sole', 'Cao su tự nhiên', 'technology', 'Cushion', 'lace_type', 'Không', 'heel_type', 'Cao gót 8cm'), NULL, NOW(), NOW()),

('Manolo Blahnik Cao Gót Nữ', 'Manolo Blahnik', @cao_got_id, 'Nữ', 2000000, 0, 'Cao gót huyền thoại 10cm, tuyệt tác thiết kế, sưu tầm', JSON_ARRAY('Fashion', 'Party', 'Formal', 'Business'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Closed Toe', 'sole', 'Cao su tự nhiên', 'technology', 'Cushion', 'lace_type', 'Không', 'heel_type', 'Cao gót 10cm'), NULL, NOW(), NOW());

-- ====== CỤM 8: GIÀY TÂY NỮ - FORMAL/BUSINESS ======
INSERT INTO products (name, brand, category_id, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES 
('Cole Haan Formal Nữ Đen', 'Cole Haan', @giay_tay_id, 'Nữ', 320000, 0, 'Giày công sở nữ oxford, thiết kế nữ tính thanh lịch', JSON_ARRAY('Formal', 'Business', 'Office'), 
 JSON_OBJECT('material', 'Da PU', 'style', 'Oxford', 'sole', 'Cao su tổng hợp', 'technology', 'Anti-slip', 'lace_type', 'Dây thừng', 'heel_type', 'Gót thấp 3cm'), NULL, NOW(), NOW()),

('Aldo Derby Nữ Nâu', 'Aldo', @giay_tay_id, 'Nữ', 300000, 5, 'Giày công sở nữ dáng derby, màu ấm cúng', JSON_ARRAY('Formal', 'Business', 'Office'), 
 JSON_OBJECT('material', 'Da PU', 'style', 'Derby', 'sole', 'Cao su tổng hợp', 'technology', 'Breathable', 'lace_type', 'Dây thừng', 'heel_type', 'Gót thấp 3cm'), NULL, NOW(), NOW()),

('Clarks Formal Nữ Xanh', 'Clarks', @giay_tay_id, 'Nữ', 350000, 10, 'Giày lười nữ, đi hội họp, thoáng khí', JSON_ARRAY('Formal', 'Office', 'Business'), 
 JSON_OBJECT('material', 'Da PU', 'style', 'Loafer', 'sole', 'Cao su tổng hợp', 'technology', 'Comfort', 'lace_type', 'Không', 'heel_type', 'Gót thấp 2cm'), NULL, NOW(), NOW()),

('Geox Formal Nữ Premium', 'Geox', @giay_tay_id, 'Nữ', 650000, 10, 'Giày công sở nữ da thật, thoáng khí, bền', JSON_ARRAY('Formal', 'Business', 'Office', 'Fashion'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Oxford', 'sole', 'Cao su tự nhiên', 'technology', 'Breathable', 'lace_type', 'Dây thừng', 'heel_type', 'Gót thấp 3cm'), NULL, NOW(), NOW()),

('Salvatore Ferragamo Formal Nữ', 'Salvatore Ferragamo', @giay_tay_id, 'Nữ', 1700000, 0, 'Giày cao cấp Ý nữ, hoàn mỹ, sưu tầm', JSON_ARRAY('Formal', 'Business', 'Office', 'Fashion', 'Party'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Oxford', 'sole', 'Cao su tự nhiên', 'technology', 'Cushion', 'lace_type', 'Dây thừng', 'heel_type', 'Gót thấp 3cm'), NULL, NOW(), NOW());

-- ====== CỤM 9: GIÀY DA NỮ - CASUAL/FASHION ======
INSERT INTO products (name, brand, category_id, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES 
('Timberland Giày Da Nữ Vàng', 'Timberland', @giay_da_nam_id, 'Nữ', 300000, 0, 'Giày da chất lượng nữ, kiêu cổ, đẹp mắt', JSON_ARRAY('Casual', 'Fashion', 'Comfort'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Bít', 'sole', 'Cao su tự nhiên', 'technology', 'Waterproof', 'lace_type', 'Dây thừng', 'heel_type', 'Gót thấp 2cm'), NULL, NOW(), NOW()),

('Clarks Giày Da Nữ Nâu', 'Clarks', @giay_da_nam_id, 'Nữ', 320000, 5, 'Giày da thoáng nữ, dáng hiện đại, dễ mix', JSON_ARRAY('Casual', 'Fashion', 'Comfort', 'Office'), 
 JSON_OBJECT('material', 'Da PU', 'style', 'Bít', 'sole', 'Cao su tổng hợp', 'technology', 'Breathable', 'lace_type', 'Dây thừng', 'heel_type', 'Gót thấp 2cm'), NULL, NOW(), NOW()),

('Skechers Giày Da Nữ Đen', 'Skechers', @giay_da_nam_id, 'Nữ', 280000, 0, 'Giày da êm nữ, smart casual, thoáng khí', JSON_ARRAY('Casual', 'Comfort', 'Fashion'), 
 JSON_OBJECT('material', 'Da PU', 'style', 'Bít', 'sole', 'EVA', 'technology', 'Cushion', 'lace_type', 'Dây thừng', 'heel_type', 'Gót thấp 2cm'), NULL, NOW(), NOW()),

('Geox Giày Da Nữ Đỏ', 'Geox', @giay_da_nam_id, 'Nữ', 600000, 10, 'Giày da thoáng khí nữ, công nghệ nổi tiếng, sang', JSON_ARRAY('Casual', 'Fashion', 'Comfort', 'Office'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Bít', 'sole', 'Cao su tự nhiên', 'technology', 'Breathable', 'lace_type', 'Dây thừng', 'heel_type', 'Gót thấp 2cm'), NULL, NOW(), NOW()),

('Gucci Giày Da Nữ', 'Gucci', @giay_da_nam_id, 'Nữ', 1900000, 0, 'Giày da sang trọng nữ, thiết kế Ý, tuyệt tác', JSON_ARRAY('Casual', 'Fashion', 'Office', 'Party', 'Business'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Bít', 'sole', 'Cao su tự nhiên', 'technology', 'Cushion', 'lace_type', 'Dây thừng', 'heel_type', 'Gót thấp 2cm'), NULL, NOW(), NOW());

-- ====== CỤM 10: BRIDGE ITEM - GIÀY DA FORM THỂ THAO (NAM/NỮ) ======
INSERT INTO products (name, brand, category_id, gender, price, discount, description, tags, specification, image, created_at, updated_at)
VALUES 
('Nike Court Borough Low Hybrid Nam', 'Nike', @sneaker_id, 'Nam', 500000, 5, 'Giày da form thể thao nam, vừa thể thao vừa công sở', JSON_ARRAY('Sport', 'Casual', 'Office', 'Fashion', 'Comfort'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Sneaker', 'sole', 'Cao su tự nhiên', 'technology', 'Cushion', 'lace_type', 'Dây thừng', 'heel_type', 'Flat'), NULL, NOW(), NOW()),

('Adidas Stan Smith Hybrid Nữ', 'Adidas', @sneaker_id, 'Nữ', 480000, 10, 'Giày da form thể thao nữ, tối giản, dùng hàng ngày', JSON_ARRAY('Casual', 'Office', 'Fashion', 'Comfort', 'Sport'), 
 JSON_OBJECT('material', 'Da thật', 'style', 'Sneaker', 'sole', 'Cao su tự nhiên', 'technology', 'Breathable', 'lace_type', 'Dây thừng', 'heel_type', 'Flat'), NULL, NOW(), NOW());

-- =============================================================================
-- TỔNG CỘNG: 52 sản phẩm (10 cụm x 5 + 2 bridge items)
-- Các cụm được tổ chức rõ ràng để hỗ trợ CBF (Content-Based Filtering)
-- Các khoảng giá phủ đều: Rẻ (200-350k), Tầm trung (500-800k), Cao cấp (>1M)
-- Bridge items kết nối các cụm với nhau
-- Tags và Specification sử dụng JSON_ARRAY() và JSON_OBJECT() để tuy nhân tính
-- =============================================================================
