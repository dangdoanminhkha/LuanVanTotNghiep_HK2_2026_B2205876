const jwt = require('jsonwebtoken');

// Middleware xác thực token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Chuẩn header mong đợi: "Authorization: Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Không có quyền truy cập - Thiếu token' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn', details: err.message });
        }
        req.user = user;
        // req.user chứa payload JWT (id/email/role) cho các middleware phía sau.
        next();
    });
};

// Middleware kiểm tra role admin
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Chỉ admin mới có quyền thực hiện', currentRole: req.user?.role });
    }
    next();
};

// Middleware kiểm tra role shipper
const isShipper = (req, res, next) => {
    if (req.user.role !== 'shipper' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Chỉ shipper hoặc admin mới có quyền thực hiện' });
    }
    next();
};

module.exports = authenticateToken;
module.exports.authenticateToken = authenticateToken;
module.exports.isAdmin = isAdmin;
module.exports.isShipper = isShipper;
