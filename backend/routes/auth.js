// ...existing code...
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { createRegisterLimiter, createResendLimiter } = require('../middleware/rateLimiter');
const { transferGuestDataToUser } = require('../utils/guestDataMigration');

// nodemailer transporter (requires SMTP env vars)
const createTransporter = () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return null;
};

// Đăng ký (email, password, fullName, phone, termsAccepted)
// Register route with validation and rate limiting
const registerLimiter = createRegisterLimiter();

router.post('/register',
    registerLimiter,
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 chars'),
    body('fullName').isLength({ min: 2 }).withMessage('Full name required'),
    async (req, res) => {
        // server-side validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input' });
        }

        const { email, password, fullName, phone, gender, termsAccepted } = req.body;
        if (!termsAccepted) {
            return res.status(400).json({ error: 'Terms must be accepted' });
        }

        try {
            const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            if (users.length > 0) {
                // To avoid user enumeration, respond with generic message
                return res.json({ message: 'If the registration was successful, check your email to verify your account' });
            }

            const hash = await bcrypt.hash(password, 10);
            const validGender = ['Nam', 'Nữ', 'Khác'].includes(gender) ? gender : 'Khác';
            const result = await db.query('INSERT INTO users (email, password, role, full_name, phone, gender, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)', [email, hash, 'customer', fullName, phone || null, validGender, 0]);
            const insertId = result[0].insertId || (result.insertId ? result.insertId : null);

            // create verification token
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
            await db.query('INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)', [insertId, token, expiresAt]);

            // ==== GUEST DATA MIGRATION ====
            // Transfer any guest cart and behavior data to newly created account
            if (req.sessionId) {
                const migrationResult = await transferGuestDataToUser(req.sessionId, insertId);
                // Migration data silently
            }

            // send email if transporter configured
            const transporter = createTransporter();
            const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
            const verifyUrl = `${backendUrl}/api/auth/verify?token=${token}`;
            if (transporter) {
                await transporter.sendMail({
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: email,
                    subject: 'Verify your account',
                    text: `Please verify your account by visiting: ${verifyUrl}`,
                    html: `<p>Please verify your account by clicking <a href="${verifyUrl}">this link</a>.</p>`,
                });
            } else {
                console.log('Verification URL (no SMTP configured):', verifyUrl);
            }

            // generic response to avoid enumeration
            res.json({ message: 'If the registration was successful, check your email to verify your account' });
        } catch (err) {
            console.error('Register error:', err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// Resend verification email
const resendLimiter = createResendLimiter();
router.post('/resend-verification',
    resendLimiter,
    body('email').isEmail().withMessage('Invalid email'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input' });
        }

        const { email } = req.body;
        try {
            const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            if (users.length === 0) {
                // Generic response
                return res.json({ message: 'If the registration was successful, check your email to verify your account' });
            }

            const user = users[0];
            if (user.is_verified && user.is_verified === 1) {
                return res.json({ message: 'If the registration was successful, check your email to verify your account' });
            }

            // delete previous tokens for this user
            await db.query('DELETE FROM email_verifications WHERE user_id = ?', [user.id]);

            // create new token
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
            await db.query('INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)', [user.id, token, expiresAt]);

            const transporter = createTransporter();
            const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
            const verifyUrl = `${backendUrl}/api/auth/verify?token=${token}`;
            if (transporter) {
                await transporter.sendMail({
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: email,
                    subject: 'Verify your account',
                    text: `Please verify your account by visiting: ${verifyUrl}`,
                    html: `<p>Please verify your account by clicking <a href="${verifyUrl}">this link</a>.</p>`,
                });
            } else {
                console.log('Verification URL (no SMTP configured):', verifyUrl);
            }

            return res.json({ message: 'If the registration was successful, check your email to verify your account' });
        } catch (err) {
            console.error('Resend verification error:', err);
            return res.status(500).json({ error: 'Server error' });
        }
    }
);

// Đăng nhập
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(400).json({ error: 'Sai tài khoản hoặc mật khẩu' });
        const user = users[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: 'Sai tài khoản hoặc mật khẩu' });
        // Kiểm tra tài khoản đã được kích hoạt (is_verified)
        if (!user.is_verified || user.is_verified === 0) {
            return res.status(403).json({ error: 'Tài khoản của bạn đã bị vô hiệu hoá, liên hệ admin@gmail.com để biết thêm chi tiết' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        // ==== GUEST DATA MIGRATION ====
        // Transfer any guest cart and behavior data ONLY for customer role
        if (user.role === 'customer' && req.sessionId) {
            const migrationResult = await transferGuestDataToUser(req.sessionId, user.id);
            // Migration data silently
        }
        
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                email: user.email, 
                role: user.role, 
                full_name: user.full_name, 
                phone: user.phone, 
                gender: user.gender 
            } 
        });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Quên mật khẩu - Gửi email reset
router.post('/forgot-password', 
    body('email').isEmail().withMessage('Invalid email'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input' });
        }

        const { email } = req.body;

        try {
            // Check if user exists
            const [users] = await db.query('SELECT id, full_name FROM users WHERE email = ? AND is_verified = 1', [email]);
            const user = users[0];
            if (!user) {
                return res.json({ message: 'If an account exists, a password reset link will be sent' });
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

            // Save reset token to email_verifications with type='reset'
            await db.query(
                'INSERT INTO email_verifications (user_id, token, expires_at, type) VALUES (?, ?, ?, ?)',
                [user.id, resetToken, expiresAt, 'reset']
            );

            // Send email
            const transporter = createTransporter();
            if (!transporter) {
                return res.status(500).json({ error: 'Email service not configured' });
            }

            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
            await transporter.sendMail({
                from: process.env.SMTP_FROM || 'noreply@shoestore.com',
                to: email,
                subject: 'Cấp lại mật khẩu - ShoeStore',
                html: `
                    <h2>Yêu cầu cấp lại mật khẩu</h2>
                    <p>Xin chào ${user.full_name || 'Khách hàng'},</p>
                    <p>Bạn đã yêu cầu cấp lại mật khẩu cho tài khoản của mình. Vui lòng click vào link dưới để tiếp tục:</p>
                    <a href="${resetUrl}" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; display: inline-block;">
                        Đặt lại mật khẩu
                    </a>
                    <p>Link này sẽ hết hạn trong 1 giờ.</p>
                    <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>
                    <p>Trân trọng,<br/>ShoeStore Team</p>
                `
            });

            res.json({ message: 'Password reset link sent to your email' });
        } catch (err) {
            console.error('Forgot password error:', err);
            res.status(500).json({ error: 'Server error: ' + err.message });
        }
    }
);

// Xác nhận reset token và cập nhật mật khẩu
router.post('/reset-password',
    body('token').notEmpty().withMessage('Token required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 chars'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input' });
        }

        const { token, password } = req.body;

        try {
            // Find valid reset token with type='reset'
            const [resetRecords] = await db.query(
                'SELECT user_id FROM email_verifications WHERE token = ? AND type = ? AND expires_at > NOW()',
                [token, 'reset']
            );
            const resetRecord = resetRecords[0];

            if (!resetRecord) {
                return res.status(400).json({ error: 'Invalid or expired reset token' });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Update user password
            await db.query(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedPassword, resetRecord.user_id]
            );

            // Delete used reset token
            await db.query(
                'DELETE FROM email_verifications WHERE token = ? AND type = ?',
                [token, 'reset']
            );

            res.json({ message: 'Password updated successfully' });
        } catch (err) {
            console.error('Reset password error:', err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// Verify reset token (để check xem token còn valid không)
router.get('/verify-reset-token/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const [resetRecords] = await db.query(
            'SELECT user_id FROM email_verifications WHERE token = ? AND type = ? AND expires_at > NOW()',
            [token, 'reset']
        );
        const resetRecord = resetRecords[0];

        if (!resetRecord) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        res.json({ valid: true });
    } catch (err) {
        console.error('Verify token error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
