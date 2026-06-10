const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQL_ADDON_HOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQL_ADDON_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQL_ADDON_PASSWORD,
    database: process.env.DB_NAME || process.env.MYSQL_ADDON_DB || 'shoestore',
    port: process.env.DB_PORT || process.env.MYSQL_ADDON_PORT || 3306,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com')) || process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});
// Dùng pool để tái sử dụng connection và hỗ trợ transaction qua getConnection().

// Test connection
pool.getConnection().then(conn => {
    conn.release();
}).catch(err => {
    console.error('❌ Database connection failed:', err.message);
});

module.exports = pool;

