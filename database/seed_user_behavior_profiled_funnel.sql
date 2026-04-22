-- Seed mock behavior with coherent funnel + category preference per user
-- Logic per seeded user:
--   1) View 5 products (mostly in preferred category)
--   2) Add 3 viewed products to cart
--   3) Purchase 1 product from cart
--   4) Like 2 viewed (non-purchased) products
--   5) Write 1 review_rating on purchased product
--   6) A small subset gets return on purchased product
-- Idempotent by source tag in extra_info

USE shoestore;

SET @mock_source = 'seed_user_behavior_profiled_v3';

DROP TEMPORARY TABLE IF EXISTS tmp_seed_users;
CREATE TEMPORARY TABLE tmp_seed_users AS
SELECT id AS user_id,
       ROW_NUMBER() OVER (ORDER BY id DESC) AS user_rank
FROM users
ORDER BY id DESC
LIMIT 20;

DROP TEMPORARY TABLE IF EXISTS tmp_seed_categories;
CREATE TEMPORARY TABLE tmp_seed_categories AS
SELECT id AS category_id,
       ROW_NUMBER() OVER (ORDER BY id) AS cat_rank
FROM categories
ORDER BY id;

SET @cat_count = (SELECT COUNT(*) FROM tmp_seed_categories);
SET @cat_count = IFNULL(NULLIF(@cat_count, 0), 1);

DROP TEMPORARY TABLE IF EXISTS tmp_user_pref;
CREATE TEMPORARY TABLE tmp_user_pref AS
SELECT
    u.user_id,
    c1.category_id AS primary_category_id,
    c2.category_id AS secondary_category_id
FROM tmp_seed_users u
JOIN tmp_seed_categories c1
  ON c1.cat_rank = 1 + MOD(u.user_rank - 1, @cat_count)
JOIN tmp_seed_categories c2
  ON c2.cat_rank = 1 + MOD(u.user_rank, @cat_count);

-- Pick 4 products from primary category
DROP TEMPORARY TABLE IF EXISTS tmp_primary_view;
CREATE TEMPORARY TABLE tmp_primary_view AS
SELECT user_id, product_id
FROM (
  SELECT
      up.user_id,
      p.id AS product_id,
      ROW_NUMBER() OVER (
          PARTITION BY up.user_id
          ORDER BY MOD((up.user_id * 997 + p.id * 37), 100000)
      ) AS rn
  FROM tmp_user_pref up
  JOIN products p ON p.category_id = up.primary_category_id
) ranked
WHERE rn <= 4;

-- Pick 1 product outside primary category (prefer secondary)
DROP TEMPORARY TABLE IF EXISTS tmp_non_primary_view;
CREATE TEMPORARY TABLE tmp_non_primary_view AS
SELECT user_id, product_id
FROM (
  SELECT
      up.user_id,
      p.id AS product_id,
      ROW_NUMBER() OVER (
          PARTITION BY up.user_id
          ORDER BY
              CASE WHEN p.category_id = up.secondary_category_id THEN 0 ELSE 1 END,
              MOD((up.user_id * 389 + p.id * 17), 100000)
      ) AS rn
  FROM tmp_user_pref up
  JOIN products p ON p.category_id <> up.primary_category_id
  LEFT JOIN tmp_primary_view pv
    ON pv.user_id = up.user_id AND pv.product_id = p.id
  WHERE pv.product_id IS NULL
) ranked
WHERE rn <= 1;

DROP TEMPORARY TABLE IF EXISTS tmp_view_base;
CREATE TEMPORARY TABLE tmp_view_base AS
SELECT user_id, product_id FROM tmp_primary_view
UNION ALL
SELECT user_id, product_id FROM tmp_non_primary_view;

-- Fallback fill to ensure exactly 5 views/user
DROP TEMPORARY TABLE IF EXISTS tmp_view_fill_candidates;
CREATE TEMPORARY TABLE tmp_view_fill_candidates AS
SELECT
    up.user_id,
    p.id AS product_id,
    ROW_NUMBER() OVER (
        PARTITION BY up.user_id
        ORDER BY MOD((up.user_id * 577 + p.id * 29), 100000)
    ) AS rn
FROM tmp_user_pref up
JOIN products p ON 1=1
LEFT JOIN tmp_view_base vb
  ON vb.user_id = up.user_id AND vb.product_id = p.id
WHERE vb.product_id IS NULL;

DROP TEMPORARY TABLE IF EXISTS tmp_view_products;
CREATE TEMPORARY TABLE tmp_view_products AS
SELECT user_id, product_id FROM tmp_view_base;

INSERT INTO tmp_view_products (user_id, product_id)
SELECT c.user_id, c.product_id
FROM tmp_view_fill_candidates c
JOIN (
  SELECT user_id, GREATEST(0, 5 - COUNT(*)) AS need_cnt
  FROM tmp_view_base
  GROUP BY user_id
) need ON need.user_id = c.user_id
WHERE c.rn <= need.need_cnt;

DROP TEMPORARY TABLE IF EXISTS tmp_view_ranked;
CREATE TEMPORARY TABLE tmp_view_ranked AS
SELECT
    v.user_id,
    v.product_id,
    ROW_NUMBER() OVER (
        PARTITION BY v.user_id
        ORDER BY MOD((v.user_id * 809 + v.product_id * 31), 100000)
    ) AS view_order
FROM tmp_view_products v;

-- Cart = top 3 viewed
DROP TEMPORARY TABLE IF EXISTS tmp_cart_products;
CREATE TEMPORARY TABLE tmp_cart_products AS
SELECT user_id, product_id, view_order
FROM tmp_view_ranked
WHERE view_order <= 3;

-- Purchase = 1 product from cart
DROP TEMPORARY TABLE IF EXISTS tmp_purchase_products;
CREATE TEMPORARY TABLE tmp_purchase_products AS
SELECT user_id, product_id
FROM (
  SELECT
      c.user_id,
      c.product_id,
      ROW_NUMBER() OVER (
          PARTITION BY c.user_id
          ORDER BY c.view_order DESC
      ) AS rn
  FROM tmp_cart_products c
) ranked
WHERE rn = 1;

-- Likes = 2 viewed products excluding purchased product
DROP TEMPORARY TABLE IF EXISTS tmp_like_products;
CREATE TEMPORARY TABLE tmp_like_products AS
SELECT user_id, product_id, like_order
FROM (
  SELECT
      v.user_id,
      v.product_id,
      ROW_NUMBER() OVER (
          PARTITION BY v.user_id
          ORDER BY v.view_order ASC
      ) AS like_order
  FROM tmp_view_ranked v
  LEFT JOIN tmp_purchase_products p
    ON p.user_id = v.user_id AND p.product_id = v.product_id
  WHERE p.product_id IS NULL
) ranked
WHERE like_order <= 2;

-- Returns only for a small subset of purchased products
DROP TEMPORARY TABLE IF EXISTS tmp_return_products;
CREATE TEMPORARY TABLE tmp_return_products AS
SELECT user_id, product_id
FROM tmp_purchase_products
WHERE MOD(user_id, 7) = 0;

-- Insert VIEW logs
INSERT INTO user_behavior_logs (user_id, action, product_id, extra_info, timestamp)
SELECT
    v.user_id,
    'view',
    v.product_id,
    JSON_OBJECT(
        'source', @mock_source,
        'stage', 'view',
        'view_order', v.view_order,
        'primary_category_id', up.primary_category_id,
        'secondary_category_id', up.secondary_category_id
    ),
    DATE_SUB(NOW(), INTERVAL (10 - v.view_order + MOD(v.user_id, 3)) DAY)
FROM tmp_view_ranked v
JOIN tmp_user_pref up ON up.user_id = v.user_id
WHERE NOT EXISTS (
  SELECT 1
  FROM user_behavior_logs l
  WHERE l.user_id = v.user_id
    AND l.action = 'view'
    AND l.product_id = v.product_id
    AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(l.extra_info, '$.source')), '') = @mock_source
);

-- Insert ADD_TO_CART logs
INSERT INTO user_behavior_logs (user_id, action, product_id, extra_info, timestamp)
SELECT
    c.user_id,
    'add_to_cart',
    c.product_id,
    JSON_OBJECT(
        'source', @mock_source,
        'stage', 'add_to_cart',
        'from_view_order', c.view_order
    ),
    DATE_SUB(NOW(), INTERVAL (4 - c.view_order + MOD(c.user_id, 2)) DAY)
FROM tmp_cart_products c
WHERE NOT EXISTS (
  SELECT 1
  FROM user_behavior_logs l
  WHERE l.user_id = c.user_id
    AND l.action = 'add_to_cart'
    AND l.product_id = c.product_id
    AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(l.extra_info, '$.source')), '') = @mock_source
);

-- Insert PURCHASE logs
INSERT INTO user_behavior_logs (user_id, action, product_id, extra_info, timestamp)
SELECT
    p.user_id,
    'purchase',
    p.product_id,
    JSON_OBJECT(
        'source', @mock_source,
        'stage', 'purchase'
    ),
    DATE_SUB(NOW(), INTERVAL MOD(p.user_id, 2) DAY)
FROM tmp_purchase_products p
WHERE NOT EXISTS (
  SELECT 1
  FROM user_behavior_logs l
  WHERE l.user_id = p.user_id
    AND l.action = 'purchase'
    AND l.product_id = p.product_id
    AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(l.extra_info, '$.source')), '') = @mock_source
);

-- Insert LIKE logs
INSERT INTO user_behavior_logs (user_id, action, product_id, extra_info, timestamp)
SELECT
    lk.user_id,
    'like',
    lk.product_id,
    JSON_OBJECT(
        'source', @mock_source,
        'stage', 'like',
        'like_order', lk.like_order
    ),
    DATE_SUB(NOW(), INTERVAL (6 - lk.like_order + MOD(lk.user_id, 2)) DAY)
FROM tmp_like_products lk
WHERE NOT EXISTS (
  SELECT 1
  FROM user_behavior_logs l
  WHERE l.user_id = lk.user_id
    AND l.action = 'like'
    AND l.product_id = lk.product_id
    AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(l.extra_info, '$.source')), '') = @mock_source
);

-- Insert REVIEW_RATING logs on purchased products
INSERT INTO user_behavior_logs (user_id, action, product_id, extra_info, timestamp)
SELECT
    p.user_id,
    'review_rating',
    p.product_id,
    JSON_OBJECT(
        'source', @mock_source,
        'stage', 'review_rating',
        'rating', CASE
            WHEN r.user_id IS NOT NULL THEN CASE WHEN MOD(p.user_id, 2) = 0 THEN 1 ELSE 2 END
            WHEN MOD(p.user_id, 5) = 0 THEN 3
            WHEN MOD(p.user_id, 5) = 1 THEN 4
            ELSE 5
        END,
        'rating_score', CASE
            WHEN r.user_id IS NOT NULL THEN CASE WHEN MOD(p.user_id, 2) = 0 THEN -4 ELSE -2 END
            WHEN MOD(p.user_id, 5) = 0 THEN 0
            WHEN MOD(p.user_id, 5) = 1 THEN 2
            ELSE 4
        END
    ),
    DATE_SUB(NOW(), INTERVAL MOD(p.user_id, 2) DAY)
FROM tmp_purchase_products p
LEFT JOIN tmp_return_products r
  ON r.user_id = p.user_id AND r.product_id = p.product_id
WHERE NOT EXISTS (
  SELECT 1
  FROM user_behavior_logs l
  WHERE l.user_id = p.user_id
    AND l.action = 'review_rating'
    AND l.product_id = p.product_id
    AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(l.extra_info, '$.source')), '') = @mock_source
);

-- Insert RETURN logs (small subset)
INSERT INTO user_behavior_logs (user_id, action, product_id, extra_info, timestamp)
SELECT
    r.user_id,
    'return',
    r.product_id,
    JSON_OBJECT(
        'source', @mock_source,
        'stage', 'return',
        'reason', 'mock_profiled_return'
    ),
    NOW()
FROM tmp_return_products r
WHERE NOT EXISTS (
  SELECT 1
  FROM user_behavior_logs l
  WHERE l.user_id = r.user_id
    AND l.action = 'return'
    AND l.product_id = r.product_id
    AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(l.extra_info, '$.source')), '') = @mock_source
);

DROP TEMPORARY TABLE IF EXISTS tmp_return_products;
DROP TEMPORARY TABLE IF EXISTS tmp_like_products;
DROP TEMPORARY TABLE IF EXISTS tmp_purchase_products;
DROP TEMPORARY TABLE IF EXISTS tmp_cart_products;
DROP TEMPORARY TABLE IF EXISTS tmp_view_ranked;
DROP TEMPORARY TABLE IF EXISTS tmp_view_products;
DROP TEMPORARY TABLE IF EXISTS tmp_view_fill_candidates;
DROP TEMPORARY TABLE IF EXISTS tmp_view_base;
DROP TEMPORARY TABLE IF EXISTS tmp_non_primary_view;
DROP TEMPORARY TABLE IF EXISTS tmp_primary_view;
DROP TEMPORARY TABLE IF EXISTS tmp_user_pref;
DROP TEMPORARY TABLE IF EXISTS tmp_seed_categories;
DROP TEMPORARY TABLE IF EXISTS tmp_seed_users;
