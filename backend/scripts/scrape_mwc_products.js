const https = require('https');
const http = require('http');
const { URL } = require('url');

// Scraper utility to fetch and parse HTML
class MWCScraper {
  constructor() {
    this.baseUrl = 'https://mwc.com.vn';
    this.categories = [
      { url: '/collections/giay-nam', name: 'giay-the-thao-nam', label: 'Giày thể thao nam' },
      { url: '/collections/sandal-dep', name: 'dep-nam', label: 'Dép nam' },
      { url: '/collections/giay-nu', name: 'giay-the-thao-nu', label: 'Giày thể thao nữ' },
      { url: '/collections/giay-cao-got', name: 'giay-cao-got', label: 'Giày cao gót nữ' },
      { url: '/collections/dep-nu', name: 'sandal-nu', label: 'Dép/Sandal nữ' }
    ];
    this.products = [];
  }

  // Fetch HTML from URL
  fetchUrl(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };

      protocol.get(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }

  // Simple HTML parser to extract product data
  parseProducts(html, categoryName) {
    const products = [];
    
    // Look for product items in common patterns
    // Pattern 1: data-product-id or product containers
    const productRegex = /class="[^"]*product[^"]*"[^>]*>[\s\S]*?(?=class="[^"]*product|$)/gi;
    const matches = html.match(productRegex) || [];

    // Alternative: Look for links with product data
    const linkRegex = /href="\/products\/([^"]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?(?:<a[^>]*>)?([^<]+)<\/a>[\s\S]*?(?:₫|VND)?\s*([0-9,\.]+)/gi;
    
    let match;
    let count = 0;
    while ((match = linkRegex.exec(html)) && count < 10) {
      const [fullMatch, productSlug, imageUrl, productName, price] = match;
      
      if (productName && imageUrl && price) {
        const cleanPrice = parseInt(price.replace(/[.,]/g, ''));
        
        if (!isNaN(cleanPrice) && cleanPrice > 100000) { // Valid price
          products.push({
            name: productName.trim(),
            price: cleanPrice,
            image_url: imageUrl.startsWith('http') ? imageUrl : this.baseUrl + imageUrl,
            description: `Sản phẩm từ danh mục ${categoryName}`,
            category: categoryName,
            url: `${this.baseUrl}/products/${productSlug}`
          });
          count++;
        }
      }
    }

    return products;
  }

  // Extract from JSON-LD if available
  parseJsonLD(html, categoryName) {
    const products = [];
    
    // Look for product JSON in script tags
    const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    
    while ((match = jsonLdRegex.exec(html)) && products.length < 10) {
      try {
        const json = JSON.parse(match[1]);
        
        if (json['@type'] === 'Product' || json.itemListElement) {
          const items = Array.isArray(json.itemListElement) ? json.itemListElement : [json];
          
          items.forEach(item => {
            if (products.length >= 10) return;
            
            const product = item.item || item;
            if (product.name && product.image && product.offers) {
              const price = product.offers[0]?.price || product.offers?.price;
              const pricNum = parseInt(price);
              
              if (!isNaN(pricNum) && pricNum > 100000) {
                products.push({
                  name: product.name,
                  price: pricNum,
                  image_url: Array.isArray(product.image) ? product.image[0] : product.image,
                  description: product.description || `Sản phẩm từ danh mục ${categoryName}`,
                  category: categoryName,
                  url: product.url || ''
                });
              }
            }
          });
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
    
    return products;
  }

  // Main scraping function
  async scrapeCategory(categoryUrl, categoryName, categoryLabel) {
    console.log(`\n🔍 Đang lấy dữ liệu từ: ${categoryLabel}...`);
    
    try {
      const fullUrl = this.baseUrl + categoryUrl;
      const html = await this.fetchUrl(fullUrl);
      
      // Try JSON-LD first (more reliable)
      let products = this.parseJsonLD(html, categoryName);
      
      // If not enough products, try regex parsing
      if (products.length < 10) {
        products = [...products, ...this.parseProducts(html, categoryName)];
      }
      
      // Remove duplicates
      products = products.filter((p, i, arr) => 
        arr.findIndex(x => x.name === p.name) === i
      ).slice(0, 10);

      console.log(`✅ Tìm được ${products.length} sản phẩm`);
      return products;
    } catch (error) {
      console.log(`❌ Lỗi khi lấy dữ liệu: ${error.message}`);
      return [];
    }
  }

  // Main execution
  async scrapeAll() {
    console.log('📦 Bắt đầu lấy dữ liệu từ MWC.com.vn...\n');
    
    for (const category of this.categories) {
      const products = await this.scrapeCategory(category.url, category.name, category.label);
      this.products.push(...products);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return this.products;
  }

  // Save to JSON file
  saveToFile(filename = 'mwc_products.json') {
    const fs = require('fs');
    const path = require('path');
    
    const outputPath = path.join(__dirname, filename);
    fs.writeFileSync(outputPath, JSON.stringify(this.products, null, 2), 'utf8');
    
    console.log(`\n💾 Dữ liệu đã lưu vào: ${outputPath}`);
    console.log(`📊 Tổng số sản phẩm: ${this.products.length}`);
  }
}

// Run scraper if executed directly
if (require.main === module) {
  const scraper = new MWCScraper();
  
  scraper.scrapeAll()
    .then(() => {
      scraper.saveToFile();
      console.log('\n✨ Hoàn thành!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Lỗi:', error);
      process.exit(1);
    });
}

module.exports = MWCScraper;
