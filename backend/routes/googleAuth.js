const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth callback
router.post('/google-login', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        // Verify the token with Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const googleId = payload.sub;
        const email = payload.email;
        const name = payload.name;
        const picture = payload.picture;

        // Check if user with this google_id exists
        let [users] = await db.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
        let user = users[0];

        if (user) {
            // If admin disabled the account, block login
            if (user.is_verified === 0) {
                return res.status(403).json({ error: 'Tài khoản của bạn đã bị vô hiệu hoá, liên hệ admin@gmail.com để biết thêm chi tiết' });
            }
            // update avatar if needed
            await db.query('UPDATE users SET avatar_url = ? WHERE id = ?', [picture, user.id]).catch(() => {});
        } else {
            // Check if email already exists
            const [existingEmail] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

            if (existingEmail.length > 0) {
                // If admin disabled the account, block login
                if (existingEmail[0].is_verified === 0) {
                    return res.status(403).json({ error: 'Tài khoản của bạn đã bị vô hiệu hoá, liên hệ admin@gmail.com để biết thêm chi tiết' });
                }

                // User exists with this email but different auth provider
                // Update their google_id and other details but keep existing verification state
                user = existingEmail[0];
                await db.query(
                    'UPDATE users SET google_id = ?, auth_provider = ?, avatar_url = ?, full_name = COALESCE(full_name, ?) WHERE id = ?',
                    [googleId, 'google', picture, name, user.id]
                );
                // Refresh user object
                const [updatedUsers] = await db.query('SELECT * FROM users WHERE id = ?', [user.id]);
                user = updatedUsers[0];
            } else {
                // Create new user (using email column) and mark verified
                const [result] = await db.query(
                    'INSERT INTO users (email, google_id, auth_provider, is_verified, avatar_url, full_name, role) VALUES (?, ?, ?, 1, ?, ?, ?)',
                    [email, googleId, 'google', picture, name, 'customer']
                );

                // Fetch the created user
                const [newUser] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
                user = newUser[0];
            }
        }

        // Generate JWT token
        const jwtToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.json({
            success: true,
            token: jwtToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                avatar_url: picture,
                auth_provider: 'google'
            }
        });
    } catch (error) {
        console.error('Google login error:', error.message);
        return res.status(400).json({ error: 'Invalid token or authentication failed' });
    }
});

module.exports = router;
