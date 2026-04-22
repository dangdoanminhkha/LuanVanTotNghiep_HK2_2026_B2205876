-- Migration: add review_rating action to behavior logs

ALTER TABLE user_behavior_logs
MODIFY COLUMN action ENUM('search', 'view', 'add_to_cart', 'like', 'purchase', 'return', 'review_rating') NOT NULL;
