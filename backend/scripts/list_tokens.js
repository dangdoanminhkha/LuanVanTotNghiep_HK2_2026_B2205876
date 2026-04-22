const db = require('../db');

async function listTokens() {
    try {
        const [rows] = await db.query('SELECT * FROM email_verifications ORDER BY id DESC');
        if (!rows || rows.length === 0) {
            console.log('No tokens found.');
            return;
        }
        console.log(`Found ${rows.length} tokens:`);
        rows.forEach(r => {
            console.log(`- id=${r.id} | user_id=${r.user_id} | token=${r.token} | expires_at=${r.expires_at} | created_at=${r.created_at}`);
        });
    } catch (err) {
        console.error('Error listing tokens:', err.message || err);
    } finally {
        process.exit(0);
    }
}

listTokens();
