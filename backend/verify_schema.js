const db = require('./db');

(async () => {
  try {
    console.log('📋 Verifying orders table schema...\n');
    
    // 1. Check FOREIGN KEY
    console.log('1️⃣  Foreign Keys:');
    const [fks] = await db.query(
      `SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
       WHERE TABLE_NAME = 'orders' AND TABLE_SCHEMA = 'shoestore'`
    );
    
    fks.forEach(fk => {
      const refTable = fk.REFERENCED_TABLE_NAME ? `→ ${fk.REFERENCED_TABLE_NAME}(${fk.REFERENCED_COLUMN_NAME})` : '(Primary Key)';
      console.log(`   ${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} ${refTable}`);
    });
    
    // 2. Check user_address_id FK specifically
    const hasFk = fks.some(fk => fk.CONSTRAINT_NAME === 'fk_orders_user_address_id');
    console.log(`   ✅ user_address_id FK: ${hasFk ? 'EXISTS' : 'MISSING'}`);
    
    // 3. Check INDEX
    console.log('\n2️⃣  Indexes:');
    const [indexes] = await db.query(
      `SELECT INDEX_NAME, COLUMN_NAME 
       FROM INFORMATION_SCHEMA.STATISTICS 
       WHERE TABLE_NAME = 'orders' AND TABLE_SCHEMA = 'shoestore'`
    );
    
    const addressIdx = indexes.find(idx => idx.COLUMN_NAME === 'user_address_id');
    console.log(`   idx_user_address_id: ${addressIdx ? 'EXISTS' : 'MISSING'}`);
    
    // 4. Count user_address_id distribution
    console.log('\n3️⃣  Data Distribution:');
    const [stats] = await db.query(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN user_address_id IS NOT NULL THEN 1 ELSE 0 END) as with_address,
         SUM(CASE WHEN user_address_id IS NULL THEN 1 ELSE 0 END) as without_address
       FROM orders`
    );
    
    const stat = stats[0];
    console.log(`   Total orders: ${stat.total}`);
    console.log(`   With user_address_id: ${stat.with_address}`);
    console.log(`   Without (NULL): ${stat.without_address}`);
    
    console.log('\n✅ Schema verification complete!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
})();
