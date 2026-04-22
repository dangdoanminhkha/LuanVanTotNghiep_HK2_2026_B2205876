-- Migration: Add session_id support for guest favorites
-- Purpose: Allow favorites for both authenticated users and guests

ALTER TABLE favorites MODIFY COLUMN user_id INT NULL;
ALTER TABLE favorites ADD COLUMN session_id VARCHAR(36) NULL AFTER user_id;

CREATE INDEX idx_session_id_favorites ON favorites(session_id);
CREATE UNIQUE INDEX unique_session_product ON favorites(session_id, product_id);
