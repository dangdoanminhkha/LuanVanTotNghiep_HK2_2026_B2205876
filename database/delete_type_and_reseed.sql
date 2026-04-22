USE shoestore;

-- Xóa cột type khỏi products
ALTER TABLE products DROP COLUMN type;

-- Xóa tất cả sản phẩm cũ
DELETE FROM products;

-- Thêm sản phẩm mới (10 mỗi danh mục = 60 sản phẩm)

-- ===== GIÀY THỂ THAO NAM (10) =====
INSERT INTO products (name, price, brand, gender, category, image, description, discount) VALUES
('Nike Air Max 90 Nam', 2590000, 'Nike', 'nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'Giày thể thao Nike Air Max 90 với đệm khí nổi tiếng', 10),
('Adidas Ultraboost 22 Nam', 4590000, 'Adidas', 'nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop', 'Công nghệ Boost năng lượng tối ưu', 15),
('Puma RS-X Nam', 2690000, 'Puma', 'nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1556821552-5374a32e1e6f?w=400&h=400&fit=crop', 'Thiết kế chunky retro cổ điển', 0),
('New Balance 574 Nam', 2490000, 'New Balance', 'nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&h=400&fit=crop', 'Giày thể thao với phong cách vintage', 5),
('Converse Chuck Taylor Nam', 1290000, 'Converse', 'nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop', 'Biểu tượng kinh điển của thời trang', 0),
('Vans Old Skool Nam', 1590000, 'Vans', 'nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'Giày Vans với stripe nổi tiếng', 8),
('Nike React Infinity Run Nam', 3490000, 'Nike', 'nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop', 'Giày chạy bộ với foam React', 12),
('Adidas Stan Smith Nam', 2290000, 'Adidas', 'nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1556821552-5374a32e1e6f?w=400&h=400&fit=crop', 'Giày tennis cổ điển tối giản', 0),
('Puma Velocity Nitro Nam', 2990000, 'Puma', 'nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&h=400&fit=crop', 'Công nghệ Nitro foam nhẹ nhàng', 10),
('Asics Gel-Lyte III Nam', 2890000, 'Asics', 'nam', 'giay-the-thao-nam', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop', 'Giày chạy bộ huyền thoại', 7),

-- ===== DÉP NAM (10) =====
('Adidas Adilette Comfort Nam', 890000, 'Adidas', 'nam', 'dep-nam', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'Dép nam thoải mái với đệm Cloudfoam', 0),
('Nike Benassi JDI Nam', 790000, 'Nike', 'nam', 'dep-nam', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop', 'Dép nam đơn giản và nhẹ nhàng', 5),
('Puma Leadcat Nam', 690000, 'Puma', 'nam', 'dep-nam', 'https://images.unsplash.com/photo-1556821552-5374a32e1e6f?w=400&h=400&fit=crop', 'Dép nam thời trang phổ biến', 0),
('Havaianas Top Nam', 590000, 'Havaianas', 'nam', 'dep-nam', 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&h=400&fit=crop', 'Dép tổ ong nổi tiếng', 8),
('Crocs Classic Nam', 990000, 'Crocs', 'nam', 'dep-nam', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop', 'Dép crocs thoáng khí', 10),
('Birkenstock Boston Nam', 1290000, 'Birkenstock', 'nam', 'dep-nam', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'Dép y tế chất lượng cao', 0),
('Skechers Go Max Nam', 890000, 'Skechers', 'nam', 'dep-nam', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop', 'Dép nam với công nghệ Memory Foam', 6),
('Hush Puppies Nam', 1090000, 'Hush Puppies', 'nam', 'dep-nam', 'https://images.unsplash.com/photo-1556821552-5374a32e1e6f?w=400&h=400&fit=crop', 'Dép nam thoải mái đi mọi lúc', 0),
('Scholl Biomechanics Nam', 1190000, 'Scholl', 'nam', 'dep-nam', 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&h=400&fit=crop', 'Dép nam hỗ trợ sinh học', 4),
('Ipanema Nam', 690000, 'Ipanema', 'nam', 'dep-nam', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop', 'Dép nam Brazil chất lượng', 0),

-- ===== SANDAL NAM (10) =====
('Nike Sunray Adjust Nam', 1390000, 'Nike', 'nam', 'sandal-nam', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'Sandal nam chống nước', 0),
('Adidas Adilette Sandal Nam', 1290000, 'Adidas', 'nam', 'sandal-nam', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop', 'Sandal nam thể thao', 5),
('Skechers Relaxed Fit Nam', 1190000, 'Skechers', 'nam', 'sandal-nam', 'https://images.unsplash.com/photo-1556821552-5374a32e1e6f?w=400&h=400&fit=crop', 'Sandal nam với Memory Foam', 8),
('Birkenstock Arizona Nam', 1590000, 'Birkenstock', 'nam', 'sandal-nam', 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&h=400&fit=crop', 'Sandal nam kinh điển', 0),
('Teva Flatform Nam', 1290000, 'Teva', 'nam', 'sandal-nam', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop', 'Sandal nam ngoài trời', 10),
('Keen Newport Nam', 1690000, 'Keen', 'nam', 'sandal-nam', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'Sandal nam bảo vệ toàn diện', 6),
('Clarks Sandal Nam', 1390000, 'Clarks', 'nam', 'sandal-nam', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop', 'Sandal nam cao cấp', 0),
('Merrell Kahuna Nam', 1490000, 'Merrell', 'nam', 'sandal-nam', 'https://images.unsplash.com/photo-1556821552-5374a32e1e6f?w=400&h=400&fit=crop', 'Sandal nam thể thao', 7),
('Salomon Techamphibian Nam', 1890000, 'Salomon', 'nam', 'sandal-nam', 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&h=400&fit=crop', 'Sandal nam đa năng', 0),
('Regatta Sandal Nam', 1090000, 'Regatta', 'nam', 'sandal-nam', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop', 'Sandal nam bền bỉ', 5),

-- ===== GIÀY CAO GÓT NỮ (10) =====
('Salvatore Ferragamo Kitten Nữ', 3890000, 'Salvatore Ferragamo', 'nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'Giày cao gót 5cm kinh điển', 0),
('Jimmy Choo Romy Nữ', 5290000, 'Jimmy Choo', 'nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop', 'Giày cao gót 10cm sang trọng', 8),
('Christian Louboutin Pigalle Nữ', 7890000, 'Christian Louboutin', 'nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1556821552-5374a32e1e6f?w=400&h=400&fit=crop', 'Giày cao gót huyền thoại', 0),
('Manolo Blahnik Hangisi Nữ', 6290000, 'Manolo Blahnik', 'nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&h=400&fit=crop', 'Giày cao gót 10cm đính đá', 5),
('Prada Saffiano Nữ', 4890000, 'Prada', 'nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop', 'Giày cao gót đơn giản sang trọng', 10),
('Gucci Marmont Nữ', 5690000, 'Gucci', 'nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'Giày cao gót với logo GG', 6),
('Louis Vuitton Pumps Nữ', 6090000, 'Louis Vuitton', 'nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop', 'Giày cao gót monogram', 0),
('Valentino Rockstud Nữ', 5490000, 'Valentino', 'nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1556821552-5374a32e1e6f?w=400&h=400&fit=crop', 'Giày cao gót đính đinh tán', 7),
('Gianvito Rossi Pumps Nữ', 4690000, 'Gianvito Rossi', 'nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&h=400&fit=crop', 'Giày cao gót 9cm thoải mái', 0),
('Sergio Rossi Sandal Nữ', 3990000, 'Sergio Rossi', 'nữ', 'giay-cao-got', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop', 'Giày cao gót Italia', 4),

-- ===== GIÀY THỂ THAO NỮ (10) =====
('Nike Air Max 90 Nữ', 2590000, 'Nike', 'nữ', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'Giày thể thao Nike nữ cổ điển', 10),
('Adidas Ultraboost 22 Nữ', 4590000, 'Adidas', 'nữ', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop', 'Giày chạy bộ nữ công nghệ Boost', 15),
('Puma RS-X Nữ', 2690000, 'Puma', 'nữ', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1556821552-5374a32e1e6f?w=400&h=400&fit=crop', 'Giày thể thao nữ retro', 0),
('New Balance 574 Nữ', 2490000, 'New Balance', 'nữ', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&h=400&fit=crop', 'Giày thể thao nữ thoải mái', 5),
('Converse Chuck Taylor Nữ', 1290000, 'Converse', 'nữ', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop', 'Giày Converse nữ kinh điển', 0),
('Vans Old Skool Nữ', 1590000, 'Vans', 'nữ', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'Giày Vans nữ classic', 8),
('Nike React Infinity Nữ', 3490000, 'Nike', 'nữ', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop', 'Giày chạy nữ React foam', 12),
('Adidas Stan Smith Nữ', 2290000, 'Adidas', 'nữ', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1556821552-5374a32e1e6f?w=400&h=400&fit=crop', 'Giày tennis nữ tối giản', 0),
('Puma Velocity Nitro Nữ', 2990000, 'Puma', 'nữ', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&h=400&fit=crop', 'Giày chạy nữ Nitro foam', 10),
('Asics Gel-Lyte III Nữ', 2890000, 'Asics', 'nữ', 'giay-the-thao-nu', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop', 'Giày chạy nữ huyền thoại', 7),

-- ===== SANDAL NỮ (10) =====
('Nike Sunray Adjust Nữ', 1390000, 'Nike', 'nữ', 'sandal-nu', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'Sandal nữ chống nước', 0),
('Adidas Adilette Sandal Nữ', 1290000, 'Adidas', 'nữ', 'sandal-nu', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop', 'Sandal nữ thể thao', 5),
('Skechers Relaxed Fit Nữ', 1190000, 'Skechers', 'nữ', 'sandal-nu', 'https://images.unsplash.com/photo-1556821552-5374a32e1e6f?w=400&h=400&fit=crop', 'Sandal nữ với Memory Foam', 8),
('Birkenstock Arizona Nữ', 1590000, 'Birkenstock', 'nữ', 'sandal-nu', 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&h=400&fit=crop', 'Sandal nữ kinh điển', 0),
('Teva Flatform Nữ', 1290000, 'Teva', 'nữ', 'sandal-nu', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop', 'Sandal nữ ngoài trời', 10),
('Keen Newport Nữ', 1690000, 'Keen', 'nữ', 'sandal-nu', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'Sandal nữ bảo vệ toàn diện', 6),
('Clarks Sandal Nữ', 1390000, 'Clarks', 'nữ', 'sandal-nu', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop', 'Sandal nữ cao cấp', 0),
('Merrell Kahuna Nữ', 1490000, 'Merrell', 'nữ', 'sandal-nu', 'https://images.unsplash.com/photo-1556821552-5374a32e1e6f?w=400&h=400&fit=crop', 'Sandal nữ thể thao', 7),
('Salomon Techamphibian Nữ', 1890000, 'Salomon', 'nữ', 'sandal-nu', 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&h=400&fit=crop', 'Sandal nữ đa năng', 0),
('Regatta Sandal Nữ', 1090000, 'Regatta', 'nữ', 'sandal-nu', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop', 'Sandal nữ bền bỉ', 5);
