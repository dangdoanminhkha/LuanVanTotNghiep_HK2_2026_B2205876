const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/brands - Lấy tất cả brands
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, slug, logo, is_active, sort_order, created_at, updated_at
      FROM brands 
      ORDER BY sort_order ASC, name ASC
    `);
    // MySQL2 trả về [rows, fields], lấy rows (phần tử đầu tiên)
    const brands = Array.isArray(result) ? result[0] : result;
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/brands/active - Lấy brands đang hoạt động
router.get('/active', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, slug, logo, sort_order
      FROM brands 
      WHERE is_active = 1
      ORDER BY sort_order ASC, name ASC
    `);
    const brands = Array.isArray(result) ? result[0] : result;
    res.json(brands);
  } catch (error) {
    console.error('Error fetching active brands:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/brands - Tạo brand mới (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const { name, slug, logo, is_active = true, sort_order = 0 } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tên thương hiệu là bắt buộc' });
    }

    // Tự động tạo slug nếu không có
    const finalSlug = slug || name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Loại bỏ ký tự đặc biệt
      .replace(/\s+/g, '-')         // Thay space bằng -
      .trim();

    const result = await db.query(`
      INSERT INTO brands (name, slug, logo, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `, [name, finalSlug, logo, is_active, sort_order]);

    const insertId = Array.isArray(result) ? result[0].insertId : result.insertId;
    const newBrandResult = await db.query('SELECT * FROM brands WHERE id = ?', [insertId]);
    const newBrand = Array.isArray(newBrandResult) ? newBrandResult[0][0] : newBrandResult[0];
    
    res.status(201).json({ 
      message: 'Thêm thương hiệu thành công',
      brand: newBrand
    });
  } catch (error) {
    console.error('Error creating brand:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Tên thương hiệu đã tồn tại' });
    } else {
      res.status(500).json({ error: 'Lỗi server' });
    }
  }
});

// PUT /api/brands/:id - Cập nhật brand (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const { id } = req.params;
    const { name, slug, logo, is_active, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tên thương hiệu là bắt buộc' });
    }

    await db.query(`
      UPDATE brands 
      SET name = ?, slug = ?, logo = ?, is_active = ?, sort_order = ?, updated_at = NOW()
      WHERE id = ?
    `, [name, slug, logo, is_active, sort_order, id]);

    const updatedBrandResult = await db.query('SELECT * FROM brands WHERE id = ?', [id]);
    const updatedBrand = Array.isArray(updatedBrandResult) ? updatedBrandResult[0][0] : updatedBrandResult[0];
    
    res.json({
      message: 'Cập nhật thương hiệu thành công',
      brand: updatedBrand
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Tên thương hiệu đã tồn tại' });
    } else {
      res.status(500).json({ error: 'Lỗi server' });
    }
  }
});

// DELETE /api/brands/:id - Xóa brand (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const { id } = req.params;

    // Lấy tên brand trước
    const brandResult = await db.query('SELECT name FROM brands WHERE id = ?', [id]);
    const brandData = Array.isArray(brandResult) ? brandResult[0] : brandResult;
    
    if (!brandData || brandData.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy thương hiệu' });
    }
    
    const brandName = brandData[0].name;

    // Kiểm tra xem có sản phẩm nào đang sử dụng brand này không (theo tên)
    const productsCountResult = await db.query('SELECT COUNT(*) as count FROM products WHERE brand = ?', [brandName]);
    const productsCount = Array.isArray(productsCountResult) ? productsCountResult[0] : productsCountResult;
    
    if (productsCount[0]?.count > 0) {
      return res.status(400).json({ 
        error: `Không thể xóa thương hiệu "${brandName}" vì có ${productsCount[0].count} sản phẩm đang sử dụng.`
      });
    }

    await db.query('DELETE FROM brands WHERE id = ?', [id]);
    
    res.json({ message: 'Xóa thương hiệu thành công' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;