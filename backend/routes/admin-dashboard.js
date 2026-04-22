const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

/**
 * Helper: Build date condition for order_status_logs
 * Returns condition string that works with status log timestamps
 */
function buildStatusLogDateCondition(tableName, statusValue, dateCondition) {
  return `(${tableName}.status = '${statusValue}' AND EXISTS (
    SELECT 1 FROM order_status_logs osl 
    WHERE osl.order_id = ${tableName}.id 
    AND osl.status_new = '${statusValue}' 
    AND ${dateCondition}
  ))`;
}

/**
 * GET /api/admin/dashboard
 * Comprehensive dashboard statistics API
 * Query params: 
 *   - ?range=7days|thisMonth|thisYear|custom (default: thisMonth)
 *   - ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD (required when range=custom)
 * Requires: Admin authentication
 */
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { range = 'thisMonth', startDate = '', endDate = '', month = '', year = '' } = req.query;

    // Determine date range for filtering
    let dateFilter = '';
    let previousDateFilter = '';
    const now = new Date();
    
    switch (range) {
      case '7days':
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0];
        const fourteenDaysStr = fourteenDaysAgo.toISOString().split('T')[0];
        const deliveredSevenDaysCond = buildStatusLogDateCondition('o', 'delivered', `DATE(osl.created_at) >= '${sevenDaysStr}'`);
        const returnRejectedSevenDaysCond = buildStatusLogDateCondition('o', 'return_rejected', `DATE(osl.created_at) >= '${sevenDaysStr}'`);
        dateFilter = `AND (${deliveredSevenDaysCond} OR ${returnRejectedSevenDaysCond})`;
        
        const deliveredFourteenDaysCond = buildStatusLogDateCondition('o', 'delivered', `DATE(osl.created_at) >= '${fourteenDaysStr}' AND DATE(osl.created_at) < '${sevenDaysStr}'`);
        const returnRejectedFourteenDaysCond = buildStatusLogDateCondition('o', 'return_rejected', `DATE(osl.created_at) >= '${fourteenDaysStr}' AND DATE(osl.created_at) < '${sevenDaysStr}'`);
        previousDateFilter = `AND (${deliveredFourteenDaysCond} OR ${returnRejectedFourteenDaysCond})`;
        break;
      case 'thisMonth':
        const selectedMonth = month ? parseInt(month) : now.getMonth() + 1;
        const selectedYear = year ? parseInt(year) : now.getFullYear();
        const previousMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
        const previousYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
        const deliveredThisMonthCond = buildStatusLogDateCondition('o', 'delivered', `YEAR(osl.created_at) = ${selectedYear} AND MONTH(osl.created_at) = ${selectedMonth}`);
        const returnRejectedThisMonthCond = buildStatusLogDateCondition('o', 'return_rejected', `YEAR(osl.created_at) = ${selectedYear} AND MONTH(osl.created_at) = ${selectedMonth}`);
        dateFilter = `AND (${deliveredThisMonthCond} OR ${returnRejectedThisMonthCond})`;
        
        const deliveredPrevMonthCond = buildStatusLogDateCondition('o', 'delivered', `YEAR(osl.created_at) = ${previousYear} AND MONTH(osl.created_at) = ${previousMonth}`);
        const returnRejectedPrevMonthCond = buildStatusLogDateCondition('o', 'return_rejected', `YEAR(osl.created_at) = ${previousYear} AND MONTH(osl.created_at) = ${previousMonth}`);
        previousDateFilter = `AND (${deliveredPrevMonthCond} OR ${returnRejectedPrevMonthCond})`;
        break;
      case 'thisYear':
        const targetYear = year ? parseInt(year) : now.getFullYear();
        const deliveredThisYearCond = buildStatusLogDateCondition('o', 'delivered', `YEAR(osl.created_at) = ${targetYear}`);
        const returnRejectedThisYearCond = buildStatusLogDateCondition('o', 'return_rejected', `YEAR(osl.created_at) = ${targetYear}`);
        dateFilter = `AND (${deliveredThisYearCond} OR ${returnRejectedThisYearCond})`;
        
        const deliveredPrevYearCond = buildStatusLogDateCondition('o', 'delivered', `YEAR(osl.created_at) = ${targetYear - 1}`);
        const returnRejectedPrevYearCond = buildStatusLogDateCondition('o', 'return_rejected', `YEAR(osl.created_at) = ${targetYear - 1}`);
        previousDateFilter = `AND (${deliveredPrevYearCond} OR ${returnRejectedPrevYearCond})`;
        break;
      case 'custom':
        if (startDate && endDate) {
          try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const startStr = startDate;
            const endDatePlus = new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000);
            const endDateStr = endDatePlus.toISOString().split('T')[0];
            
            const deliveredCustomCond = buildStatusLogDateCondition('o', 'delivered', `DATE(osl.created_at) >= '${startStr}' AND DATE(osl.created_at) < '${endDateStr}'`);
            const returnRejectedCustomCond = buildStatusLogDateCondition('o', 'return_rejected', `DATE(osl.created_at) >= '${startStr}' AND DATE(osl.created_at) < '${endDateStr}'`);
            dateFilter = `AND (${deliveredCustomCond} OR ${returnRejectedCustomCond})`;
            
            const duration = end - start;
            const prevStart = new Date(start.getTime() - duration);
            const prevEnd = start;
            const prevStartStr = prevStart.toISOString().split('T')[0];
            const prevEndStr = prevEnd.toISOString().split('T')[0];
            
            const deliveredPrevCustomCond = buildStatusLogDateCondition('o', 'delivered', `DATE(osl.created_at) >= '${prevStartStr}' AND DATE(osl.created_at) < '${prevEndStr}'`);
            const returnRejectedPrevCustomCond = buildStatusLogDateCondition('o', 'return_rejected', `DATE(osl.created_at) >= '${prevStartStr}' AND DATE(osl.created_at) < '${prevEndStr}'`);
            previousDateFilter = `AND (${deliveredPrevCustomCond} OR ${returnRejectedPrevCustomCond})`;
          } catch (err) {
            const defaultMonth = now.getMonth() + 1;
            const defaultYear = now.getFullYear();
            const defaultPrevMonth = defaultMonth === 1 ? 12 : defaultMonth - 1;
            const defaultPrevYear = defaultMonth === 1 ? defaultYear - 1 : defaultYear;
            const deliveredDefaultCond = buildStatusLogDateCondition('o', 'delivered', `YEAR(osl.created_at) = ${defaultYear} AND MONTH(osl.created_at) = ${defaultMonth}`);
            const returnRejectedDefaultCond = buildStatusLogDateCondition('o', 'return_rejected', `YEAR(osl.created_at) = ${defaultYear} AND MONTH(osl.created_at) = ${defaultMonth}`);
            dateFilter = `AND (${deliveredDefaultCond} OR ${returnRejectedDefaultCond})`;
            
            const deliveredDefaultPrevCond = buildStatusLogDateCondition('o', 'delivered', `YEAR(osl.created_at) = ${defaultPrevYear} AND MONTH(osl.created_at) = ${defaultPrevMonth}`);
            const returnRejectedDefaultPrevCond = buildStatusLogDateCondition('o', 'return_rejected', `YEAR(osl.created_at) = ${defaultPrevYear} AND MONTH(osl.created_at) = ${defaultPrevMonth}`);
            previousDateFilter = `AND (${deliveredDefaultPrevCond} OR ${returnRejectedDefaultPrevCond})`;
          }
        } else {
          const defaultMonth = now.getMonth() + 1;
          const defaultYear = now.getFullYear();
          const defaultPrevMonth = defaultMonth === 1 ? 12 : defaultMonth - 1;
          const defaultPrevYear = defaultMonth === 1 ? defaultYear - 1 : defaultYear;
          const deliveredDefaultCond = buildStatusLogDateCondition('o', 'delivered', `YEAR(osl.created_at) = ${defaultYear} AND MONTH(osl.created_at) = ${defaultMonth}`);
          const returnRejectedDefaultCond = buildStatusLogDateCondition('o', 'return_rejected', `YEAR(osl.created_at) = ${defaultYear} AND MONTH(osl.created_at) = ${defaultMonth}`);
          dateFilter = `AND (${deliveredDefaultCond} OR ${returnRejectedDefaultCond})`;
          
          const deliveredDefaultPrevCond = buildStatusLogDateCondition('o', 'delivered', `YEAR(osl.created_at) = ${defaultPrevYear} AND MONTH(osl.created_at) = ${defaultPrevMonth}`);
          const returnRejectedDefaultPrevCond = buildStatusLogDateCondition('o', 'return_rejected', `YEAR(osl.created_at) = ${defaultPrevYear} AND MONTH(osl.created_at) = ${defaultPrevMonth}`);
          previousDateFilter = `AND (${deliveredDefaultPrevCond} OR ${returnRejectedDefaultPrevCond})`;
        }
        break;
      case 'all':
        // No date filter for 'all' case - get all orders
        dateFilter = '';
        previousDateFilter = '';
        break;
      default:
        const defaultMonth = now.getMonth() + 1;
        const defaultYear = now.getFullYear();
        const defaultPrevMonth = defaultMonth === 1 ? 12 : defaultMonth - 1;
        const defaultPrevYear = defaultMonth === 1 ? defaultYear - 1 : defaultYear;
        const deliveredDefaultCond = buildStatusLogDateCondition('o', 'delivered', `YEAR(osl.created_at) = ${defaultYear} AND MONTH(osl.created_at) = ${defaultMonth}`);
        const returnRejectedDefaultCond = buildStatusLogDateCondition('o', 'return_rejected', `YEAR(osl.created_at) = ${defaultYear} AND MONTH(osl.created_at) = ${defaultMonth}`);
        dateFilter = `AND (${deliveredDefaultCond} OR ${returnRejectedDefaultCond})`;
        
        const deliveredDefaultPrevCond = buildStatusLogDateCondition( 'o', 'delivered', `YEAR(osl.created_at) = ${defaultPrevYear} AND MONTH(osl.created_at) = ${defaultPrevMonth}`);
        const returnRejectedDefaultPrevCond = buildStatusLogDateCondition('o', 'return_rejected', `YEAR(osl.created_at) = ${defaultPrevYear} AND MONTH(osl.created_at) = ${defaultPrevMonth}`);
        previousDateFilter = `AND (${deliveredDefaultPrevCond} OR ${returnRejectedDefaultPrevCond})`;
    }

    // ============================================
    // PART A: Overview Statistics (Tổng quan)
    // ============================================
    
    // Query 1: Total Revenue từ các đơn delivery thành công + return_rejected (tương đương giao thành công)
    // Chỉ tính các đơn đã thanh toán (payment_status = 'paid')
    const totalRevenueQuery = `
      SELECT SUM(o.total) as total_revenue
      FROM orders o
      WHERE o.status IN ('delivered', 'return_rejected')
        AND o.payment_status = 'paid'
      ${dateFilter}
    `;

    // Query 1B: Previous period revenue for comparison
    const previousRevenueQuery = `
      SELECT SUM(o.total) as total_revenue
      FROM orders o
      WHERE o.status IN ('delivered', 'return_rejected')
        AND o.payment_status = 'paid'
      ${previousDateFilter}
    `;

    // Query 2: Total Orders count
    // Chỉ tính các đơn có payment xác lập: COD/Bank hoặc VNPay đã paid
    const totalOrdersQuery = `
      SELECT COUNT(*) as total_orders
      FROM orders o
      WHERE o.status IN ('delivered', 'return_rejected')
        AND o.payment_status = 'paid'
      ${dateFilter}
    `;

    // Query 3: AI Revenue Percentage
    // Tính tổng revenue từ AI-suggested items / tổng revenue của các đơn thành công
    // Chỉ tính các đơn có payment xác lập: COD/Bank hoặc VNPay đã paid
    const aiRevenueQuery = `
      SELECT 
        SUM(CASE WHEN oi.is_ai_suggested = 1 THEN (oi.price * oi.quantity) ELSE 0 END) as ai_revenue,
        SUM(oi.price * oi.quantity) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('delivered', 'return_rejected')
        AND o.payment_status = 'paid'
      ${dateFilter}
    `;

    // Query 4: Guest Conversion Rate
    // Tính tỉ lệ khách vãng lai đã đăng ký tài khoản
    // Công thức: user_count / (unique_session_id + user_count) × 100%
    // Query 4A: Đếm unique session_id từ user_behavior_logs
    const uniqueSessionsQuery = `
      SELECT COUNT(DISTINCT session_id) as unique_sessions
      FROM user_behavior_logs
      WHERE session_id IS NOT NULL
    `;

    // ============================================
    // PART B: Charts Data (Dữ liệu biểu đồ)
    // ============================================

    // Query 5: Revenue Chart by Day with AI breakdown
    // Chỉ tính các đơn có payment xác lập: COD/Bank hoặc VNPay đã paid
    const revenueChartQuery = `
      SELECT 
        DATE(osl.created_at) as date,
        SUM(o.total) as total_revenue,
        SUM(CASE WHEN EXISTS (
          SELECT 1 FROM order_items oi 
          WHERE oi.order_id = o.id AND oi.is_ai_suggested = 1
        ) THEN o.total ELSE 0 END) as ai_revenue
      FROM orders o
      INNER JOIN order_status_logs osl ON o.id = osl.order_id
      WHERE (o.status = 'delivered' OR o.status = 'return_rejected')
        AND o.payment_status = 'paid'
        AND osl.status_new IN ('delivered', 'return_rejected')
      ${dateFilter}
      GROUP BY DATE(osl.created_at)
      ORDER BY date DESC
    `;

    // Query 6: Customer Pie Chart (Guest vs User orders)
    const customerPieQuery = `
      SELECT 
        COUNT(CASE WHEN o.user_id IS NULL THEN 1 END) as guest_orders,
        COUNT(CASE WHEN o.user_id IS NOT NULL THEN 1 END) as user_orders
      FROM orders o
      WHERE o.status IN ('delivered', 'return_rejected')
        AND o.payment_status = 'paid'
      ${dateFilter}
    `;

    // ============================================
    // PART C: Inventory & AI Metrics (Kho & Gợi ý)
    // ============================================

    // Query 7: Low Stock Items (5 variants với stock < 5)
    const lowStockQuery = `
      SELECT 
        pv.id,
        pv.product_id,
        p.name as product_name,
        pv.size,
        c.color,
        c.hex_code,
        pv.stock,
        pv.sold,
        p.image,
        p.price
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      JOIN colors c ON pv.color_id = c.id
      WHERE pv.stock < 5
      ORDER BY pv.stock ASC
      LIMIT 5
    `;

    // Query 8: Frequently Bought Together (Top 3 product pairs)
    // Self-join trên order_items: 
    const frequentlyBoughtQuery = `
      SELECT 
        a.product_id as product_1_id,
        b.product_id as product_2_id,
        p1.name as product_1_name,
        p2.name as product_2_name,
        p1.image as product_1_image,
        p2.image as product_2_image,
        COUNT(*) as times_bought_together
      FROM order_items a
      JOIN order_items b ON a.order_id = b.order_id 
                         AND a.product_id < b.product_id
      JOIN products p1 ON a.product_id = p1.id
      JOIN products p2 ON b.product_id = p2.id
      GROUP BY a.product_id, b.product_id
      ORDER BY times_bought_together DESC
      LIMIT 3
    `;

    // Query 9: Pending Orders Count
    // Count orders with actionable statuses (where admin has buttons to take action)
    // pending: Admin can confirm/cancel
    // return_requested: Admin can approve/reject return
    // return_approved: Admin can receive goods
    // return_received: Admin can process refund
    // failed_delivery: Admin can retry/cancel
    // NOTE: Do NOT count 'confirmed' (no action buttons), 'shipping', 'delivered' (shipper handles)
    const pendingOrdersQuery = `
      SELECT COUNT(*) as pending_count
      FROM orders o
      WHERE o.status IN ('pending', 'return_requested', 'return_approved', 'return_received', 'failed_delivery')
    `;

    // Query 10: Total Products (Count of base products only, not variants)
    const totalProductsQuery = `
      SELECT COUNT(*) as total_products
      FROM products
    `;

    // Query 10B: Total Color Variants (Unique product_id + color_id combinations)
    const variantCountQuery = `
      SELECT COUNT(DISTINCT CONCAT(product_id, '_', color_id)) as variant_count
      FROM product_variants
      WHERE color_id IS NOT NULL
    `;

    // Query 10C: Reviews Awaiting Feedback
    const reviewsPendingQuery = `
      SELECT COALESCE(COUNT(r.id), 0) as reviews_pending
      FROM reviews r
      WHERE r.reply_text IS NULL
    `;

    // Query 11: Total Users (customers only)
    const totalUsersQuery = `
      SELECT COUNT(*) as total_users
      FROM users
      WHERE role = 'customer'
    `;

    // Query 12: Top 5 Best Selling Products
    const topProductsQuery = `
      SELECT 
        p.id,
        p.name,
        p.image,
        COALESCE(SUM(pv.sold), 0) as total_sold
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      GROUP BY p.id, p.name, p.image
      ORDER BY total_sold DESC
      LIMIT 5
    `;

    // Query 13: Top 5 Newest Users
    const newUsersQuery = `
      SELECT 
        id,
        email,
        created_at
      FROM users
      WHERE role = 'customer'
      ORDER BY created_at DESC
      LIMIT 5
    `;
    // Execute all queries in parallel using Promise.all
    // ============================================
    const [
      totalRevenueRes,
      previousRevenueRes,
      totalOrdersRes,
      aiRevenueRes,
      uniqueSessionsRes,
      totalUsersRes,
      pendingOrdersRes,
      totalProductsRes,
      variantCountRes,
      reviewsPendingRes,
      revenueChartRes,
      customerPieRes,
      lowStockRes,
      frequentlyBoughtRes,
      topProductsRes,
      newUsersRes
    ] = await Promise.all([
      db.query(totalRevenueQuery),
      db.query(previousRevenueQuery),
      db.query(totalOrdersQuery),
      db.query(aiRevenueQuery),
      db.query(uniqueSessionsQuery),
      db.query(totalUsersQuery),
      db.query(pendingOrdersQuery),
      db.query(totalProductsQuery),
      db.query(variantCountQuery),
      db.query(reviewsPendingQuery),
      db.query(revenueChartQuery),
      db.query(customerPieQuery),
      db.query(lowStockQuery),
      db.query(frequentlyBoughtQuery),
      db.query(topProductsQuery),
      db.query(newUsersQuery)
    ]);

    // ============================================
    // Process and format results
    // ============================================

    // Overview Stats
    const totalRevenue = parseFloat(totalRevenueRes[0][0]?.total_revenue || 0);
    const previousRevenue = parseFloat(previousRevenueRes[0][0]?.total_revenue || 0);
    
    // Calculate revenue growth percentage
    let revenueGrowthPercent = 0;
    if (previousRevenue > 0) {
      revenueGrowthPercent = ((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(2);
    } else if (totalRevenue > 0) {
      // If previous period had 0 revenue but current has revenue, it's 100% growth
      revenueGrowthPercent = 100;
    }
    
    const totalOrders = totalOrdersRes[0][0]?.total_orders || 0;

    const aiTotal = parseFloat(aiRevenueRes[0][0]?.ai_revenue || 0);
    const revenueTot = parseFloat(aiRevenueRes[0][0]?.total_revenue || 0);
    const aiRevenuePercentage = revenueTot > 0 ? ((aiTotal / revenueTot) * 100).toFixed(2) : 0;

    // Guest Conversion Rate = user / (unique_sessions + user) × 100%
    const uniqueSessions = uniqueSessionsRes[0][0]?.unique_sessions || 0;
    const totalUsers = totalUsersRes[0][0]?.total_users || 0;
    const conversionRate = (uniqueSessions + totalUsers) > 0 
      ? ((totalUsers / (uniqueSessions + totalUsers)) * 100).toFixed(2)
      : 0;

    // Charts Data
    const revenueChart = revenueChartRes[0].map(row => ({
      date: row.date,
      total_revenue: parseFloat(row.total_revenue || 0),
      ai_revenue: parseFloat(row.ai_revenue || 0)
    }));

    const customerPieData = customerPieRes[0][0] || {};
    const customerPie = [
      {
        order_type: 'guest',
        count: customerPieData.guest_orders || 0
      },
      {
        order_type: 'user',
        count: customerPieData.user_orders || 0
      }
    ];

    // Inventory & AI
    const lowStock = lowStockRes[0].map(item => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      size: item.size,
      color: item.color,
      quantity: item.stock,
      image: item.image,
      price: parseFloat(item.price),
      status: item.stock === 0 ? 'out' : 'low'
    }));

    const frequentlyBought = frequentlyBoughtRes[0].map(pair => ({
      product1_id: pair.product_1_id,
      product2_id: pair.product_2_id,
      product1_name: pair.product_1_name,
      product2_name: pair.product_2_name,
      product1_image: pair.product_1_image,
      product2_image: pair.product_2_image,
      count: pair.times_bought_together
    }));

    // Additional Stats
    const pendingOrders = pendingOrdersRes[0][0]?.pending_count || 0;
    const totalProducts = totalProductsRes[0][0]?.total_products || 0;
    const variantCount = variantCountRes[0][0]?.variant_count || 0;
    const reviewsPending = reviewsPendingRes[0][0]?.reviews_pending || 0;

    // Top 5 Selling Products
    const topProducts = (topProductsRes[0] && Array.isArray(topProductsRes[0])) 
      ? topProductsRes[0].map(product => ({
          id: product.id,
          name: product.name,
          image: product.image,
          totalSold: parseInt(product.total_sold) || 0
        }))
      : [];


    // Top 5 New Users
    const newUsers = newUsersRes[0].map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at
    }));

    // ============================================
    // Return unified response
    // ============================================
    res.json({
      success: true,
      data: {
        overview: {
          pendingOrders: parseInt(pendingOrders),
          totalRevenue: parseFloat(totalRevenue),
          revenueGrowthPercent: parseFloat(revenueGrowthPercent),
          totalOrders: parseInt(totalOrders),
          totalProducts: parseInt(totalProducts),
          totalUsers: parseInt(totalUsers),
          variantCount: parseInt(variantCount),
          reviewsPending: parseInt(reviewsPending)
        },
        charts: {
          revenueChart,
          customerPie
        },
        inventory: {
          lowStock
        },
        ai: {
          frequentlyBought,
          topProducts
        },
        users: {
          newUsers
        }
      },
      range,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy thống kê',
      message: err.message
    });
  }
});

module.exports = router;
