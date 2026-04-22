SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
USE shoestore;

DELETE FROM products;

-- GIAY THE THAO NAM
INSERT INTO products (name, price, brand, gender, category, image, description, discount, quantity, sku) VALUES
('Giay The Thao Nam MWC 5811', 375000, 'MWC', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop', 'Giay da the thao nam di hoc, di choi, leo nui sieu ben dep', 10, 50, 'MWC-5811'),
('Giay The Thao Nam MWC 5886', 385000, 'MWC', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500&h=500&fit=crop', 'Giay sneaker nam khoe khoan, ca tinh, di phuot, leo nui', 10, 45, 'MWC-5886'),
('Giay Tay Nam MWC 6745', 395000, 'MWC', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1543163521-9145f931371e?w=500&h=500&fit=crop', 'Giay tay nam cao cap, slip on cong so lich lam', 15, 30, 'MWC-6745'),
('Giay Tay Nam MWC 6729', 395000, 'MWC', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1548625149-fc4a5dfd6f3f?w=500&h=500&fit=crop', 'Giay moi nam kieu Monk Strap, mui bo tron sang trong', 15, 28, 'MWC-6729'),
('Giay Sneaker Nam Nike Style', 450000, 'Nike', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1549622095-c0c9c36d1b1d?w=500&h=500&fit=crop', 'Giay the thao nam phong cach Nike, de dang phoi do', 20, 40, 'NIKE-M001'),
('Giay The Thao Nam Adidas', 380000, 'Adidas', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1556906781-9a412961b28c?w=500&h=500&fit=crop', 'Giay the thao nam dang Adidas, thoai mai ca ngay', 12, 35, 'ADIDAS-M001'),
('Giay Chay Bo Nam Asics', 420000, 'Asics', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1542219550-37153d35c823?w=500&h=500&fit=crop', 'Giay chay bo nam cong nghe dem tuyet voi', 18, 25, 'ASICS-M001'),
('Giay The Thao Nam Puma', 340000, 'Puma', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=500&fit=crop', 'Giay the thao nam kinh dien, ben va thoai mai', 8, 32, 'PUMA-M001'),
('Giay Canvas Nam Casual', 280000, 'Generic', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1579338475527-e0e67782e567?w=500&h=500&fit=crop', 'Giay canvas nam thoai mai, phu hop tat ca dip', 5, 55, 'CANVAS-M001'),
('Giay Oxford Nam Formal', 450000, 'Oxford', 'Nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1473085747062-3500c1a6491e?w=500&h=500&fit=crop', 'Giay oxford nam lich su, phu hop di lam va du tiec', 20, 20, 'OXFORD-M001');

-- DEP NAM
INSERT INTO products (name, price, brand, gender, category, image, description, discount, quantity, sku) VALUES
('Dep Nam MWC 9262', 295000, 'MWC', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1576428773550-2173dba999ef?w=500&h=500&fit=crop', 'Dep nam quai ngang ban to gan khoa kim loai nam tinh', 10, 60, 'MWC-9262'),
('Dep Nam MWC 9253', 235000, 'MWC', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1572099135085-0e3fdaa0485c?w=500&h=500&fit=crop', 'Dep nam quai cheo chu X dinh kim loai, phong cach Nhat', 5, 50, 'MWC-9253'),
('Dep Flip Flop Nam', 120000, 'Generic', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop', 'Dep nam lop leo co dien, thoai mai hang ngay', 0, 80, 'FLIPFLOP-M001'),
('Dep Xo Ngon Nam Sport', 180000, 'Sport', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500&h=500&fit=crop', 'Dep xo ngon nam chat lieu cao su, ben bi', 8, 45, 'SPORT-M001'),
('Dep Pool Nam', 150000, 'Aqua', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1511886642585-9f2d1a0e5fa3?w=500&h=500&fit=crop', 'Dep boi nam chong nuoc, em chan', 0, 70, 'AQUA-M001'),
('Dep Ho Tro Nam', 280000, 'OrthoPlus', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1516139541169-a28f8fcac9fe?w=500&h=500&fit=crop', 'Dep ho tro chinh hang cho suc khoe doi chan', 15, 25, 'ORTHO-M001'),
('Dep Slide Nam Premium', 220000, 'Premium', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1572099135085-0e3fdaa0485c?w=500&h=500&fit=crop', 'Dep slide nam chat lieu cao cap, ben lau', 10, 35, 'PREMIUM-M001'),
('Dep Sandal Nam Casual', 190000, 'Casual', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1605348532760-376a49c6e149?w=500&h=500&fit=crop', 'Dep sandal nam phong cach casual, de phoi', 5, 55, 'CASUAL-M001'),
('Dep Nam Cork', 260000, 'Cork', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1573022556802-ffd0a93c7b65?w=500&h=500&fit=crop', 'Dep quai dan nam voi lop dem cork thoai mai', 12, 30, 'CORK-M001'),
('Dep Xo Ngon Thoai Mai', 165000, 'ComfyFoot', 'Nam', 'dep-nam', 'https://images.unsplash.com/photo-1566226039267-a6f0db51e245?w=500&h=500&fit=crop', 'Dep nam thoai mai cho mac ca ngay', 0, 65, 'COMFY-M001');

-- SANDAL NAM
INSERT INTO products (name, price, brand, gender, category, image, description, discount, quantity, sku) VALUES
('Sandal Nam MWC 7103', 295000, 'MWC', 'Nam', 'sandal-nam', 'https://images.unsplash.com/photo-1559412529-e41ab59b60af?w=500&h=500&fit=crop', 'Sandal nam quai ngang ban to phoi quai hau co khoa gai', 10, 40, 'MWC-7103'),
('Sandal Nam MWC 7106', 295000, 'MWC', 'Nam', 'sandal-nam', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop', 'Sandal nam quai ban to vat cheo, thoai mai', 10, 38, 'MWC-7106'),
('Sandal Mountain Nam', 350000, 'Trekking', 'Nam', 'sandal-nam', 'https://images.unsplash.com/photo-1556821552-5f394e324a02?w=500&h=500&fit=crop', 'Sandal leo nui nam chiu luc tot, ben bi', 12, 22, 'TREK-M001'),
('Sandal Ngoai Troi Nam', 320000, 'Adventure', 'Nam', 'sandal-nam', 'https://images.unsplash.com/photo-1562183241-bd70ba538601?w=500&h=500&fit=crop', 'Sandal ngoai troi nam phu hop cho cac hoat dong linh hoat', 8, 28, 'ADV-M001'),
('Sandal Xo Ngon Nam Leather', 280000, 'Leather', 'Nam', 'sandal-nam', 'https://images.unsplash.com/photo-1544167567-c90caebb72e3?w=500&h=500&fit=crop', 'Sandal nam da that, thanh lich va ben bi', 15, 32, 'LEATHER-M001'),
('Sandal Nam Casual', 240000, 'Casual', 'Nam', 'sandal-nam', 'https://images.unsplash.com/photo-1526309818098-8c3b37dd09cb?w=500&h=500&fit=crop', 'Sandal nam quai kep, de dang di va thao', 5, 50, 'CAUSAL-SD-M001'),
('Sandal Nam Beo Comfort', 260000, 'Comfort', 'Nam', 'sandal-nam', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop', 'Sandal nam voi cong nghe beo dem thoai mai', 10, 35, 'COMFORT-SD-M001'),
('Sandal Nam Beach', 190000, 'Beach', 'Nam', 'sandal-nam', 'https://images.unsplash.com/photo-1559414148-2f5810628f8c?w=500&h=500&fit=crop', 'Sandal nam phu hop di bien, de lau sach', 0, 60, 'BEACH-M001'),
('Sandal Nam Smart', 275000, 'Smart', 'Nam', 'sandal-nam', 'https://images.unsplash.com/photo-1523869335684-c52646db42c3?w=500&h=500&fit=crop', 'Sandal nam kieu dang thong minh, phu hop mac thuong ngay', 12, 25, 'SMART-SD-M001'),
('Sandal Nam Premium', 310000, 'Premium', 'Nam', 'sandal-nam', 'https://images.unsplash.com/photo-1555692726-fc4fc4f3f98f?w=500&h=500&fit=crop', 'Sandal nam chat lieu cao cap, sang trong', 20, 20, 'PREMIUM-SD-M001');

-- GIAY CAO GOT NU
INSERT INTO products (name, price, brand, gender, category, image, description, discount, quantity, sku) VALUES
('Giay Cao Got Nu MWC G268', 315000, 'MWC', 'Nu', 'giay-cao-got', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop', 'Giay bup be got em, no xinh phoi quai ngang thanh lich', 8, 40, 'MWC-G268'),
('Giay Cao Got Nu MWC G317', 275000, 'MWC', 'Nu', 'giay-cao-got', 'https://images.unsplash.com/photo-1494866388000-ecc6cc2e08c5?w=500&h=500&fit=crop', 'Sandal de duc 12cm sieu hack dang, quai ngang thanh lich', 10, 35, 'MWC-G317'),
('Giay Cao Got Nu MWC G345', 235000, 'MWC', 'Nu', 'giay-cao-got', 'https://images.unsplash.com/photo-1560343676-04071c5f467b?w=500&h=500&fit=crop', 'Giay cao got 5cm, mui vuong, quai manh dinh da bac', 5, 32, 'MWC-G345'),
('Giay Cao Got Nu MWC G322', 225000, 'MWC', 'Nu', 'giay-cao-got', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=500&fit=crop', 'Sandal nu 7P, quai ngang hoa tiet xoan thanh manh', 0, 45, 'MWC-G322'),
('Giay Cao Got Nu MWC G347', 250000, 'MWC', 'Nu', 'giay-cao-got', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=500&fit=crop', 'Giay got vuong 7P dang Slingback, mui nhon phoi no tieu thu', 8, 28, 'MWC-G347'),
('Giay Cao Got Nu MWC G296', 235000, 'MWC', 'Nu', 'giay-cao-got', 'https://images.unsplash.com/photo-1520099002409-ddfb91e8f8e6?w=500&h=500&fit=crop', 'Dep cao got guoc mule ho got 5P, quai da ban to mem min', 8, 33, 'MWC-G296'),
('Giay Cao Got Nu Slingback', 380000, 'Premium', 'Nu', 'giay-cao-got', 'https://images.unsplash.com/photo-1513895537439-4e3c526c0b00?w=500&h=500&fit=crop', 'Giay cao got slingback cao cap, de dang di chuyen', 15, 20, 'PREMIUM-CG-001'),
('Giay Cao Got Nu Den', 320000, 'Classic', 'Nu', 'giay-cao-got', 'https://images.unsplash.com/photo-1581101297235-2e2e0f9d2b56?w=500&h=500&fit=crop', 'Giay cao got den kinh dien, thanh lich moi dip', 12, 25, 'CLASSIC-CG-001'),
('Giay Cao Got Nu Hanoi', 290000, 'Hanoi Design', 'Nu', 'giay-cao-got', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop', 'Giay cao got thiet ke doc dao, phu hop du tiec', 10, 30, 'HANOI-CG-001'),
('Giay Cao Got Nu TStrap', 340000, 'TStrap', 'Nu', 'giay-cao-got', 'https://images.unsplash.com/photo-1603487180144-58a86405d5b5?w=500&h=500&fit=crop', 'Giay cao got T-strap, thiet ke hien dai va nu tinh', 18, 22, 'TSTRAP-CG-001');

-- GIAY THE THAO NU
INSERT INTO products (name, price, brand, gender, category, image, description, discount, quantity, sku) VALUES
('Giay The Thao Nu MWC A397', 345000, 'MWC', 'Nu', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1542219550-37153d35c823?w=500&h=500&fit=crop', 'Giay the thao nu dang sneaker phoi vien tre khoe, ton dang', 12, 50, 'MWC-A397'),
('Giay The Thao Nu Nike', 420000, 'Nike', 'Nu', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop', 'Giay chay bo nu cong nghe toi tan, em chan', 18, 35, 'NIKE-F001'),
('Giay Adidas Nu Running', 410000, 'Adidas', 'Nu', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1556906781-9a412961b28c?w=500&h=500&fit=crop', 'Giay adidas nu chay bo, thoai mai ca ngay', 15, 40, 'ADIDAS-F001'),
('Giay The Thao Nu Casual', 320000, 'Generic', 'Nu', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1525967811867-fd3aa5a3fb04?w=500&h=500&fit=crop', 'Giay the thao nu casual thoai mai, phu hop mac hang ngay', 8, 60, 'CASUAL-F001'),
('Giay Basketball Nu', 450000, 'Basketball', 'Nu', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500&h=500&fit=crop', 'Giay bong ro nu chat luong cao, chong va dap', 20, 25, 'BBALL-F001'),
('Giay Tennis Nu', 380000, 'Tennis', 'Nu', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop', 'Giay tennis nu co do bam tot, ben bi', 12, 30, 'TENNIS-F001'),
('Giay Yoga Nu', 250000, 'Yoga', 'Nu', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop', 'Giay yoga nu nhe va mem, thoai mai cho cac bai tap', 5, 55, 'YOGA-F001'),
('Giay The Thao Nu Puma', 360000, 'Puma', 'Nu', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=500&fit=crop', 'Giay puma nu dang kinh dien, ben va thoai mai', 10, 45, 'PUMA-F001'),
('Giay The Thao Nu Asics', 430000, 'Asics', 'Nu', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1542219550-37153d35c823?w=500&h=500&fit=crop', 'Giay asics nu cong nghe dem cai tien, chay bo thoai mai', 16, 28, 'ASICS-F001'),
('Giay The Thao Nu New Balance', 400000, 'New Balance', 'Nu', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop', 'Giay the thao nu New Balance, phu hop cho the thao', 14, 32, 'NB-F001');

-- SANDAL NU
INSERT INTO products (name, price, brand, gender, category, image, description, discount, quantity, sku) VALUES
('Dep Nu MWC 8683', 195000, 'MWC', 'Nu', 'sandal-nu', 'https://images.unsplash.com/photo-1572099135085-0e3fdaa0485c?w=500&h=500&fit=crop', 'Dep nu hai quai ngang dan cai nhe em, nu tinh', 5, 70, 'MWC-8683'),
('Dep Nu MWC 8673', 125000, 'MWC', 'Nu', 'sandal-nu', 'https://images.unsplash.com/photo-1576428773550-2173dba999ef?w=500&h=500&fit=crop', 'Dep nu quai dan phoi khuyen vang dong sang trong', 0, 80, 'MWC-8673'),
('Dep Nu MWC 8687', 195000, 'MWC', 'Nu', 'sandal-nu', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop', 'Dep sandal de duc gan sticker gau xinh, tre trung', 10, 55, 'MWC-8687'),
('Sandal Nu MWC E208', 215000, 'MWC', 'Nu', 'sandal-nu', 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500&h=500&fit=crop', 'Sandal nu quai ngang cheo phoi xo ngon thanh lich', 8, 45, 'MWC-E208'),
('Sandal Nu MWC E215', 295000, 'MWC', 'Nu', 'sandal-nu', 'https://images.unsplash.com/photo-1544167567-c90caebb72e3?w=500&h=500&fit=crop', 'Sandal quai kep chu V thanh lich, di hoc di choi di bien', 12, 35, 'MWC-E215'),
('Dep Flip Flop Nu', 110000, 'Summer', 'Nu', 'sandal-nu', 'https://images.unsplash.com/photo-1566226039267-a6f0db51e245?w=500&h=500&fit=crop', 'Dep lop leo nu nhe va thoai mai mac hang ngay', 0, 90, 'SUMMER-F001'),
('Dep Xo Ngon Nu', 155000, 'Casual', 'Nu', 'sandal-nu', 'https://images.unsplash.com/photo-1572099135085-0e3fdaa0485c?w=500&h=500&fit=crop', 'Dep xo ngon nu voi cac mau sac xinh xan', 5, 65, 'CASUAL-FD-001'),
('Sandal Nu Ngoai Troi', 240000, 'Outdoor', 'Nu', 'sandal-nu', 'https://images.unsplash.com/photo-1562183241-bd70ba538601?w=500&h=500&fit=crop', 'Sandal nu phu hop cho cac hoat dong ngoai troi', 10, 40, 'OUTDOOR-F001'),
('Sandal Nu Leather', 280000, 'Leather', 'Nu', 'sandal-nu', 'https://images.unsplash.com/photo-1526309818098-8c3b37dd09cb?w=500&h=500&fit=crop', 'Dep sandal nu da that ben dep va sang trong', 15, 30, 'LEATHER-FD-001'),
('Sandal Nu Comfort', 260000, 'Comfort', 'Nu', 'sandal-nu', 'https://images.unsplash.com/photo-1544167567-c90caebb72e3?w=500&h=500&fit=crop', 'Sandal nu voi dem em, phu hop di xe dap va thoai mai', 8, 50, 'COMFORT-FD-001');

-- Xac nhan insert
SELECT COUNT(*) as total_products FROM products;
SELECT category, COUNT(*) as count FROM products GROUP BY category;
SELECT CONCAT(category, ': ', COUNT(*), ' san pham') as thongke FROM products GROUP BY category;
