const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, isAdmin, isShipper } = require('../middleware/auth');
const { createNotification } = require('./notifications');
const upload = require('../middleware/uploadFile');

const ONLINE_PAYMENT_METHODS = ['vnpay'];
const HOLD_MINUTES = parseInt(process.env.ORDER_HOLD_MINUTES || '15', 10);

// Ghi log hành vi theo toàn bộ sản phẩm trong đơn (dùng cho return)
async function logOrderBehavior(action, orderId, userId, extraInfo = {}) {
    if (!action || !orderId || !userId) return;

    try {
        const [items] = await db.query(
            'SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?',
            [orderId]
        );

        for (const item of items) {
            if (!item.product_id) continue;

            await db.query(
                'INSERT INTO user_behavior_logs (user_id, action, product_id, extra_info) VALUES (?, ?, ?, ?)',
                [
                    userId,
                    action,
                    item.product_id,
                    JSON.stringify({
                        order_id: Number(orderId),
                        variant_id: item.variant_id || null,
                        quantity: Number(item.quantity || 0),
                        ...extraInfo,
                    }),
                ]
            );
        }
    } catch (error) {
        console.error(`[BehaviorLog] Failed to log action '${action}' for order ${orderId}:`, error.message);
    }
}

// Tạo đơn hàng
router.post('/', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { items, total, address, payment_method, note, voucher } = req.body;
        const paymentMethod = payment_method || 'cod';
        const shouldHoldInventory = ONLINE_PAYMENT_METHODS.includes(paymentMethod);
        const holdExpiresAt = shouldHoldInventory ? new Date(Date.now() + HOLD_MINUTES * 60 * 1000) : null;

        // Validate
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Giỏ hàng trống' });
        }

        if (!address) {
            return res.status(400).json({ message: 'Vui lòng chọn địa chỉ giao hàng' });
        }

        // Validate user_address_id
        const userAddressId = address.id || address.user_address_id;
        if (!userAddressId) {
            return res.status(400).json({ message: 'Địa chỉ giao hàng phải được chọn từ danh sách đã lưu' });
        }

        // Verify địa chỉ tồn tại và thuộc đúng user đang đặt đơn
        const [addressRows] = await connection.query(
            'SELECT id FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1',
            [userAddressId, req.user.id]
        );
        if (!addressRows.length) {
            return res.status(400).json({ message: 'Địa chỉ giao hàng không hợp lệ hoặc đã bị xóa' });
        }

        // Preparatory insert - now only save user_address_id (no more snapshot columns)
        const columns = ['user_id', 'total', 'status', 'payment_method', 'note', 'user_address_id'];
        const placeholders = ['?', '?', '?', '?', '?', '?'];
        const params = [req.user.id, total, 'pending', paymentMethod, note || null, userAddressId];

        const insertQuery = `INSERT INTO orders (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
        const [orderResult] = await connection.query(insertQuery, params);

        const orderId = orderResult.insertId;

        // Thêm các sản phẩm vào order_items
        for (const item of items) {
            let size = item.size || null;
            let color = item.color || null;

            // Nếu có variant_id nhưng không có size/color, fetch từ database
            if (item.variant_id && (!size || !color)) {
                const [variants] = await connection.query(
                    `SELECT pv.size, c.color FROM product_variants pv
                     JOIN colors c ON pv.color_id = c.id
                     WHERE pv.id = ?`,
                    [item.variant_id]
                );
                if (variants.length > 0) {
                    size = variants[0].size;
                    color = variants[0].color;
                }
            }

            const isAiSuggested = item.isAiSuggested ? 1 : 0;

            await connection.query(
                'INSERT INTO order_items (order_id, product_id, variant_id, size, color, quantity, price, is_ai_suggested) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [orderId, item.product_id, item.variant_id || null, size, color, item.quantity, item.price, isAiSuggested]
            );

            // ===== Log inventory khi tạo đơn hàng =====
            // Tạo entry trong inventory_logs với quantity_changed âm (bán ra)
            if (item.variant_id) {
                try {
                    await connection.query(
                        `INSERT INTO inventory_logs (variant_id, quantity_changed, action_type, reference_code, note, created_at)
                         VALUES (?, ?, ?, ?, ?, NOW())`,
                        [
                            item.variant_id,
                            -item.quantity,           // Âm vì bán ra
                            'ORDER',                  // Loại giao dịch: ORDER
                            `DH-${orderId}`,          // Mã đối chiếu: DH-{orderId}
                            `Khách hàng mua (Đơn: ${orderId})` // Ghi chú
                        ]
                    );
                } catch (inventoryErr) {
                    // Không rollback nếu inventory log fail - order vẫn valid
                    console.error(`⚠️  Lỗi ghi inventory log cho đơn ${orderId}:`, inventoryErr.message);
                }
            }

            // Luôn trừ inventory để tránh race condition
            if (item.variant_id) {
                const [updateResult] = await connection.query(
                    'UPDATE product_variants SET sold = sold + ? WHERE id = ? AND (quantity - sold) >= ?',
                    [item.quantity, item.variant_id, item.quantity]
                );

                if (updateResult.affectedRows === 0) {
                    const [variantRows] = await connection.query(
                        `SELECT pv.id AS variant_id, pv.product_id, pv.quantity AS available_quantity,
                                p.name AS product_name, pv.size, c.color
                         FROM product_variants pv
                         LEFT JOIN products p ON p.id = pv.product_id
                         LEFT JOIN colors c ON pv.color_id = c.id
                         WHERE pv.id = ?`,
                        [item.variant_id]
                    );

                    const variant = variantRows[0] || null;
                    await connection.rollback();
                    return res.status(409).json({
                        code: 'OUT_OF_STOCK',
                        error: 'Sản phẩm đã hết hàng hoặc không đủ số lượng.',
                        message: 'Sản phẩm bạn chọn đã hết hàng hoặc không đủ số lượng. Vui lòng cập nhật giỏ hàng và thử lại.',
                        outOfStockItems: [
                            {
                                product_id: variant?.product_id || item.product_id || null,
                                product_name: variant?.product_name || null,
                                variant_id: item.variant_id,
                                size: variant?.size || item.size || null,
                                color: variant?.color || item.color || null,
                                requested_quantity: Number(item.quantity || 0),
                                available_quantity: Number(variant?.available_quantity || 0),
                            },
                        ],
                    });
                }
            }
        }

        // Xóa giỏ hàng database nếu có
        await connection.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

        // Xử lý voucher nếu có
        if (voucher && voucher.id) {
            try {
                // Cập nhật voucher info trong orders
                await connection.query(
                    'UPDATE orders SET voucher_id = ?, discount_applied = ?, applied_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [voucher.id, voucher.discount || 0, orderId]
                );

                // Update user_voucher_usage
                await connection.query(`
                    INSERT INTO user_voucher_usage (user_id, voucher_id, used_count)
                    VALUES (?, ?, 1)
                    ON DUPLICATE KEY UPDATE 
                        used_count = used_count + 1,
                        last_used_at = NOW()
                `, [req.user.id, voucher.id]);

                // Update voucher current_usage
                await connection.query(
                    'UPDATE vouchers SET current_usage = current_usage + 1 WHERE id = ?',
                    [voucher.id]
                );
            } catch (voucherErr) {
                console.error('Error processing voucher:', voucherErr);
                // Không rollback nếu voucher fail - order vẫn valid
            }
        }

        await connection.commit();

        // NOTE: Do NOT log 'purchase' here. Only record 'purchase' when payment is confirmed
        // (e.g., via payment IPN or demo confirm). Logging here would record purchase when
        // the user only created the order or clicked pay but hasn't completed payment.

        res.json({ 
            message: 'Đặt hàng thành công', 
            orderId,
            holdExpiresAt,
            holdMinutes: shouldHoldInventory ? HOLD_MINUTES : null
        });
    } catch (err) {
        await connection.rollback();
        console.error('Order error:', err);
        res.status(500).json({ error: 'Lỗi server', message: err.message });
    } finally {
        connection.release();
    }
});

// Hủy đơn hàng (Chỉ cho pending/confirmed)
router.put('/:id/cancel', authenticateToken, async (req, res) => {
    try {
        // Lấy thông tin đơn hàng
        const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        
        if (orders.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        const order = orders[0];

        // Kiểm tra quyền - chỉ owner hoặc admin mới có thể hủy
        if (order.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Bạn không có quyền hủy đơn hàng này' });
        }

        // Kiểm tra status - chỉ pending hoặc confirmed mới được hủy
        if (!['pending', 'confirmed'].includes(order.status)) {
            return res.status(400).json({ 
                message: 'Không thể hủy đơn hàng ở trạng thái này. Chỉ có thể hủy khi đơn chờ xác nhận hoặc đã xác nhận nhưng chưa giao cho đơn vị vận chuyển.' 
            });
        }

        // Hoàn lại inventory
        const [items] = await db.query(
            'SELECT variant_id, quantity FROM order_items WHERE order_id = ?',
            [req.params.id]
        );

        for (const item of items) {
            if (item.variant_id) {
                await db.query(
                    'UPDATE product_variants SET sold = sold - ? WHERE id = ?',
                    [item.quantity, item.variant_id]
                );
                console.log(`Hoàn lại ${item.quantity} sản phẩm variant ${item.variant_id}`);
            }
        }

        // Cập nhật status thành cancelled
        const [orderToCancel] = await db.query('SELECT status FROM orders WHERE id = ?', [req.params.id]);
        const cancelOldStatus = orderToCancel[0]?.status;
        
        await db.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            ['cancelled', req.params.id]
        );
        
        // Log status change
        await db.query(
            'INSERT INTO order_status_logs (order_id, status_old, status_new, created_at) VALUES (?, ?, ?, NOW())',
            [req.params.id, cancelOldStatus, 'cancelled']
        );

        // Tạo thông báo cho user
        await db.query(
            'INSERT INTO notifications (user_id, title, message, type, order_id) VALUES (?, ?, ?, ?, ?)',
            [order.user_id, 'Đơn hàng đã được hủy', `Đơn hàng #${req.params.id} đã được hủy thành công.`, 'order_status', req.params.id]
        ).catch(err => console.log('Không thể tạo notification:', err));

        res.json({ message: 'Hủy đơn hàng thành công' });
    } catch (err) {
        console.error('Cancel order error:', err);
        res.status(500).json({ error: 'Lỗi server', message: err.message });
    }
});

// Lấy danh sách đơn hàng của user
router.get('/my-orders', authenticateToken, async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT o.*,
                                        (
                                            SELECT osl.created_at
                                            FROM order_status_logs osl
                                            WHERE osl.order_id = o.id AND osl.status_new = 'delivered'
                                            ORDER BY osl.created_at DESC
                                            LIMIT 1
                                        ) AS delivered_at,
                    ua.full_name AS recipient_name, ua.phone, ua.address_detail,
                    ua.province_name, ua.district_name, ua.ward_name,
                          orr.return_reason, orr.return_evidence, orr.return_rejected_reason,
                          orr.return_rejected_reason AS return_rejection_reason,
                          orr.return_detailed
             FROM orders o 
             LEFT JOIN user_addresses ua ON o.user_address_id = ua.id
             LEFT JOIN order_returns orr ON o.id = orr.order_id
             WHERE o.user_id = ? 
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );

        // Lấy chi tiết từng đơn
        for (let order of orders) {
            const [items] = await db.query(
                `SELECT oi.*, p.name, p.image, COALESCE(b.name, 'N/A') as brand
             FROM order_items oi 
             JOIN products p ON oi.product_id = p.id 
             LEFT JOIN brands b ON p.brand_id = b.id
             WHERE oi.order_id = ?`,
                [order.id]
            );
            order.items = items;
        }

        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi server', message: err.message });
    }
});

// Admin: Lấy tất cả đơn hàng (Chỉ lấy các đơn đã xác lập)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Chỉ lấy các đơn hàng:
        // 1. COD hoặc Chuyển khoản (Xác lập ngay khi đặt)
        // 2. VNPay NHƯNG đã thanh toán thành công (payment_status = 'paid') hoặc đã hoàn tiền (payment_status = 'refunded')
        const [orders] = await db.query(
            `SELECT o.*, u.email, u.full_name AS user_full_name,
                    ua.full_name AS recipient_name, ua.phone, ua.address_detail,
                    ua.province_name, ua.district_name, ua.ward_name,
                          orr.return_reason, orr.return_evidence, orr.return_rejected_reason,
                          orr.return_rejected_reason AS return_rejection_reason,
                          orr.return_detailed
             FROM orders o 
             JOIN users u ON o.user_id = u.id 
             LEFT JOIN user_addresses ua ON o.user_address_id = ua.id
             LEFT JOIN order_returns orr ON o.id = orr.order_id
             WHERE (o.payment_method IN ('cod', 'bank'))
                OR (o.payment_method = 'vnpay' AND o.payment_status IN ('paid', 'refunded'))
             ORDER BY o.created_at DESC`
        );
        res.json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Lỗi server', message: err.message });
    }
});

// Shipper: Lấy đơn hàng cần giao (Chỉ lấy các đơn đã xác lập)
router.get('/shipper', authenticateToken, isShipper, async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT o.*, u.email, u.full_name AS user_full_name,
                                        COALESCE(ua.full_name, ua_fallback.full_name) AS recipient_name,
                                        COALESCE(ua.phone, ua_fallback.phone) AS phone,
                                        COALESCE(ua.address_detail, ua_fallback.address_detail) AS address_detail,
                                        COALESCE(ua.province_name, ua_fallback.province_name) AS province_name,
                                        COALESCE(ua.district_name, ua_fallback.district_name) AS district_name,
                                        COALESCE(ua.ward_name, ua_fallback.ward_name) AS ward_name,
                          orr.return_reason, orr.return_evidence, orr.return_rejected_reason,
                          orr.return_rejected_reason AS return_rejection_reason,
                          orr.return_detailed
             FROM orders o 
             JOIN users u ON o.user_id = u.id 
             LEFT JOIN user_addresses ua ON o.user_address_id = ua.id
                         LEFT JOIN user_addresses ua_fallback ON ua_fallback.id = (
                             SELECT uax.id
                             FROM user_addresses uax
                             WHERE uax.user_id = o.user_id
                             ORDER BY uax.is_default DESC, uax.updated_at DESC, uax.id DESC
                             LIMIT 1
                         )
             LEFT JOIN order_returns orr ON o.id = orr.order_id
             WHERE o.status IN ('confirmed', 'shipping', 'delivered', 'failed_delivery_retry', 'failed_delivery', 'return', 'refund_pending', 'refund')
               AND (
                 (o.payment_method IN ('cod', 'bank'))
                 OR (o.payment_method = 'vnpay' AND o.payment_status = 'paid')
               )
             ORDER BY 
               CASE o.status 
                 WHEN 'confirmed' THEN 1 
                 WHEN 'shipping' THEN 2 
                 WHEN 'failed_delivery_retry' THEN 2
                 ELSE 3 
               END,
               o.created_at DESC`
        );
        res.json(orders);
    } catch (err) {
        console.error('Error fetching shipper orders:', err);
        res.status(500).json({ error: 'Lỗi server', message: err.message });
    }
});

// Admin: Lấy các đơn "chưa thiết lập" (những đơn hiện bị loại bởi query chính của admin)
// Admin/Shipper: Cập nhật trạng thái đơn hàng
router.put('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status, note, payment_status } = req.body;
        const orderId = req.params.id;
        
        // 1. Cập nhật trạng thái thanh toán nếu có (Shipper thu tiền COD hoặc Admin xác nhận chuyển khoản)
        if (payment_status) {
            const [currOrder] = await db.query('SELECT status FROM orders WHERE id = ?', [orderId]);
            const oldStatus = currOrder[0]?.status;
            
            await db.query(
                'UPDATE orders SET payment_status = ? WHERE id = ?',
                [payment_status, orderId]
            );
            
            // Nếu chỉ cập nhật thanh toán mà không đổi status đơn thì dừng tại đây
            if (!status) {
                return res.json({ message: 'Đã cập nhật trạng thái thanh toán' });
            }
        }
        
        // 2. Logic cập nhật status đơn hàng (Chỉ chạy nếu có status)
        if (status) {
            // Xử lý giao thất bại: tăng retry_count, kiểm tra nếu đạt 3 lần thì chuyển sang failed_delivery
            if (status === 'failed_delivery_retry' && note) {
                const [orders] = await db.query('SELECT note, retry_count, status FROM orders WHERE id = ?', [orderId]);
                const currentRetry = (orders[0]?.retry_count || 0) + 1;
                const existingNote = orders[0]?.note || '';
                const newNote = existingNote ? `${existingNote}\n[Giao thất bại lần ${currentRetry}] ${note}` : `[Giao thất bại lần ${currentRetry}] ${note}`;
                
                // Nếu đạt 3 lần thất bại, tự động chuyển sang failed_delivery
                const finalStatus = currentRetry >= 3 ? 'failed_delivery' : 'failed_delivery_retry';
                const oldStatus = orders[0]?.status;
                
                await db.query(
                    'UPDATE orders SET status = ?, note = ?, retry_count = ? WHERE id = ?',
                    [finalStatus, newNote, currentRetry, orderId]
                );
                
                // Log status change
                await db.query(
                    'INSERT INTO order_status_logs (order_id, status_old, status_new, created_at) VALUES (?, ?, ?, NOW())',
                    [orderId, oldStatus, finalStatus]
                );
                
                return res.json({ 
                    message: currentRetry >= 3 ? 'Đã chuyển sang trạng thái giao thất bại cuối cùng' : `Lần giao thất bại ${currentRetry}/3`,
                    retryCount: currentRetry,
                    autoFailure: currentRetry >= 3
                });
            }
            
            // Xử lý hoàn tiền
            if (status === 'refund' && note) {
                const [orders] = await db.query('SELECT note, status FROM orders WHERE id = ?', [orderId]);
                const existingNote = orders[0]?.note || '';
                const oldOrderStatus = orders[0]?.status;
                const newNote = existingNote ? `${existingNote}\n[Hoàn tiền xác nhận] ${note}` : `[Hoàn tiền xác nhận] ${note}`;
                
                await db.query(
                    'UPDATE orders SET status = ?, note = ?, payment_status = ? WHERE id = ?',
                    [status, newNote, 'refunded', orderId]
                );
                
                // Log status change
                if (oldOrderStatus !== status) {
                    await db.query(
                        'INSERT INTO order_status_logs (order_id, status_old, status_new, created_at) VALUES (?, ?, ?, NOW())',
                        [orderId, oldOrderStatus, status]
                    );
                }

                // ===== Ghi inventory_logs khi hoàn tiền (nhập hàng lại) =====
                try {
                    const [orderItems] = await db.query(
                        'SELECT variant_id, product_id, quantity FROM order_items WHERE order_id = ?',
                        [orderId]
                    );

                    for (const item of orderItems) {
                        if (item.variant_id) {
                            await db.query(
                                `INSERT INTO inventory_logs (variant_id, quantity_changed, action_type, reference_code, note, created_at)
                                 VALUES (?, ?, ?, ?, ?, NOW())`,
                                [
                                    item.variant_id,
                                    item.quantity,              // Dương vì nhập hàng lại
                                    'RETURN',                   // Loại: hoàn hàng
                                    `DH-${orderId}-RETURN`,    // Mã đối chiếu
                                    `Khách hàng hoàn hàng (Đơn: ${orderId})` // Ghi chú
                                ]
                            );
                        }
                    }
                } catch (inventoryErr) {
                    console.error(`Lỗi ghi inventory hoàn hàng cho đơn ${orderId}:`, inventoryErr.message);
                }
                
                return res.json({ message: 'Đã xác nhận hoàn tiền cho khách hàng' });
            }
            
            // Xây dựng câu UPDATE động dựa trên status
            const [currentOrder] = await db.query('SELECT status FROM orders WHERE id = ?', [orderId]);
            const oldStatus = currentOrder[0]?.status;

            // Trạng thái này phải đi qua endpoint riêng để lưu chi tiết vận đơn hoàn trả
            if (status === 'return_shipped') {
                return res.status(400).json({
                    error: 'Không thể cập nhật trực tiếp return_shipped. Vui lòng dùng API xác nhận gửi hàng hoàn từ phía khách hàng.'
                });
            }

            // Chỉ cho phép xác nhận đã nhận hàng hoàn sau khi khách đã xác nhận gửi hàng
            if (status === 'return_received' && oldStatus !== 'return_shipped') {
                return res.status(400).json({
                    error: 'Đơn hàng phải ở trạng thái return_shipped trước khi xác nhận đã nhận hàng hoàn.'
                });
            }
            
            let updateQuery = 'UPDATE orders SET status = ?';
            const updateParams = [status];
            
            updateQuery += ' WHERE id = ?';
            updateParams.push(orderId);
            
            await db.query(updateQuery, updateParams);
            
            // Log status change to order_status_logs
            if (oldStatus !== status) {
                await db.query(
                    'INSERT INTO order_status_logs (order_id, status_old, status_new, created_at) VALUES (?, ?, ?, NOW())',
                    [orderId, oldStatus, status]
                );
            }
            
            // Nếu đơn hàng đã giao thành công, cập nhật số lượng đã bán (sold)
            if (status === 'delivered') {
                const [orderItems] = await db.query(
                    'SELECT variant_id, product_id, quantity FROM order_items WHERE order_id = ?',
                    [orderId]
                );

                // Check whether `products` table has a `sold` column (legacy deployments)
                const [prodSoldCols] = await db.query("SHOW COLUMNS FROM products LIKE 'sold'");
                const productsHasSold = (prodSoldCols || []).length > 0;

                for (const item of orderItems) {
                    if (item.variant_id) {
                        await db.query(
                            'UPDATE product_variants SET sold = sold + ? WHERE id = ?',
                            [item.quantity, item.variant_id]
                        );
                    } else if (productsHasSold) {
                        // Fallback for older schemas that track sold on products
                        await db.query(
                            'UPDATE products SET sold = sold + ? WHERE id = ?',
                            [item.quantity, item.product_id]
                        );
                    } else {
                        // As a last resort, increment sold on one variant of the product
                        await db.query(
                            'UPDATE product_variants SET sold = sold + ? WHERE product_id = ? ORDER BY id LIMIT 1',
                            [item.quantity, item.product_id]
                        );
                    }
                }
            }

            // Nếu đã nhận hàng hoàn: cộng lại tồn kho
            if (status === 'return_received') {
                const [returnItems] = await db.query(
                    'SELECT variant_id, quantity FROM order_items WHERE order_id = ?',
                    [orderId]
                );
                for (const item of returnItems) {
                    if (item.variant_id) {
                        await db.query(
                            'UPDATE product_variants SET sold = sold - ? WHERE id = ?',
                            [item.quantity, item.variant_id]
                        );
                    }
                }
            }
            
            // Tạo thông báo tự động cho người dùng
            const [orderInfo] = await db.query('SELECT user_id, id FROM orders WHERE id = ?', [orderId]);
            if (orderInfo.length > 0) {
                const userId = orderInfo[0].user_id;
                let notificationTitle = '';
                let notificationMessage = '';
                
                switch(status) {
                    case 'confirmed':
                        notificationTitle = 'Đơn hàng đã được xác nhận';
                        notificationMessage = `Đơn hàng #${orderId} của bạn đã được xác nhận và đang được chuẩn bị.`;
                        break;
                    case 'shipping':
                        notificationTitle = 'Đơn hàng đang vận chuyển';
                        notificationMessage = `Đơn hàng #${orderId} đang được vận chuyển và sẽ đến trong 2-3 ngày.`;
                        break;
                    case 'delivered':
                        notificationTitle = 'Đơn hàng đã được giao';
                        notificationMessage = `Đơn hàng #${orderId} đã được giao thành công. Cảm ơn bạn đã mua hàng!`;
                        break;
                    case 'failed_delivery':
                        notificationTitle = 'Giao hàng không thành công';
                        notificationMessage = `Đơn hàng #${orderId} giao hàng không thành công. Chúng tôi sẽ liên hệ với bạn sớm nhất.`;
                        break;
                    case 'cancelled':
                        notificationTitle = 'Đơn hàng đã bị hủy';
                        notificationMessage = `Đơn hàng #${orderId} đã bị hủy. Nếu có thắc mắc, vui lòng liên hệ với chúng tôi.`;
                        break;
                    case 'refund':
                        notificationTitle = 'Đơn hàng đã được hoàn tiền';
                        notificationMessage = `Đơn hàng #${orderId} đã được hoàn tiền. Tiền sẽ được chuyển về tài khoản của bạn trong 3-5 ngày.`;
                        break;
                    case 'return_received':
                        notificationTitle = 'Đã nhận hàng hoàn';
                        notificationMessage = `Đơn hàng #${orderId} đã được xác nhận nhận hàng hoàn tại kho. Chúng tôi sẽ xử lý hoàn tiền sớm nhất.`;
                        break;
                    case 'return_shipped':
                        notificationTitle = 'Khách đã gửi hàng hoàn';
                        notificationMessage = `Đơn hàng #${orderId} đã được khách xác nhận gửi trả qua đơn vị vận chuyển.`;
                        break;
                }
                
                if (notificationTitle) {
                    try {
                        await createNotification(userId, 'order_status', notificationTitle, notificationMessage, orderId);
                    } catch (notificationError) {
                        console.error('Error creating notification:', notificationError);
                    }
                }

                // Log negative feedback behavior khi đơn hoàn trả đã được nhận tại kho
                if (status === 'return_received') {
                    await logOrderBehavior('return', orderId, userId, {
                        source: 'order_status_update',
                    });
                }
            }
        }
        
        res.json({ message: 'Đã cập nhật trạng thái đơn hàng' });
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ error: 'Lỗi server', message: err.message });
    }
});

// Admin: Lấy các đơn "chưa thiết lập" (những đơn hiện bị loại bởi query chính của admin)
router.get('/unsettled', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Lấy các đơn không thỏa điều kiện của admin: (payment_method IN ('cod','bank')) OR (payment_method = 'vnpay' AND payment_status IN ('paid', 'refunded'))
        const [orders] = await db.query(
            `SELECT o.*, u.email, u.full_name AS user_full_name,
                    ua.full_name AS recipient_name, ua.phone, ua.address_detail,
                    ua.province_name, ua.district_name, ua.ward_name,
                          orr.return_reason, orr.return_evidence, orr.return_rejected_reason,
                          orr.return_rejected_reason AS return_rejection_reason,
                          orr.return_detailed
             FROM orders o 
             JOIN users u ON o.user_id = u.id 
             LEFT JOIN user_addresses ua ON o.user_address_id = ua.id
             LEFT JOIN order_returns orr ON o.id = orr.order_id
             WHERE NOT (
               (o.payment_method IN ('cod', 'bank'))
               OR (o.payment_method = 'vnpay' AND o.payment_status IN ('paid', 'refunded'))
             )
             ORDER BY o.created_at DESC`
        );
        res.json(orders);
    } catch (err) {
        console.error('Error fetching unsettled orders:', err);
        res.status(500).json({ error: 'Lỗi server', message: err.message });
    }
});

// Lấy chi tiết đơn hàng
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT o.*, u.email, u.full_name AS user_full_name,
                    ua.full_name AS recipient_name, ua.phone, ua.address_detail,
                    ua.province_name, ua.district_name, ua.ward_name,
                          orr.return_reason, orr.return_evidence, orr.return_rejected_reason,
                          orr.return_rejected_reason AS return_rejection_reason,
                          orr.return_detailed
             FROM orders o 
             JOIN users u ON o.user_id = u.id 
             LEFT JOIN user_addresses ua ON o.user_address_id = ua.id
             LEFT JOIN order_returns orr ON o.id = orr.order_id
             WHERE o.id = ?`,
            [req.params.id]
        );
        if (orders.length === 0) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

        const order = orders[0];

        // Kiểm tra quyền xem đơn hàng
        if (req.user.role !== 'admin' && req.user.role !== 'shipper' && order.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Không có quyền xem đơn hàng này' });
        }

        const [items] = await db.query(
            `SELECT oi.*, p.name, p.image, COALESCE(b.name, '') as brand
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE oi.order_id = ?`,
            [req.params.id]
        );
        order.items = items;

        res.json(order);
    } catch (err) {
        console.error('Error fetching order details:', err);
        res.status(500).json({ error: 'Lỗi server', message: err.message });
    }
});

// Lấy lịch sử trạng thái của đơn hàng
router.get('/:id/status-logs', authenticateToken, async (req, res) => {
    try {
        const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
        }

        const order = orders[0];

        // Kiểm tra quyền xem đơn hàng
        if (req.user.role !== 'admin' && req.user.role !== 'shipper' && order.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Không có quyền xem đơn hàng này' });
        }

        const [logs] = await db.query(
            'SELECT * FROM order_status_logs WHERE order_id = ? ORDER BY created_at ASC',
            [req.params.id]
        );

        res.json(logs);
    } catch (err) {
        console.error('Error fetching status logs:', err);
        res.status(500).json({ error: 'Lỗi server', message: err.message });
    }
});

// Khách hàng yêu cầu hoàn trả (chỉ cho đơn delivered, trong 7 ngày)
router.post('/:id/return-request', authenticateToken, upload.array('evidence', 5), async (req, res) => {
    try {
        const orderId = req.params.id;
        const { reason } = req.body;

        const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        if (orders.length === 0) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
        const order = orders[0];

        if (order.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Không có quyền thực hiện thao tác này' });
        }
        if (order.status !== 'delivered') {
            return res.status(400).json({ error: 'Chỉ có thể yêu cầu hoàn trả đơn hàng đã được giao thành công' });
        }
        // Get delivered timestamp from order_status_logs (or use created_at as fallback)
        const [statusLog] = await db.query(
            'SELECT created_at FROM order_status_logs WHERE order_id = ? AND status_new = "delivered" ORDER BY created_at DESC LIMIT 1',
            [orderId]
        );
        const deliveredAt = statusLog[0]?.created_at || order.created_at;
        const daysSince = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 7) {
            return res.status(400).json({ error: 'Đã quá 7 ngày kể từ khi nhận hàng, không thể yêu cầu hoàn trả' });
        }
        if (!reason || !reason.trim()) {
            return res.status(400).json({ error: 'Vui lòng chọn lý do hoàn trả' });
        }

        const evidenceUrls = (req.files || []).map(f => `/uploads/${f.filename}`);
        
        // Update order status
        await db.query(
            `UPDATE orders SET status = 'return_requested' WHERE id = ?`,
            [orderId]
        );
        
        // Log status change
        await db.query(
            'INSERT INTO order_status_logs (order_id, status_old, status_new) VALUES (?, ?, ?)',
            [orderId, 'delivered', 'return_requested']
        );
        
        // Insert return details into order_returns
        await db.query(
            'INSERT INTO order_returns (order_id, return_reason, return_evidence) VALUES (?, ?, ?)',
            [orderId, reason.trim(), JSON.stringify(evidenceUrls)]
        );

        // Thông báo cho admin
        await db.query(
            'INSERT INTO notifications (user_id, title, message, type, order_id) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'Yêu cầu hoàn trả đã gửi',
             `Yêu cầu hoàn trả đơn hàng #${orderId} đã được gửi. Chúng tôi sẽ xem xét và phản hồi sớm nhất.`,
             'order_status', orderId]
        ).catch(() => {});

        res.json({ message: 'Yêu cầu hoàn trả đã được gửi thành công' });
    } catch (err) {
        console.error('Return request error:', err);
        res.status(500).json({ error: 'Lỗi server', message: err.message });
    }
});

// Admin duyệt / từ chối yêu cầu hoàn trả
router.post('/:id/return-review', authenticateToken, isAdmin, async (req, res) => {
    try {
        const orderId = req.params.id;
        const { action, rejection_reason } = req.body;

        const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        if (orders.length === 0) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
        const order = orders[0];

        if (order.status !== 'return_requested') {
            return res.status(400).json({ error: 'Đơn hàng không ở trạng thái yêu cầu hoàn trả' });
        }

        const warehouseAddress = process.env.WAREHOUSE_ADDRESS || 'Kho Shoestore - Liên hệ admin@gmail.com để biết địa chỉ';

        if (action === 'approve') {
            await db.query(
                `UPDATE orders SET status = 'return_approved' WHERE id = ?`,
                [orderId]
            );
            
            // Log status change
            await db.query(
                'INSERT INTO order_status_logs (order_id, status_old, status_new) VALUES (?, ?, ?)',
                [orderId, 'return_requested', 'return_approved']
            );
            
            await db.query(
                'INSERT INTO notifications (user_id, title, message, type, order_id) VALUES (?, ?, ?, ?, ?)',
                [order.user_id, 'Yêu cầu hoàn trả được chấp nhận',
                  `Yêu cầu hoàn trả đơn hàng #${orderId} đã được chấp nhận. Vui lòng gửi hàng về địa chỉ: ${warehouseAddress} và xác nhận "Đã gửi hàng hoàn" trên trang đơn hàng của bạn.`,
                 'order_status', orderId]
            ).catch(() => {});
            return res.json({ message: 'Đã duyệt yêu cầu hoàn trả' });
        }

        if (action === 'reject') {
            if (!rejection_reason || !rejection_reason.trim()) {
                return res.status(400).json({ error: 'Vui lòng nhập lý do từ chối' });
            }
            await db.query(
                `UPDATE orders SET status = 'return_rejected' WHERE id = ?`,
                [orderId]
            );
            
            // Log status change
            await db.query(
                'INSERT INTO order_status_logs (order_id, status_old, status_new) VALUES (?, ?, ?)',
                [orderId, 'return_requested', 'return_rejected']
            );
            
            // Update rejection reason in order_returns
            await db.query(
                'UPDATE order_returns SET return_rejected_reason = ? WHERE order_id = ?',
                [rejection_reason.trim(), orderId]
            );
            
            await db.query(
                'INSERT INTO notifications (user_id, title, message, type, order_id) VALUES (?, ?, ?, ?, ?)',
                [order.user_id, 'Yêu cầu hoàn trả bị từ chối',
                 `Yêu cầu hoàn trả đơn hàng #${orderId} đã bị từ chối. Lý do: ${rejection_reason.trim()}`,
                 'order_status', orderId]
            ).catch(() => {});
            return res.json({ message: 'Đã từ chối yêu cầu hoàn trả' });
        }

        return res.status(400).json({ error: 'action phải là approve hoặc reject' });
    } catch (err) {
        console.error('Return review error:', err);
        res.status(500).json({ error: 'Lỗi server', message: err.message });
    }
});

// Khách hàng xác nhận đã gửi hàng hoàn qua đơn vị vận chuyển
router.post('/:id/confirm-return-shipped', authenticateToken, async (req, res) => {
    try {
        const orderId = req.params.id;
        const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
        }

        const order = orders[0];
        if (order.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Không có quyền thực hiện thao tác này' });
        }

        if (order.status !== 'return_approved') {
            return res.status(400).json({ error: 'Đơn hàng chưa ở trạng thái được duyệt hoàn trả' });
        }

        let detailList = req.body.return_detailed;
        if (typeof detailList === 'string') {
            try {
                detailList = JSON.parse(detailList);
            } catch {
                detailList = null;
            }
        }

        if (!detailList) {
            detailList = [{
                carrier: req.body.carrier,
                tracking_code: req.body.tracking_code,
                receipt_image: req.body.receipt_image,
                refund_info: req.body.refund_info,
            }];
        }

        if (!Array.isArray(detailList)) {
            detailList = [detailList];
        }

        const normalizedDetails = detailList
            .map((item) => ({
                carrier: String(item?.carrier || '').trim(),
                tracking_code: String(item?.tracking_code || '').trim(),
                receipt_image: String(item?.receipt_image || '').trim(),
                refund_info: String(item?.refund_info || '').trim(),
            }))
            .filter((item) => item.carrier || item.tracking_code || item.receipt_image || item.refund_info);

        if (normalizedDetails.length === 0) {
            return res.status(400).json({ error: 'Vui lòng nhập thông tin gửi hàng hoàn' });
        }

        if (!normalizedDetails[0].carrier || !normalizedDetails[0].tracking_code) {
            return res.status(400).json({ error: 'Vui lòng nhập đơn vị vận chuyển và mã vận đơn' });
        }

        const [updateReturn] = await db.query(
            'UPDATE order_returns SET return_detailed = ? WHERE order_id = ?',
            [JSON.stringify(normalizedDetails), orderId]
        );

        if (!updateReturn.affectedRows) {
            return res.status(400).json({ error: 'Không tìm thấy thông tin yêu cầu hoàn trả cho đơn hàng này' });
        }

        await db.query("UPDATE orders SET status = 'return_shipped' WHERE id = ?", [orderId]);
        await db.query(
            'INSERT INTO order_status_logs (order_id, status_old, status_new, created_at) VALUES (?, ?, ?, NOW())',
            [orderId, 'return_approved', 'return_shipped']
        );

        // Thông báo cho admin để kiểm tra kiện hàng trả về
        const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin'");
        await Promise.all(
            (admins || []).map((admin) => db.query(
                'INSERT INTO notifications (user_id, title, message, type, order_id) VALUES (?, ?, ?, ?, ?)',
                [admin.id, 'Khách đã gửi hàng hoàn', `Đơn hàng #${orderId}: khách đã xác nhận gửi hàng hoàn, vui lòng theo dõi để nhận hàng.`, 'order_status', orderId]
            ).catch(() => {}))
        );

        res.json({
            message: 'Đã xác nhận gửi hàng hoàn thành công',
            return_detailed: normalizedDetails,
        });
    } catch (err) {
        console.error('Confirm return shipped error:', err);
        res.status(500).json({ error: 'Lỗi server', message: err.message });
    }
});

// Admin: Từ chối hoàn trả khi khách đã gửi hàng nhưng hàng không thể tiếp tục xử lý
router.post('/:id/reject-return-shipped', authenticateToken, isAdmin, async (req, res) => {
    try {
        const orderId = req.params.id;
        const { reason } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({ error: 'Vui lòng cung cấp lý do từ chối.' });
        }

        const [orders] = await db.query("SELECT * FROM orders WHERE id = ? AND status = 'return_shipped'", [orderId]);
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng hoặc đơn hàng không ở trạng thái phù hợp.' });
        }

        const order = orders[0];

        await db.query("UPDATE orders SET status = 'return_rejected' WHERE id = ?", [orderId]);

        await db.query(
            'INSERT INTO order_status_logs (order_id, status_old, status_new, created_at) VALUES (?, ?, ?, NOW())',
            [orderId, 'return_shipped', 'return_rejected']
        );

        await db.query(
            'UPDATE order_returns SET return_rejected_reason = ? WHERE order_id = ?',
            [reason.trim(), orderId]
        ).catch(() => {});

        await createNotification(
            order.user_id,
            'order_status',
            'Yêu cầu hoàn trả bị từ chối',
            `Đơn hàng #${orderId} đã bị từ chối hoàn trả. Lý do: ${reason.trim()}.`,
            orderId
        );

        res.json({ message: 'Đã từ chối hoàn trả.' });
    } catch (err) {
        console.error('Error rejecting shipped return:', err);
        res.status(500).json({ error: 'Lỗi server', message: err.message });
    }
});

// Admin: Từ chối hoàn tiền khi hàng trả về bị hư hỏng
router.post('/:id/refund-rejection', authenticateToken, isAdmin, async (req, res) => {
    try {
        const orderId = req.params.id;
        const { reason } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({ error: 'Vui lòng nhập lý do từ chối' });
        }

        const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        if (orders.length === 0) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
        const order = orders[0];

        if (order.status !== 'return_received' && order.status !== 'refund_pending') {
            return res.status(400).json({ error: 'Đơn hàng không ở trạng thái chờ xử lý hoàn tiền' });
        }

        // Update order status to return_rejected
        await db.query(
            `UPDATE orders SET status = 'return_rejected' WHERE id = ?`,
            [orderId]
        );
        
        // Log status change
        await db.query(
            'INSERT INTO order_status_logs (order_id, status_old, status_new) VALUES (?, ?, ?)',
            [orderId, order.status, 'return_rejected']
        );
        
        // Update rejection reason in order_returns table
        await db.query(
            'UPDATE order_returns SET return_rejected_reason = ? WHERE order_id = ?',
            [reason.trim(), orderId]
        ).catch(() => {});
        
        // Send notification to customer
        if (order.user_id) {
            await db.query(
                'INSERT INTO notifications (user_id, title, message, type, order_id) VALUES (?, ?, ?, ?, ?)',
                [order.user_id, 'Yêu cầu hoàn tiền bị từ chối',
                 `Yêu cầu hoàn tiền đơn hàng #${orderId} đã bị từ chối. Lý do: ${reason.trim()}. Vui lòng liên hệ admin để biết thêm chi tiết.`,
                 'order_status', orderId]
            ).catch(() => {});
        }

        return res.json({ message: 'Đã từ chối hoàn tiền' });
    } catch (err) {
        console.error('Refund rejection error:', err);
        res.status(500).json({ error: 'Lỗi server', message: err.message });
    }
});

// Admin: Chấp nhận yêu cầu hoàn trả
router.post('/:id/approve-return', authenticateToken, isAdmin, async (req, res) => {
    try {
        const orderId = req.params.id;
        const [orders] = await db.query("SELECT * FROM orders WHERE id = ? AND status = 'return_requested'", [orderId]);
        if (orders.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng hoặc đơn hàng không ở trạng thái phù hợp.' });
        }
        const order = orders[0];

        await db.query("UPDATE orders SET status = 'return_approved' WHERE id = ?", [orderId]);
        
        // Log status change
        await db.query(
            'INSERT INTO order_status_logs (order_id, status_old, status_new) VALUES (?, ?, ?)',
            [orderId, 'return_requested', 'return_approved']
        );
        
        const warehouseAddress = process.env.WAREHOUSE_ADDRESS || 'Kho Shoestore - Liên hệ admin@gmail.com để biết địa chỉ';
        await createNotification(order.user_id, 'order_status', 'Yêu cầu hoàn trả được chấp nhận', `Yêu cầu hoàn trả cho đơn hàng #${orderId} đã được chấp nhận. Vui lòng gửi hàng về địa chỉ: ${warehouseAddress}`, orderId);

        res.json({ message: 'Đã chấp nhận yêu cầu hoàn trả.' });
    } catch (err) {
        console.error('Error approving return:', err);
        res.status(500).json({ error: 'Lỗi server', message: err.message });
    }
});

// Admin: Từ chối yêu cầu hoàn trả
router.post('/:id/reject-return', authenticateToken, isAdmin, async (req, res) => {
    try {
        const orderId = req.params.id;
        const { reason } = req.body;
        if (!reason) {
            return res.status(400).json({ message: 'Vui lòng cung cấp lý do từ chối.' });
        }

        const [orders] = await db.query("SELECT * FROM orders WHERE id = ? AND status = 'return_requested'", [orderId]);
        if (orders.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng hoặc đơn hàng không ở trạng thái phù hợp.' });
        }
        const order = orders[0];

        await db.query("UPDATE orders SET status = 'return_rejected' WHERE id = ?", [orderId]);
        
        // Log status change
        await db.query(
            'INSERT INTO order_status_logs (order_id, status_old, status_new) VALUES (?, ?, ?)',
            [orderId, 'return_requested', 'return_rejected']
        );
        
        // Update rejection reason in order_returns
        await db.query(
            'UPDATE order_returns SET return_rejected_reason = ? WHERE order_id = ?',
            [reason, orderId]
        );
        
        await createNotification(order.user_id, 'order_status', 'Yêu cầu hoàn trả bị từ chối', `Yêu cầu hoàn trả cho đơn hàng #${orderId} đã bị từ chối. Lý do: ${reason}`, orderId);

        res.json({ message: 'Đã từ chối yêu cầu hoàn trả.' });
    } catch (err) {
        console.error('Error rejecting return:', err);
        res.status(500).json({ error: 'Lỗi server', message: err.message });
    }
});

// Admin: Xác nhận đã nhận hàng hoàn
router.post('/:id/receive-return', authenticateToken, isAdmin, async (req, res) => {
    try {
        const orderId = req.params.id;
        const [orders] = await db.query("SELECT * FROM orders WHERE id = ? AND status = 'return_shipped'", [orderId]);
        if (orders.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng hoặc đơn hàng không ở trạng thái phù hợp.' });
        }
        const order = orders[0];

        // Cập nhật trạng thái đơn hàng
        await db.query("UPDATE orders SET status = 'return_received' WHERE id = ?", [orderId]);
        
        // Log status change
        await db.query(
            'INSERT INTO order_status_logs (order_id, status_old, status_new, created_at) VALUES (?, ?, ?, NOW())',
            [orderId, 'return_shipped', 'return_received']
        );

        // Hoàn lại tồn kho
        const [items] = await db.query('SELECT variant_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
        for (const item of items) {
            if (item.variant_id) {
                await db.query('UPDATE product_variants SET sold = sold - ? WHERE id = ?', [item.quantity, item.variant_id]);
            }
        }
        
        await createNotification(order.user_id, 'order_status', 'Đã nhận hàng hoàn', `Chúng tôi đã nhận được hàng hoàn cho đơn hàng #${orderId} và sẽ xử lý hoàn tiền sớm.`, orderId);

        res.json({ message: 'Đã xác nhận nhận hàng hoàn và cập nhật tồn kho.' });
    } catch (err) {
        console.error('Error receiving return:', err);
        res.status(500).json({ error: 'Lỗi server', message: err.message });
    }
});

// Admin: Xử lý hoàn tiền
router.post('/:id/process-refund', authenticateToken, isAdmin, async (req, res) => {
    try {
        const orderId = req.params.id;
        // Chấp nhận hoàn tiền cho đơn có status: 'return_received', 'refund_pending', 'failed_delivery'
        const [orders] = await db.query("SELECT * FROM orders WHERE id = ? AND status IN ('return_received', 'refund_pending', 'failed_delivery')", [orderId]);
        if (orders.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng hoặc đơn hàng không ở trạng thái phù hợp để hoàn tiền.' });
        }
        const order = orders[0];

        // Chỉ hoàn tiền cho các đơn đã thanh toán
        if (order.payment_status !== 'paid') {
            // Nếu là COD và giao thất bại, chỉ cần cập nhật status, không hoàn tiền
            if (order.payment_method === 'cod' && order.status === 'failed_delivery') {
                 const [currOrder2] = await db.query('SELECT status FROM orders WHERE id = ?', [orderId]);
                 await db.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [orderId]);
                 // Log status change
                 await db.query(
                     'INSERT INTO order_status_logs (order_id, status_old, status_new, created_at) VALUES (?, ?, ?, NOW())',
                     [orderId, currOrder2[0]?.status, 'cancelled']
                 );
                 return res.json({ message: 'Đơn hàng COD giao thất bại đã được hủy.' });
            }
            return res.status(400).json({ message: 'Đơn hàng này chưa được thanh toán, không thể hoàn tiền.' });
        }

        // Cập nhật trạng thái đơn hàng: refund_pending -> refund (đã hoàn tiền)
        const [currOrderRefund] = await db.query('SELECT status FROM orders WHERE id = ?', [orderId]);
        await db.query("UPDATE orders SET status = 'refund', payment_status = 'refunded' WHERE id = ?", [orderId]);
        // Log status change
        await db.query(
            'INSERT INTO order_status_logs (order_id, status_old, status_new, created_at) VALUES (?, ?, ?, NOW())',
            [orderId, currOrderRefund[0]?.status, 'refund']
        );
        
        await createNotification(order.user_id, 'order_status', 'Đã hoàn tiền', `Đơn hàng #${orderId} đã được hoàn tiền thành công.`, orderId);

        res.json({ message: 'Đã hoàn tiền thành công cho đơn hàng.' });
    } catch (err) {
        console.error('Error processing refund:', err);
        res.status(500).json({ error: 'Lỗi server', message: err.message });
    }
});

module.exports = router;
