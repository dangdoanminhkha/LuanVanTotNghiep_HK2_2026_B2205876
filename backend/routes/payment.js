const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const moment = require('moment');
const qs = require('qs');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const http = require('http');

// ML service URL (same env var used in behavior.js)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const CLIENT_PAYMENT_BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ================== [PAYMENT_MODE_SWITCH_START] ==================
// PAYMENT_DEMO_MODE=true  -> dùng trang demo nội bộ (/payment/demo)
// PAYMENT_DEMO_MODE=false -> dùng VNPay sandbox thật
const PAYMENT_MODE = process.env.PAYMENT_DEMO_MODE === 'true' ? 'demo' : 'vnpay_sandbox';
const DEMO_MODE = PAYMENT_MODE === 'demo';
// ================== [PAYMENT_MODE_SWITCH_END] ==================

// ================== [VNPAY_SANDBOX_CONFIG_START] ==================
// Sandbox merchant: theo thông tin bạn cung cấp.
// Có thể override bằng ENV khi deploy production.
const vnpayConfig = {
  vnp_TmnCode: (process.env.VNPAY_TMN_CODE || '3ARR1DJS').trim(),
  vnp_HashSecret: (process.env.VNPAY_HASH_SECRET || '0W74BMW3QDC0WD9FXIO1G6L0GHYFF6LU').trim(),
  vnp_Url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || `${CLIENT_PAYMENT_BASE_URL}/payment/vnpay-return`,
  vnp_IpnUrl: process.env.VNPAY_IPN_URL || 'http://localhost:5000/api/payment/vnpay/ipn',
  vnp_ApiUrl: 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction'
};
// ================== [VNPAY_SANDBOX_CONFIG_END] ==================

// Check if order items have sufficient inventory
async function checkOrderInventory(orderId) {
    const [items] = await db.query(
        `SELECT oi.variant_id, oi.quantity, oi.product_id,
                pv.quantity as variant_stock, p.name as product_name
         FROM order_items oi
         LEFT JOIN product_variants pv ON oi.variant_id = pv.id
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [orderId]
    );

    const unavailableItems = [];
    const availableItems = [];

    for (const item of items) {
        if (item.variant_id && (item.variant_stock === null || item.variant_stock < item.quantity)) {
            unavailableItems.push({
                product_name: item.product_name,
                ordered: item.quantity,
                available: item.variant_stock || 0
            });
        } else {
            availableItems.push(item);
        }
    }

    return { unavailableItems, availableItems };
}

// Restore available items back to user cart
async function restoreItemsToCart(userId, availableItems) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        for (const item of availableItems) {
            // Check if item already exists in cart
            const [existing] = await connection.query(
                'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
                [userId, item.product_id]
            );

            if (existing.length > 0) {
                // Update existing cart item
                await connection.query(
                    'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
                    [item.quantity, existing[0].id]
                );
            } else {
                // Add new cart item  
                await connection.query(
                    'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
                    [userId, item.product_id, item.quantity]
                );
            }
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}



// ================== Helper Functions ==================
// VNPay official: sort + encode keys/values
function sortObject(obj) {
  let sorted = {};
  let str = [];
  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (let key of str) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
  }
  return sorted;
}

// VNPay signing helper (official flow): sort -> stringify (encode:false) -> HMAC SHA512
function buildSignedVnpayUrl(baseUrl, params, secretKey) {
  const sortedParams = sortObject(params);
  const signData = qs.stringify(sortedParams, { encode: false });
  const signed = crypto
    .createHmac('sha512', secretKey)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  sortedParams['vnp_SecureHash'] = signed;

  return {
    paymentUrl: `${baseUrl}?${qs.stringify(sortedParams, { encode: false })}`,
    signData,
    signed,
  };
}

function buildDemoPaymentUrl({ orderId, amount, txnRef }) {
  const query = qs.stringify({ orderId, amount, txnRef, method: 'vnpay' });
  return `${CLIENT_PAYMENT_BASE_URL}/payment/demo?${query}`;
}

// ================== VNPay Create Payment URL ==================

router.post('/vnpay/create', authenticateToken, async (req, res) => {
  try {
    const { orderId, orderInfo, bankCode } = req.body;

    const userId = req.user.id || req.user.userId;
    const [orderRows] = await db.query(
      `SELECT id, total, status, payment_status
       FROM orders
       WHERE id = ? AND user_id = ?`,
      [orderId, userId]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    const order = orderRows[0];
    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Đơn hàng đã bị hủy' });
    }
    if (order.payment_status === 'paid') {
      return res.status(400).json({ success: false, message: 'Đơn hàng đã thanh toán' });
    }

    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const txnRef = `${orderId}_${createDate}`;

    // ================== [DEMO_FALLBACK_START] ==================
    // Nhánh dự phòng: trang demo nội bộ.
    // Khi sandbox VNPay lỗi, chỉ cần set PAYMENT_DEMO_MODE=true.
    if (DEMO_MODE) {
      await db.query(
        `UPDATE orders SET payment_ref = ?, payment_method = 'vnpay' WHERE id = ?`,
        [txnRef, orderId]
      );

      const demoUrl = buildDemoPaymentUrl({ orderId, amount: Number(order.total || 0), txnRef });
      
      return res.json({ 
        success: true,
        paymentUrl: demoUrl,
        txnRef,
        demoMode: true
      });
    }
    // ================== [DEMO_FALLBACK_END] ==================

    // ================== [VNPAY_SANDBOX_FLOW_START] ==================
    const ipAddr = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
    
    // 🔧 Fix IPv6 loopback (::1) - VNPay requires valid IPv4 or public IP
    let finalIpAddr = ipAddr || '127.0.0.1';
    if (finalIpAddr.includes('::1') || finalIpAddr === '::1') {
      finalIpAddr = '127.0.0.1';  // VNPay default fallback for localhost
    }
    // Handle x-forwarded-for with multiple IPs (take first one)
    if (finalIpAddr.includes(',')) {
      finalIpAddr = finalIpAddr.split(',')[0].trim();
    }
    // Remove IPv6 wrapper like ::ffff:127.0.0.1
    if (finalIpAddr.includes('::ffff:')) {
      finalIpAddr = finalIpAddr.replace('::ffff:', '');
    }

    const tmnCode = vnpayConfig.vnp_TmnCode;
    const secretKey = vnpayConfig.vnp_HashSecret;
    let vnpUrl = vnpayConfig.vnp_Url;
    const returnUrl = vnpayConfig.vnp_ReturnUrl;

    const orderInfoText = orderInfo || `Thanh toan don hang #${orderId}`;
    const orderType = 'billpayment';
    const locale = 'vn';
    const currCode = 'VND';
    const finalAmount = Math.round(Number(order.total || 0) * 100);

    let vnp_Params = {
      'vnp_Version': '2.1.0',
      'vnp_Command': 'pay',
      'vnp_TmnCode': tmnCode,
      'vnp_Locale': locale,
      'vnp_CurrCode': currCode,
      'vnp_TxnRef': txnRef,
      'vnp_OrderInfo': orderInfoText,
      'vnp_OrderType': orderType,
      'vnp_Amount': finalAmount, // VNPay yêu cầu nhân 100 và là số nguyên
      'vnp_ReturnUrl': returnUrl,
      'vnp_IpAddr': finalIpAddr,
      'vnp_CreateDate': createDate
    };

    if (bankCode) {
      vnp_Params['vnp_BankCode'] = bankCode;
    }

    const signedData = buildSignedVnpayUrl(vnpUrl, vnp_Params, secretKey);
    vnpUrl = signedData.paymentUrl;

    // Lưu transaction reference vào database
    await db.query(
      `UPDATE orders SET payment_ref = ?, payment_method = 'vnpay' WHERE id = ?`,
      [txnRef, orderId]
    );

    res.json({ 
      success: true,
      paymentUrl: vnpUrl,
      txnRef 
    });
    // ================== [VNPAY_SANDBOX_FLOW_END] ==================

  } catch (error) {
    console.error('VNPay create error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// VNPay Retry Payment (tạo mã giao dịch mới cho order đã tồn tại)
router.post('/vnpay/retry', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id || req.user.userId; // Support cả 2 format token

    // Kiểm tra order có thể retry không
    const [orderResult] = await db.query(
      `SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = 'pending'`,
      [orderId, userId]
    );

    if (orderResult.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng không tồn tại hoặc không thể thanh toán lại'
      });
    }

    const order = orderResult[0];

    // 🔥 REAL-TIME INVENTORY CHECK
    const { unavailableItems, availableItems } = await checkOrderInventory(orderId);

    if (unavailableItems.length > 0) {
      // Some items out of stock - cancel order and restore available items
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        // Get current order status
        const [currentOrder] = await connection.query(
          `SELECT status FROM orders WHERE id = ?`,
          [orderId]
        );
        const oldStatus = currentOrder[0]?.status || 'pending';

        // Cancel the order
        await connection.query(
          `UPDATE orders SET 
              status = 'cancelled',
              payment_status = 'failed',
              note = CONCAT(COALESCE(note, ''), '\n', ?) 
           WHERE id = ?`,
          [`[Hệ thống] Đơn hàng bị hủy do sản phẩm hết hàng khi thử thanh toán lại.`, orderId]
        );

        // Log status change
        await connection.query(
          `INSERT INTO order_status_logs (order_id, status_old, status_new, created_at) 
           VALUES (?, ?, ?, NOW())`,
          [orderId, oldStatus, 'cancelled']
        );

        await connection.commit();

        // Restore available items to cart
        if (availableItems.length > 0) {
          await restoreItemsToCart(userId, availableItems);
        }

        return res.status(409).json({
          success: false,
          type: 'inventory_insufficient',
          message: 'Một số sản phẩm trong đơn hàng đã hết hàng',
          unavailableItems,
          restoredItems: availableItems.length,
          action: 'redirect_to_cart'
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }

    // Tạo mã giao dịch mới (unique)
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const timestamp = Date.now();
    const txnRef = `${orderId}_${createDate}_${timestamp}`;

    // ================== [DEMO_FALLBACK_START] ==================
    // Nhánh dự phòng retry: dùng trang demo nội bộ.
    if (DEMO_MODE) {
      await db.query(
        `UPDATE orders SET payment_ref = ?, payment_method = 'vnpay' WHERE id = ?`,
        [txnRef, orderId]
      );

      const demoUrl = buildDemoPaymentUrl({ orderId, amount: order.total, txnRef });
      
      return res.json({ 
        success: true,
        paymentUrl: demoUrl,
        txnRef,
        demoMode: true
      });
    }
    // ================== [DEMO_FALLBACK_END] ==================

    // ================== [VNPAY_SANDBOX_FLOW_START] ==================
    // Tạo VNPay URL với amount từ order
    // 🔧 Fix IP Address - same as /create endpoint
    let retryIpAddr = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';
    if (retryIpAddr.includes('::1') || retryIpAddr === '::1') {
      retryIpAddr = '127.0.0.1';
    }
    if (retryIpAddr.includes(',')) {
      retryIpAddr = retryIpAddr.split(',')[0].trim();
    }
    if (retryIpAddr.includes('::ffff:')) {
      retryIpAddr = retryIpAddr.replace('::ffff:', '');
    }
    
    const retryAmount = Math.round(Number(order.total) * 100);

    let vnp_Params = {
      'vnp_Version': '2.1.0',
      'vnp_Command': 'pay',
      'vnp_TmnCode': vnpayConfig.vnp_TmnCode,
      'vnp_Locale': 'vn',
      'vnp_CurrCode': 'VND',
      'vnp_TxnRef': txnRef,
      'vnp_OrderInfo': `Thanh toan lai don hang #${orderId}`,
      'vnp_OrderType': 'other',
      'vnp_Amount': retryAmount,
      'vnp_ReturnUrl': vnpayConfig.vnp_ReturnUrl,
      'vnp_IpAddr': retryIpAddr,
      'vnp_CreateDate': createDate
    };

    const signedData = buildSignedVnpayUrl(vnpayConfig.vnp_Url, vnp_Params, vnpayConfig.vnp_HashSecret);
    const vnpUrl = signedData.paymentUrl;

    // Update payment reference
    await db.query(
      `UPDATE orders SET payment_ref = ?, payment_method = 'vnpay' WHERE id = ?`,
      [txnRef, orderId]
    );

    res.json({
      success: true,
      paymentUrl: vnpUrl,
      txnRef 
    });
    // ================== [VNPAY_SANDBOX_FLOW_END] ==================

  } catch (error) {
    console.error('VNPay retry error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ================== [VNPAY_SANDBOX_RETURN_START] ==================
// VNPay Return URL - Chỉ hiển thị giao diện UI, không cập nhật Database (Database được cập nhật bởi IPN Callback)
router.get('/vnpay/return', async (req, res) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    const secretKey = vnpayConfig.vnp_HashSecret;
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    const txnRef = vnp_Params['vnp_TxnRef'] || vnp_Params[encodeURIComponent('vnp_TxnRef')];
    const responseCode = vnp_Params['vnp_ResponseCode'] || vnp_Params[encodeURIComponent('vnp_ResponseCode')];
    const amount = parseInt(vnp_Params['vnp_Amount'] || vnp_Params[encodeURIComponent('vnp_Amount')]) / 100;
    const bankCode = vnp_Params['vnp_BankCode'] || vnp_Params[encodeURIComponent('vnp_BankCode')];
    const transactionNo = vnp_Params['vnp_TransactionNo'] || vnp_Params[encodeURIComponent('vnp_TransactionNo')];

    // Lấy orderId từ txnRef (format: orderId_timestamp)
    const orderId = txnRef ? txnRef.split('_')[0] : null;

    if (secureHash === signed) {
      if (responseCode === '00') {
        // ✅ Chỉ hiển thị UI - Database sẽ được cập nhật bởi IPN Callback
        res.json({
          success: true,
          message: 'Thanh toán thành công. Đơn hàng của bạn đang được xử lý.',
          orderId,
          amount,
          bankCode,
          transactionNo
        });
      } else {
        // ❌ Thanh toán thất bại
        res.json({
          success: false,
          message: 'Thanh toán thất bại. Bạn có thể thử lại.',
          responseCode,
          orderId
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Chữ ký không hợp lệ'
      });
    }
  } catch (error) {
    console.error('VNPay return error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// ================== [VNPAY_SANDBOX_RETURN_END] ==================

// ================== [VNPAY_SANDBOX_IPN_START] ==================
// VNPay IPN - Instant Payment Notification (Callback từ VNPay Server)
// Đây là chỗ cập nhật Database sau khi thanh toán
// Support cả GET và POST (VNPay dashboard có thể cấu hình GET hoặc POST)
router.get('/vnpay/ipn', handleVNPayIPN);
router.post('/vnpay/ipn', handleVNPayIPN);

async function handleVNPayIPN(req, res) {
  const connection = await db.getConnection();
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    const secretKey = vnpayConfig.vnp_HashSecret;
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    const txnRef = vnp_Params['vnp_TxnRef'] || vnp_Params[encodeURIComponent('vnp_TxnRef')];
    const orderId = txnRef ? txnRef.split('_')[0] : null;
    const responseCode = vnp_Params['vnp_ResponseCode'] || vnp_Params[encodeURIComponent('vnp_ResponseCode')];
    const amount = parseInt(vnp_Params['vnp_Amount'] || vnp_Params[encodeURIComponent('vnp_Amount')]) / 100;
    const bankCode = vnp_Params['vnp_BankCode'] || vnp_Params[encodeURIComponent('vnp_BankCode')];
    const transactionNo = vnp_Params['vnp_TransactionNo'] || vnp_Params[encodeURIComponent('vnp_TransactionNo')];

    // 1️⃣ Kiểm tra chữ ký (Signature)
    if (secureHash !== signed) {
      console.warn('❌ IPN: Chữ ký không hợp lệ');
      return res.json({ RspCode: '97', Message: 'Invalid Signature' });
    }

    // 2️⃣ Kiểm tra order tồn tại
    const [orderRows] = await connection.query(
      'SELECT id, user_id, total, payment_status, status FROM orders WHERE id = ?',
      [orderId]
    );

    if (orderRows.length === 0) {
      console.warn('❌ IPN: Order không tìm thấy');
      return res.json({ RspCode: '01', Message: 'Order not found' });
    }

    const order = orderRows[0];

    // Kiểm tra order đã bị hủy
    if (order.status === 'cancelled') {
      console.warn('❌ IPN: Order đã bị hủy');
      return res.json({ RspCode: '02', Message: 'Order already cancelled' });
    }

    // Kiểm tra order đã thanh toán
    if (order.payment_status === 'paid') {
      console.warn('⚠️ IPN: Order đã thanh toán rồi (trùng request)');
      return res.json({ RspCode: '00', Message: 'Order already confirmed' });
    }

    if (responseCode === '00') {
      // 3️⃣ Kiểm tra giá tiền có khớp không
      if (Math.abs(order.total - amount) > 0.01) {
        console.error('❌ IPN: Giá tiền không khớp', { expected: order.total, received: amount });
        
        await connection.query(
          `UPDATE orders SET 
            payment_status = 'failed',
            note = CONCAT(COALESCE(note, ''), '\n[', NOW(), '] IPN: Giá tiền không khớp (Yêu cầu: ${order.total}, Nhận: ${amount})')
          WHERE id = ?`,
          [orderId]
        );

        return res.json({ RspCode: '99', Message: 'Amount mismatch' });
      }

      // ✅ 4️⃣ Tất cả kiểm tra OK → Cập nhật Database
      await connection.beginTransaction();

      try {
        // Cập nhật order status
        const [currentOrder] = await connection.query(
          `SELECT status FROM orders WHERE id = ?`,
          [orderId]
        );
        const oldStatus = currentOrder[0]?.status || 'pending';

        await connection.query(
          `UPDATE orders SET 
            payment_status = 'paid',
            payment_ref = ?,
            payment_bank = ?,
            payment_transaction_no = ?,
            note = CONCAT(COALESCE(note, ''), '\n[', NOW(), '] IPN: Thanh toán thành công bằng VNPay')
          WHERE id = ?`,
          [txnRef, bankCode, transactionNo, orderId]
        );

        // Log status change if needed
        if (oldStatus !== 'confirmed') {
          await connection.query(
            `INSERT INTO order_status_logs (order_id, status_old, status_new, created_at) 
             VALUES (?, ?, ?, NOW())`,
            [orderId, oldStatus, 'confirmed']
          );
        }

        // Lưu ý: inventory đã được trừ ngay khi tạo đơn trong orders route,
        // nên IPN không trừ lại để tránh double-deduct.

        // Ghi log 'purchase' chỉ khi thanh toán thành công
        try {
          const [orderItemsToLog] = await connection.query(
            `SELECT * FROM order_items WHERE order_id = ?`,
            [orderId]
          );

          for (const it of orderItemsToLog) {
            try {
              const variantId = it.variant_id ?? null;
              await connection.query(
                'INSERT INTO user_behavior_logs (user_id, action, product_id, extra_info) VALUES (?, ?, ?, ?)',
                [order.user_id, 'purchase', it.product_id, JSON.stringify({ variant_id: variantId, quantity: it.quantity, order_id: Number(orderId) })]
              );
            } catch (logErr) {
              console.error('IPN: Error logging purchase for order', orderId, it.product_id, logErr.message);
              // Continue logging other items
            }
          }
        } catch (err) {
          console.error('IPN: Error fetching order items for logging:', err.message);
        }

        await connection.commit();
        
        // Trigger ML retrain (non-blocking) after successful payment + logging
        try {
          const options = {
            hostname: new URL(ML_SERVICE_URL).hostname,
            port: new URL(ML_SERVICE_URL).port || 80,
            path: '/retrain',
            method: 'POST',
            timeout: 3000,
          };

          const retrainReq = http.request(options, (retrainRes) => {
            // consume response quietly
            retrainRes.on('data', () => {});
            retrainRes.on('end', () => {});
          });
          retrainReq.on('error', () => {});
          retrainReq.on('timeout', () => retrainReq.destroy());
          retrainReq.end();
        } catch (err) {
          // Ignore retrain trigger failures
        }

        return res.json({ RspCode: '00', Message: 'Confirm Success' });
      } catch (error) {
        await connection.rollback();
        console.error('❌ IPN: Lỗi khi cập nhật DB:', error);
        return res.json({ RspCode: '99', Message: 'Database error' });
      }
    } else {
      // Thanh toán thất bại từ phía VNPay
      await connection.query(
        `UPDATE orders SET 
          payment_status = 'failed',
          note = CONCAT(COALESCE(note, ''), '\n[', NOW(), '] IPN: Thanh toán thất bại (mã: ', ?, ')')
        WHERE id = ?`,
        [responseCode, orderId]
      );

      return res.json({ RspCode: '00', Message: 'Confirm failed payment' });
    }
  } catch (error) {
    console.error('❌ IPN: Error:', error);
    res.json({ RspCode: '99', Message: 'Unknown error' });
  } finally {
    connection.release();
  }
}
// ================== [VNPAY_SANDBOX_IPN_END] ==================

// ================== Danh sách ngân hàng VNPay ==================
router.get('/vnpay/banks', (req, res) => {
  // Danh sách ngân hàng phổ biến hỗ trợ VNPay
  const banks = [
    { code: '', name: 'Chọn ngân hàng (để trống = chọn tại VNPay)' },
    { code: 'VNPAYQR', name: 'Quét QR VNPay' },
    { code: 'VNBANK', name: 'Thẻ ATM nội địa' },
    { code: 'INTCARD', name: 'Thẻ thanh toán quốc tế' },
    { code: 'NCB', name: 'Ngân hàng NCB' },
    { code: 'SACOMBANK', name: 'Ngân hàng Sacombank' },
    { code: 'EXIMBANK', name: 'Ngân hàng Eximbank' },
    { code: 'MSBANK', name: 'Ngân hàng MSBANK' },
    { code: 'NAMABANK', name: 'Ngân hàng NamABank' },
    { code: 'VNMART', name: 'Ví điện tử VnMart' },
    { code: 'VIETINBANK', name: 'Ngân hàng Vietinbank' },
    { code: 'VIETCOMBANK', name: 'Ngân hàng Vietcombank' },
    { code: 'HDBANK', name: 'Ngân hàng HDBank' },
    { code: 'DONGABANK', name: 'Ngân hàng Đông Á' },
    { code: 'TPBANK', name: 'Ngân hàng TPBank' },
    { code: 'OJB', name: 'Ngân hàng OceanBank' },
    { code: 'BIDV', name: 'Ngân hàng BIDV' },
    { code: 'TECHCOMBANK', name: 'Ngân hàng Techcombank' },
    { code: 'VPBANK', name: 'Ngân hàng VPBank' },
    { code: 'AGRIBANK', name: 'Ngân hàng Agribank' },
    { code: 'MBBANK', name: 'Ngân hàng MBBank' },
    { code: 'ACB', name: 'Ngân hàng ACB' },
    { code: 'OCB', name: 'Ngân hàng OCB' },
    { code: 'SHB', name: 'Ngân hàng SHB' },
    { code: 'IVB', name: 'Ngân hàng IVB' }
  ];
  res.json(banks);
});

// ================== [DEMO_FALLBACK_CONFIRM_START] ==================
// Endpoint dành riêng cho trang demo nội bộ (/payment/demo).
// Chỉ chạy khi dùng nhánh fallback, không dùng trong luồng VNPay sandbox thật.
router.post('/demo/confirm', async (req, res) => {
  try {
    const { orderId, txnRef, success, method } = req.body;
    const orderIdInt = parseInt(orderId, 10);

    if (success) {
      const [result] = await db.query(
        `UPDATE orders SET 
          payment_status = 'paid',
          payment_ref = ?,
          payment_transaction_no = ?
        WHERE id = ?`,
        [txnRef || `PAYMENT_${Date.now()}`, `DEMO_${Date.now()}`, orderIdInt]
      );
      
      if (result?.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          orderId: orderIdInt
        });
      }

      // Log purchase behaviors for demo success
      try {
        const [demoItems] = await db.query(
          'SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?',
          [orderIdInt]
        );

        // Only log if authenticated
        if (req.user && req.user.id) {
          for (const it of demoItems) {
            try {
              await db.query(
                'INSERT INTO user_behavior_logs (user_id, action, product_id, extra_info) VALUES (?, ?, ?, ?)',
                [req.user.id, 'purchase', it.product_id, JSON.stringify({ variant_id: it.variant_id, quantity: it.quantity, order_id: orderId })]
              );
            } catch (logErr) {
              console.error('Demo confirm: error logging purchase for order', orderId, it.product_id, logErr.message);
            }
          }
        }
      } catch (err) {
        console.error('Demo confirm: error fetching order items for logging:', err.message);
      }

      res.json({
        success: true,
        message: 'Demo payment successful',
        orderId: orderIdInt
      });

      // Trigger ML retrain for demo confirmed purchase (non-blocking)
      try {
        const options = {
          hostname: new URL(ML_SERVICE_URL).hostname,
          port: new URL(ML_SERVICE_URL).port || 80,
          path: '/retrain',
          method: 'POST',
          timeout: 3000,
        };

        const retrainReq = http.request(options, (retrainRes) => {
          retrainRes.on('data', () => {});
          retrainRes.on('end', () => {});
        });
        retrainReq.on('error', () => {});
        retrainReq.on('timeout', () => retrainReq.destroy());
        retrainReq.end();
      } catch (err) {
        // ignore
      }
    } else {
      await db.query(
        `UPDATE orders SET payment_status = 'failed' WHERE id = ?`,
        [orderId]
      );

      res.json({
        success: false,
        message: 'Demo payment cancelled',
        orderId
      });
    }
  } catch (error) {
    console.error('Demo confirm error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// ================== [DEMO_FALLBACK_CONFIRM_END] ==================

module.exports = router;
