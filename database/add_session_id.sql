-- Migration: Add session_id columns for guest tracking
-- Purpose: Track guest (non-authenticated) users via session_id

-- Step 1: Add session_id column to cart_items
ALTER TABLE cart_items ADD COLUMN session_id VARCHAR(36) NULL AFTER user_id;
CREATE INDEX idx_session_id ON cart_items(session_id);

-- Step 2: Add session_id column to user_behavior_logs
ALTER TABLE user_behavior_logs ADD COLUMN session_id VARCHAR(36) NULL AFTER user_id;
CREATE INDEX idx_session_id_behavior ON user_behavior_logs(session_id);

-- Step 3: Allow user_id to be NULL for guest tracking
ALTER TABLE cart_items MODIFY COLUMN user_id INT NULL;
ALTER TABLE user_behavior_logs MODIFY COLUMN user_id INT NULL;

-- Step 4: Update foreign key constraints to allow NULL
ALTER TABLE cart_items DROP FOREIGN KEY cart_items_ibfk_1;
ALTER TABLE cart_items ADD CONSTRAINT cart_items_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_behavior_logs DROP FOREIGN KEY user_behavior_logs_ibfk_1;
ALTER TABLE user_behavior_logs ADD CONSTRAINT user_behavior_logs_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
