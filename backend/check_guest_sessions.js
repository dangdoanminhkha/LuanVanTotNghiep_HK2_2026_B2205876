const db = require('./db');

(async () => {
  try {
    const [sessionBehaviors] = await db.query(`
      SELECT session_id, COUNT(*) as count FROM user_behavior_logs 
      WHERE session_id IS NOT NULL AND user_id IS NULL
      GROUP BY session_id 
      HAVING count > 2 
      ORDER BY count DESC 
      LIMIT 5
    `);
    console.log('Guest sessions with >2 behaviors:', sessionBehaviors.length);
    sessionBehaviors.forEach(s => console.log(`  - ${s.session_id}: ${s.count} events`));
  } catch(e) {
    console.error(e.message);
  }
  process.exit();
})();
