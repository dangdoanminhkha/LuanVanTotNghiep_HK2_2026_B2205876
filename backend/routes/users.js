const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Admin: Lấy danh sách người dùng
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        // include full_name, email and is_verified so admin UI can show names and verified status
        let query = 'SELECT id, email, role, full_name, is_verified, created_at FROM users WHERE 1=1';
        const params = [];

        // Filter by is_verified status if provided
        if (req.query.is_verified !== undefined) {
            query += ' AND is_verified = ?';
            params.push(req.query.is_verified);
        }

        // Filter by search term if provided
        if (req.query.search) {
            query += ' AND (email LIKE ? OR full_name LIKE ?)';
            const searchTerm = `%${req.query.search}%`;
            params.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY created_at DESC';
        const [users] = await db.query(query, params);
        res.json(users);
    } catch (err) {
        console.error('Error in GET /api/users:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Lấy thông tin profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, email, role, full_name, phone, gender, google_id, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if (users.length === 0) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        res.json(users[0]);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Cập nhật thông tin profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { full_name, phone, gender } = req.body;

        // Validate phone number if provided
        if (phone && !/^[0-9]{10,11}$/.test(phone)) {
            return res.status(400).json({ error: 'Số điện thoại không hợp lệ' });
        }

        // Validate gender if provided
        const validGender = ['Nam', 'Nữ', 'Khác'].includes(gender) ? gender : 'Khác';

        await db.query(
            'UPDATE users SET full_name = ?, phone = ?, gender = ? WHERE id = ?',
            [full_name || null, phone || null, validGender, req.user.id]
        );

        // Lấy thông tin user mới sau khi update
        const [users] = await db.query(
            'SELECT id, email, role, full_name, phone, gender, google_id, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        res.json({
            message: 'Cập nhật thông tin thành công',
            user: users[0]
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Đổi mật khẩu
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const bcrypt = require('bcryptjs');

        // Kiểm tra user có đăng nhập bằng Google không
        const [users] = await db.query(
            'SELECT password, google_id FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }

        if (users[0].google_id) {
            return res.status(400).json({ error: 'Tài khoản Google không thể đổi mật khẩu' });
        }

        // Verify current password
        const match = await bcrypt.compare(currentPassword, users[0].password);
        if (!match) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, req.user.id]
        );

        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Admin: Cập nhật role người dùng
router.put('/:id/role', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        if (!['customer', 'admin', 'shipper'].includes(role)) {
            return res.status(400).json({ error: 'Role không hợp lệ' });
        }
        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
        res.json({ message: 'Đã cập nhật role người dùng' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Admin: Lấy thông tin người dùng bởi id
router.get('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, email, role, full_name, phone, gender, is_verified, google_id, created_at FROM users WHERE id = ?',
            [req.params.id]
        );
        if (users.length === 0) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        res.json(users[0]);
    } catch (err) {
        console.error('Error fetching user by id:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Admin: Lấy danh sách đơn hàng của một user (admin)
router.get('/:id/orders', authenticateToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const [orders] = await db.query(
            `SELECT o.*,
                    ua.full_name AS recipient_name, ua.phone, ua.address_detail,
                    ua.province_name, ua.district_name, ua.ward_name
             FROM orders o 
             LEFT JOIN user_addresses ua ON o.user_address_id = ua.id
             WHERE o.user_id = ? 
             ORDER BY o.created_at DESC`,
            [userId]
        );

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
        console.error('Error fetching user orders:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Admin: Cập nhật một vài trường người dùng (is_active, role)
router.patch('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { is_verified, role } = req.body;
        const updates = [];
        const params = [];

        if (typeof is_verified !== 'undefined') {
            updates.push('is_verified = ?');
            params.push(is_verified ? 1 : 0);
        }
        if (typeof role !== 'undefined') {
            if (!['customer', 'admin', 'shipper'].includes(role)) {
                return res.status(400).json({ error: 'Role không hợp lệ' });
            }
            updates.push('role = ?');
            params.push(role);
        }

        if (updates.length === 0) return res.status(400).json({ error: 'Không có trường để cập nhật' });

        params.push(req.params.id);
        const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        await db.query(sql, params);
        res.json({ message: 'Cập nhật người dùng thành công' });
    } catch (err) {
        console.error('Error patching user:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Admin: Xóa người dùng
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'Đã xóa người dùng' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
