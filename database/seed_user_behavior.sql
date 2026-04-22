-- Seed dữ liệu hành vi người dùng để test ML recommendations
-- Dữ liệu này giả lập các hành động: view, add_to_cart, purchase

USE shoestore;

-- User 1: Thích Nike & Adidas Running
INSERT INTO user_behavior_logs (user_id, action, product_id, timestamp) VALUES
(1, 'view', 1, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(1, 'view', 2, DATE_SUB(NOW(), INTERVAL 9 DAY)),
(1, 'view', 3, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(1, 'add_to_cart', 1, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(1, 'view', 4, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(1, 'add_to_cart', 3, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(1, 'view', 6, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 'view', 7, DATE_SUB(NOW(), INTERVAL 4 DAY));

-- User 2: Thích Casual & Sneakers
INSERT INTO user_behavior_logs (user_id, action, product_id, timestamp) VALUES
(2, 'view', 5, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(2, 'view', 8, DATE_SUB(NOW(), INTERVAL 9 DAY)),
(2, 'add_to_cart', 5, DATE_SUB(NOW(), INTERVAL 9 DAY)),
(2, 'view', 9, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(2, 'view', 12, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(2, 'add_to_cart', 8, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(2, 'view', 15, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 'view', 16, DATE_SUB(NOW(), INTERVAL 3 DAY));

-- User 3: Thích Sneakers & Basketball
INSERT INTO user_behavior_logs (user_id, action, product_id, timestamp) VALUES
(3, 'view', 2, DATE_SUB(NOW(), INTERVAL 9 DAY)),
(3, 'view', 8, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(3, 'add_to_cart', 2, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(3, 'view', 15, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(3, 'view', 20, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(3, 'add_to_cart', 15, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(3, 'view', 10, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(3, 'view', 11, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- User 4: Thích Nike & Converse
INSERT INTO user_behavior_logs (user_id, action, product_id, timestamp) VALUES
(4, 'view', 1, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(4, 'view', 2, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(4, 'view', 16, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(4, 'add_to_cart', 1, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(4, 'view', 17, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(4, 'view', 18, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4, 'add_to_cart', 16, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(4, 'view', 19, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- User 5: Thích Adidas & Puma
INSERT INTO user_behavior_logs (user_id, action, product_id, timestamp) VALUES
(5, 'view', 6, DATE_SUB(NOW(), INTERVAL 9 DAY)),
(5, 'view', 7, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(5, 'add_to_cart', 6, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(5, 'view', 11, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(5, 'view', 12, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(5, 'view', 13, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(5, 'add_to_cart', 11, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(5, 'view', 10, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- User 6: Thích Vans & Skateboard
INSERT INTO user_behavior_logs (user_id, action, product_id, timestamp) VALUES
(6, 'view', 21, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(6, 'view', 22, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(6, 'add_to_cart', 21, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(6, 'view', 23, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(6, 'view', 24, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(6, 'add_to_cart', 22, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(6, 'view', 25, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(6, 'view', 19, DATE_SUB(NOW(), INTERVAL 1 DAY));

-- User 7: Thích New Balance
INSERT INTO user_behavior_logs (user_id, action, product_id, timestamp) VALUES
(7, 'view', 26, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(7, 'view', 27, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(7, 'add_to_cart', 26, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(7, 'view', 28, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(7, 'view', 29, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(7, 'add_to_cart', 27, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(7, 'view', 30, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(7, 'view', 1, DATE_SUB(NOW(), INTERVAL 1 DAY));

-- User 8: Thích Running shoes
INSERT INTO user_behavior_logs (user_id, action, product_id, timestamp) VALUES
(8, 'view', 3, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(8, 'view', 4, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(8, 'add_to_cart', 3, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(8, 'view', 6, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(8, 'view', 28, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(8, 'add_to_cart', 4, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(8, 'view', 7, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(8, 'view', 9, NOW());

-- User 9: Diverse preferences
INSERT INTO user_behavior_logs (user_id, action, product_id, timestamp) VALUES
(9, 'view', 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(9, 'view', 8, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(9, 'view', 15, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(9, 'add_to_cart', 8, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(9, 'view', 22, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(9, 'view', 26, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(9, 'add_to_cart', 15, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(9, 'view', 3, NOW());

-- User 10: Diverse but prefers casual
INSERT INTO user_behavior_logs (user_id, action, product_id, timestamp) VALUES
(10, 'view', 5, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(10, 'view', 9, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(10, 'add_to_cart', 5, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(10, 'view', 12, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(10, 'view', 17, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(10, 'view', 24, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(10, 'add_to_cart', 9, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(10, 'view', 20, NOW());

-- Additional views to increase data density
INSERT INTO user_behavior_logs (user_id, action, product_id, timestamp) VALUES
(1, 'view', 10, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 'view', 15, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 'view', 20, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 'view', 25, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 'view', 25, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 'view', 16, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(6, 'view', 10, NOW()),
(7, 'view', 5, NOW()),
(8, 'view', 12, NOW()),
(9, 'view', 13, NOW());

-- More purchase-like patterns (multiple items from same user)
INSERT INTO user_behavior_logs (user_id, action, product_id, timestamp) VALUES
(1, 'add_to_cart', 4, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 'add_to_cart', 12, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 'add_to_cart', 20, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, 'add_to_cart', 17, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(5, 'add_to_cart', 13, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(6, 'add_to_cart', 24, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(7, 'add_to_cart', 29, NOW()),
(8, 'add_to_cart', 28, NOW()),
(9, 'add_to_cart', 22, NOW()),
(10, 'add_to_cart', 17, NOW());
