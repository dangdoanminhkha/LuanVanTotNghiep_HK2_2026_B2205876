const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// ────────────────────────────────────────────────────────────────────────────
// ADMIN: Tạo voucher mới
// ────────────────────────────────────────────────────────────────────────────
router.post('/admin/create', authenticateToken, isAdmin, async (req, res) => {
  try {
    const user = req.user;
    
    // Kiểm tra admin
    if (user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Chỉ admin có thể tạo voucher' });
    }

    const {
      code,
      voucher_type, // 'free_shipping' | 'discount'
      discount_amount, // định nghĩa nếu type = discount
      min_order_value,
      max_usage_per_user,
      total_usage_limit,
      duration_days,
      description
    } = req.body;

    // Validate
    if (!code || !voucher_type || !duration_days) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Thiếu thông tin: code, voucher_type, duration_days' 
      });
    }

    if (!['free_shipping', 'discount'].includes(voucher_type)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'voucher_type phải là "free_shipping" hoặc "discount"' 
      });
    }

    if (voucher_type === 'discount' && !discount_amount) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Nếu type = discount, phải cung cấp discount_amount' 
      });
    }

    // Tính valid_until
    const valid_from = new Date();
    const valid_until = new Date(valid_from.getTime() + duration_days * 24 * 60 * 60 * 1000);

    const query = `
      INSERT INTO vouchers 
      (code, voucher_type, discount_amount, min_order_value, max_usage_per_user, 
       total_usage_limit, duration_days, description, valid_from, valid_until, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;

    await db.query(query, [
      code.toUpperCase(),
      voucher_type,
      voucher_type === 'discount' ? discount_amount : null,
      min_order_value || 0,
      max_usage_per_user || 1,
      total_usage_limit || null,
      duration_days,
      description || '',
      valid_from,
      valid_until
    ]);

    res.json({ 
      status: 'success', 
      message: 'Tạo voucher thành công',
      voucher: { code: code.toUpperCase(), valid_until }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// ADMIN: Liệt kê tất cả vouchers
// ────────────────────────────────────────────────────────────────────────────
router.get('/admin/list', authenticateToken, isAdmin, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Chỉ admin có thể xem' });
    }

    const query = `
      SELECT 
        id, code, voucher_type, discount_amount, min_order_value,
        max_usage_per_user, total_usage_limit, current_usage,
        valid_from, valid_until, duration_days, description,
        is_active, created_at
      FROM vouchers
      ORDER BY created_at DESC
    `;

    const [vouchers] = await db.query(query);
    
    res.json({ 
      status: 'success',
      vouchers: vouchers.map(v => ({
        id: v.id,
        code: v.code,
        voucher_type: v.voucher_type,
        discount_amount: v.discount_amount,
        min_order_value: v.min_order_value,
        max_usage_per_user: v.max_usage_per_user,
        total_usage_limit: v.total_usage_limit,
        current_usage: v.current_usage,
        valid_from: v.valid_from,
        valid_until: v.valid_until,
        duration_days: v.duration_days,
        description: v.description,
        is_active: v.is_active,
        created_at: v.created_at,
        remaining_usage: v.total_usage_limit ? (v.total_usage_limit - v.current_usage) : 'Unlimited',
        status: new Date() > v.valid_until ? 'Hết hạn' : (v.is_active ? 'Hoạt động' : 'Vô hiệu hóa')
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// USER: Liệt kê vouchers có sẵn (không expired, active)
// ────────────────────────────────────────────────────────────────────────────
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { order_total = 0 } = req.query; // Giá trị đơn hiện tại (để validated min_order_value)

    const query = `
      SELECT 
        v.id, v.code, v.voucher_type, v.discount_amount, v.min_order_value,
        v.max_usage_per_user, v.valid_until, v.description,
        COALESCE(uvu.used_count, 0) as user_used_count,
        CASE 
          WHEN (v.total_usage_limit IS NOT NULL AND v.current_usage >= v.total_usage_limit) THEN 'Hết lượt'
          WHEN NOW() > v.valid_until THEN 'Hết hạn'
          WHEN v.is_active = 0 THEN 'Vô hiệu hóa'
          WHEN v.min_order_value > ? THEN 'Giá trị đơn không đủ'
          WHEN COALESCE(uvu.used_count, 0) >= v.max_usage_per_user THEN 'Đã dùng hết lượt'
          ELSE 'Có thể dùng'
        END as status
      FROM vouchers v
      LEFT JOIN user_voucher_usage uvu ON v.id = uvu.voucher_id AND uvu.user_id = ?
      WHERE v.is_active = 1
        AND NOW() <= v.valid_until
        AND (v.total_usage_limit IS NULL OR v.current_usage < v.total_usage_limit)
      ORDER BY 
        CASE 
          WHEN (COALESCE(uvu.used_count, 0) < v.max_usage_per_user) THEN 0
          ELSE 1
        END,
        v.discount_amount DESC
    `;

    const [vouchers] = await db.query(query, [parseInt(order_total), user.id]);
    
    res.json({ 
      status: 'success',
      vouchers: vouchers.map(v => ({
        id: v.id,
        code: v.code,
        type: v.voucher_type,
        discount: v.discount_amount,
        min_value: v.min_order_value,
        expires_at: v.valid_until,
        description: v.description,
        user_can_use: v.status === 'Có thể dùng',
        reason: v.status,
        user_used_count: v.user_used_count
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// USER: Validate và áp dụng voucher cho order
// ────────────────────────────────────────────────────────────────────────────
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { voucher_code, order_total } = req.body;

    if (!voucher_code || !order_total) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Thiếu voucher_code hoặc order_total' 
      });
    }

    // Lấy voucher
    const voucherQuery = `
      SELECT * FROM vouchers 
      WHERE code = ? AND is_active = 1
    `;
    const [vouchers] = await db.query(voucherQuery, [voucher_code.toUpperCase()]);
    
    if (vouchers.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Voucher không tồn tại' });
    }

    const voucher = vouchers[0];

    // Kiểm tra hạn sử dụng
    if (new Date() > voucher.valid_until) {
      return res.status(400).json({ status: 'error', message: 'Voucher đã hết hạn' });
    }

    // Kiểm tra giá trị đơn
    if (order_total < voucher.min_order_value) {
      return res.status(400).json({ 
        status: 'error', 
        message: `Giá trị đơn phải >= ${voucher.min_order_value.toLocaleString('vi-VN')} VND` 
      });
    }

    // Kiểm tra tổng lượt dùng
    if (voucher.total_usage_limit && voucher.current_usage >= voucher.total_usage_limit) {
      return res.status(400).json({ status: 'error', message: 'Voucher đã hết lượt dùng' });
    }

    // Kiểm tra tần suất user
    const usageQuery = `
      SELECT used_count FROM user_voucher_usage 
      WHERE user_id = ? AND voucher_id = ?
    `;
    const [usages] = await db.query(usageQuery, [user.id, voucher.id]);
    const userUsedCount = usages.length > 0 ? usages[0].used_count : 0;

    if (userUsedCount >= voucher.max_usage_per_user) {
      return res.status(400).json({ 
        status: 'error', 
        message: `Bạn đã dùng voucher này ${userUsedCount} lần (tối đa: ${voucher.max_usage_per_user})` 
      });
    }

    // Tính discount
    let discount = 0;
    if (voucher.voucher_type === 'discount') {
      discount = voucher.discount_amount;
    } else if (voucher.voucher_type === 'free_shipping') {
      // Miễn phí vận chuyển - cần lấy từ order (mặc định ~30k hoặc từ config)
      // Ở đây sẽ return loại voucher để frontend tính
      discount = 0; // Will be handled separately for free_shipping
    }

    res.json({ 
      status: 'success',
      message: 'Voucher hợp lệ',
      voucher: {
        id: voucher.id,
        code: voucher.code,
        type: voucher.voucher_type,
        discount_amount: discount,
        description: voucher.description
      },
      can_apply: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Internal: Ghi nhận áp dụng voucher vào order (gọi từ checkout)
// ────────────────────────────────────────────────────────────────────────────
router.post('/apply-to-order', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { voucher_id, order_id, discount_applied } = req.body;

    // Cập nhật user_voucher_usage
    const upsertUsageQuery = `
      INSERT INTO user_voucher_usage (user_id, voucher_id, used_count)
      VALUES (?, ?, 1)
      ON DUPLICATE KEY UPDATE 
        used_count = used_count + 1,
        last_used_at = NOW()
    `;
    await db.query(upsertUsageQuery, [user.id, voucher_id]);

    // Cập nhật current_usage trong vouchers
    const updateVoucherQuery = `
      UPDATE vouchers 
      SET current_usage = current_usage + 1
      WHERE id = ?
    `;
    await db.query(updateVoucherQuery, [voucher_id]);

    // Cập nhật voucher vào đơn hàng
    const applyVoucherQuery = `
      UPDATE orders 
      SET voucher_id = ?, discount_applied = ?, applied_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await db.query(applyVoucherQuery, [voucher_id, discount_applied, order_id]);

    res.json({ 
      status: 'success',
      message: 'Đã áp dụng voucher vào đơn hàng' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// ADMIN: Cập nhật voucher
// ────────────────────────────────────────────────────────────────────────────
router.put('/admin/:id/update', authenticateToken, isAdmin, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Chỉ admin có thể cập nhật' });
    }

    const { id } = req.params;
    const {
      voucher_type,
      discount_amount,
      min_order_value,
      max_usage_per_user,
      total_usage_limit,
      duration_days,
      description
    } = req.body;

    // Tính lại valid_until từ duration_days
    const valid_from = new Date();
    const valid_until = new Date(valid_from.getTime() + duration_days * 24 * 60 * 60 * 1000);

    const query = `
      UPDATE vouchers 
      SET 
        voucher_type = ?,
        discount_amount = ?,
        min_order_value = ?,
        max_usage_per_user = ?,
        total_usage_limit = ?,
        duration_days = ?,
        description = ?,
        valid_from = ?,
        valid_until = ?
      WHERE id = ?
    `;

    await db.query(query, [
      voucher_type,
      voucher_type === 'discount' ? discount_amount : null,
      min_order_value || 0,
      max_usage_per_user || 1,
      total_usage_limit || null,
      duration_days,
      description || '',
      valid_from,
      valid_until,
      id
    ]);

    res.json({ 
      status: 'success', 
      message: 'Cập nhật voucher thành công'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// ADMIN: Vô hiệu hóa voucher (single)
// ────────────────────────────────────────────────────────────────────────────
router.put('/admin/:id/deactivate', authenticateToken, isAdmin, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'No permission' });
    }

    await db.query('UPDATE vouchers SET is_active = 0 WHERE id = ?', [req.params.id]);
    
    res.json({ status: 'success', message: 'Vô hiệu hóa voucher thành công' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
