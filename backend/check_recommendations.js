const http = require('http');

// Generate UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function checkRecommendations() {
  try {
    // Generate valid UUID v4
    const sessionId = generateUUID();
    console.log('Testing with Session ID:', sessionId);

    // 1. Test Backend Recommendations API with proper session
    console.log('\n=== 1. Backend /recommendations API ===');
    const beOptions = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/behavior/recommendations?top_n=5`,
      method: 'GET',
      headers: {
        'x-session-id': sessionId
      }
    };

    const beResponse = await new Promise((resolve, reject) => {
      const req = http.request(beOptions, (res) => {
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
      req.on('error', reject);
      req.end();
    });

    console.log('Response:', JSON.stringify(beResponse, null, 2));

    // 2. Test ML API directly
    console.log('\n=== 2. ML API /recommend ===');
    const mlOptions = {
      hostname: 'localhost',
      port: 5001,
      path: `/recommend?user_id=${sessionId}&top_n=5`,
      method: 'GET'
    };

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
      req.on('error', (e) => resolve({ error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ error: 'Timeout' }); });
      req.setTimeout(5000);
      req.end();
    });

    console.log('Response:', JSON.stringify(mlResponse, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit();
}

checkRecommendations();
