USE shoestore;

-- Thêm tài khoản admin mặc định (password: admin123)
INSERT INTO users (username, password, role) VALUES
('admin', '$2a$10$YJZv4rKx3gqJxK6K6F3LHOiU7vYvZQ7zXZ8GqK9W8F9Y3Q7Z8F9Y3', 'admin'),
('shipper1', '$2a$10$YJZv4rKx3gqJxK6K6F3LHOiU7vYvZQ7zXZ8GqK9W8F9Y3Q7Z8F9Y3', 'shipper');

-- Thêm dữ liệu mẫu sản phẩm giày (30 sản phẩm)
INSERT INTO products (name, price, brand, type, image, description) VALUES
-- Nike
('Nike Air Max 90', 2590000, 'Nike', 'Sneakers', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop', 'Giày thể thao Nike Air Max 90 với đệm khí nổi tiếng, thiết kế cổ điển'),
('Nike Air Force 1', 2390000, 'Nike', 'Sneakers', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=300&h=300&fit=crop', 'Nike Air Force 1 - biểu tượng của văn hóa streetwear'),
('Nike React Infinity Run', 3490000, 'Nike', 'Running', 'https://images.unsplash.com/photo-1556821552-5374a32e1e6f?w=300&h=300&fit=crop', 'Giày chạy bộ với công nghệ React foam êm ái'),
('Nike Pegasus 40', 3290000, 'Nike', 'Running', 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=300&h=300&fit=crop', 'Giày chạy bộ Pegasus thế hệ 40 với đệm Air Zoom'),
('Nike Court Vision Low', 1890000, 'Nike', 'Casual', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300&h=300&fit=crop', 'Giày casual lấy cảm hứng từ bóng rổ cổ điển'),

-- Adidas
('Adidas Ultraboost 22', 4590000, 'Adidas', 'Running', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop', 'Giày chạy bộ cao cấp với đệm Boost năng lượng'),
('Adidas Stan Smith', 2290000, 'Adidas', 'Casual', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=300&h=300&fit=crop', 'Giày tennis cổ điển với thiết kế tối giản'),
('Adidas Superstar', 2190000, 'Adidas', 'Sneakers', 'https://images.unsplash.com/photo-1556821552-5374a32e1e6f?w=300&h=300&fit=crop', 'Giày Superstar huyền thoại với mũi shell toe'),
('Adidas NMD R1', 3790000, 'Adidas', 'Sneakers', 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=300&h=300&fit=crop', 'Giày NMD kết hợp công nghệ Boost và thiết kế hiện đại'),
('Adidas Samba OG', 2490000, 'Adidas', 'Casual', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300&h=300&fit=crop', 'Giày Samba cổ điển dành cho bóng đá trong nhà'),

-- Puma
('Puma Suede Classic', 1890000, 'Puma', 'Casual', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop', 'Giày Suede cổ điển với chất liệu da lộn'),
('Puma RS-X', 2690000, 'Puma', 'Sneakers', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=300&h=300&fit=crop', 'Giày RS-X với thiết kế chunky đậm chất retro'),
('Puma Velocity Nitro', 2990000, 'Puma', 'Running', 'https://images.unsplash.com/photo-1556821552-5374a32e1e6f?w=300&h=300&fit=crop', 'Giày chạy bộ với công nghệ Nitro foam'),
('Puma Cali Sport', 2290000, 'Puma', 'Casual', 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=300&h=300&fit=crop', 'Giày lifestyle Cali với phong cách California'),
('Puma MB.01', 3290000, 'Puma', 'Basketball', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300&h=300&fit=crop', 'Giày bóng rổ signature của LaMelo Ball'),

-- Converse
('Converse Chuck Taylor All Star', 1290000, 'Converse', 'Casual', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop', 'Giày Converse cổ điển biểu tượng thời trang'),
('Converse Chuck 70', 1790000, 'Converse', 'Casual', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=300&h=300&fit=crop', 'Phiên bản cao cấp của Chuck Taylor với chất liệu tốt hơn'),
('Converse Run Star Hike', 2190000, 'Converse', 'Platform', 'https://images.unsplash.com/photo-1556821552-5374a32e1e6f?w=300&h=300&fit=crop', 'Giày Converse với đế platform độc đáo'),
('Converse One Star Pro', 1590000, 'Converse', 'Skateboard', 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=300&h=300&fit=crop', 'Giày skate One Star với độ bền cao'),
('Converse All Star Pro BB', 2490000, 'Converse', 'Basketball', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300&h=300&fit=crop', 'Giày bóng rổ hiện đại từ Converse'),

-- Vans
('Vans Old Skool', 1590000, 'Vans', 'Skateboard', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop', 'Giày Vans Old Skool cổ điển với stripe nổi tiếng'),
('Vans Authentic', 1290000, 'Vans', 'Casual', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=300&h=300&fit=crop', 'Giày Vans Authentic đơn giản và linh hoạt'),
('Vans Sk8-Hi', 1790000, 'Vans', 'Skateboard', 'https://images.unsplash.com/photo-1556821552-5374a32e1e6f?w=300&h=300&fit=crop', 'Giày cổ cao Sk8-Hi với độ hỗ trợ tốt'),
('Vans Slip-On', 1390000, 'Vans', 'Casual', 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=300&h=300&fit=crop', 'Giày Vans Slip-On tiện lợi không dây'),
('Vans UltraRange EXO', 2190000, 'Vans', 'Outdoor', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300&h=300&fit=crop', 'Giày outdoor nhẹ nhàng và linh hoạt'),

-- New Balance
('New Balance 574', 2490000, 'New Balance', 'Casual', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop', 'Giày New Balance 574 cổ điển với phong cách retro'),
('New Balance 990v5', 4990000, 'New Balance', 'Sneakers', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=300&h=300&fit=crop', 'Giày 990v5 cao cấp Made in USA'),
('New Balance Fresh Foam 1080', 3790000, 'New Balance', 'Running', 'https://images.unsplash.com/photo-1556821552-5374a32e1e6f?w=300&h=300&fit=crop', 'Giày chạy bộ với đệm Fresh Foam êm ái'),
('New Balance 327', 2290000, 'New Balance', 'Casual', 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=300&h=300&fit=crop', 'Giày 327 với thiết kế retro hiện đại'),
('New Balance 2002R', 3490000, 'New Balance', 'Sneakers', 'https://via.placeholder.com/300x300.png?text=NB+2002R', 'Giày 2002R với công nghệ N-ergy và Abzorb');
