const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// GET /api/admin/revenue - Lấy dữ liệu doanh thu (theo tháng hoặc năm)
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
      // Lấy dữ liệu theo ngày trong tháng
      query = `
        SELECT 
          DATE(osl.created_at) as day,
          COUNT(DISTINCT o.id) as orders,
          SUM(o.total) as total,
          COALESCE(SUM(CASE 
            WHEN EXISTS (
              SELECT 1 FROM order_items oi 
              WHERE oi.order_id = o.id AND oi.is_ai_suggested = 1
            ) THEN o.total 
            ELSE 0 
          END), 0) as ai
        FROM orders o
        INNER JOIN order_status_logs osl ON o.id = osl.order_id
        WHERE osl.status_new IN ('delivered', 'return_rejected')
          AND YEAR(osl.created_at) = ? AND MONTH(osl.created_at) = ?
          AND o.payment_status = 'paid'
        GROUP BY DATE(osl.created_at)
        ORDER BY day ASC
      `;
      params = [finalYear, finalMonth];
    } else if (mode === 'year') {
      // Lấy dữ liệu theo tháng trong năm (12 tháng)
      query = `
        SELECT 
          DATE_FORMAT(osl.created_at, '%Y-%m-01') as day,
          MONTH(osl.created_at) as rawMonth,
          COUNT(DISTINCT o.id) as orders,
          SUM(o.total) as total,
          COALESCE(SUM(CASE 
            WHEN EXISTS (
              SELECT 1 FROM order_items oi 
              WHERE oi.order_id = o.id AND oi.is_ai_suggested = 1
            ) THEN o.total 
            ELSE 0 
          END), 0) as ai
        FROM orders o
        INNER JOIN order_status_logs osl ON o.id = osl.order_id
        WHERE osl.status_new IN ('delivered', 'return_rejected')
          AND YEAR(osl.created_at) = ?
          AND o.payment_status = 'paid'
        GROUP BY DATE_FORMAT(osl.created_at, '%Y-%m-01'), MONTH(osl.created_at)
        ORDER BY MONTH(osl.created_at) ASC
      `;
      params = [finalYear];
    } else if (mode === 'custom') {
      // Custom date range
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const endDatePlus = new Date(end.getTime() + 24 * 60 * 60 * 1000);
        const startStr = startDate;
        const endStr = endDatePlus.toISOString().slice(0, 10);

        query = `
          SELECT 
            DATE(osl.created_at) as day,
            COUNT(DISTINCT o.id) as orders,
            SUM(o.total) as total,
            COALESCE(SUM(CASE 
              WHEN EXISTS (
                SELECT 1 FROM order_items oi 
                WHERE oi.order_id = o.id AND oi.is_ai_suggested = 1
              ) THEN o.total 
              ELSE 0 
            END), 0) as ai
          FROM orders o
          INNER JOIN order_status_logs osl ON o.id = osl.order_id
          WHERE osl.status_new IN ('delivered', 'return_rejected')
            AND DATE(osl.created_at) >= ? AND DATE(osl.created_at) < ?
            AND o.payment_status = 'paid'
          GROUP BY DATE(osl.created_at)
          ORDER BY day ASC
        `;
        params = [startStr, endStr];
      } else {
        // Fallback to current month
        const defaultMonth = currentMonth;
        const defaultYear = currentYear;
        query = `
          SELECT 
            DATE(osl.created_at) as day,
            COUNT(DISTINCT o.id) as orders,
            SUM(o.total) as total,
            COALESCE(SUM(CASE 
              WHEN EXISTS (
                SELECT 1 FROM order_items oi 
                WHERE oi.order_id = o.id AND oi.is_ai_suggested = 1
              ) THEN o.total 
              ELSE 0 
            END), 0) as ai
          FROM orders o
          INNER JOIN order_status_logs osl ON o.id = osl.order_id
          WHERE osl.status_new IN ('delivered', 'return_rejected')
            AND YEAR(osl.created_at) = ? AND MONTH(osl.created_at) = ?
            AND o.payment_status = 'paid'
          GROUP BY DATE(osl.created_at)
          ORDER BY day ASC
        `;
        params = [defaultYear, defaultMonth];
      }
    } else {
      // Fallback to date range if mode is invalid
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
      const startStr = start.toISOString().slice(0,10);
      const endStr = end.toISOString().slice(0,10);

      query = `
        SELECT 
          DATE(osl.created_at) as day,
          COUNT(DISTINCT o.id) as orders,
          SUM(o.total) as total,
          COALESCE(SUM(CASE 
            WHEN EXISTS (
              SELECT 1 FROM order_items oi 
              WHERE oi.order_id = o.id AND oi.is_ai_suggested = 1
            ) THEN o.total 
            ELSE 0 
          END), 0) as ai
        FROM orders o
        INNER JOIN order_status_logs osl ON o.id = osl.order_id
        WHERE osl.status_new IN ('delivered', 'return_rejected')
          AND DATE(osl.created_at) BETWEEN ? AND ?
          AND o.payment_status = 'paid'
        GROUP BY DATE(osl.created_at)
        ORDER BY day ASC
      `;
      params = [startStr, endStr];
    }

    const [daily] = await db.query(query, params);

    // Nếu mode = 'custom', fill dữ liệu cho các ngày không có bán hàng
    let finalDaily = daily || [];
    if (mode === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dailyMap = {};
      
      // Tạo map từ kết quả query
      finalDaily.forEach(row => {
        const dateKey = new Date(row.day).toISOString().slice(0, 10);
        dailyMap[dateKey] = row;
      });
      
      // Fill dữ liệu cho tất cả ngày từ start đến end
      const filledDaily = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().slice(0, 10);
        if (dailyMap[dateKey]) {
          filledDaily.push(dailyMap[dateKey]);
        } else {
          filledDaily.push({
            day: new Date(dateKey),
            orders: 0,
            total: 0,
            ai: 0
          });
        }
      }
      finalDaily = filledDaily;
    }

    // Lấy dữ liệu category (doanh thu theo danh mục)
    const categoryQuery = `
      SELECT 
        COALESCE(cat.name, 'Chưa phân loại') as category,
        SUM(o.total) as revenue
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories cat ON p.category_id = cat.id
      WHERE o.status = 'delivered'
        AND o.payment_status = 'paid'
      GROUP BY cat.id, cat.name
      ORDER BY revenue DESC
      LIMIT 10
    `;

    const [category] = await db.query(categoryQuery);

    res.json({
      success: true,
      data: {
        daily: finalDaily,
        category: category || []
      }
    });
  } catch (err) {
    console.error('Error fetching revenue data:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy dữ liệu doanh thu',
      details: err.message
    });
  }
});

// GET /api/admin/import-expense - Lấy tổng tiền chi nhập hàng
router.get('/import-expense', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { mode = 'month', month, year } = req.query;
    console.log('Import expense API called with:', { mode, month, year });
    
    let query = '';
    let params = [];
    let currentMonth = new Date().getMonth() + 1;
    let currentYear = new Date().getFullYear();
    
    let finalMonth = month ? parseInt(month) : currentMonth;
    let finalYear = year ? parseInt(year) : currentYear;

    if (mode === 'month') {
      // Tính tổng chi nhập hàng theo tháng
      query = `
        SELECT 
          COALESCE(SUM(quantity_changed * import_price), 0) as totalExpense
        FROM inventory_logs
        WHERE action_type = 'IMPORT'
          AND YEAR(created_at) = ?
          AND MONTH(created_at) = ?
      `;
      params = [finalYear, finalMonth];
    } else if (mode === 'year') {
      // Tính tổng chi nhập hàng theo năm
      query = `
        SELECT 
          COALESCE(SUM(quantity_changed * import_price), 0) as totalExpense
        FROM inventory_logs
        WHERE action_type = 'IMPORT'
          AND YEAR(created_at) = ?
      `;
      params = [finalYear];
    }

    const [result] = await db.query(query, params);
    const totalExpense = result?.[0]?.totalExpense || 0;
    console.log('Import expense from DB:', { totalExpense });

    res.json({
      success: true,
      data: {
        totalExpense: Number(totalExpense)
      }
    });
  } catch (err) {
    console.error('Error fetching import expense:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy dữ liệu tiền chi',
      details: err.message
    });
  }
});

module.exports = router;
