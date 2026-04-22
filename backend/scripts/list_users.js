const db = require('../db');

async function listUsers() {
    try {
        const [rows] = await db.query('SELECT id, email, full_name, phone, role, is_verified, created_at FROM users ORDER BY id DESC');
        if (!rows || rows.length === 0) {
            console.log('No users found.');
            return;
        }

        console.log(`Found ${rows.length} users:\n`);
        rows.forEach(u => {
            console.log(`- id=${u.id} | email=${u.email} | name=${u.full_name || '-'} | phone=${u.phone || '-'} | role=${u.role} | verified=${u.is_verified} | created_at=${u.created_at}`);
        });
    } catch (err) {
        console.error('Error listing users:', err.message || err);
    } finally {
        // close pool gracefully
        process.exit(0);
    }
}

listUsers();
