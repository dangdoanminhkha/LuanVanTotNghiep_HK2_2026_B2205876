const http = require('http');

http.get('http://localhost:5000/api/products/all?limit=500&category=sandal-nam', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const products = JSON.parse(data);
    console.log('Sandal Nam Products:');
    const withSales = products.filter(p => parseInt(p.total_sold) > 0);
    const noSales = products.filter(p => parseInt(p.total_sold) === 0);
    
    console.log(`\nProducts WITH sales (${withSales.length}):`);
    withSales.forEach(p => console.log(`  - ${p.id}: ${p.name} (sold: ${p.total_sold})`));
    
    console.log(`\nProducts WITHOUT sales (${noSales.length}):`);
    noSales.slice(0, 5).forEach(p => console.log(`  - ${p.id}: ${p.name} (sold: ${p.total_sold})`));
  });
}).on('error', console.error);
