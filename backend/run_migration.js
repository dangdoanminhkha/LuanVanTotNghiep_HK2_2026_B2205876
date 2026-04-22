const db = require('./db');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const filePath = path.join(__dirname, '../database/migrations/refactor_orders_remove_snapshot_address.sql');
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log('🔄 Running migration: refactor_orders_remove_snapshot_address.sql');
    
    // Split by ; and filter empty statements
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    console.log(`Found ${statements.length} SQL statements\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`[${i+1}/${statements.length}] ${stmt.substring(0, 60)}...`);
      await db.query(stmt);
      console.log(`    ✅`);
    }
    
    console.log('\n✅ All migration statements executed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  }
})();
