const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Lấy giỏ hàng của user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT c.*, p.name, p.price, p.image, COALESCE(b.name, 'N/A') as brand
       FROM cart_items c 
       JOIN products p ON c.product_id = p.id 
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE c.user_id = ?`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Thêm sản phẩm vào giỏ
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { product_id, quantity } = req.body;

        // Kiểm tra sản phẩm đã có trong giỏ chưa
        const [existing] = await db.query(
            'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
            [req.user.id, product_id]
        );

        if (existing.length > 0) {
            // Cập nhật số lượng
            await db.query(
                'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
                [quantity, req.user.id, product_id]
            );
        } else {
            // Thêm mới
            await db.query(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [req.user.id, product_id, quantity]
            );
        }

        // Ghi log hành động add_to_cart
        await db.query(
            'INSERT INTO user_behavior_logs (user_id, action, product_id, extra_info) VALUES (?, ?, ?, ?)',
            [req.user.id, 'add_to_cart', product_id, JSON.stringify({ quantity })]
        );

        res.json({ message: 'Đã thêm vào giỏ hàng' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Cập nhật số lượng sản phẩm trong giỏ
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { quantity } = req.body;
        await db.query(
            'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
            [quantity, req.params.id, req.user.id]
        );
        res.json({ message: 'Đã cập nhật giỏ hàng' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Xóa sản phẩm khỏi giỏ
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await db.query(
            'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Đã xóa khỏi giỏ hàng' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Xóa toàn bộ giỏ hàng
router.delete('/', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
        res.json({ message: 'Đã xóa toàn bộ giỏ hàng' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
