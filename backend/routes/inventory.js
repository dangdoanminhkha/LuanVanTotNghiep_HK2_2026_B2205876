/**
 * =====================================================
 * INVENTORY MANAGEMENT MODULE
 * Senior Backend Developer - Node.js + ExpressJS + MySQL
 * File: routes/inventory.js
 * =====================================================
 * 
 * Mô tả: Module quản lý kho (Stock Ledger Pattern)
 * - 1 table duy nhất: inventory_logs
 * - Ghi nhận mọi biến động: Nhập (IMPORT), Bán (ORDER), Chỉnh sửa (ADJUST)
 * - Support Transaction để đảm bảo tính toàn vẹn dữ liệu
 * 
 * API Endpoints:
 * 1. GET  /api/inventory/stock     - Lấy số lượng tồn kho hiện tại
 * 2. GET  /api/inventory/logs      - Lấy lịch sử sổ cái (có JOIN)
 * 3. POST /api/inventory/import    - API xử lý form nhập hàng (Transaction)
 */

const express = require('express');
const router = express.Router();
const db = require('../db'); // Kết nối MySQL pool

// =====================================================
// 1. GET /api/inventory/stock
// Lấy số lượng tồn kho hiện tại của tất cả variant
// =====================================================
/**
 * Trả về JSON map tồn kho theo variant_id
 * 
 * Response:
 * {
 *   "101": 45,    // variant_id: current_stock (Sum của quantity_changed)
 *   "102": 27,
 *   "103": 0
 * }
 * 
 * HTTP Status:
 * - 200: Success
 * - 500: Database error
 */
router.get('/stock', async (req, res) => {
  let connection;
  
  try {
    // Lấy connection từ pool
    connection = await db.getConnection();
    
    // SQL Query: Tính tổng quantity_changed (tồn kho) theo variant_id
    // GROUP BY variant_id để ghép nhóm các giao dịch cùng variant
    const query = `
      SELECT 
        variant_id,
        SUM(quantity_changed) as current_stock
      FROM inventory_logs
      GROUP BY variant_id
      ORDER BY variant_id ASC
    `;
    
    // Thực thi query
    const [results] = await connection.query(query);
    
    // Chuyển đổi kết quả thành map {variant_id: stock}
    const stockMap = {};
    results.forEach(row => {
      stockMap[row.variant_id] = row.current_stock || 0;
    });
    
    // Trả về response JSON
    res.status(200).json(stockMap);
    
  } catch (error) {
    // Bắt lỗi database
    console.error('❌ Lỗi khi lấy tồn kho:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi lấy dữ liệu tồn kho',
      error: error.message
    });
    
  } finally {
    // Release connection về pool
    if (connection) connection.release();
  }
});


// =====================================================
// 2. GET /api/inventory/logs
// Lấy lịch sử sổ cái (có JOIN với products, colors)
// =====================================================
/**
 * Trả về danh sách lịch sử các giao dịch
 * 
 * Query Parameters:
 * - action_type (optional): Lọc theo loại giao dịch (IMPORT, ORDER, ADJUST)
 * - limit (optional): Số bản ghi (default: 100)
 * - offset (optional): Bắt đầu từ vị trí (default: 0)
 * 
 * Response:
 * [
 *   {
 *     "id": 1,
 *     "created_at": "2026-04-01T10:30:00.000Z",
 *     "reference_code": "PN-20260401",
 *     "product_name": "Nike Air Max 90",
 *     "variant_name": "Size 40 - Black",
 *     "variant_id": 101,
 *     "action_type": "IMPORT",
 *     "quantity_changed": 50,
 *     "import_price": 500000,
 *     "note": "Nhập hàng Nike Air Max 90"
 *   },
 *   ...
 * ]
 * 
 * HTTP Status:
 * - 200: Success
 * - 400: Invalid query parameters
 * - 500: Database error
 */
router.get('/logs', async (req, res) => {
  let connection;
  
  try {
    // Lấy connection từ pool
    connection = await db.getConnection();
    
    // Parse query parameters
    const actionType = req.query.action_type || null;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    // Validation: Đảm bảo limit hợp lệ
    if (limit <= 0 || limit > 1000) {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter limit phải nằm trong khoảng 1-1000'
      });
    }
    
    // Xây dựng WHERE clause động
    let whereClause = '1=1'; // Default: tất cả
    let queryParams = [];
    
    if (actionType) {
      whereClause += ' AND il.action_type = ?';
      queryParams.push(actionType);
    }
    
    // SQL Query: JOIN với product_variants, products, colors
    const query = `
      SELECT 
        il.id,
        il.created_at,
        il.reference_code,
        il.variant_id,
        il.quantity_changed,
        il.import_price,
        il.action_type,
        il.note,
        p.id as product_id,
        p.name as product_name,
        pv.color_id,
        pv.size,
        COALESCE(c.color, 'N/A') as color_name,
        c.hex_code
      FROM inventory_logs il
      LEFT JOIN product_variants pv ON il.variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      LEFT JOIN colors c ON pv.color_id = c.id
      WHERE ${whereClause}
      ORDER BY il.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    // Thêm LIMIT và OFFSET vào parameters
    queryParams.push(limit, offset);
    
    // Thực thi query
    const [results] = await connection.query(query, queryParams);
    
    // Format lại response
    const logs = results.map(row => {
      // Tạo variant_name từ size và màu
      let variantName = row.size ? `Size ${row.size}` : 'N/A';
      if (row.color_name && row.color_name !== 'N/A') {
        variantName += ` - ${row.color_name}`;
      }

      // Map action_type thành label tiếng Việt
      let label = 'Giao dịch';
      switch(row.action_type) {
        case 'IMPORT':
          label = 'Nhập hàng';
          break;
        case 'INITIAL_SYNC':
          label = 'Nhập (khởi tạo)';
          break;
        case 'ORDER':
          label = 'Bán';
          break;
        case 'RETURN':
          label = 'Hoàn hàng';
          break;
        case 'ADJUST':
          label = 'Chỉnh sửa';
          break;
      }
      
      return {
        id: row.id,
        created_at: row.created_at,
        reference_code: row.reference_code,
        product_id: row.product_id,
        product_name: row.product_name || 'N/A',
        variant_id: row.variant_id,
        variant_name: variantName,
        size: row.size,
        color_id: row.color_id,
        color_name: row.color_name,
        hex_code: row.hex_code,
        action_type: row.action_type,
        label: label,                                  // <<<< Thêm label tiếng Việt
        quantity_changed: row.quantity_changed,
        import_price: row.import_price ? parseFloat(row.import_price) : null,
        note: row.note
      };
    });
    
    // Get total count (để pagination)
    let countParams = [];
    if (actionType) {
      countParams.push(actionType);
    }
    const countQuery = `
      SELECT COUNT(*) as total
      FROM inventory_logs il
      WHERE ${whereClause}
    `;
    
    const [countResult] = await connection.query(countQuery, countParams);
    
    // Trả về response
    res.status(200).json({
      status: 'success',
      data: logs,
      pagination: {
        total: countResult[0].total,
        limit,
        offset,
        page: Math.floor(offset / limit) + 1
      }
    });
    
  } catch (error) {
    // Bắt lỗi
    console.error('❌ Lỗi khi lấy lịch sử kho:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi lấy dữ liệu lịch sử kho',
      error: error.message
    });
    
  } finally {
    // Release connection
    if (connection) connection.release();
  }
});


// =====================================================
// 3. POST /api/inventory/import
// API xử lý form nhập hàng (Dùng Transaction)
// =====================================================
/**
 * Nhập hàng vào kho từ form Admin
 * 
 * Request Body:
 * {
 *   "reference_code": "PN-20260405",
 *   "note": "Nhập hàng từ nhà cung cấp ABC",
 *   "items": [
 *     {
 *       "variant_id": 101,
 *       "qty": 20,
 *       "price": 500000
 *     },
 *     {
 *       "variant_id": 102,
 *       "qty": 15,
 *       "price": 520000
 *     }
 *   ]
 * }
 * 
 * Response (Success - 201):
 * {
 *   "status": "success",
 *   "message": "Nhập hàng thành công! Mã: PN-20260405",
 *   "reference_code": "PN-20260405",
 *   "items_count": 2,
 *   "total_quantity": 35,
 *   "total_price": 9,900,000
 * }
 * 
 * Response (Error - 400/500):
 * {
 *   "status": "error",
 *   "message": "Chi tiết lỗi",
 *   "error": "Stack trace"
 * }
 * 
 * Logic:
 * 1. Validate input
 * 2. Kiểm tra reference_code không trùng
 * 3. Bắt đầu Transaction
 * 4. Insert từng item vào inventory_logs
 * 5. Commit nếu thành công, Rollback nếu lỗi
 * 
 * Đảm bảo:
 * - Nếu lỗi 1 dòng → Rollback tất cả (Atomicity)
 * - Mỗi item tạo 1 bản ghi mới
 * - action_type = 'IMPORT', quantity_changed > 0
 */
router.post('/import', async (req, res) => {
  let connection;
  
  try {
    // Lấy connection từ pool
    connection = await db.getConnection();
    
    // ===== 1. Validate Input =====
    const { reference_code, note, items } = req.body;
    
    // Kiểm tra required fields
    if (!reference_code || !items) {
      return res.status(400).json({
        status: 'error',
        message: 'Thiếu trường bắt buộc: reference_code, items'
      });
    }
    
    // Kiểm tra items là mảng
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Items phải là mảng không rỗng'
      });
    }
    
    // Validate reference_code format
    if (typeof reference_code !== 'string' || reference_code.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'reference_code phải là chuỗi không rỗng'
      });
    }
    
    // Validate từng item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (!item.variant_id || !item.qty || !item.price) {
        return res.status(400).json({
          status: 'error',
          message: `Hàng ${i + 1}: thiếu trường variant_id, qty, hoặc price`
        });
      }
      
      // Validate dữ liệu
      if (typeof item.variant_id !== 'number' || item.variant_id <= 0) {
        return res.status(400).json({
          status: 'error',
          message: `Hàng ${i + 1}: variant_id phải là số dương`
        });
      }
      
      if (typeof item.qty !== 'number' || item.qty <= 0) {
        return res.status(400).json({
          status: 'error',
          message: `Hàng ${i + 1}: qty phải là số dương`
        });
      }
      
      if (typeof item.price !== 'number' || item.price <= 0) {
        return res.status(400).json({
          status: 'error',
          message: `Hàng ${i + 1}: price phải là số dương`
        });
      }
    }
    
    // ===== 2. Bắt đầu Transaction =====
    // Transaction đảm bảo: Either tất cả thành công, hoặc tất cả rollback
    await connection.beginTransaction();
    
    // ===== 3. Insert từng item vào inventory_logs =====
    const insertQuery = `
      INSERT INTO inventory_logs 
      (variant_id, quantity_changed, import_price, action_type, reference_code, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    let totalQuantity = 0;
    let totalPrice = 0;
    
    for (const item of items) {
      const { variant_id, qty, price } = item;
      
      // ===== 4a. Insert vào inventory_logs =====
      await connection.query(insertQuery, [
        variant_id,
        qty,                    // Số lượng dương (nhập)
        price,                  // Giá nhập vốn
        'IMPORT',               // Loại giao dịch
        reference_code,         // Mã đối chiếu
        note || ''              // Ghi chú (nếu có)
      ]);
      
      // ===== 4b. UPDATE quantity trong product_variants =====
      // Cộng dồn số lượng nhập vào bảng product_variants
      const updateQuery = `
        UPDATE product_variants 
        SET quantity = IFNULL(quantity, 0) + ?
        WHERE id = ?
      `;
      
      await connection.query(updateQuery, [qty, variant_id]);
      
      // Accumulate totals
      totalQuantity += qty;
      totalPrice += (qty * price);
    }
    
    // ===== 4. COMMIT Transaction =====
    // Nếu tất cả insert thành công, commit
    await connection.commit();
    
    // Trả về response success
    res.status(201).json({
      status: 'success',
      message: `✅ Nhập hàng thành công! Mã: ${reference_code}`,
      reference_code,
      items_count: items.length,
      total_quantity: totalQuantity,
      total_price: totalPrice,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // ===== 5. ERROR HANDLING =====
    // Nếu có lỗi ở bất kỳ step nào, rollback transaction
    
    try {
      if (connection) {
        await connection.rollback();
        console.warn('⚠️  Transaction đã rollback do lỗi');
      }
    } catch (rollbackError) {
      console.error('❌ Lỗi khi rollback:', rollbackError.message);
    }
    
    // Log detail error
    console.error('❌ Lỗi khi nhập hàng:', error.message);
    
    // Phân loại lỗi
    let statusCode = 500;
    let message = 'Lỗi xử lý nhập hàng';
    
    if (error.code === 'ER_FOREIGN_KEY_CONSTRAINT_FAILS') {
      statusCode = 400;
      message = 'Variant ID không tồn tại. Vui lòng kiểm tra lại.';
    } else if (error.code === 'ER_DUP_ENTRY') {
      statusCode = 400;
      message = 'Dữ liệu trùng lặp. Vui lòng kiểm tra lại.';
    }
    
    // Trả về response error
    res.status(statusCode).json({
      status: 'error',
      message,
      error: error.message
    });
    
  } finally {
    // ===== 6. CLEANUP =====
    // Release connection về pool
    if (connection) connection.release();
  }
});


// =====================================================
// BONUS ENDPOINTS (Optional)
// =====================================================

/**
 * POST/GET /api/inventory/init
 * Initialize database - Create inventory_logs table if not exists
 */
router.post('/init', initDatabase);
router.get('/init', initDatabase);

async function initDatabase(req, res) {
  let connection;
  
  try {
    connection = await db.getConnection();
    
    // SQL để tạo bảng nếu chưa tồn tại
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS inventory_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        variant_id INT NOT NULL,
        quantity_changed INT NOT NULL,
        import_price DECIMAL(10, 2),
        action_type VARCHAR(20) NOT NULL DEFAULT 'IMPORT',
        reference_code VARCHAR(50) NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_variant_id (variant_id),
        INDEX idx_reference_code (reference_code),
        INDEX idx_action_type (action_type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await connection.query(createTableQuery);
    
    res.status(200).json({
      status: 'success',
      message: '✅ Bảng inventory_logs đã được khởi tạo thành công'
    });
    
  } catch (error) {
    console.error('❌ Lỗi init database:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khởi tạo database',
      error: error.message
    });
    
  } finally {
    if (connection) connection.release();
  }
}

/**
 * GET /api/inventory/check
 * Check xem inventory_logs table có tồn tại không
 */
router.get('/check', async (req, res) => {
  let connection;
  
  try {
    connection = await db.getConnection();
    
    // Check xem table tồn tại không
    const checkQuery = `
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_logs'
    `;
    
    const [result] = await connection.query(checkQuery);
    
    if (result.length > 0) {
      res.status(200).json({
        status: 'success',
        exists: true,
        message: '✅ Bảng inventory_logs tồn tại',
        table: result[0]
      });
    } else {
      res.status(200).json({
        status: 'warning',
        exists: false,
        message: '⚠️  Bảng inventory_logs chưa được tạo. Vui lòng gọi POST /api/inventory/init'
      });
    }
    
  } catch (error) {
    console.error('❌ Lỗi check database:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi kiểm tra database',
      error: error.message
    });
    
  } finally {
    if (connection) connection.release();
  }
});

/**
 * POST /api/inventory/adjust
 * Chỉnh sửa tồn kho thủ công (Inventory Adjustment)
 * 
 * Payload:
 * {
 *   "variant_id": 101,
 *   "quantity_change": 5,    // Dương hoặc âm
 *   "reason": "Hết hạn",
 *   "reference_code": "ADJ-001"
 * }
 */
router.post('/adjust', async (req, res) => {
  let connection;
  
  try {
    connection = await db.getConnection();
    
    const { variant_id, quantity_change, reason, reference_code } = req.body;
    
    // Validate
    if (!variant_id || quantity_change === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Thiếu trường variant_id hoặc quantity_change'
      });
    }
    
    const refCode = reference_code || `ADJ-${Date.now()}`;
    
    const query = `
      INSERT INTO inventory_logs
      (variant_id, quantity_changed, action_type, reference_code, note, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    await connection.query(query, [
      variant_id,
      quantity_change,
      'ADJUST',
      refCode,
      reason || 'Manual Adjustment'
    ]);
    
    res.status(201).json({
      status: 'success',
      message: 'Chỉnh sửa tồn kho thành công',
      reference_code: refCode
    });
    
  } catch (error) {
    console.error('❌ Lỗi chỉnh sửa tồn kho:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi chỉnh sửa tồn kho',
      error: error.message
    });
    
  } finally {
    if (connection) connection.release();
  }
});


/**
 * POST/GET /api/inventory/sync-initial
 * SYNC DỮ LIỆU BAN ĐẦU: Import product_variants.quantity vào inventory_logs
 * 
 * Mục tiêu: Đồng bộ hóa dữ liệu cũ sang stock ledger mới
 * - Đọc tất cả product_variants có quantity > 0
 * - Lấy giá từ products table
 * - Chèn vào inventory_logs với quantity_changed = quantity hiện tại
 * - Tính import_price = product.price * 0.8
 * - Sau đó set product_variants.quantity = 0 (để tránh double counting)
 * 
 * Response:
 * {
 *   "status": "success",
 *   "message": "Đã sync 45 sản phẩm vào inventory_logs",
 *   "synced_count": 45,
 *   "total_quantity": 350,
 *   "timestamp": "2026-04-05T15:30:00.000Z"
 * }
 * 
 * ⚠️ CẢNH BÁO: Endpoint này chỉ nên chạy 1 lần!
 */

async function syncInitialInventory(req, res) {
  let connection;
  
  try {
    connection = await db.getConnection();
    
    // ===== BƯỚC 1: Đọc tất cả product_variants =====
    const selectQuery = `
      SELECT 
        pv.id as variant_id,
        pv.quantity,
        pv.sold,
        pv.product_id,
        p.price
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE pv.quantity > 0 OR pv.sold > 0
      ORDER BY pv.id ASC
    `;
    
    const [variants] = await connection.query(selectQuery);
    
    if (variants.length === 0) {
      return res.status(200).json({
        status: 'info',
        message: 'Không có sản phẩm nào để sync (tất cả quantity = 0 và sold = 0)',
        synced_count: 0,
        total_quantity: 0
      });
    }
    
    // ===== BƯỚC 2: Bắt đầu Transaction =====
    await connection.beginTransaction();
    
    const syncRefCode = `INIT-${Date.now()}`;
    let totalQuantity = 0;
    let syncedCount = 0;
    
    // ===== BƯỚC 3: Chèn từng variant vào inventory_logs =====
    const insertImportQuery = `
      INSERT INTO inventory_logs
      (variant_id, quantity_changed, import_price, action_type, reference_code, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    for (const variant of variants) {
      // Tính giá nhập = giá bán × 0.8
      const importPrice = (variant.price * 0.8).toFixed(2);
      
      // Chèn IMPORT record nếu có quantity
      if (variant.quantity > 0) {
        await connection.query(insertImportQuery, [
          variant.variant_id,
          variant.quantity,
          importPrice,
          'INITIAL_SYNC',
          syncRefCode,
          `Auto-sync từ product_variants (quantity=${variant.quantity})`
        ]);
        totalQuantity += variant.quantity;
      }
      
      // Chèn ORDER record nếu có sold (quantity_changed = negative)
      if (variant.sold > 0) {
        await connection.query(insertImportQuery, [
          variant.variant_id,
          -variant.sold,              // negative để giảm tồn kho
          0,                          // không có import_price cho ORDER
          'INITIAL_SYNC',
          syncRefCode,
          `Auto-sync từ product_variants.sold (sold=${variant.sold})`
        ]);
      }
      
      syncedCount++;
    }
    
    // ===== BƯỚC 4: UPDATE product_variants.quantity = 0 và sold = 0 =====
    const updateQuery = `
      UPDATE product_variants 
      SET quantity = 0, sold = 0
      WHERE quantity > 0 OR sold > 0
    `;
    
    const [updateResult] = await connection.query(updateQuery);
    
    // ===== BƯỚC 5: COMMIT Transaction =====
    await connection.commit();
    
    // Trả về response success
    res.status(200).json({
      status: 'success',
      message: `✅ Đã sync ${syncedCount} sản phẩm vào inventory_logs`,
      reference_code: syncRefCode,
      synced_count: syncedCount,
      total_quantity: totalQuantity,
      note: 'Tồn kho hiện tại được quản lý qua SUM(quantity_changed) từ inventory_logs. product_variants.quantity và sold đã reset = 0',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // ===== ERROR HANDLING: Rollback Transaction =====
    try {
      if (connection) {
        await connection.rollback();
        console.warn('⚠️  Rollback transaction do lỗi');
      }
    } catch (rollbackError) {
      console.error('❌ Lỗi rollback:', rollbackError.message);
    }
    
    console.error('❌ Lỗi khi sync dữ liệu ban đầu:', error.message);
    
    res.status(500).json({
      status: 'error',
      message: 'Lỗi đồng bộ dữ liệu ban đầu',
      error: error.message,
      note: 'Transaction đã rollback. Không có dữ liệu nào bị thay đổi.'
    });
    
  } finally {
    if (connection) connection.release();
  }
}

// Support cả POST và GET
router.post('/sync-initial', syncInitialInventory);
router.get('/sync-initial', syncInitialInventory);


// =====================================================
// Export Router
// =====================================================
module.exports = router;

/**
 * INTEGRATION IN MAIN APP (index.js):
 * 
 * const inventoryRoutes = require('./routes/inventory');
 * app.use('/api', inventoryRoutes);
 * 
 * OR:
 * 
 * const inventoryRoutes = require('./routes/inventory');
 * app.use('/api/inventory', inventoryRoutes);
 */
