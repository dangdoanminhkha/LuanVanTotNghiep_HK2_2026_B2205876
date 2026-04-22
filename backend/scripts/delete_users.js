const fs = require('fs');
const path = require('path');
const db = require('../db');

function escapeSql(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val;
    return '\'' + String(val).replace(/\\/g, '\\\\').replace(/'/g, "''") + '\'';
}

async function run() {
    const args = process.argv.slice(2).filter(a => a !== '--confirm');
    const confirm = process.argv.includes('--confirm');
    if (args.length === 0) {
        console.error('Usage: node scripts/delete_users.js <id1> <id2> ... [--confirm]');
        process.exit(1);
    }

    const ids = args.map(a => Number(a)).filter(n => !isNaN(n));
    if (ids.length === 0) {
        console.error('No valid ids provided');
        process.exit(1);
    }

    try {
        // fetch users
        const [users] = await db.query(`SELECT * FROM users WHERE id IN (${ids.join(',')})`);
        if (!users || users.length === 0) {
            console.log('No matching users found for ids:', ids.join(', '));
            process.exit(0);
        }

        // fetch related email_verifications
        const [tokens] = await db.query(`SELECT * FROM email_verifications WHERE user_id IN (${ids.join(',')})`);

        console.log('Users to be removed:');
        users.forEach(u => {
            console.log(`- id=${u.id} | email=${u.email} | name=${u.full_name} | verified=${u.is_verified} | created_at=${u.created_at}`);
        });

        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(__dirname, `backup_users_${ts}.sql`);
        const lines = [];
        lines.push('-- Backup created by delete_users.js');
        lines.push('USE shoestore;');

        if (tokens && tokens.length > 0) {
            lines.push('\n-- email_verifications backup');
            tokens.forEach(t => {
                const cols = ['id', 'user_id', 'token', 'expires_at', 'created_at'];
                const vals = cols.map(c => escapeSql(t[c]));
                lines.push(`INSERT INTO email_verifications (${cols.join(',')}) VALUES (${vals.join(',')});`);
            });
        }

        lines.push('\n-- users backup');
        users.forEach(u => {
            const cols = Object.keys(u).filter(k => k !== '');
            const vals = cols.map(c => escapeSql(u[c]));
            lines.push(`INSERT INTO users (${cols.join(',')}) VALUES (${vals.join(',')});`);
        });

        // also record delete statements
        lines.push('\n-- delete statements');
        lines.push(`DELETE FROM email_verifications WHERE user_id IN (${ids.join(',')});`);
        lines.push(`DELETE FROM users WHERE id IN (${ids.join(',')});`);

        fs.writeFileSync(backupPath, lines.join('\n'));
        console.log('Backup saved to', backupPath);

        if (!confirm) {
            console.log('\nDry run complete. To actually delete, re-run with --confirm');
            process.exit(0);
        }

        // perform deletion inside a transaction
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query(`DELETE FROM email_verifications WHERE user_id IN (${ids.join(',')})`);
            await conn.query(`DELETE FROM users WHERE id IN (${ids.join(',')})`);
            await conn.commit();
            console.log('Deletion successful for ids:', ids.join(', '));
        } catch (e) {
            await conn.rollback();
            console.error('Error during deletion, rolled back:', e.message || e);
        } finally {
            conn.release();
        }

    } catch (err) {
        console.error('Error:', err.message || err);
    } finally {
        process.exit(0);
    }
}

run();
