ALTER TABLE orders MODIFY COLUMN status ENUM(
    'pending',
    'confirmed',
    'shipping',
    'delivered',
    'cancelled',
    'failed_delivery_retry',
    'failed_delivery',
    'return_requested',
    'return_approved',
    'return_rejected',
    'return_received',
    'refund_pending',
    'refunded'
) DEFAULT 'pending';
