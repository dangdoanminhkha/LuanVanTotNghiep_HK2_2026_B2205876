// =====================================================================
// Database Migration Script - Normalize Product Variants
// =====================================================================
// Cách chạy:
// 1. npm install mysql2 (nếu chưa có)
// 2. node migrate_variants.js

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shoestore',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Mapping colors to hex codes
const colorHexMap = {
  'đen': '#000000',
  'black': '#000000',
  'trắng': '#FFFFFF',
  'white': '#FFFFFF',
  'xanh': '#0066FF',
  'blue': '#0066FF',
  'đỏ': '#FF0000',
  'red': '#FF0000',
  'vàng': '#FFFF00',
  'yellow': '#FFFF00',
  'xám': '#808080',
  'gray': '#808080',
  'hồng': '#FF69B4',
  'pink': '#FF69B4',
  'tím': '#800080',
  'purple': '#800080',
  'xanh lá': '#008000',
  'green': '#008000',
  'nâu': '#A52A2A',
  'brown': '#A52A2A'
};

// Mapping size to foot length in cm
const sizeFootLengthMap = {
  '36': 22.5,
  '37': 23.0,
  '38': 23.5,
  '39': 24.0,
  '40': 24.5,
  '41': 25.0,
  '42': 25.5,
  '43': 26.0,
  '44': 26.5,
  '45': 27.0
};

async function migrate() {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    console.log('\n🔄 Starting migration process...\n');

    // STEP 1: Check current data
    console.log('📊 STEP 1: Checking current data...');
    const [colors] = await connection.execute(
      `SELECT DISTINCT color FROM product_variants WHERE color IS NOT NULL ORDER BY color`
    );
    console.log(`   Found ${colors.length} unique colors:`);
    colors.forEach(row => console.log(`   - ${row.color}`));

    const [sizes] = await connection.execute(
      `SELECT DISTINCT size FROM product_variants WHERE size IS NOT NULL ORDER BY CAST(size AS DECIMAL)`
    );
    console.log(`\n   Found ${sizes.length} unique sizes:`);
    sizes.forEach(row => console.log(`   - ${row.size}`));

    const [[variantCount]] = await connection.execute(
      `SELECT COUNT(*) as count FROM product_variants`
    );
    console.log(`\n   Total variants: ${variantCount.count}\n`);

    // STEP 2: Create colors table
    console.log('🎨 STEP 2: Creating colors table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS colors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        color VARCHAR(50) NOT NULL UNIQUE,
        hex_code VARCHAR(7),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_color (color)
      )
    `);
    console.log('   ✓ Colors table created\n');

    // STEP 3: Create sizes table
    console.log('📏 STEP 3: Creating sizes table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sizes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        size VARCHAR(10) NOT NULL UNIQUE,
        foot_length_cm DECIMAL(5, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_size (size)
      )
    `);
    console.log('   ✓ Sizes table created\n');

    // STEP 4: Drop old UNIQUE constraint
    console.log('🔗 STEP 4: Dropping old UNIQUE constraint...');
    try {
      await connection.execute(
        `ALTER TABLE product_variants DROP INDEX unique_variant`
      );
      console.log('   ✓ Old UNIQUE constraint dropped\n');
    } catch (err) {
      if (err.code !== 'ER_CANT_DROP_FIELD_OR_KEY') throw err;
      console.log('   (Constraint might already be removed)\n');
    }

    // STEP 5: Add FK columns to product_variants
    console.log('🔗 STEP 5: Adding FK columns to product_variants...');
    try {
      await connection.execute(
        `ALTER TABLE product_variants ADD COLUMN color_id INT`
      );
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
      console.log('   (color_id column already exists)');
    }

    try {
      await connection.execute(
        `ALTER TABLE product_variants ADD COLUMN size_id INT`
      );
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
      console.log('   (size_id column already exists)');
    }

    try {
      await connection.execute(`
        ALTER TABLE product_variants 
        ADD CONSTRAINT fk_product_variants_color 
        FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE
      `);
    } catch (err) {
      if (err.code !== 'ER_DUP_KEYNAME') throw err;
      console.log('   (FK color constraint already exists)');
    }

    try {
      await connection.execute(`
        ALTER TABLE product_variants 
        ADD CONSTRAINT fk_product_variants_size 
        FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE CASCADE
      `);
    } catch (err) {
      if (err.code !== 'ER_DUP_KEYNAME') throw err;
      console.log('   (FK size constraint already exists)');
    }
    console.log('   ✓ FK columns added\n');

    // STEP 6: Add Foreign Key constraints
    console.log('🔗 STEP 6: Adding Foreign Key constraints...');
    try {
      await connection.execute(`
        ALTER TABLE product_variants 
        ADD CONSTRAINT fk_product_variants_color 
        FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE
      `);
      console.log('   ✓ Color FK constraint added');
    } catch (err) {
      if (err.code !== 'ER_DUP_KEYNAME') throw err;
      console.log('   (Color FK constraint already exists)');
    }

    try {
      await connection.execute(`
        ALTER TABLE product_variants 
        ADD CONSTRAINT fk_product_variants_size 
        FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE CASCADE
      `);
      console.log('   ✓ Size FK constraint added');
    } catch (err) {
      if (err.code !== 'ER_DUP_KEYNAME') throw err;
      console.log('   (Size FK constraint already exists)');
    }
    console.log();

    // STEP 7: Insert colors
    console.log('🎨 STEP 7: Inserting colors...');
    for (const colorRow of colors) {
      const color = colorRow.color;
      const hexCode = colorHexMap[color.toLowerCase()] || null;
      
      try {
        await connection.execute(
          `INSERT INTO colors (color, hex_code) VALUES (?, ?)`,
          [color, hexCode]
        );
        console.log(`   ✓ ${color} (${hexCode})`);
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') throw err;
        console.log(`   (${color} already exists)`);
      }
    }
    console.log();

    // STEP 8: Insert sizes
    console.log('📏 STEP 8: Inserting sizes...');
    for (const sizeRow of sizes) {
      const size = sizeRow.size;
      const footLength = sizeFootLengthMap[size] || null;
      
      try {
        await connection.execute(
          `INSERT INTO sizes (size, foot_length_cm) VALUES (?, ?)`,
          [size, footLength]
        );
        console.log(`   ✓ ${size} (${footLength}cm)`);
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') throw err;
        console.log(`   (${size} already exists)`);
      }
    }
    console.log();

    // STEP 9: Populate FK columns
    console.log('🔄 STEP 9: Populating FK columns...');
    const result = await connection.execute(`
      UPDATE product_variants pv
      SET 
        pv.color_id = (SELECT c.id FROM colors c WHERE c.color = pv.color),
        pv.size_id = (SELECT s.id FROM sizes s WHERE s.size = pv.size)
      WHERE pv.color_id IS NULL OR pv.size_id IS NULL
    `);
    console.log(`   ✓ Updated ${result[0].changedRows} rows\n`);

    // STEP 10: Create new UNIQUE constraint using FK
    console.log('🔐 STEP 10: Creating new UNIQUE constraint with FK...');
    try {
      await connection.execute(`
        ALTER TABLE product_variants 
        ADD CONSTRAINT unique_variant_fk UNIQUE KEY (product_id, color_id, size_id)
      `);
      console.log('   ✓ New UNIQUE constraint created\n');
    } catch (err) {
      if (err.code !== 'ER_DUP_KEYNAME') throw err;
      console.log('   (UNIQUE constraint already exists)\n');
    }

    // STEP 11: Verify migration
    console.log('✅ STEP 11: Verifying migration...');
    const [[verification]] = await connection.execute(`
      SELECT 
        COUNT(*) as total_variants,
        COUNT(CASE WHEN color_id IS NOT NULL THEN 1 END) as color_id_populated,
        COUNT(CASE WHEN size_id IS NOT NULL THEN 1 END) as size_id_populated,
        COUNT(CASE WHEN color_id IS NULL OR size_id IS NULL THEN 1 END) as unpopulated
      FROM product_variants
    `);

    console.log(`   Total variants: ${verification.total_variants}`);
    console.log(`   Color IDs populated: ${verification.color_id_populated}`);
    console.log(`   Size IDs populated: ${verification.size_id_populated}`);
    console.log(`   Unpopulated: ${verification.unpopulated}`);
    
    if (verification.unpopulated > 0) {
      console.log('\n   ⚠️  WARNING: Some variants could not be populated!');
    } else {
      console.log('\n   ✓ All variants successfully populated!\n');
    }

    // STEP 12: Sample data
    console.log('📋 STEP 12: Sample data after migration:');
    const [samples] = await connection.execute(`
      SELECT 
        pv.id,
        pv.product_id,
        c.color,
        c.hex_code,
        s.size,
        s.foot_length_cm,
        pv.stock
      FROM product_variants pv
      LEFT JOIN colors c ON pv.color_id = c.id
      LEFT JOIN sizes s ON pv.size_id = s.id
      LIMIT 10
    `);
    
    console.table(samples);

    // STEP 13: Create indexes
    console.log('\n⚡ STEP 13: Creating indexes...');
    try {
      await connection.execute(`
        ALTER TABLE product_variants 
        ADD INDEX idx_color_id (color_id),
        ADD INDEX idx_size_id (size_id),
        ADD INDEX idx_product_color_size (product_id, color_id, size_id)
      `);
      console.log('   ✓ Indexes created\n');
    } catch (err) {
      if (err.message.includes('Duplicate key name')) {
        console.log('   (Indexes already exist)\n');
      } else {
        throw err;
      }
    }

    console.log('🎉 Migration completed successfully!');
    console.log('\n⚠️  NEXT STEPS:');
    console.log('1. Test your application with the new schema');
    console.log('2. Update your backend API queries to use color_id and size_id');
    console.log('3. When confident, run this to drop old columns:');
    console.log('   ALTER TABLE product_variants DROP COLUMN color, DROP COLUMN size;\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.release();
    await pool.end();
  }
}

// Run migration
migrate();
