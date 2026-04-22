-- Migration: expand behavior actions for recommender signals
-- Add positive signal: like
-- Add negative signal: return
-- Add rating signal from reviews: review_rating

ALTER TABLE user_behavior_logs
MODIFY COLUMN action ENUM('search', 'view', 'add_to_cart', 'like', 'purchase', 'return', 'review_rating') NOT NULL;
