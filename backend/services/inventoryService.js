/**
 * =====================================================
 * EXAMPLE: Sử dụng Inventory API từ Frontend hoặc Service
 * File: backend/services/inventoryService.js
 * =====================================================
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api/inventory';

/**
 * Class: InventoryService
 * Wrapper để gọi Inventory API một cách tiện lợi từ backend service/controller
 */
class InventoryService {
  
  /**
   * 1. Lấy tồn kho hiện tại
   * @returns {Promise<Object>} Map {variant_id: stock}
   */
  static async getCurrentStock() {
    try {
      const response = await axios.get(`${API_BASE_URL}/stock`);
      return response.data; // {101: 45, 102: 27, ...}
    } catch (error) {
      console.error('❌ Error fetching stock:', error.message);
      throw error;
    }
  }
  
  /**
   * 2. Lấy số lượng tồn kho của 1 variant
   * @param {number} variantId
   * @returns {Promise<number>} Current stock
   */
  static async getVariantStock(variantId) {
    try {
      const stockMap = await this.getCurrentStock();
      return stockMap[variantId] || 0;
    } catch (error) {
      console.error(`❌ Error fetching stock for variant ${variantId}:`, error.message);
      return 0;
    }
  }
  
  /**
   * 3. Lấy lịch sử kho (with pagination)
   * @param {Object} options - { actionType, limit, offset }
   * @returns {Promise<Object>} { data, pagination }
   */
  static async getInventoryLogs(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.actionType) params.append('action_type', options.actionType);
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);
      
      const response = await axios.get(
        `${API_BASE_URL}/logs?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching inventory logs:', error.message);
      throw error;
    }
  }
  
  /**
   * 4. Nhập hàng (Gọi POST /api/inventory/import)
   * @param {Object} importData - { reference_code, note, items }
   * @returns {Promise<Object>} Response success/error
   */
  static async importStock(importData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/import`,
        importData,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error importing stock:', error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * 5. Chỉnh sửa tồn kho thủ công
   * @param {Object} adjustData - { variant_id, quantity_change, reason, reference_code }
   * @returns {Promise<Object>} Response
   */
  static async adjustStock(adjustData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/adjust`,
        adjustData,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error adjusting stock:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = InventoryService;


// =====================================================
// EXAMPLE USAGE
// =====================================================

/**
 * EXAMPLE 1: Sử dụng trong Controller
 */
const exampleController = async (req, res) => {
  try {
    // Lấy tồn kho
    const stock = await InventoryService.getVariantStock(101);
    console.log(`Variant 101 hiện có: ${stock} cái`);
    
    // Check tồn kho trước khi cho phép order
    if (stock < 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Số lượng không đủ'
      });
    }
    
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * EXAMPLE 2: Gọi từ Service khi xử lý Order
 */
const processOrderService = async (orderId, items) => {
  try {
    // 1. Validate tồn kho trước
    for (const item of items) {
      const stock = await InventoryService.getVariantStock(item.variant_id);
      if (stock < item.qty) {
        throw new Error(`Variant ${item.variant_id} không đủ tồn kho`);
      }
    }
    
    // 2. Processing order...
    console.log('✅ Order processing...');
    
    // 3. Nếu order thành công, tương lai có thể tự động
    //    tạo entry ORDER trong inventory_logs (do backend khác)
    
  } catch (error) {
    console.error('❌ Error processing order:', error.message);
    throw error;
  }
};


/**
 * EXAMPLE 3: Tạo phiếu nhập từ Admin form
 */
const handleImportSubmit = async (formData) => {
  try {
    // formData: { reference_code, note, items }
    const result = await InventoryService.importStock(formData);
    
    console.log('✅ Import success:', result.message);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('❌ Import failed:', error.response?.data?.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};


/**
 * EXAMPLE 4: Lấy lịch sử kho với filter
 */
const viewInventoryHistory = async () => {
  try {
    // Lấy tất cả IMPORT transactions
    const result = await InventoryService.getInventoryLogs({
      actionType: 'IMPORT',
      limit: 50,
      offset: 0
    });
    
    console.log(`📊 Total imports: ${result.pagination.total}`);
    console.log(`📄 Current page: ${result.pagination.page}`);
    
    // Render table với result.data
    result.data.forEach(log => {
      console.log(`${log.reference_code}: ${log.product_name} (x${log.quantity_changed})`);
    });
    
  } catch (error) {
    console.error('❌ Error fetching history:', error.message);
  }
};


// =====================================================
// Integration vào Express App
// =====================================================

/**
 * OPTION 1: Export service để dùng ở chỗ khác
 * 
 * File: routes/orders.js
 * 
 * const InventoryService = require('../services/inventoryService');
 * 
 * router.post('/checkout', async (req, res) => {
 *   // Kiểm tra tồn kho
 *   const stock = await InventoryService.getVariantStock(variant_id);
 *   if (stock < qty) {
 *     return res.status(400).json({ message: 'Out of stock' });
 *   }
 *   // Continue checkout...
 * });
 */

/**
 * OPTION 2: Sử dụng trực tiếp request body
 * 
 * router.post('/batch-import', async (req, res) => {
 *   const { items } = req.body;
 *   try {
 *     const result = await InventoryService.importStock({
 *       reference_code: `PN-${Date.now()}`,
 *       note: req.body.note,
 *       items
 *     });
 *     res.json(result);
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 */
