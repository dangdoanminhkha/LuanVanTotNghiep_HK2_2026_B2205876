const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/categories - Lấy tất cả categories hoặc filter theo gender
router.get('/', async (req, res) => {
  try {
    const { gender } = req.query;
    
    let query = `
      SELECT id, name, slug, gender_applicable, description, image, sort_order, is_active
      FROM categories 
      WHERE is_active = 1
    `;
    
    // Filter theo gender nếu có
    if (gender) {
      const genderLower = gender.toLowerCase();
      query += ` AND (gender_applicable = 'unisex' OR gender_applicable = '${genderLower}')`;
    }
    
    query += ` ORDER BY sort_order ASC, name ASC`;
    
    const result = await db.query(query);
    const categories = Array.isArray(result) ? result[0] : result;
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/categories/all - Lấy tất cả categories (admin)
router.get('/all', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, slug, gender_applicable, description, image, is_active, sort_order, created_at
      FROM categories 
      ORDER BY sort_order ASC, name ASC
    `);
    const categories = Array.isArray(result) ? result[0] : result;
    res.json(categories);
  } catch (error) {
    console.error('Error fetching all categories:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/categories/:slug - Lấy category theo slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const result = await db.query(
      'SELECT * FROM categories WHERE slug = ? AND is_active = 1',
      [slug]
    );
    const category = Array.isArray(result) ? result[0] : result;
    
    if (category.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    }
    
    res.json(category[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/categories - Tạo category mới (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const { name, slug, gender_applicable = 'unisex', description, image, sort_order = 0 } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tên danh mục là bắt buộc' });
    }

    // Tự động tạo slug nếu không có
    const finalSlug = slug || name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') 
      .replace(/\s+/g, '-')
      .trim();

    const insertResult = await db.query(`
      INSERT INTO categories (name, slug, gender_applicable, description, image, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, finalSlug, gender_applicable, description, image, sort_order]);
    const insertId = Array.isArray(insertResult) ? insertResult[0].insertId : insertResult.insertId;

    const categoryResult = await db.query('SELECT * FROM categories WHERE id = ?', [insertId]);
    const newCategory = Array.isArray(categoryResult) ? categoryResult[0] : categoryResult;
    
    res.status(201).json({ 
      message: 'Thêm danh mục thành công',
      category: newCategory[0]
    });
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Tên danh mục hoặc slug đã tồn tại' });
    } else {
      res.status(500).json({ error: 'Lỗi server' });
    }
  }
});

// PUT /api/categories/:id - Cập nhật category (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const { id } = req.params;
    const { name, slug, gender_applicable, description, image, sort_order, is_active } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tên danh mục là bắt buộc' });
    }

    const updateResult = await db.query(`
      UPDATE categories 
      SET name = ?, slug = ?, gender_applicable = ?, description = ?, image = ?, sort_order = ?, is_active = ?
      WHERE id = ?
    `, [name, slug, gender_applicable, description, image, sort_order, is_active, id]);

    const affectedRows = Array.isArray(updateResult) ? updateResult[0].affectedRows : updateResult.affectedRows;

    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    }

    const categoryResult = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
    const updatedCategory = Array.isArray(categoryResult) ? categoryResult[0] : categoryResult;

    res.json({ 
      message: 'Cập nhật danh mục thành công',
      category: updatedCategory[0]
    });
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Tên danh mục hoặc slug đã tồn tại' });
    } else {
      res.status(500).json({ error: 'Lỗi server' });
    }
  }
});

// DELETE /api/categories/:id - Xóa category (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const { id } = req.params;

    // Lấy tên category trước
    const categoryResult = await db.query('SELECT name FROM categories WHERE id = ?', [id]);
    const categoryData = Array.isArray(categoryResult) ? categoryResult[0] : categoryResult;
    
    if (!categoryData || categoryData.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    }
    
    const categoryName = categoryData[0].name;

    // Kiểm tra xem có sản phẩm nào đang sử dụng category này không (theo category_id)
    const [checkRows] = await db.query('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id]);
    const productCount = checkRows[0].count;

    if (productCount > 0) {
      return res.status(400).json({ 
        error: `Không thể xóa danh mục "${categoryName}" vì có ${productCount} sản phẩm đang sử dụng` 
      });
    }

    const [deleteRows] = await db.query('DELETE FROM categories WHERE id = ?', [id]);
    const affectedRows = deleteRows.affectedRows;

    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    }

    res.json({ message: 'Xóa danh mục thành công' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;