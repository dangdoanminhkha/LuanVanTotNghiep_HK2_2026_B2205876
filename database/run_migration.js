// Run SQL migration using node
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
const db = require('../backend/db');

async function runMigration() {
  const sqlFile = process.argv[2] || 'create_user_addresses.sql';
  
  try {
    const sqlPath = path.join(__dirname, sqlFile);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and run each statement
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 60) + '...');
        try {
          await db.query(statement);
          console.log('✅ Success');
        } catch (err) {
          // Ignore "column already exists" errors
          if (err.code === 'ER_DUP_FIELDNAME' || err.message.includes('Duplicate column')) {
            console.log('⚠️ Column already exists, skipping');
          } else if (err.code === 'ER_DUP_KEYNAME') {
            console.log('⚠️ Key already exists, skipping');
          } else {
            throw err;
          }
        }
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
