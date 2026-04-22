const express = require('express');
const router = express.Router();
const db = require('../db');

// Verify email token: /api/auth/verify?token=...
router.get('/', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Invalid token' });

    try {
        const [rows] = await db.query('SELECT * FROM email_verifications WHERE token = ?', [token]);
        if (rows.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });

        const record = rows[0];
        const now = new Date();
        if (new Date(record.expires_at) < now) {
            await db.query('DELETE FROM email_verifications WHERE id = ?', [record.id]);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            return res.redirect(`${frontendUrl}/verify?result=expired`);
        }

        // mark user verified
        await db.query('UPDATE users SET is_verified = 1 WHERE id = ?', [record.user_id]);
        await db.query('DELETE FROM email_verifications WHERE id = ?', [record.id]);

        // Redirect to frontend with success flag so the user sees a friendly page
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/verify?result=success`);
    } catch (err) {
        console.error('Verification error:', err);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/verify?result=error`);
    }
});

module.exports = router;
