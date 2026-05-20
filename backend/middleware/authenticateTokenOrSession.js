/**
 * Middleware: Authenticate either by JWT token OR session_id
 * Used for endpoints that serve both authenticated users and guests
 * 
 * Priority order:
 * 1. If JWT token exists → Verify and extract user_id
 * 2. If session_id exists → Use session_id, user_id = null
 * 3. Otherwise → Return 401
 */

const jwt = require('jsonwebtoken');

const authenticateTokenOrSession = (req, res, next) => {
  try {
    // Check for JWT token in Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // User is authenticated with JWT
      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
          return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn', details: err.message });
        }
        req.user = user;
        req.authType = 'token';
        next();
      });
    } else if (req.sessionId) {
      // Guest user with valid session_id
      req.authType = 'session';
      req.user = null; // No authenticated user
      // Giữ session flow cho guest để vẫn cá nhân hoá recommendation/cart tạm.
      next();
    } else {
      // No authentication method provided
      return res.status(401).json({ error: 'Không có quyền truy cập - Thiếu token hoặc session_id' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Lỗi xác thực' });
  }
};

module.exports = authenticateTokenOrSession;
module.exports.authenticateTokenOrSession = authenticateTokenOrSession;
