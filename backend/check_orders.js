const db = require('./db');

(async () => {
  try {
    const [orders] = await db.query('SELECT COUNT(*) as count FROM orders WHERE status=? AND payment_status=?', ['delivered', 'paid']);
    console.log('Delivered + Paid Orders:', orders[0].count);
    
    const [items] = await db.query('SELECT COUNT(*) as count FROM order_items');
    console.log('Order Items (total):', items[0].count);
    
    const [test] = await db.query(`
      SELECT oi.product_id, SUM(oi.quantity) as qty 
      FROM order_items oi 
      JOIN orders o ON oi.order_id = o.id 
      WHERE o.status=? AND o.payment_status=?
      GROUP BY oi.product_id 
      LIMIT 5
    `, ['delivered', 'paid']);
    console.log('Sample Query Result:', test);
    
    const [allOrders] = await db.query('SELECT id, status, payment_status FROM orders LIMIT 5');
    console.log('All Orders (first 5):', allOrders);
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit();
})();
