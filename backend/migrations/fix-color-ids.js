/**
 * Verify data integrity on startup
 * Checks that all product_variants have valid color_id
 */

const db = require('../db');

async function fixNullColorIds() {
  try {
    console.log('🔍 Verifying product_variants data integrity...');

    // Check if there are any NULL color_id values (shouldn't be any if migration was run)
    const [nullCheck] = await db.query(`
      SELECT COUNT(*) as null_count FROM product_variants WHERE color_id IS NULL
    `);

    // Get total count
    const [totalCount] = await db.query(`SELECT COUNT(*) as total FROM product_variants`);

    console.log(`✅ Data integrity check: ${totalCount[0].total} variants, ${nullCheck[0].null_count} with NULL color_id`);

    if (nullCheck[0].null_count > 0) {
      console.log('⚠️  Warning: Some variants have NULL color_id. Assign them a default color.');
    }

    return true;

  } catch (error) {
    console.error('⚠️  Data integrity check failed (non-blocking):', error.message);
    return false;
  }
}

module.exports = { fixNullColorIds };
