const http = require('http');

// Convert session UUID to numeric
function sessionToNumeric(sessionId) {
  return Math.abs(sessionId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 999999 + 1000000;
}

const sessionId = '86c0e771-a3cd-4925-bce8-471fa395d627';
const mlUserId = sessionToNumeric(sessionId);

console.log('Testing Guest Session:', sessionId);
console.log('ML User ID:', mlUserId);

const opts = {
  hostname: 'localhost', port: 5001, 
  path: `/recommend?user_id=${mlUserId}&top_n=5`,
  method: 'GET'
};

console.log('Request URL: http://localhost:5001' + opts.path);

const req = http.request(opts, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => { 
    try {
      const json = JSON.parse(data);
      console.log('\nML Response:');
      console.log('is_cold_start:', json.is_cold_start);
      console.log('method:', json.method);
      console.log('recommendations:', json.recommendations);
    } catch(e) { 
      console.log('Error parsing response:', e.message);
      console.log('Raw:', data);
    }
    process.exit();
  });
});
req.on('error', e => { 
  console.error('Request error:', e); 
  process.exit(); 
});
req.setTimeout(5000);
req.end();
