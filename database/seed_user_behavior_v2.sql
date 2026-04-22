-- Seed additional mock behavior data for recommender v2
-- Includes: view, add_to_cart, like, purchase, return, review_rating
-- Idempotent by checking extra_info.source = 'seed_user_behavior_v2'

USE shoestore;

SET @mock_source = 'seed_user_behavior_v2';

-- 1) Dense views
INSERT INTO user_behavior_logs (user_id, action, product_id, extra_info, timestamp)
SELECT
  u.id,
  'view',
  p.id,
  JSON_OBJECT('source', @mock_source),
  DATE_SUB(NOW(), INTERVAL MOD((u.id * 7 + p.id), 30) DAY)
FROM (SELECT id FROM users ORDER BY id DESC LIMIT 20) u
JOIN (SELECT id FROM products ORDER BY id DESC LIMIT 60) p
WHERE MOD(u.id + p.id, 3) = 0
  AND NOT EXISTS (
    SELECT 1
    FROM user_behavior_logs l
    WHERE l.user_id = u.id
      AND l.action = 'view'
      AND l.product_id = p.id
      AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(l.extra_info, '$.source')), '') = @mock_source
  );

-- 2) Add to cart signals
INSERT INTO user_behavior_logs (user_id, action, product_id, extra_info, timestamp)
SELECT
  u.id,
  'add_to_cart',
  p.id,
  JSON_OBJECT('source', @mock_source),
  DATE_SUB(NOW(), INTERVAL MOD((u.id * 5 + p.id), 21) DAY)
FROM (SELECT id FROM users ORDER BY id DESC LIMIT 20) u
JOIN (SELECT id FROM products ORDER BY id DESC LIMIT 60) p
WHERE MOD(u.id + p.id, 9) = 0
  AND NOT EXISTS (
    SELECT 1
    FROM user_behavior_logs l
    WHERE l.user_id = u.id
      AND l.action = 'add_to_cart'
      AND l.product_id = p.id
      AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(l.extra_info, '$.source')), '') = @mock_source
  );

-- 3) Like signals
INSERT INTO user_behavior_logs (user_id, action, product_id, extra_info, timestamp)
SELECT
  u.id,
  'like',
  p.id,
  JSON_OBJECT('source', @mock_source),
  DATE_SUB(NOW(), INTERVAL MOD((u.id * 3 + p.id), 18) DAY)
FROM (SELECT id FROM users ORDER BY id DESC LIMIT 20) u
JOIN (SELECT id FROM products ORDER BY id DESC LIMIT 60) p
WHERE MOD(u.id + p.id, 11) = 0
  AND NOT EXISTS (
    SELECT 1
    FROM user_behavior_logs l
    WHERE l.user_id = u.id
      AND l.action = 'like'
      AND l.product_id = p.id
      AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(l.extra_info, '$.source')), '') = @mock_source
  );

-- 4) Purchase signals
INSERT INTO user_behavior_logs (user_id, action, product_id, extra_info, timestamp)
SELECT
  u.id,
  'purchase',
  p.id,
  JSON_OBJECT('source', @mock_source),
  DATE_SUB(NOW(), INTERVAL MOD((u.id * 13 + p.id), 15) DAY)
FROM (SELECT id FROM users ORDER BY id DESC LIMIT 20) u
JOIN (SELECT id FROM products ORDER BY id DESC LIMIT 60) p
WHERE MOD(u.id + p.id, 17) = 0
  AND NOT EXISTS (
    SELECT 1
    FROM user_behavior_logs l
    WHERE l.user_id = u.id
      AND l.action = 'purchase'
      AND l.product_id = p.id
      AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(l.extra_info, '$.source')), '') = @mock_source
  );

-- 5) Return (negative) signals
INSERT INTO user_behavior_logs (user_id, action, product_id, extra_info, timestamp)
SELECT
  u.id,
  'return',
  p.id,
  JSON_OBJECT('source', @mock_source, 'reason', 'mock_return'),
  DATE_SUB(NOW(), INTERVAL MOD((u.id * 17 + p.id), 10) DAY)
FROM (SELECT id FROM users ORDER BY id DESC LIMIT 20) u
JOIN (SELECT id FROM products ORDER BY id DESC LIMIT 60) p
WHERE MOD(u.id + p.id, 43) = 0
  AND NOT EXISTS (
    SELECT 1
    FROM user_behavior_logs l
    WHERE l.user_id = u.id
      AND l.action = 'return'
      AND l.product_id = p.id
      AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(l.extra_info, '$.source')), '') = @mock_source
  );

-- 6) Review rating signals with dynamic rating score
INSERT INTO user_behavior_logs (user_id, action, product_id, extra_info, timestamp)
SELECT
  u.id,
  'review_rating',
  p.id,
  JSON_OBJECT(
    'source', @mock_source,
    'rating', CASE MOD(u.id + p.id, 5)
      WHEN 0 THEN 5
      WHEN 1 THEN 4
      WHEN 2 THEN 3
      WHEN 3 THEN 2
      ELSE 1
    END,
    'rating_score', CASE MOD(u.id + p.id, 5)
      WHEN 0 THEN 4
      WHEN 1 THEN 2
      WHEN 2 THEN 0
      WHEN 3 THEN -2
      ELSE -4
    END
  ),
  DATE_SUB(NOW(), INTERVAL MOD((u.id * 19 + p.id), 12) DAY)
FROM (SELECT id FROM users ORDER BY id DESC LIMIT 20) u
JOIN (SELECT id FROM products ORDER BY id DESC LIMIT 60) p
WHERE MOD(u.id + p.id, 13) = 0
  AND NOT EXISTS (
    SELECT 1
    FROM user_behavior_logs l
    WHERE l.user_id = u.id
      AND l.action = 'review_rating'
      AND l.product_id = p.id
      AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(l.extra_info, '$.source')), '') = @mock_source
  );
