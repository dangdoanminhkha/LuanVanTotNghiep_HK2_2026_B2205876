const db = require('./db');

(async () => {
  try {
    const [userBehaviors] = await db.query(`
      SELECT user_id, COUNT(*) as count FROM user_behavior_logs 
      WHERE user_id IS NOT NULL 
      GROUP BY user_id 
      HAVING count > 5 
      ORDER BY count DESC 
      LIMIT 5
    `);
    console.log('Users with >5 behaviors:', userBehaviors);
  } catch(e) {
    console.error(e.message);
  }
  process.exit();
})();
