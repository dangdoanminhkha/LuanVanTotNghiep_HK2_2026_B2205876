#!/usr/bin/env node

/**
 * MWC Product Scraper - Advanced Version with Cheerio
 * 
 * Installation:
 * npm install cheerio axios --save-dev
 * 
 * Usage:
 * node scrape_mwc_advanced.js
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class MWCAdvancedScraper {
  constructor() {
    this.baseUrl = 'https://mwc.com.vn';
    this.categories = [
      {
        url: '/collections/giay-nam',
        categoryName: 'giay-the-thao-nam',
        label: 'Giày thể thao nam'
      },
      {
        url: '/collections/sandal-dep',
        categoryName: 'dep-nam',
        label: 'Dép nam'
      },
      {
        url: '/collections/giay-nu',
        categoryName: 'giay-the-thao-nu',
        label: 'Giày thể thao nữ'
      },
      {
        url: '/collections/giay-cao-got',
        categoryName: 'giay-cao-got',
        label: 'Giày cao gót nữ'
      },
      {
        url: '/collections/dep-nu',
        categoryName: 'sandal-nu',
        label: 'Dép/Sandal nữ'
      }
    ];
    this.allProducts = [];
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
  }

  // Parse price string to number
  parsePrice(priceStr) {
    if (!priceStr) return 0;
    const cleaned = priceStr
      .replace(/[₫VND\s]/g, '')
      .replace(/[.,]/g, (m) => m === '.' ? '' : '')
      .trim();
    return parseInt(cleaned) || 0;
  }

  // Clean text
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Get absolute URL
  getAbsoluteUrl(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return this.baseUrl + url;
    return this.baseUrl + '/' + url;
  }

  // Scrape single category
  async scrapeCategory(categoryUrl, categoryName, label) {
    console.log(`\n🔍 Đang lấy dữ liệu từ: ${label}`);
    
    try {
      const response = await axios.get(this.baseUrl + categoryUrl, {
        headers: this.headers,
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const products = [];

      // Multiple selectors to try
      const selectors = [
        '.product-item',
        '[data-product-id]',
        '.product',
        '.product-card',
        'a[href*="/products/"]'
      ];

      for (const selector of selectors) {
        $(selector).each((index, element) => {
          if (products.length >= 10) return;

          try {
            // Extract product information
            const $el = $(element);
            
            // Get name
            let name = $el.find('h2, .product-name, .title, a[href*="/products/"]').first().text();
            if (!name) {
              name = $el.attr('alt') || $el.find('img').first().attr('alt');
            }
            name = this.cleanText(name);

            // Get price
            let price = $el.find('.price, [data-price], .product-price, .amount').first().text();
            const priceNum = this.parsePrice(price);

            // Get image
            let imageUrl = $el.find('img').first().attr('src');
            if (!imageUrl) {
              imageUrl = $el.find('img').first().attr('data-src');
            }
            imageUrl = this.getAbsoluteUrl(imageUrl);

            // Get description
            let description = $el.find('.description, .short-description, p').first().text();
            description = this.cleanText(description) || `Sản phẩm từ ${label}`;

            // Get product URL
            let productUrl = $el.find('a[href*="/products/"]').attr('href');
            productUrl = this.getAbsoluteUrl(productUrl);

            // Validate
            if (name && priceNum > 100000 && imageUrl) {
              const product = {
                name,
                price: priceNum,
                image_url: imageUrl,
                description: description.substring(0, 150),
                category: categoryName,
                url: productUrl
              };

              // Check if already exists
              const exists = products.some(p => p.name === product.name);
              if (!exists) {
                products.push(product);
              }
            }
          } catch (err) {
            // Skip this item
          }
        });

        if (products.length >= 10) break;
      }

      console.log(`✅ Tìm được ${products.length} sản phẩm`);
      return products;

    } catch (error) {
      console.log(`❌ Lỗi khi lấy dữ liệu: ${error.message}`);
      return [];
    }
  }

  // Main execution
  async scrapeAll() {
    console.log('📦 Bắt đầu lấy dữ liệu từ MWC.com.vn...');
    console.log('Các danh mục: Giày nam, Dép nam, Giày nữ, Giày cao gót, Dép nữ\n');

    for (const category of this.categories) {
      try {
        const products = await this.scrapeCategory(
          category.url,
          category.categoryName,
          category.label
        );
        this.allProducts.push(...products);
      } catch (error) {
        console.error(`Lỗi với danh mục ${category.label}:`, error.message);
      }

      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return this.allProducts;
  }

  // Save results
  saveResults(filename = 'mwc_products.json') {
    const outputPath = path.join(__dirname, filename);
    
    // Group by category
    const grouped = {};
    this.allProducts.forEach(product => {
      if (!grouped[product.category]) {
        grouped[product.category] = [];
      }
      grouped[product.category].push(product);
    });

    const result = {
      timestamp: new Date().toISOString(),
      source: 'https://mwc.com.vn',
      total_products: this.allProducts.length,
      categories: grouped,
      all_products: this.allProducts
    };

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');

    console.log(`\n💾 Dữ liệu đã lưu vào: ${outputPath}`);
    console.log(`📊 Thống kê:`);
    console.log(`  - Tổng số sản phẩm: ${this.allProducts.length}`);
    Object.entries(grouped).forEach(([category, products]) => {
      console.log(`  - ${category}: ${products.length} sản phẩm`);
    });
  }
}

// Run if executed directly
if (require.main === module) {
  const scraper = new MWCAdvancedScraper();

  scraper.scrapeAll()
    .then(() => {
      scraper.saveResults();
      console.log('\n✨ Hoàn thành!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Lỗi:', error);
      process.exit(1);
    });
}

module.exports = MWCAdvancedScraper;
