const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Lấy danh sách thông báo của user
router.get('/', auth, async (req, res) => {
  try {
    const [notifications] = await db.execute(`
      SELECT 
        n.*,
        o.id as order_number,
        p.name as product_name
      FROM notifications n
      LEFT JOIN orders o ON n.order_id = o.id
      LEFT JOIN reviews r ON n.review_id = r.id
      LEFT JOIN products p ON r.product_id = p.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [req.user.id]);

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy thông báo' });
  }
});

// Đánh dấu tất cả thông báo đã đọc (đặt trước /:id để không bị route param chặn)
router.patch('/mark-all-read', auth, async (req, res) => {
  try {
    await db.execute(`
      UPDATE notifications 
      SET is_read = TRUE, updated_at = NOW()
      WHERE user_id = ? AND is_read = FALSE
    `, [req.user.id]);

    res.json({ message: 'Đã đánh dấu tất cả thông báo đã đọc' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Đánh dấu thông báo đã đọc
router.patch('/:id/read', auth, async (req, res) => {
  try {
    await db.execute(`
      UPDATE notifications 
      SET is_read = TRUE, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [req.params.id, req.user.id]);

    res.json({ message: 'Đã đánh dấu đọc thông báo' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Lấy số lượng thông báo chưa đọc
router.get('/unread-count', auth, async (req, res) => {
  try {
    const [result] = await db.execute(`
      SELECT COUNT(*) as unread_count
      FROM notifications
      WHERE user_id = ? AND is_read = FALSE
    `, [req.user.id]);

    res.json({ unread_count: result[0].unread_count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Xóa thông báo
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.execute(`
      DELETE FROM notifications 
      WHERE id = ? AND user_id = ?
    `, [req.params.id, req.user.id]);

    res.json({ message: 'Đã xóa thông báo' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Hàm helper để tạo thông báo (được gọi từ các route khác)
const createNotification = async (userId, type, title, message, orderId = null, reviewId = null) => {
  try {
    await db.execute(`
      INSERT INTO notifications (user_id, type, title, message, order_id, review_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, type, title, message, orderId, reviewId]);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Export router as default và createNotification as named export
module.exports = router;
module.exports.createNotification = createNotification;