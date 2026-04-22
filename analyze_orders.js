const mysql = require('mysql2/promise');

async function analyzeOrdersTable() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'admin123',
            database: 'shoestore'
        });

        console.log('✅ Kết nối database thành công\n');

        // Lấy cấu trúc bảng orders
        console.log('=== CẤU TRÚC BẢNG ORDERS ===');
        const [structure] = await connection.execute('DESCRIBE orders');
        console.table(structure);

        // Lọc ra các cột timestamp/datetime
        const timestampCols = structure.filter(col => 
            col.Type.includes('TIMESTAMP') || col.Type.includes('DATETIME')
        );
        
        console.log('\n=== CÁC CỘT TIMESTAMP/DATETIME CẦN XOÁ ===');
        console.table(timestampCols);
        
        console.log('\nCác cột cần xoá:');
        timestampCols.forEach(col => {
            console.log(`  - ${col.Field}`);
        });

        await connection.end();
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    }
}

analyzeOrdersTable();
