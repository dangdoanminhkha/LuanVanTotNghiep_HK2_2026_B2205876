-- Seed sample data for shoestore
-- Purpose: insert 2-3 demo rows per table for quick local testing
-- USE shoestore;
SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS=0;

-- Cleanup old sample rows (if re-running seed)
DELETE FROM notifications WHERE title LIKE 'SAMPLE:%';
DELETE FROM order_returns WHERE order_id IN (SELECT id FROM orders WHERE note LIKE '[SAMPLE_SEED]%');
DELETE FROM order_status_logs WHERE order_id IN (SELECT id FROM orders WHERE note LIKE '[SAMPLE_SEED]%');
DELETE FROM reviews WHERE general_comment LIKE 'SAMPLE:%';
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE note LIKE '[SAMPLE_SEED]%');
DELETE FROM inventory_logs WHERE reference_code LIKE 'SAMPLE-%';
DELETE FROM user_behavior_logs WHERE session_id LIKE 'sample-session-%';
DELETE FROM cart_items WHERE session_id LIKE 'sample-session-%';
DELETE FROM favorites WHERE session_id LIKE 'sample-session-%';
DELETE FROM email_verifications WHERE token LIKE 'sample-token-%';
DELETE FROM user_voucher_usage WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'sample.%@shoestore.local');
DELETE FROM orders WHERE note LIKE '[SAMPLE_SEED]%';
DELETE FROM product_variants WHERE sku LIKE 'SAMPLE-%';
DELETE FROM products WHERE name LIKE 'SAMPLE %';
DELETE FROM vouchers WHERE code LIKE 'SAMPLE%';
DELETE FROM user_addresses WHERE address_detail LIKE 'SAMPLE %';
DELETE FROM users WHERE email LIKE 'sample.%@shoestore.local';
DELETE FROM colors WHERE color LIKE 'SampleColor%';
DELETE FROM categories WHERE slug LIKE 'sample-cat-%';
DELETE FROM brands WHERE slug LIKE 'sample-brand-%';

SET FOREIGN_KEY_CHECKS=1;

-- 1) Base tables
INSERT INTO brands (name, slug, logo, is_active, sort_order)
VALUES
  ('Sample Brand Alpha', 'sample-brand-alpha', '/uploads/brands/sample-alpha.png', 1, 1),
  ('Sample Brand Beta', 'sample-brand-beta', '/uploads/brands/sample-beta.png', 1, 2);

INSERT INTO categories (name, slug, gender_applicable, description, image, is_active, sort_order)
VALUES
  ('Sample Running', 'sample-cat-running', 'unisex', 'Danh muc mau cho giay running', '/uploads/categories/sample-running.jpg', 1, 1),
  ('Sample Lifestyle', 'sample-cat-lifestyle', 'unisex', 'Danh muc mau cho giay lifestyle', '/uploads/categories/sample-lifestyle.jpg', 1, 2),
  ('Sample Training', 'sample-cat-training', 'unisex', 'Danh muc mau cho giay training', '/uploads/categories/sample-training.jpg', 1, 3);

INSERT INTO colors (color, hex_code)
VALUES
  ('SampleColor Black', '#111111'),
  ('SampleColor White', '#F5F5F5'),
  ('SampleColor Red', '#D32F2F');

INSERT INTO users (email, password, is_verified, role, full_name, phone, gender, auth_provider, avatar_url)
VALUES
  ('sample.admin@shoestore.local', '$2b$10$sampleAdminHash', 1, 'admin', 'Sample Admin', '0900000001', 'Khác', 'email', '/uploads/avatars/sample-admin.png'),
  ('sample.customer@shoestore.local', '$2b$10$sampleCustomerHash', 1, 'customer', 'Sample Customer', '0900000002', 'Nam', 'email', '/uploads/avatars/sample-customer.png'),
  ('sample.shipper@shoestore.local', '$2b$10$sampleShipperHash', 1, 'shipper', 'Sample Shipper', '0900000003', 'Nữ', 'email', '/uploads/avatars/sample-shipper.png');

INSERT INTO vouchers (code, voucher_type, discount_amount, min_order_value, max_usage_per_user, total_usage_limit, current_usage, valid_from, valid_until, duration_days, description, is_active)
VALUES
  ('SAMPLE10K', 'discount', 10000, 200000, 2, 100, 0, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 30, 'Voucher giam 10k cho du lieu mau', 1),
  ('SAMPLEFREESHIP', 'free_shipping', NULL, 150000, 1, 50, 0, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY), 15, 'Voucher freeship cho du lieu mau', 1);

-- 2) Product and address
INSERT INTO products (name, price, brand_id, gender, tags, category_id, description, specification, discount, image)
VALUES
  (
    'SAMPLE Sneaker A',
    890000,
    (SELECT id FROM brands WHERE slug = 'sample-brand-alpha' LIMIT 1),
    'Nam',
    JSON_ARRAY('sample', 'running'),
    (SELECT id FROM categories WHERE slug = 'sample-cat-running' LIMIT 1),
    'San pham mau A',
    JSON_OBJECT('upper', 'mesh', 'outsole', 'rubber'),
    5,
    '/uploads/products/sample-a-main.jpg'
  ),
  (
    'SAMPLE Sneaker B',
    990000,
    (SELECT id FROM brands WHERE slug = 'sample-brand-beta' LIMIT 1),
    'Nữ',
    JSON_ARRAY('sample', 'lifestyle'),
    (SELECT id FROM categories WHERE slug = 'sample-cat-lifestyle' LIMIT 1),
    'San pham mau B',
    JSON_OBJECT('upper', 'knit', 'outsole', 'eva'),
    10,
    '/uploads/products/sample-b-main.jpg'
  ),
  (
    'SAMPLE Sneaker C',
    1090000,
    (SELECT id FROM brands WHERE slug = 'sample-brand-alpha' LIMIT 1),
    'Nam',
    JSON_ARRAY('sample', 'training'),
    (SELECT id FROM categories WHERE slug = 'sample-cat-training' LIMIT 1),
    'San pham mau C',
    JSON_OBJECT('upper', 'synthetic', 'outsole', 'phylon'),
    0,
    '/uploads/products/sample-c-main.jpg'
  );

INSERT INTO user_addresses (
  user_id, full_name, phone,
  province_code, province_name,
  district_code, district_name,
  ward_code, ward_name,
  address_detail, is_default
)
VALUES
  (
    (SELECT id FROM users WHERE email = 'sample.customer@shoestore.local' LIMIT 1),
    'Sample Customer',
    '0900000002',
    '92', 'Can Tho',
    '916', 'Ninh Kieu',
    '31123', 'An Hoa',
    'SAMPLE 12 Nguyen Van Cu, Ninh Kieu',
    1
  ),
  (
    (SELECT id FROM users WHERE email = 'sample.customer@shoestore.local' LIMIT 1),
    'Sample Customer Office',
    '0900000012',
    '92', 'Can Tho',
    '918', 'Cai Rang',
    '31201', 'Le Binh',
    'SAMPLE 88A Quang Trung, Cai Rang',
    0
  ),
  (
    (SELECT id FROM users WHERE email = 'sample.admin@shoestore.local' LIMIT 1),
    'Sample Admin',
    '0900000001',
    '79', 'Ho Chi Minh',
    '760', 'Quan 1',
    '26734', 'Ben Nghe',
    'SAMPLE 1 Le Loi, Quan 1',
    1
  );

INSERT INTO product_variants (product_id, quantity, sold, images, sku, color_id, size)
VALUES
  (
    (SELECT id FROM products WHERE name = 'SAMPLE Sneaker A' LIMIT 1),
    30,
    5,
    JSON_ARRAY('/uploads/products/sample-a-1.jpg', '/uploads/products/sample-a-2.jpg'),
    'SAMPLE-SNK-A-42-BLK',
    (SELECT id FROM colors WHERE color = 'SampleColor Black' LIMIT 1),
    '42'
  ),
  (
    (SELECT id FROM products WHERE name = 'SAMPLE Sneaker B' LIMIT 1),
    25,
    3,
    JSON_ARRAY('/uploads/products/sample-b-1.jpg', '/uploads/products/sample-b-2.jpg'),
    'SAMPLE-SNK-B-39-WHT',
    (SELECT id FROM colors WHERE color = 'SampleColor White' LIMIT 1),
    '39'
  ),
  (
    (SELECT id FROM products WHERE name = 'SAMPLE Sneaker C' LIMIT 1),
    20,
    1,
    JSON_ARRAY('/uploads/products/sample-c-1.jpg', '/uploads/products/sample-c-2.jpg'),
    'SAMPLE-SNK-C-41-RED',
    (SELECT id FROM colors WHERE color = 'SampleColor Red' LIMIT 1),
    '41'
  );

-- 3) Order flow tables
INSERT INTO orders (
  user_id, voucher_id, payment_method, payment_status,
  payment_ref, payment_bank, payment_transaction_no,
  note, total, discount_applied, status, retry_count, user_address_id
)
VALUES
  (
    (SELECT id FROM users WHERE email = 'sample.customer@shoestore.local' LIMIT 1),
    (SELECT id FROM vouchers WHERE code = 'SAMPLE10K' LIMIT 1),
    'cod', 'pending',
    'SAMPLE-PAY-001', NULL, NULL,
    '[SAMPLE_SEED] Don hang cho luong pending',
    880000, 10000, 'pending', 0,
    (SELECT id FROM user_addresses WHERE address_detail = 'SAMPLE 12 Nguyen Van Cu, Ninh Kieu' LIMIT 1)
  ),
  (
    (SELECT id FROM users WHERE email = 'sample.customer@shoestore.local' LIMIT 1),
    (SELECT id FROM vouchers WHERE code = 'SAMPLEFREESHIP' LIMIT 1),
    'vnpay', 'paid',
    'SAMPLE-PAY-002', 'NCB', 'SAMPLETXN002',
    '[SAMPLE_SEED] Don hang da giao',
    990000, 0, 'delivered', 0,
    (SELECT id FROM user_addresses WHERE address_detail = 'SAMPLE 88A Quang Trung, Cai Rang' LIMIT 1)
  ),
  (
    (SELECT id FROM users WHERE email = 'sample.customer@shoestore.local' LIMIT 1),
    NULL,
    'momo', 'refunded',
    'SAMPLE-PAY-003', 'MOMO', 'SAMPLETXN003',
    '[SAMPLE_SEED] Don hang dang yeu cau hoan',
    1090000, 0, 'return_requested', 1,
    (SELECT id FROM user_addresses WHERE address_detail = 'SAMPLE 12 Nguyen Van Cu, Ninh Kieu' LIMIT 1)
  );

INSERT INTO order_items (order_id, product_id, variant_id, size, color, quantity, price, is_ai_suggested)
VALUES
  (
    (SELECT id FROM orders WHERE payment_ref = 'SAMPLE-PAY-001' LIMIT 1),
    (SELECT id FROM products WHERE name = 'SAMPLE Sneaker A' LIMIT 1),
    (SELECT id FROM product_variants WHERE sku = 'SAMPLE-SNK-A-42-BLK' LIMIT 1),
    '42', 'Black', 1, 890000, 0
  ),
  (
    (SELECT id FROM orders WHERE payment_ref = 'SAMPLE-PAY-002' LIMIT 1),
    (SELECT id FROM products WHERE name = 'SAMPLE Sneaker B' LIMIT 1),
    (SELECT id FROM product_variants WHERE sku = 'SAMPLE-SNK-B-39-WHT' LIMIT 1),
    '39', 'White', 1, 990000, 1
  ),
  (
    (SELECT id FROM orders WHERE payment_ref = 'SAMPLE-PAY-003' LIMIT 1),
    (SELECT id FROM products WHERE name = 'SAMPLE Sneaker C' LIMIT 1),
    (SELECT id FROM product_variants WHERE sku = 'SAMPLE-SNK-C-41-RED' LIMIT 1),
    '41', 'Red', 1, 1090000, 0
  );

INSERT INTO reviews (user_id, admin_user_id, product_id, order_item_id, overall_rating, general_comment, reply_text, reply_at, images, liked_user_ids)
VALUES
  (
    (SELECT id FROM users WHERE email = 'sample.customer@shoestore.local' LIMIT 1),
    (SELECT id FROM users WHERE email = 'sample.admin@shoestore.local' LIMIT 1),
    (SELECT id FROM products WHERE name = 'SAMPLE Sneaker B' LIMIT 1),
    (SELECT oi.id FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.payment_ref = 'SAMPLE-PAY-002' LIMIT 1),
    4.5,
    'SAMPLE: San pham on trong tam gia',
    'Cam on ban da danh gia!',
    NOW(),
    JSON_ARRAY('/uploads/reviews/sample-review-1.jpg'),
    JSON_ARRAY((SELECT id FROM users WHERE email = 'sample.admin@shoestore.local' LIMIT 1))
  ),
  (
    (SELECT id FROM users WHERE email = 'sample.customer@shoestore.local' LIMIT 1),
    NULL,
    (SELECT id FROM products WHERE name = 'SAMPLE Sneaker C' LIMIT 1),
    (SELECT oi.id FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.payment_ref = 'SAMPLE-PAY-003' LIMIT 1),
    3.5,
    'SAMPLE: Mau dep nhung can doi size',
    NULL,
    NULL,
    JSON_ARRAY('/uploads/reviews/sample-review-2.jpg'),
    JSON_ARRAY()
  );

INSERT INTO email_verifications (user_id, token, expires_at, type)
VALUES
  ((SELECT id FROM users WHERE email = 'sample.customer@shoestore.local' LIMIT 1), 'sample-token-verify-customer', DATE_ADD(NOW(), INTERVAL 1 DAY), 'verify'),
  ((SELECT id FROM users WHERE email = 'sample.admin@shoestore.local' LIMIT 1), 'sample-token-reset-admin', DATE_ADD(NOW(), INTERVAL 2 HOUR), 'reset');

INSERT INTO favorites (user_id, session_id, product_id)
VALUES
  ((SELECT id FROM users WHERE email = 'sample.customer@shoestore.local' LIMIT 1), NULL, (SELECT id FROM products WHERE name = 'SAMPLE Sneaker A' LIMIT 1)),
  (NULL, 'sample-session-guest-01', (SELECT id FROM products WHERE name = 'SAMPLE Sneaker B' LIMIT 1));

INSERT INTO cart_items (user_id, session_id, product_id, quantity)
VALUES
  ((SELECT id FROM users WHERE email = 'sample.customer@shoestore.local' LIMIT 1), NULL, (SELECT id FROM products WHERE name = 'SAMPLE Sneaker C' LIMIT 1), 1),
  (NULL, 'sample-session-guest-01', (SELECT id FROM products WHERE name = 'SAMPLE Sneaker A' LIMIT 1), 2);

INSERT INTO user_behavior_logs (user_id, session_id, action, product_id, extra_info)
VALUES
  ((SELECT id FROM users WHERE email = 'sample.customer@shoestore.local' LIMIT 1), NULL, 'view', (SELECT id FROM products WHERE name = 'SAMPLE Sneaker A' LIMIT 1), JSON_OBJECT('seed', true, 'screen', 'product_detail')),
  ((SELECT id FROM users WHERE email = 'sample.customer@shoestore.local' LIMIT 1), NULL, 'add_to_cart', (SELECT id FROM products WHERE name = 'SAMPLE Sneaker C' LIMIT 1), JSON_OBJECT('seed', true, 'qty', 1)),
  (NULL, 'sample-session-guest-01', 'search', NULL, JSON_OBJECT('seed', true, 'keyword', 'sample sneaker'));

INSERT INTO user_voucher_usage (user_id, voucher_id, used_count, last_used_at)
VALUES
  ((SELECT id FROM users WHERE email = 'sample.customer@shoestore.local' LIMIT 1), (SELECT id FROM vouchers WHERE code = 'SAMPLE10K' LIMIT 1), 1, NOW()),
  ((SELECT id FROM users WHERE email = 'sample.customer@shoestore.local' LIMIT 1), (SELECT id FROM vouchers WHERE code = 'SAMPLEFREESHIP' LIMIT 1), 1, NOW());

INSERT INTO inventory_logs (variant_id, quantity_changed, import_price, action_type, reference_code, note)
VALUES
  ((SELECT id FROM product_variants WHERE sku = 'SAMPLE-SNK-A-42-BLK' LIMIT 1), 30, 520000, 'IMPORT', 'SAMPLE-IMP-001', 'Nhap kho ban dau mau A'),
  ((SELECT id FROM product_variants WHERE sku = 'SAMPLE-SNK-B-39-WHT' LIMIT 1), -1, NULL, 'ORDER', 'SAMPLE-ORD-002', 'Xuat kho cho don SAMPLE-PAY-002'),
  ((SELECT id FROM product_variants WHERE sku = 'SAMPLE-SNK-C-41-RED' LIMIT 1), -1, NULL, 'ORDER', 'SAMPLE-ORD-003', 'Xuat kho cho don SAMPLE-PAY-003');

INSERT INTO order_status_logs (order_id, status_old, status_new)
VALUES
  ((SELECT id FROM orders WHERE payment_ref = 'SAMPLE-PAY-001' LIMIT 1), NULL, 'pending'),
  ((SELECT id FROM orders WHERE payment_ref = 'SAMPLE-PAY-002' LIMIT 1), 'shipping', 'delivered'),
  ((SELECT id FROM orders WHERE payment_ref = 'SAMPLE-PAY-003' LIMIT 1), 'delivered', 'return_requested');

INSERT INTO order_returns (order_id, return_reason, return_evidence, return_rejected_reason, return_detailed)
VALUES
  (
    (SELECT id FROM orders WHERE payment_ref = 'SAMPLE-PAY-003' LIMIT 1),
    'Khach hang muon doi size',
    JSON_ARRAY('/uploads/returns/sample-return-1.jpg', '/uploads/returns/sample-return-2.mp4'),
    NULL,
    JSON_OBJECT('size_requested', '42', 'pickup_slot', '2026-04-25 10:00:00', 'seed', true)
  ),
  (
    (SELECT id FROM orders WHERE payment_ref = 'SAMPLE-PAY-002' LIMIT 1),
    'Khach hang phan anh loi keo giay',
    JSON_ARRAY('/uploads/returns/sample-return-3.jpg'),
    'Khong du dieu kien do vo ngoai quan trinh van chuyen',
    JSON_OBJECT('inspection_result', 'rejected', 'seed', true)
  );

INSERT INTO notifications (user_id, type, title, message, order_id, review_id, is_read)
VALUES
  (
    (SELECT id FROM users WHERE email = 'sample.customer@shoestore.local' LIMIT 1),
    'order_status',
    'SAMPLE: Don hang dang giao',
    'Don SAMPLE-PAY-001 da chuyen sang trang thai pending.',
    (SELECT id FROM orders WHERE payment_ref = 'SAMPLE-PAY-001' LIMIT 1),
    NULL,
    0
  ),
  (
    (SELECT id FROM users WHERE email = 'sample.customer@shoestore.local' LIMIT 1),
    'review_reply',
    'SAMPLE: Admin da phan hoi danh gia',
    'Admin vua phan hoi review cua ban.',
    (SELECT id FROM orders WHERE payment_ref = 'SAMPLE-PAY-002' LIMIT 1),
    (SELECT id FROM reviews WHERE general_comment = 'SAMPLE: San pham on trong tam gia' LIMIT 1),
    0
  ),
  (
    (SELECT id FROM users WHERE email = 'sample.admin@shoestore.local' LIMIT 1),
    'system',
    'SAMPLE: Yeu cau hoan hang moi',
    'Co don SAMPLE-PAY-003 vua gui yeu cau hoan hang.',
    (SELECT id FROM orders WHERE payment_ref = 'SAMPLE-PAY-003' LIMIT 1),
    NULL,
    1
  );

SELECT 'Seed sample data completed successfully.' AS message;
