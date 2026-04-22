-- Migration: Add AI suggestion tracking to order items
-- Purpose: Track which products were AI-recommended in each order

ALTER TABLE order_items ADD COLUMN is_ai_suggested BOOLEAN DEFAULT FALSE AFTER price;
CREATE INDEX idx_ai_suggested ON order_items(is_ai_suggested);
