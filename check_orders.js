const mysql = require('mysql2/promise');

async function checkOrders() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'admin123',
            database: 'shoestore'
        });

        console.log('✅ Kết nối database thành công\n');

        // Đọc cấu trúc bảng orders
        console.log('=== CẤU TRÚC BẢNG ORDERS ===');
        const [structure] = await connection.execute('DESCRIBE orders');
        console.table(structure);

        // Đọc dữ liệu bảng orders
        console.log('\n=== DỮ LIỆU BẢNG ORDERS ===');
        const [orders] = await connection.execute('SELECT * FROM orders');
        console.log(`Tổng số đơn hàng: ${orders.length}`);
        if (orders.length > 0) {
            console.table(orders);
        } else {
            console.log('Bảng orders chưa có dữ liệu');
        }

        // Kiểm tra xem có cột status không
        console.log('\n=== KIỂM TRA CỘT STATUS ===');
        const [statusData] = await connection.execute('SELECT id, status, created_at, updated_at FROM orders');
        console.log(`Số bản ghi có cột status: ${statusData.length}`);
        if (statusData.length > 0) {
            console.table(statusData);
        }

        await connection.end();
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    }
}

checkOrders();
