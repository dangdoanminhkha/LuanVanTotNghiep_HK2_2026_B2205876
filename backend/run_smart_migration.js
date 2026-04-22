const db = require('./db');

(async () => {
  try {
    console.log('🔍 Checking existing columns in orders table...\n');
    
    const [columns] = await db.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'orders' AND TABLE_SCHEMA = 'shoestore' ORDER BY ORDINAL_POSITION"
    );
    
    const columnNames = columns.map(c => c.COLUMN_NAME);
    console.log('Current columns:', columnNames.join(', '));
    
    // List of snapshot columns to drop
    const columnsToCheck = [
      'shipping_address', 'phone', 'recipient_name', 'recipient_phone',
      'province_name', 'district_name', 'ward_name', 'province', 'district', 'ward', 'address_detail'
    ];
    
    const columnsToDrop = columnsToCheck.filter(col => columnNames.includes(col));
    const columnsNotExists = columnsToCheck.filter(col => !columnNames.includes(col));
    
    console.log('\n✅ Columns to drop:', columnsToDrop.length > 0 ? columnsToDrop.join(', ') : 'None');
    console.log('⏭️  Columns already dropped:', columnsNotExists.length > 0 ? columnsNotExists.join(', ') : 'None');
    
    if (columnsToDrop.length === 0) {
      console.log('\n✨ Migration complete! All snapshot columns already removed.');
      process.exit(0);
    }
    
    console.log(`\n🔄 Dropping ${columnsToDrop.length} columns...`);
    
    for (let i = 0; i < columnsToDrop.length; i++) {
      const col = columnsToDrop[i];
      console.log(`  [${i+1}/${columnsToDrop.length}] Dropping ${col}...`);
      await db.query(`ALTER TABLE orders DROP COLUMN ${col}`);
      console.log(`    ✅`);
    }
    
    console.log('\n✅ All snapshot columns removed!');
    
    // Check FK and index
    console.log('\n🔍 Checking FK and index...');
    
    try {
      await db.query(
        `ALTER TABLE orders 
         ADD CONSTRAINT fk_orders_user_address_id 
         FOREIGN KEY (user_address_id) 
         REFERENCES user_addresses(id) ON DELETE SET NULL`
      );
      console.log('✅ FK constraint added');
    } catch (err) {
      if (err.message.includes('Duplicate')) {
        console.log('⏭️  FK already exists');
      } else {
        throw err;
      }
    }
    
    try {
      await db.query(`CREATE INDEX idx_user_address_id ON orders(user_address_id)`);
      console.log('✅ Index created');
    } catch (err) {
      if (err.message.includes('Duplicate')) {
        console.log('⏭️  Index already exists');
      } else {
        throw err;
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
})();
