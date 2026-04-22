const db = require('../db');
const bcrypt = require('bcryptjs');

async function createShipper() {
    const email = 'shipper@gmail.com';
    const password = 'shipper123';
    const fullName = 'Shipper';
    const role = 'shipper';

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user already exists
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            console.log(`User ${email} already exists. Updating role and password.`);
            await db.query(
                'UPDATE users SET password = ?, role = ?, is_verified = 1 WHERE email = ?',
                [hashedPassword, role, email]
            );
        } else {
            // Insert new user
            await db.query(
                'INSERT INTO users (email, password, role, full_name, is_verified) VALUES (?, ?, ?, ?, ?)',
                [email, hashedPassword, role, fullName, 1]
            );
            console.log(`Shipper user created: ${email} (pass: ${password})`);
        }
    } catch (error) {
        console.error('Error creating shipper user:', error);
    } finally {
        process.exit();
    }
}

createShipper();
