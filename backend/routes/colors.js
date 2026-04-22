const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Lấy tất cả màu sắc
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [colors] = await db.query('SELECT * FROM colors ORDER BY color ASC');
        res.json(colors);
    } catch (error) {
        console.error('Error fetching colors:', error);
        res.status(500).json({ error: 'Lỗi server', message: error.message });
    }
});

// Tạo màu sắc mới
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { color, hex_code } = req.body;
        
        if (!color || !hex_code) {
            return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
        }

        // Kiểm tra trùng lặp
        const [existing] = await db.query('SELECT id FROM colors WHERE LOWER(color) = LOWER(?)', [color]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Màu này đã tồn tại' });
        }

        const [result] = await db.query(
            'INSERT INTO colors (color, hex_code) VALUES (?, ?)',
            [color, hex_code]
        );
        
        res.json({ id: result.insertId, color, hex_code });
    } catch (error) {
        console.error('Error creating color:', error);
        res.status(500).json({ error: 'Lỗi server', message: error.message });
    }
});

// Cập nhật màu sắc
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { color, hex_code } = req.body;
        
        if (!color || !hex_code) {
            return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
        }

        // Kiểm tra trùng lặp (ngoại trừ chính nó)
        const [existing] = await db.query(
            'SELECT id FROM colors WHERE LOWER(color) = LOWER(?) AND id != ?',
            [color, id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Màu này đã tồn tại' });
        }

        await db.query(
            'UPDATE colors SET color = ?, hex_code = ?, updated_at = NOW() WHERE id = ?',
            [color, hex_code, id]
        );
        
        res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
        console.error('Error updating color:', error);
        res.status(500).json({ error: 'Lỗi server', message: error.message });
    }
});

// Xóa màu sắc
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Kiểm tra có variant sử dụng màu này không
        const [variants] = await db.query(
            'SELECT COUNT(*) as count FROM product_variants WHERE color = (SELECT color FROM colors WHERE id = ?)',
            [id]
        );
        
        if (variants[0].count > 0) {
            return res.status(400).json({ 
                error: 'Không thể xóa', 
                message: `Màu này đang được sử dụng trong ${variants[0].count} biến thể sản phẩm` 
            });
        }

        await db.query('DELETE FROM colors WHERE id = ?', [id]);
        res.json({ message: 'Xóa thành công' });
    } catch (error) {
        console.error('Error deleting color:', error);
        res.status(500).json({ error: 'Lỗi server', message: error.message });
    }
});

module.exports = router;
