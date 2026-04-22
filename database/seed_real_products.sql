SET NAMES utf8mb4;
USE shoestore;

-- Xoa san pham cu
DELETE FROM products;

-- ============ GIAY THE THAO NAM (Nam - giay-the-thao-nam) ============
INSERT INTO products (name, price, brand, gender, category, image, description, discount, quantity, sku, created_at, updated_at) VALUES
('Giày Thể Thao Nam MWC 5811', 375000, 'MWC', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop', 'Giày da thể thao nam đi học, đi chơi, leo núi siêu bền đẹp', 10, 50, 'MWC-5811', NOW(), NOW()),
('Giày Thể Thao Nam MWC 5886', 385000, 'MWC', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500&h=500&fit=crop', 'Giày sneaker nam khoẻ khoắn, cá tính, đi phượt, leo núi', 10, 45, 'MWC-5886', NOW(), NOW()),
('Giày Tây Nam MWC 6745', 395000, 'MWC', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1543163521-9145f931371e?w=500&h=500&fit=crop', 'Giày tây nam cao cấp, slip on công sở lịch lãm', 15, 30, 'MWC-6745', NOW(), NOW()),
('Giày Tây Nam MWC 6729', 395000, 'MWC', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1548625149-fc4a5dfd6f3f?w=500&h=500&fit=crop', 'Giày mọi nam kiểu Monk Strap, mũi bo tròn sang trọng', 15, 28, 'MWC-6729', NOW(), NOW()),
('Giày Sneaker Nam Nike Style', 450000, 'Nike', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1549622095-c0c9c36d1b1d?w=500&h=500&fit=crop', 'Giày thể thao nam phong cách Nike, dễ dàng phối đồ', 20, 40, 'NIKE-M001', NOW(), NOW()),
('Giày Thể Thao Nam Adidas Replica', 380000, 'Adidas', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1556906781-9a412961b28c?w=500&h=500&fit=crop', 'Giày thể thao nam dáng Adidas, thoải mái cả ngày', 12, 35, 'ADIDAS-M001', NOW(), NOW()),
('Giày Chạy Bộ Nam Asics', 420000, 'Asics', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1542219550-37153d35c823?w=500&h=500&fit=crop', 'Giày chạy bộ nam công nghệ đệm tuyệt vời', 18, 25, 'ASICS-M001', NOW(), NOW()),
('Giày Thể Thao Nam Puma Classic', 340000, 'Puma', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=500&fit=crop', 'Giày thể thao nam kinh điển, bền và thoải mái', 8, 32, 'PUMA-M001', NOW(), NOW()),
('Giày Canvas Nam Casual', 280000, 'Generic', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1579338475527-e0e67782e567?w=500&h=500&fit=crop', 'Giày canvas nam thoải mái, phù hợp tất cả dịp', 5, 55, 'CANVAS-M001', NOW(), NOW()),
('Giày Oxford Nam Formal', 450000, 'Oxford', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1473085747062-3500c1a6491e?w=500&h=500&fit=crop', 'Giày oxford nam lịch sự, phù hợp đi làm và dự tiệc', 20, 20, 'OXFORD-M001', NOW(), NOW()),

-- ============ DÉP NAM (Nam - dep-nam) ============
INSERT INTO products (name, price, brand, gender, category, image, description, discount, quantity, sku, created_at, updated_at) VALUES
('Dép Nam MWC 9262', 295000, 'MWC', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1576428773550-2173dba999ef?w=500&h=500&fit=crop', 'Dép nam quai ngang bản to gắn khóa kim loại nam tính', 10, 60, 'MWC-9262', NOW(), NOW()),
('Dép Nam MWC 9253', 235000, 'MWC', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1572099135085-0e3fdaa0485c?w=500&h=500&fit=crop', 'Dép nam quai chéo chữ X đính kim loại, phong cách Nhật', 5, 50, 'MWC-9253', NOW(), NOW()),
('Dép Flip Flop Nam Classic', 120000, 'Generic', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop', 'Dép nam lọp lẻo cổ điển, thoải mái hàng ngày', 0, 80, 'FLIPFLOP-M001', NOW(), NOW()),
('Dép Xỏ Ngón Nam Sport', 180000, 'Sport', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500&h=500&fit=crop', 'Dép xỏ ngón nam chất liệu cao su, bền bỉ', 8, 45, 'SPORT-M001', NOW(), NOW()),
('Dép Pool Nam Waterproof', 150000, 'Aqua', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1511886642585-9f2d1a0e5fa3?w=500&h=500&fit=crop', 'Dép bơi nam chống nước, êm chân', 0, 70, 'AQUA-M001', NOW(), NOW()),
('Dép Hỗ Trợ Đôi Nam Orthotic', 280000, 'OrthoPlus', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1516139541169-a28f8fcac9fe?w=500&h=500&fit=crop', 'Dép hỗ trợ chính hãng cho sức khỏe đôi chân', 15, 25, 'ORTHO-M001', NOW(), NOW()),
('Dép Slide Nam Premium', 220000, 'Premium', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1572099135085-0e3fdaa0485c?w=500&h=500&fit=crop', 'Dép slide nam chất liệu cao cấp, bền lâu', 10, 35, 'PREMIUM-M001', NOW(), NOW()),
('Dép Sandal Nam Casual', 190000, 'Casual', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1605348532760-376a49c6e149?w=500&h=500&fit=crop', 'Dép sandal nam phong cách casual, dễ phối', 5, 55, 'CASUAL-M001', NOW(), NOW()),
('Dép Quai Dán Nam Cork', 260000, 'Cork', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1573022556802-ffd0a93c7b65?w=500&h=500&fit=crop', 'Dép quai dán nam với lớp đệm cork thoải mái', 12, 30, 'CORK-M001', NOW(), NOW()),
('Dép Xỏ Ngón Thoải Mái', 165000, 'ComfyFoot', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1566226039267-a6f0db51e245?w=500&h=500&fit=crop', 'Dép nam thoải mái cho mặc cả ngày', 0, 65, 'COMFY-M001', NOW(), NOW()),

-- ============ SANDAL NAM (Nam - sandal-nam) ============
INSERT INTO products (name, price, brand, gender, category, image, description, discount, quantity, sku, created_at, updated_at) VALUES
('Giày Sandal Nam MWC 7103', 295000, 'MWC', 'Nam', 'sandal-nam', 'https://images.unsplash.com/photo-1559412529-e41ab59b60af?w=500&h=500&fit=crop', 'Sandal nam quai ngang bản to phối quai hậu có khóa gài', 10, 40, 'MWC-7103', NOW(), NOW()),
('Giày Sandal Nam MWC 7106', 295000, 'MWC', 'Nam', 'sandal-nam', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop', 'Sandal nam quai bản to vắt chéo, thoải mái', 10, 38, 'MWC-7106', NOW(), NOW()),
('Sandal Mountain Nam Trekking', 350000, 'Trekking', 'Nam', 'sandal-nam', 'https://images.unsplash.com/photo-1556821552-5f394e324a02?w=500&h=500&fit=crop', 'Sandal leo núi nam chịu lực tốt, bền bỉ', 12, 22, 'TREK-M001', NOW(), NOW()),
('Sandal Ngoài Trời Nam Adventure', 320000, 'Adventure', 'Nam', 'sandal-nam', 'https://images.unsplash.com/photo-1562183241-bd70ba538601?w=500&h=500&fit=crop', 'Sandal ngoài trời nam phù hợp cho các hoạt động linh hoạt', 8, 28, 'ADV-M001', NOW(), NOW()),
('Sandal Xỏ Ngón Nam Leather', 280000, 'Leather', 'Nam', 'sandal-nam', 'https://images.unsplash.com/photo-1544167567-c90caebb72e3?w=500&h=500&fit=crop', 'Sandal nam da thật, thanh lịch và bền bỉ', 15, 32, 'LEATHER-M001', NOW(), NOW()),
('Sandal Quai Kép Nam Casual', 240000, 'Casual', 'Nam', 'sandal-nam', 'https://images.unsplash.com/photo-1526309818098-8c3b37dd09cb?w=500&h=500&fit=crop', 'Sandal nam quai kép, dễ dàng đi và tháo', 5, 50, 'CAUSAL-SD-M001', NOW(), NOW()),
('Sandal Nam Beo Comfort', 260000, 'Comfort', 'Nam', 'sandal-nam', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop', 'Sandal nam với công nghệ beo đệm thoải mái', 10, 35, 'COMFORT-SD-M001', NOW(), NOW()),
('Sandal Quai Dây Nam Beach', 190000, 'Beach', 'Nam', 'sandal-nam', 'https://images.unsplash.com/photo-1559414148-2f5810628f8c?w=500&h=500&fit=crop', 'Sandal nam phù hợp đi biển, dễ lau sạch', 0, 60, 'BEACH-M001', NOW(), NOW()),
('Sandal Quai Chéo Nam Smart', 275000, 'Smart', 'Nam', 'sandal-nam', 'https://images.unsplash.com/photo-1523869335684-c52646db42c3?w=500&h=500&fit=crop', 'Sandal nam kiểu dáng thông minh, phù hợp mặc thường ngày', 12, 25, 'SMART-SD-M001', NOW(), NOW()),

-- ============ GIÀY CAO GÓT NỮ (Nữ - giay-cao-got) ============
INSERT INTO products (name, price, brand, gender, category, image, description, discount, quantity, sku, created_at, updated_at) VALUES
('Giày Cao Gót MWC G268', 315000, 'MWC', 'Nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop', 'Giày búp bê gót êm, nơ xinh phối quai ngang thanh lịch', 8, 40, 'MWC-G268', NOW(), NOW()),
('Giày Cao Gót MWC G317', 275000, 'MWC', 'Nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1494866388000-ecc6cc2e08c5?w=500&h=500&fit=crop', 'Sandal đế đúc 12cm siêu hack dáng, quai ngang thanh lịch', 10, 35, 'MWC-G317', NOW(), NOW()),
('Giày Cao Gót MWC G345', 235000, 'MWC', 'Nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1560343676-04071c5f467b?w=500&h=500&fit=crop', 'Giày cao gót 5cm, mũi vuông, quai mảnh đính đá bạc', 5, 32, 'MWC-G345', NOW(), NOW()),
('Giày Cao Gót MWC G322', 225000, 'MWC', 'Nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=500&fit=crop', 'Sandal nữ 7P, quai ngang hoạ tiết xoắn thanh mảnh', 0, 45, 'MWC-G322', NOW(), NOW()),
('Giày Cao Gót MWC G347', 250000, 'MWC', 'Nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=500&fit=crop', 'Giày gót vuông 7P dáng Slingback, mũi nhọn phối nơ tiểu thư', 8, 28, 'MWC-G347', NOW(), NOW()),
('Giày Cao Gót MWC G296', 235000, 'MWC', 'Nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1520099002409-ddfb91e8f8e6?w=500&h=500&fit=crop', 'Dép cao gót guốc mule hở gót 5P, quai da bản to mềm mịn', 8, 33, 'MWC-G296', NOW(), NOW()),
('Giày Cao Gót Nữ Slingback Premium', 380000, 'Premium', 'Nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1513895537439-4e3c526c0b00?w=500&h=500&fit=crop', 'Giày cao gót slingback cao cấp, dễ dàng di chuyển', 15, 20, 'PREMIUM-CG-001', NOW(), NOW()),
('Giày Cao Gót Đen Kinh Điển', 320000, 'Classic', 'Nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1581101297235-2e2e0f9d2b56?w=500&h=500&fit=crop', 'Giày cao gót đen kinh điển, thanh lịch mọi dịp', 12, 25, 'CLASSIC-CG-001', NOW(), NOW()),
('Giày Cao Gót Thiết Kế Hà Nội', 290000, 'Hanoi Design', 'Nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop', 'Giày cao gót thiết kế độc đáo, phù hợp dự tiệc', 10, 30, 'HANOI-CG-001', NOW(), NOW()),
('Giày Cao Gót T-Strap Nữ', 340000, 'TStrap', 'Nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1603487180144-58a86405d5b5?w=500&h=500&fit=crop', 'Giày cao gót T-strap, thiết kế hiện đại và nữ tính', 18, 22, 'TSTRAP-CG-001', NOW(), NOW()),

-- ============ GIÀY THỂ THAO NỮ (Nữ - giay-the-thao-nu) ============
INSERT INTO products (name, price, brand, gender, category, image, description, discount, quantity, sku, created_at, updated_at) VALUES
('Giày Thể Thao Nữ MWC A397', 345000, 'MWC', 'Nữ', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1542219550-37153d35c823?w=500&h=500&fit=crop', 'Giày thể thao nữ dáng sneaker phối viền trẻ khoẻ, tôn dáng', 12, 50, 'MWC-A397', NOW(), NOW()),
('Giày Thể Thao Nữ Nike Chạy Bộ', 420000, 'Nike', 'Nữ', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop', 'Giày chạy bộ nữ công nghệ tối tân, êm chân', 18, 35, 'NIKE-F001', NOW(), NOW()),
('Giày Adidas Nữ Running', 410000, 'Adidas', 'Nữ', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1556906781-9a412961b28c?w=500&h=500&fit=crop', 'Giày adidas nữ chạy bộ, thoải mái cả ngày', 15, 40, 'ADIDAS-F001', NOW(), NOW()),
('Giày Thể Thao Nữ Casual Sneaker', 320000, 'Generic', 'Nữ', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1525967811867-fd3aa5a3fb04?w=500&h=500&fit=crop', 'Giày thể thao nữ casual thoải mái, phù hợp mặc hàng ngày', 8, 60, 'CASUAL-F001', NOW(), NOW()),
('Giày Basketball Nữ Chính Hãng', 450000, 'Basketball', 'Nữ', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500&h=500&fit=crop', 'Giày bóng rổ nữ chất lượng cao, chống va đập', 20, 25, 'BBALL-F001', NOW(), NOW()),
('Giày Tennis Nữ Chuyên Dụng', 380000, 'Tennis', 'Nữ', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop', 'Giày tennis nữ có độ bám tốt, bền bỉ', 12, 30, 'TENNIS-F001', NOW(), NOW()),
('Giày Yoga Nữ Thoải Mái', 250000, 'Yoga', 'Nữ', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop', 'Giày yoga nữ nhẹ và mềm, thoải mái cho các bài tập', 5, 55, 'YOGA-F001', NOW(), NOW()),
('Giày Thể Thao Nữ Puma Classic', 360000, 'Puma', 'Nữ', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=500&fit=crop', 'Giày puma nữ dáng kinh điển, bền và thoải mái', 10, 45, 'PUMA-F001', NOW(), NOW()),
('Giày Thể Thao Nữ Asics', 430000, 'Asics', 'Nữ', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1542219550-37153d35c823?w=500&h=500&fit=crop', 'Giày asics nữ công nghệ đệm cải tiến, chạy bộ thoải mái', 16, 28, 'ASICS-F001', NOW(), NOW()),

-- ============ SANDAL NỮ (Nữ - sandal-nu) ============
INSERT INTO products (name, price, brand, gender, category, image, description, discount, quantity, sku, created_at, updated_at) VALUES
('Dép Nữ MWC 8683', 195000, 'MWC', 'Nữ', 'sandal-nu', 'https://images.unsplash.com/photo-1572099135085-0e3fdaa0485c?w=500&h=500&fit=crop', 'Dép nữ hai quai ngang dán cài nhẹ êm, nữ tính', 5, 70, 'MWC-8683', NOW(), NOW()),
('Dép Nữ MWC 8673', 125000, 'MWC', 'Nữ', 'sandal-nu', 'https://images.unsplash.com/photo-1576428773550-2173dba999ef?w=500&h=500&fit=crop', 'Dép nữ quai đan phối khuyên vàng đồng sang trọng', 0, 80, 'MWC-8673', NOW(), NOW()),
('Dép Nữ MWC 8687', 195000, 'MWC', 'Nữ', 'sandal-nu', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop', 'Dép sandal đế đúc gắn sticker gấu xinh, trẻ trung', 10, 55, 'MWC-8687', NOW(), NOW()),
('Giày Sandal Nữ MWC E208', 215000, 'MWC', 'Nữ', 'sandal-nu', 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500&h=500&fit=crop', 'Sandal nữ quai ngang chéo phối xỏ ngón thanh lịch', 8, 45, 'MWC-E208', NOW(), NOW()),
('Sandal Nữ MWC E215', 295000, 'MWC', 'Nữ', 'sandal-nu', 'https://images.unsplash.com/photo-1544167567-c90caebb72e3?w=500&h=500&fit=crop', 'Sandal quai kẹp chữ V thanh lịch, đi học đi chơi đi biển', 12, 35, 'MWC-E215', NOW(), NOW()),
('Dép Flip Flop Nữ Summer', 110000, 'Summer', 'Nữ', 'sandal-nu', 'https://images.unsplash.com/photo-1566226039267-a6f0db51e245?w=500&h=500&fit=crop', 'Dép lọp lẻo nữ nhẹ và thoải mái mặc hàng ngày', 0, 90, 'SUMMER-F001', NOW(), NOW()),
('Dép Xỏ Ngón Nữ Xinh Xắn', 155000, 'Casual', 'Nữ', 'sandal-nu', 'https://images.unsplash.com/photo-1572099135085-0e3fdaa0485c?w=500&h=500&fit=crop', 'Dép xỏ ngón nữ với các mầu sắc xinh xắn', 5, 65, 'CASUAL-FD-001', NOW(), NOW()),
('Dép Sandal Nữ Ngoài Trời', 240000, 'Outdoor', 'Nữ', 'sandal-nu', 'https://images.unsplash.com/photo-1562183241-bd70ba538601?w=500&h=500&fit=crop', 'Sandal nữ phù hợp cho các hoạt động ngoài trời', 10, 40, 'OUTDOOR-F001', NOW(), NOW()),
('Dép Sandal Nữ Leather Da Thật', 280000, 'Leather', 'Nữ', 'sandal-nu', 'https://images.unsplash.com/photo-1526309818098-8c3b37dd09cb?w=500&h=500&fit=crop', 'Dép sandal nữ da thật bền đẹp và sang trọng', 15, 30, 'LEATHER-FD-001', NOW(), NOW());

-- Xác nhận insert
SELECT COUNT(*) as total_products FROM products;
SELECT category, COUNT(*) as count FROM products GROUP BY category;
