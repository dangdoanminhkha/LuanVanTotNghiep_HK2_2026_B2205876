const pool = require('../db');
const fs = require('fs');
const path = require('path');

// Make sure we load .env from backend directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
    const sqlPath = path.join(__dirname, '../../database/simplify_reviews.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Remove comment lines first, then split by semicolon
    const sqlWithoutComments = sql
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');
    
    const statements = sqlWithoutComments
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    const connection = await pool.getConnection();
    
    try {
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`[${i+1}/${statements.length}] Executing:`);
            console.log(statement.substring(0, 100) + '...\n');
            
            await connection.query(statement);
            console.log('✅ Success\n');
        }
        
        console.log('🎉 Migration completed successfully!');
        
        // Verify the schema
        console.log('\n📋 Verifying schema...');
        const [columns] = await connection.query('DESCRIBE reviews');
        console.log('\nReviews table structure:');
        columns.forEach(col => {
            console.log(`  ${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default} ${col.Extra}`);
        });
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        connection.release();
        await pool.end();
    }
}

runMigration().catch(err => {
    console.error(err);
    process.exit(1);
});
