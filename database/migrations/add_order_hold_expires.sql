-- Adds hold expiration metadata to orders for auto-cancellation logic
ALTER TABLE orders
    ADD COLUMN hold_expires_at DATETIME NULL AFTER payment_status;
