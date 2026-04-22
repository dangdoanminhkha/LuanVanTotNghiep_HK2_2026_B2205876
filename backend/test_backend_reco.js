const http = require('http');

// Convert session UUID to numeric
function sessionToNumeric(sessionId) {
  return Math.abs(sessionId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 999999 + 1000000;
}

const sessionId = '86c0e771-a3cd-4925-bce8-471fa395d627';
const mlUserId = sessionToNumeric(sessionId);

console.log('Testing Backend /recommendations API');
console.log('Guest Session:', sessionId);
console.log('ML User ID:', mlUserId);
console.log('');

const opts = {
  hostname: 'localhost', port: 5000, 
  path: `/api/behavior/recommendations?top_n=12`,
  method: 'GET',
  headers: {
    'x-session-id': sessionId
  }
};

console.log('Request: http://localhost:5000' + opts.path);
console.log('Headers:', { 'x-session-id': sessionId });
console.log('');

const req = http.request(opts, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => { 
    try {
      const json = JSON.parse(data);
      console.log('Backend Response:');
      console.log('source:', json.source);
      console.log('count:', json.recommendations?.length || 0);
      if (json.recommendations && json.recommendations.length > 0) {
        console.log('First 3 products:');
        json.recommendations.slice(0, 3).forEach(p => {
          console.log(`  - ${p.id}: ${p.name}`);
        });
      }
    } catch(e) { 
      console.log('Error parsing:', e.message);
      console.log('Raw response:', data.substring(0, 200));
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
