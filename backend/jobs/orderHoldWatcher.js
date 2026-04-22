const db = require('../db');
const { createNotification } = require('../routes/notifications');

const ONLINE_PAYMENT_METHODS = ['vnpay'];
const HOLD_MINUTES = parseInt(process.env.ORDER_HOLD_MINUTES || '15', 10);
const CHECK_INTERVAL = parseInt(process.env.ORDER_HOLD_CHECK_INTERVAL || '60000', 10);

let watcherStarted = false;

async function restoreInventory(connection, orderId) {
    // Kiểm tra xem order đã trừ inventory chưa
    const [orderInfo] = await connection.query(
        'SELECT payment_status, payment_method FROM orders WHERE id = ?',
        [orderId]
    );
    
    if (orderInfo.length === 0) return;
    
    const order = orderInfo[0];
    
    // Chỉ restore inventory nếu:
    // 1. COD orders (đã trừ inventory khi tạo)  
    // 2. Hoặc online payment đã paid (đã trừ inventory khi thanh toán thành công)
    const shouldRestore = order.payment_method === 'cod' || order.payment_status === 'paid';
    
    if (!shouldRestore) {
        console.log(`Order ${orderId}: No inventory to restore (${order.payment_method}, ${order.payment_status})`);
        return;
    }

    console.log(`Order ${orderId}: Restoring inventory for ${order.payment_method} order`);
    
    const [items] = await connection.query(
        `SELECT variant_id, quantity FROM order_items WHERE order_id = ?`,
        [orderId]
    );

    for (const item of items) {
        if (!item.variant_id) continue;
        await connection.query(
            'UPDATE product_variants SET quantity = quantity + ? WHERE id = ?',
            [item.quantity, item.variant_id]
        );
    }
}

async function cancelExpiredOrder(order) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Lock the order row to avoid double processing
        const [rows] = await connection.query(
            'SELECT status, payment_status FROM orders WHERE id = ? FOR UPDATE',
            [order.id]
        );

        if (!rows.length) {
            await connection.rollback();
            return;
        }

        const current = rows[0];
        // Only proceed when order still pending and not already paid.
        // Allow cancellation for orders with payment_status 'pending' or 'failed'.
        if (current.status !== 'pending' || current.payment_status === 'paid') {
            await connection.rollback();
            return;
        }

        await restoreInventory(connection, order.id);

        const noteFragment = `[Hệ thống] Đơn hàng bị hủy do quá hạn thanh toán (${HOLD_MINUTES} phút).`;

        // Log status change
        await connection.query(
            `INSERT INTO order_status_logs (order_id, status_old, status_new, created_at) 
             VALUES (?, ?, ?, NOW())`,
            [order.id, 'pending', 'cancelled']
        );

        await connection.query(
            `UPDATE orders 
             SET status = 'cancelled',
                 payment_status = 'failed',
                 note = TRIM(CONCAT(COALESCE(note, ''), '\n', ?))
             WHERE id = ?`,
            [noteFragment, order.id]
        );

        await connection.commit();

        try {
            await createNotification(
                order.user_id,
                'order_status',
                'Đơn hàng hết hạn thanh toán',
                `Đơn hàng #${order.id} đã bị hủy vì quá hạn ${HOLD_MINUTES} phút khi chờ thanh toán.`,
                order.id
            );
        } catch (notifyError) {
            console.error('OrderHoldWatcher notification error:', notifyError.message);
        }
    } catch (error) {
        await connection.rollback();
        console.error('OrderHoldWatcher cancel error:', error.message);
    } finally {
        connection.release();
    }
}

async function scanExpiredOrders() {
    try {
                const [orders] = await db.query(
                        `SELECT id, user_id FROM orders 
                         WHERE status = 'pending'
                             AND payment_status IN ('pending','failed')
                             AND payment_method IN (?)
                             AND TIMESTAMPDIFF(MINUTE, created_at, NOW()) > ?`,
                        [ONLINE_PAYMENT_METHODS, HOLD_MINUTES]
                );

        if (orders.length) {
            console.log(`[OrderHoldWatcher] Found ${orders.length} expired order(s) to cancel.`);
        }

        for (const order of orders) {
            await cancelExpiredOrder(order);
        }
    } catch (error) {
        console.error('OrderHoldWatcher scan error:', error.message);
    }
}

function startOrderHoldWatcher() {
    if (watcherStarted) {
        return;
    }

    watcherStarted = true;
    console.log(`[OrderHoldWatcher] Watching unpaid orders. Hold window: ${HOLD_MINUTES} phút, interval: ${CHECK_INTERVAL / 1000}s.`);
    // Run immediately then on interval
    scanExpiredOrders();
    setInterval(scanExpiredOrders, CHECK_INTERVAL);
}

module.exports = {
    startOrderHoldWatcher
};
