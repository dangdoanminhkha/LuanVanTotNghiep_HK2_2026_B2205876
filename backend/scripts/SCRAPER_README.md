# MWC Product Scraper - Setup Guide

## Các bước cài đặt và chạy

### 1. Cài đặt dependencies

```bash
cd backend
npm install cheerio axios --save-dev
```

### 2. Chạy scraper

**Phiên bản cơ bản (chỉ dùng Node.js built-in):**
```bash
node scripts/scrape_mwc_products.js
```

**Phiên bản nâng cao (khuyến nghị - cần cài cheerio):**
```bash
npm install cheerio axios
node scripts/scrape_mwc_advanced.js
```

### 3. Kết quả

Kết quả sẽ được lưu vào file `backend/scripts/mwc_products.json` với cấu trúc:

```json
{
  "timestamp": "2026-01-20T...",
  "source": "https://mwc.com.vn",
  "total_products": 60,
  "categories": {
    "giay-the-thao-nam": [...],
    "dep-nam": [...],
    "giay-the-thao-nu": [...],
    "giay-cao-got": [...],
    "sandal-nu": [...]
  },
  "all_products": [
    {
      "name": "Giày Thể Thao Nam MWC 5811",
      "price": 999000,
      "image_url": "https://...",
      "description": "...",
      "category": "giay-the-thao-nam",
      "url": "https://..."
    }
  ]
}
```

## Tính năng

✅ Tự động lấy dữ liệu từ 5 danh mục  
✅ Tìm ít nhất 10 sản phẩm mỗi danh mục  
✅ Trích xuất: tên, giá, URL hình ảnh, mô tả  
✅ Loại bỏ sản phẩm trùng lặp  
✅ Xử lý lỗi và timeout  
✅ Trì hoãn giữa các request để tránh bị chặn  
✅ Xuất kết quả dưới dạng JSON có cấu trúc

## Ghi chú

- Phiên bản advanced sử dụng Cheerio, hiệu suất tốt hơn
- Phiên bản cơ bản chỉ cần Node.js, không cần dependencies bổ sung
- Nếu website có cấu trúc HTML phức tạp, cần điều chỉnh CSS selectors
- Thêm delay giữa request để tránh bị rate limiting

## Tích hợp với Backend

Để tích hợp vào hệ thống backend, bạn có thể:

1. Tạo endpoint API:
```javascript
// routes/products.js
router.post('/import-from-mwc', async (req, res) => {
  const MWCScraper = require('../scripts/scrape_mwc_advanced');
  const scraper = new MWCScraper();
  
  const products = await scraper.scrapeAll();
  // Lưu vào database
  res.json({ success: true, count: products.length });
});
```

2. Hoặc chạy định kỳ với cron job:
```javascript
const cron = require('node-cron');
cron.schedule('0 2 * * 0', () => {
  // Chạy lúc 2:00 sáng mỗi Chủ Nhật
  const MWCScraper = require('../scripts/scrape_mwc_advanced');
  new MWCScraper().scrapeAll();
});
```
