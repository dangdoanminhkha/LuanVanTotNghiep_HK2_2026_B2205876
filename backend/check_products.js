const http = require('http');

http.get('http://localhost:5000/api/products/all?limit=500', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const products = JSON.parse(data);
    const targetIds = [210, 216, 218, 247, 221];
    const found = products.filter(p => targetIds.includes(p.id));
    found.forEach(p => console.log(`Product ${p.id}: ${p.name} - total_sold: ${p.total_sold}`));
  });
}).on('error', console.error);
