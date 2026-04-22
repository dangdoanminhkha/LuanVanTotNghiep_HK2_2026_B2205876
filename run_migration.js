const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'admin123',
            database: 'shoestore',
            multipleStatements: true
        });

        console.log('✅ Kết nối database thành công\n');

        // Đọc file migration
        const migrationPath = path.join(__dirname, 'database/migrations/create_order_status_logs.sql');
        let sql = fs.readFileSync(migrationPath, 'utf8');

        // Loại bỏ comment và split thành từng statement
        sql = sql.split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n')
            .split(';')
            .filter(stmt => stmt.trim())
            .map(stmt => stmt.trim() + ';')
            .join('\n');

        console.log('📝 Chạy migration...\n');
        const result = await connection.query(sql);
        console.log('✅ Migration hoàn tất!\n');

        // Kiểm tra bảng order_status_logs
        console.log('=== KIỂM TRA KẾT QUẢ ===\n');
        
        const [logCount] = await connection.execute('SELECT COUNT(*) as total FROM order_status_logs');
        console.log(`✅ Tổng số status logs được lưu: ${logCount[0].total}\n`);

        // Kiểm tra cấu trúc bảng orders
        const [ordersStructure] = await connection.execute('DESCRIBE orders');
        console.log(`✅ Cấu trúc bảng orders sau migration (${ordersStructure.length} cột):`);
        console.table(ordersStructure.map(col => ({ Field: col.Field, Type: col.Type })));

        // Kiểm tra cấu trúc bảng order_status_logs
        const [logsStructure] = await connection.execute('DESCRIBE order_status_logs');
        console.log(`\n✅ Cấu trúc bảng order_status_logs:`);
        console.table(logsStructure.map(col => ({ Field: col.Field, Type: col.Type })));

        // Ví dụ dữ liệu
        const [sampleLogs] = await connection.execute(
            'SELECT * FROM order_status_logs ORDER BY id DESC LIMIT 10'
        );
        console.log(`\n✅ Ví dụ dữ liệu từ order_status_logs (10 mục mới nhất):`);
        console.table(sampleLogs);

        // Kiểm tra số đơn hàng có lịch sử
        const [orderStats] = await connection.execute(
            'SELECT COUNT(DISTINCT order_id) as orders_with_history FROM order_status_logs'
        );
        console.log(`\n✅ Số đơn hàng có lịch sử status: ${orderStats[0].orders_with_history}`);

        await connection.end();
        console.log('\n✅ Migration hoàn tất thành công!');
        console.log('\n📝 Tiếp theo bạn cần:');
        console.log('  1. Update backend code để INSERT vào order_status_logs khi status thay đổi');
        console.log('  2. Update các query SELECT để sử dụng bảng order_status_logs');
        console.log('  3. Kiểm tra toàn bộ hệ thống');

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        console.error(error.stack);
    }
}

runMigration();
