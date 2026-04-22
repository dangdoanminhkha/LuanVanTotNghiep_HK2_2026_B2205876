const http = require('http');

// Generate UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Convert sessionId to numeric for ML API
function sessionToNumeric(sessionId) {
  return Math.abs(sessionId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 999999 + 1000000;
}

async function testML() {
  try {
    const sessionId = generateUUID();
    const mlUserId = sessionToNumeric(sessionId);
    
    console.log('Session ID:', sessionId);
    console.log('ML User ID:', mlUserId);
    
    console.log('\n=== Testing ML API directly ===');
    const mlOptions = {
      hostname: 'localhost',
      port: 5001,
      path: `/recommend?user_id=${mlUserId}&top_n=5`,
      method: 'GET'
    };

    console.log('Request:', `http://localhost:5001${mlOptions.path}`);

    const mlResponse = await new Promise((resolve, reject) => {
      const req = http.request(mlOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ error: 'Parse error', raw: data });
          }
        });
      });
      req.on('error', (e) => {
        console.log('Request error:', e.message);
        resolve({ error: e.message });
      });
      req.on('timeout', () => { 
        req.destroy(); 
        resolve({ error: 'Timeout' }); 
      });
      req.setTimeout(5000);
      req.end();
    });

    console.log('ML API Response:', JSON.stringify(mlResponse, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit();
}

testML();
