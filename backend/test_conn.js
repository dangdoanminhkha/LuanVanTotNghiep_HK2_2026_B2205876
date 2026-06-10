const mysql = require('mysql2/promise');

async function test() {
  console.log('Testing connection with Connection URI...');
  try {
    const conn = await mysql.createConnection('mysql://uqpbzumyuo5nhmvw:3f8GkeQfYhNtDuql63eU@bsyfwkfz5d6scbiu2ue8-mysql.services.clever-cloud.com/bsyfwkfz5d6scbiu2ue8');
    console.log('✅ Connection SUCCESS with URI!');
    await conn.end();
  } catch (err) {
    console.error('❌ Connection FAILED with URI:', err);
  }
}

test();
