-- Thêm cột ảnh và like JSON trực tiếp vào bảng reviews (không tạo bảng review_likes mới)

-- 1) Đảm bảo có cột images
SET @has_images := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'reviews'
      AND column_name = 'images'
);

SET @sql_add_images := IF(
    @has_images = 0,
    'ALTER TABLE reviews ADD COLUMN images JSON NULL AFTER general_comment',
    'SELECT 1'
);

PREPARE stmt FROM @sql_add_images;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Đảm bảo có cột liked_user_ids (mảng JSON chứa user_id đã like)
SET @has_liked_user_ids := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'reviews'
      AND column_name = 'liked_user_ids'
);

SET @sql_add_liked_user_ids := IF(
    @has_liked_user_ids = 0,
    'ALTER TABLE reviews ADD COLUMN liked_user_ids JSON NULL AFTER images',
    'SELECT 1'
);

PREPARE stmt FROM @sql_add_liked_user_ids;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Nếu trước đó đã có bảng review_likes, migrate dữ liệu về reviews.liked_user_ids
SET @has_review_likes := (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'review_likes'
);

SET @sql_migrate_review_likes := IF(
    @has_review_likes > 0,
    'UPDATE reviews r
     JOIN (
        SELECT review_id, JSON_ARRAYAGG(CAST(user_id AS CHAR)) AS liked_ids
        FROM review_likes
        GROUP BY review_id
     ) rl ON rl.review_id = r.id
     SET r.liked_user_ids = rl.liked_ids
     WHERE r.liked_user_ids IS NULL OR JSON_LENGTH(r.liked_user_ids) = 0',
    'SELECT 1'
);

PREPARE stmt FROM @sql_migrate_review_likes;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4) Tuỳ chọn: drop bảng cũ review_likes sau khi migrate xong
SET @sql_drop_review_likes := IF(
    @has_review_likes > 0,
    'DROP TABLE review_likes',
    'SELECT 1'
);

PREPARE stmt FROM @sql_drop_review_likes;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
