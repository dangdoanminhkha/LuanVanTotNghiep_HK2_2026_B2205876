const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/addresses - Lấy tất cả địa chỉ của user hiện tại
router.get('/', auth, async (req, res) => {
  try {
    const [addresses] = await db.query(
      'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    res.json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/addresses/default - Lấy địa chỉ mặc định
router.get('/default', auth, async (req, res) => {
  try {
    const [addresses] = await db.query(
      'SELECT * FROM user_addresses WHERE user_id = ? AND is_default = TRUE LIMIT 1',
      [req.user.id]
    );
    res.json(addresses[0] || null);
  } catch (error) {
    console.error('Error fetching default address:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/addresses - Thêm địa chỉ mới
router.post('/', auth, async (req, res) => {
  try {
    let {
      full_name,
      phone,
      province_code,
      province_name,
      district_code,
      district_name,
      ward_code,
      ward_name,
      address_detail,
      is_default
    } = req.body;

    // Trim whitespace and clean up input
    full_name = (full_name?.toString() || '').trim();
    phone = (phone?.toString() || '').trim();
    address_detail = (address_detail?.toString() || '').trim();
    province_code = (province_code?.toString() || '').trim();
    province_name = (province_name?.toString() || '').trim();
    district_code = (district_code?.toString() || '').trim();
    district_name = (district_name?.toString() || '').trim();
    ward_code = (ward_code?.toString() || '').trim();
    ward_name = (ward_name?.toString() || '').trim();

    // Convert is_default to boolean
    is_default = is_default === true || is_default === 'true' || is_default === 1 || is_default === '1';

    // Validate
    if (!full_name || !phone || !province_code || !district_code || !ward_code || !address_detail) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Kiểm tra xem đây có phải địa chỉ đầu tiên không
    const [existing] = await db.query(
      'SELECT COUNT(*) as count FROM user_addresses WHERE user_id = ?',
      [req.user.id]
    );
    const isFirstAddress = existing[0].count === 0;

    // Nếu là địa chỉ đầu tiên HOẶC user chọn mặc định, set is_default = true
    const finalIsDefault = isFirstAddress || is_default;

    // Nếu đặt làm mặc định, unset tất cả địa chỉ khác
    if (finalIsDefault) {
      await db.query(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?',
        [req.user.id]
      );
    }

    const [result] = await db.query(
      `INSERT INTO user_addresses 
       (user_id, full_name, phone, province_code, province_name, district_code, district_name, ward_code, ward_name, address_detail, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, full_name, phone, province_code, province_name, district_code, district_name, ward_code, ward_name, address_detail, finalIsDefault]
    );

    const [newAddress] = await db.query('SELECT * FROM user_addresses WHERE id = ?', [result.insertId]);
    res.status(201).json(newAddress[0]);
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/addresses/:id - Cập nhật địa chỉ
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    let {
      full_name,
      phone,
      province_code,
      province_name,
      district_code,
      district_name,
      ward_code,
      ward_name,
      address_detail,
      is_default
    } = req.body;

    // Trim whitespace and clean up input
    full_name = (full_name?.toString() || '').trim();
    phone = (phone?.toString() || '').trim();
    address_detail = (address_detail?.toString() || '').trim();
    province_code = (province_code?.toString() || '').trim();
    province_name = (province_name?.toString() || '').trim();
    district_code = (district_code?.toString() || '').trim();
    district_name = (district_name?.toString() || '').trim();
    ward_code = (ward_code?.toString() || '').trim();
    ward_name = (ward_name?.toString() || '').trim();

    // Convert is_default to boolean
    is_default = is_default === true || is_default === 'true' || is_default === 1 || is_default === '1';

    // Kiểm tra quyền sở hữu
    const [existing] = await db.query(
      'SELECT * FROM user_addresses WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy địa chỉ' });
    }

    // Nếu đặt làm mặc định, unset tất cả địa chỉ khác
    if (is_default) {
      await db.query(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = ? AND id != ?',
        [req.user.id, id]
      );
    } else {
      // Nếu đang unset default địa chỉ này, kiểm tra có địa chỉ default khác không
      const [defaultCount] = await db.query(
        'SELECT COUNT(*) as count FROM user_addresses WHERE user_id = ? AND id != ? AND is_default = TRUE',
        [req.user.id, id]
      );
      
      // Nếu không có địa chỉ default khác, tự động set địa chỉ cũ nhất còn lại làm default
      if (defaultCount[0].count === 0) {
        const [oldestAddress] = await db.query(
          'SELECT id FROM user_addresses WHERE user_id = ? AND id != ? ORDER BY created_at ASC LIMIT 1',
          [req.user.id, id]
        );
        
        if (oldestAddress.length > 0) {
          await db.query(
            'UPDATE user_addresses SET is_default = TRUE WHERE id = ?',
            [oldestAddress[0].id]
          );
        }
      }
    }

    await db.query(
      `UPDATE user_addresses SET 
       full_name = ?, phone = ?, province_code = ?, province_name = ?, 
       district_code = ?, district_name = ?, ward_code = ?, ward_name = ?, 
       address_detail = ?, is_default = ?
       WHERE id = ? AND user_id = ?`,
      [full_name, phone, province_code, province_name, district_code, district_name, ward_code, ward_name, address_detail, is_default, id, req.user.id]
    );

    const [updated] = await db.query('SELECT * FROM user_addresses WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/addresses/:id - Xóa địa chỉ
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra quyền sở hữu
    const [existing] = await db.query(
      'SELECT * FROM user_addresses WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy địa chỉ' });
    }

    const isDeletedDefault = existing[0].is_default;

    await db.query('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);

    // Nếu xóa địa chỉ mặc định, set địa chỉ cũ nhất còn lại làm mặc định
    if (isDeletedDefault) {
      const [oldestAddress] = await db.query(
        'SELECT id FROM user_addresses WHERE user_id = ? ORDER BY created_at ASC LIMIT 1',
        [req.user.id]
      );
      
      if (oldestAddress.length > 0) {
        await db.query(
          'UPDATE user_addresses SET is_default = TRUE WHERE id = ?',
          [oldestAddress[0].id]
        );
      }
    }

    res.json({ message: 'Xóa địa chỉ thành công' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/addresses/:id/default - Đặt làm địa chỉ mặc định
router.put('/:id/default', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra quyền sở hữu
    const [existing] = await db.query(
      'SELECT * FROM user_addresses WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy địa chỉ' });
    }

    // Bỏ default của tất cả
    await db.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [req.user.id]);
    
    // Set default cho địa chỉ này
    await db.query('UPDATE user_addresses SET is_default = TRUE WHERE id = ?', [id]);

    res.json({ message: 'Đã đặt làm địa chỉ mặc định' });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
