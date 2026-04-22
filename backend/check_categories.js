const db = require('./db');

(async () => {
  try {
    const [categories] = await db.query('SELECT id, slug, name FROM categories');
    console.log('All Categories:', categories);
    
    const [products] = await db.query(`
      SELECT p.id, p.name, c.slug, c.name as category_name, p.total_sold 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LIMIT 10
    `);
    console.log('\nProducts with categories:', products);
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit();
})();
