const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// GET /api/admin/expenses - Lấy tổng tiền chi (nhập hàng)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { mode = 'month', month, year, startDate, endDate } = req.query;
    
    let query = '';
    let params = [];
    let currentMonth = new Date().getMonth() + 1;
    let currentYear = new Date().getFullYear();
    
    let finalMonth = month ? parseInt(month) : currentMonth;
    let finalYear = year ? parseInt(year) : currentYear;

    if (mode === 'month') {
      // Lấy tổng tiền chi theo tháng (bao gồm IMPORT, INITIAL_STOCK, ...)
      query = `
        SELECT 
          SUM(il.import_price * il.quantity_changed) as total_expenses,
          COUNT(DISTINCT il.reference_code) as import_count,
          SUM(il.quantity_changed) as total_quantity
        FROM inventory_logs il
        WHERE YEAR(il.created_at) = ? 
          AND MONTH(il.created_at) = ?
          AND il.import_price IS NOT NULL
      `;
      params = [finalYear, finalMonth];
    } else if (mode === 'year') {
      // Lấy tổng tiền chi theo năm (bao gồm IMPORT, INITIAL_STOCK, ...)
      query = `
        SELECT 
          SUM(il.import_price * il.quantity_changed) as total_expenses,
          COUNT(DISTINCT il.reference_code) as import_count,
          SUM(il.quantity_changed) as total_quantity
        FROM inventory_logs il
        WHERE YEAR(il.created_at) = ?
          AND il.import_price IS NOT NULL
      `;
      params = [finalYear];
    } else if (mode === 'custom') {
      // Lấy tổng tiền chi theo khoảng ngày tuỳ chỉnh
      if (startDate && endDate) {
        const start = startDate;
        const end = endDate;
        const endDatePlus = new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        query = `
          SELECT 
            SUM(il.import_price * il.quantity_changed) as total_expenses,
            COUNT(DISTINCT il.reference_code) as import_count,
            SUM(il.quantity_changed) as total_quantity
          FROM inventory_logs il
          WHERE DATE(il.created_at) >= ? 
            AND DATE(il.created_at) < ?
            AND il.import_price IS NOT NULL
        `;
        params = [start, endDatePlus];
      } else {
        // Fallback to current month if custom dates not provided
        query = `
          SELECT 
            SUM(il.import_price * il.quantity_changed) as total_expenses,
            COUNT(DISTINCT il.reference_code) as import_count,
            SUM(il.quantity_changed) as total_quantity
          FROM inventory_logs il
          WHERE YEAR(il.created_at) = ? 
            AND MONTH(il.created_at) = ?
            AND il.import_price IS NOT NULL
        `;
        params = [currentYear, currentMonth];
      }
    }

    const [result] = await db.query(query, params);

    res.json({
      success: true,
      data: {
        totalExpenses: result[0]?.total_expenses || 0,
        importCount: result[0]?.import_count || 0,
        totalQuantity: result[0]?.total_quantity || 0
      }
    });
  } catch (err) {
    console.error('Error fetching expense data:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy dữ liệu chi tiêu',
      details: err.message
    });
  }
});

module.exports = router;
