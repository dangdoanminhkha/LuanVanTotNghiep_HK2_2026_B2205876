const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const http = require('http');
const https = require('https');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// ML Service URL (để trigger retrain khi product mới)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Setup multer cho image upload
const upload = multer({
    dest: path.join(__dirname, '../uploads'),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)'));
        }
    }
});

/**
 * Trigger ML retrain (non-blocking)
 * Gọi khi có product mới để ML model học product đó ngay
 */
function triggerMLRetrain() {
    const options = {
        hostname: new URL(ML_SERVICE_URL).hostname,
        port: new URL(ML_SERVICE_URL).port || 80,
        path: '/retrain',
        method: 'POST',
        timeout: 3000,
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                console.log('ML Retrain triggered successfully:', data);
            } catch (e) {
                console.error('ML Retrain error:', e);
            }
        });
    });

    req.on('error', (err) => {
        console.log('ML Retrain request error (non-blocking):', err.message);
    });
    req.on('timeout', () => {
        console.log('ML Retrain timeout (non-blocking)');
        req.destroy();
    });
    req.end();
}

// Lấy chi tiết 1 sản phẩm gốc (public)
router.get('/base/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT p.*,
                    COALESCE(AVG(r.overall_rating), 0) as average_rating
             FROM products p
             LEFT JOIN reviews r ON p.id = r.product_id
             WHERE p.id = ?
             GROUP BY p.id`,
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching base product:', err);
        res.status(500).json({ error: 'Lỗi server', details: err.message });
    }
});

// --- ROUTES CHO BIẾN THỂ (VARIANTS) ---

// Lấy variants của 1 sản phẩm (public)
router.get('/product/:product_id', async (req, res) => {
    try {
        const [variants] = await db.query(
            `SELECT 
                pv.id,
                pv.product_id,
                p.name as product_name,
                pv.color_id,
                c.color,
                c.hex_code,
                pv.size,
                pv.quantity,
                pv.sold,
                pv.stock,
                pv.images,
                pv.sku,
                COALESCE((SELECT import_price FROM inventory_logs WHERE variant_id = pv.id AND import_price IS NOT NULL ORDER BY created_at DESC LIMIT 1), 0) as import_price,
                pv.created_at,
                pv.updated_at
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.id
            JOIN colors c ON pv.color_id = c.id
            WHERE pv.product_id = ?
            ORDER BY pv.color_id, CAST(pv.size AS DECIMAL)`,
            [req.params.product_id]
        );
        res.json(variants || []);
    } catch (err) {
        console.error('Error fetching product variants:', err);
        res.status(500).json({ error: 'Lỗi server', details: err.message });
    }
});

// Lấy chi tiết variant (public)
router.get('/variant/:id', async (req, res) => {
    try {
        const [variants] = await db.query(
            `SELECT 
                pv.id,
                pv.product_id,
                p.name as product_name,
                pv.color_id,
                c.color,
                c.hex_code,
                pv.size,
                pv.quantity,
                pv.sold,
                pv.stock,
                pv.images,
                pv.sku,
                COALESCE((SELECT import_price FROM inventory_logs WHERE variant_id = pv.id AND import_price IS NOT NULL ORDER BY created_at DESC LIMIT 1), 0) as import_price,
                pv.created_at,
                pv.updated_at
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.id
            JOIN colors c ON pv.color_id = c.id
            WHERE pv.id = ?`,
            [req.params.id]
        );
        if (variants.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy variant' });
        }
        res.json(variants[0]);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi server', details: err.message });
    }
});

// Lấy danh sách tất cả variants (public)
router.get('/', async (req, res) => {
    try {
        const [variants] = await db.query(
            `SELECT 
                pv.id,
                pv.product_id,
                p.name as product_name,
                pv.color_id,
                c.color,
                c.hex_code,
                pv.size,
                pv.quantity,
                pv.sold,
                pv.stock,
                pv.images,
                pv.sku,
                COALESCE((SELECT import_price FROM inventory_logs WHERE variant_id = pv.id AND import_price IS NOT NULL ORDER BY created_at DESC LIMIT 1), 0) as import_price,
                pv.created_at,
                pv.updated_at
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.id
            LEFT JOIN colors c ON pv.color_id = c.id
            ORDER BY pv.product_id, pv.color_id, CAST(pv.size AS DECIMAL)
            LIMIT 2000`
        );
        res.json(variants || []);
    } catch (err) {
        console.error('Error fetching variants:', err);
        res.status(500).json({ error: 'Lỗi server', details: err.message });
    }
});

// --- ROUTES CHO SẢN PHẨM GỐC (BASE PRODUCTS) ---

// Lấy tất cả sản phẩm gốc (public + filter + sort)
router.get('/all', async (req, res) => {
    try {
        const { search, brand, category, gender, color, size, minPrice, maxPrice, sort, onSale, limit } = req.query;
        let query = `
                 SELECT 
                     p.id, p.name, p.price, p.brand_id, p.gender, p.tags, p.category_id, p.description,
                     p.specification, p.discount as discount_percentage, p.created_at, p.updated_at, p.image,
                     COALESCE(AVG(r.overall_rating), 0) as average_rating,
                     COALESCE((SELECT SUM(pv.sold) FROM product_variants pv WHERE pv.product_id = p.id), 0) as sold,
                     COALESCE((SELECT COUNT(DISTINCT c.color) FROM product_variants pv JOIN colors c ON pv.color_id = c.id WHERE pv.product_id = p.id), 0) as variant_count,
                     b.name as brand
            FROM products p
            LEFT JOIN product_variants pv ON p.id = pv.product_id
            LEFT JOIN colors c ON pv.color_id = c.id
            LEFT JOIN categories cat ON p.category_id = cat.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN reviews r ON p.id = r.product_id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ' AND (p.name LIKE ? OR b.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (brand) {
            query += ' AND (b.name = ? OR b.slug = ?)';
            params.push(brand, brand);
        }
        // Category filter: use category slug from categories table
        if (category) {
            query += ' AND cat.slug = ?';
            params.push(category);
        }
        if (gender) {
            query += ' AND p.gender = ?';
            params.push(gender);
        }
        if (color) {
            query += ' AND c.color = ?';
            params.push(color);
        }
        if (size) {
            query += ' AND pv.size = ?';
            params.push(size);
        }
        if (minPrice) {
            query += ' AND p.price >= ?';
            params.push(parseFloat(minPrice));
        }
        if (maxPrice) {
            query += ' AND p.price <= ?';
            params.push(parseFloat(maxPrice));
        }
        
        // Filter for products on sale (discount > 0)
        if (onSale === 'true' || onSale === true) {
            query += ' AND p.discount > 0';
        }

        // Group by product_id to aggregate reviews
        query += ' GROUP BY p.id';

        // Sorting logic
        switch (sort) {
            case 'price_asc':
                query += ' ORDER BY p.price ASC';
                break;
            case 'price_desc':
                query += ' ORDER BY p.price DESC';
                break;
            case 'name_asc':
                query += ' ORDER BY p.name ASC';
                break;
            case 'name_desc':
                query += ' ORDER BY p.name DESC';
                break;
            case 'newest':
                query += ' ORDER BY p.created_at DESC';
                break;
            case 'oldest':
                query += ' ORDER BY p.created_at ASC';
                break;
            case 'bestselling':
                // Order by sold count from order_items (delivered + paid orders)
                query += ' ORDER BY (SELECT SUM(oi.quantity) FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.product_id = p.id AND o.status = \'delivered\' AND o.payment_status = \'paid\') DESC';
                break;
            case 'discount':
                // Order by discount percentage descending (highest sale first)
                query += ' ORDER BY p.discount DESC, p.created_at DESC';
                break;
            default:
                query += ' ORDER BY p.id DESC';
        }
        
        // Limit results if specified
        if (limit && parseInt(limit) > 0) {
            query += ` LIMIT ${parseInt(limit)}`;
        }

        const [rows] = await db.query(query, params);
        res.json(rows || []);
    } catch (err) {
        console.error('Error fetching base products:', err);
        res.status(500).json({ error: 'Lỗi server', details: err.message });
    }
});

// Thêm sản phẩm gốc (admin)
router.post('/base', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, brand_id, brand, price, category_id, category, gender, description, image, material, style, sole, technology, lace_type, heel_type } = req.body;
        
        // Support both brand_id and brand (for backward compatibility)
        const finalBrandId = brand_id || brand;
        const finalCategoryId = category_id || category;
        
        // Build specification JSON from 6 fields
        const specification = JSON.stringify({
            material: material || '',
            style: style || '',
            sole: sole || '',
            technology: technology || '',
            lace_type: lace_type || '',
            heel_type: heel_type || ''
        });

        const [result] = await db.query(
            'INSERT INTO products (name, brand_id, price, category_id, gender, description, specification, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, finalBrandId, price, finalCategoryId, gender, description, specification, image]
        );

        // Trigger ML retrain ngay khi product mới được tạo (COLD START handling)
        triggerMLRetrain();

        res.json({ message: 'Thêm sản phẩm gốc thành công', id: result.insertId });
    } catch (err) {
        console.error('Error creating base product:', err);
        res.status(500).json({ error: 'Lỗi server', details: err.message });
    }
});

// Cập nhật sản phẩm gốc (admin)
router.put('/base/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, brand_id, brand, price, category_id, category, gender, description, image, material, style, sole, technology, lace_type, heel_type } = req.body;
        
        // Support both brand_id and brand (for backward compatibility)
        const finalBrandId = brand_id || brand;
        const finalCategoryId = category_id || category;
        
        // Build specification JSON from 6 fields
        const specification = JSON.stringify({
            material: material || '',
            style: style || '',
            sole: sole || '',
            technology: technology || '',
            lace_type: lace_type || '',
            heel_type: heel_type || ''
        });

        await db.query(
            'UPDATE products SET name = ?, brand_id = ?, price = ?, category_id = ?, gender = ?, description = ?, specification = ?, image = ? WHERE id = ?',
            [name, finalBrandId, price, finalCategoryId, gender, description, specification, image, req.params.id]
        );

        // Trigger ML retrain khi product được cập nhật (để model học feature mới)
        triggerMLRetrain();

        res.json({ message: 'Cập nhật sản phẩm gốc thành công' });
    } catch (err) {
        console.error('Error updating base product:', err);
        res.status(500).json({ error: 'Lỗi server', details: err.message });
    }
});

// Xóa sản phẩm gốc (admin)
router.delete('/base/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Xóa tất cả variants trước
        await db.query('DELETE FROM product_variants WHERE product_id = ?', [req.params.id]);
        // Sau đó xóa sản phẩm
        await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Xóa sản phẩm và các biến thể thành công' });
    } catch (err) {
        console.error('Error deleting base product:', err);
        res.status(500).json({ error: 'Lỗi server', details: err.message });
    }
});

// Thêm variant (admin)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { product_id, color, size, sku, quantity, images } = req.body;
        
        if (!product_id || !color || !size) {
            return res.status(400).json({ error: 'product_id, color, size là bắt buộc' });
        }

        // Lookup color_id từ colors table
        const [colorRows] = await db.query(
            'SELECT id FROM colors WHERE LOWER(color) = LOWER(?)',
            [color]
        );
        if (colorRows.length === 0) {
            return res.status(400).json({ error: `Màu "${color}" không tồn tại` });
        }
        const color_id = colorRows[0].id;

        // Insert với color_id (size giờ là cột bình thường)
        const [result] = await db.query(
            `INSERT INTO product_variants (product_id, color_id, size, quantity, sku, images) 
             VALUES (?, ?, ?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
             quantity = VALUES(quantity), 
             sku = VALUES(sku), 
             images = VALUES(images)`,
            [product_id, color_id, size, quantity || 0, sku || null, JSON.stringify(images || [])]
        );
        
        res.json({ 
            message: 'Thêm/Cập nhật variant thành công', 
            id: result.insertId 
        });
    } catch (err) {
        console.error('Error creating variant:', err);
        res.status(500).json({ 
            error: 'Lỗi server khi thêm variant', 
            details: err.message,
            code: err.code 
        });
    }
});

// Cập nhật variant (admin)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { product_id, color_id, size, sku, quantity, images } = req.body;
        
        // If only quantity is provided (admin updating stock)
        if (req.body.quantity !== undefined && !product_id && !color_id && !size) {
            await db.query(
                'UPDATE product_variants SET stock = ? WHERE id = ?',
                [quantity || 0, req.params.id]
            );
            return res.json({ message: 'Cập nhật số lượng thành công' });
        }
        
        // Full variant update (admin editing variant details)
        if (!product_id || !color_id || !size) {
            return res.status(400).json({ error: 'product_id, color_id, size là bắt buộc' });
        }

        await db.query(
            'UPDATE product_variants SET product_id = ?, color_id = ?, size = ?, quantity = ?, sku = ?, images = ? WHERE id = ?',
            [product_id, color_id, size, quantity || 0, sku || null, JSON.stringify(images || []), req.params.id]
        );
        
        res.json({ message: 'Cập nhật variant thành công' });
    } catch (err) {
        console.error('Error updating variant:', err);
        res.status(500).json({ 
            error: 'Lỗi server khi cập nhật variant', 
            details: err.message,
            code: err.code
        });
    }
});

// Xóa variant (admin)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM product_variants WHERE id = ?', [req.params.id]);
        res.json({ message: 'Xóa variant thành công' });
    } catch (err) {
        console.error('Error deleting variant:', err);
        res.status(500).json({ error: 'Lỗi server', details: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────
// Tìm kiếm sản phẩm bằng hình ảnh (PUBLIC)
// ─────────────────────────────────────────────────────────────────────────
router.post('/search-by-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Thiếu file ảnh' });
        }

        const threshold = parseFloat(req.body.threshold || 0.5);
        const topN = parseInt(req.body.top_n || 1);

        if (isNaN(threshold) || threshold < 0 || threshold > 1) {
            return res.status(400).json({ error: 'threshold phải là số từ 0-1' });
        }
        if (isNaN(topN) || topN < 1 || topN > 500) {
            return res.status(400).json({ error: 'top_n phải từ 1-500' });
        }

        // Forward tới ML Service
        const formData = new (require('form-data'))();
        formData.append('image', fs.createReadStream(req.file.path));
        formData.append('threshold', threshold.toString());
        formData.append('top_n', topN.toString());

        const mlUrl = new URL(ML_SERVICE_URL + '/search-by-image');
        const protocol = mlUrl.protocol === 'https:' ? https : http;

        const mlReq = protocol.request({
            hostname: mlUrl.hostname,
            port: mlUrl.port || (mlUrl.protocol === 'https:' ? 443 : 80),
            path: mlUrl.pathname,
            method: 'POST',
            headers: formData.getHeaders(),
            timeout: 30000,
        }, (mlRes) => {
            let data = '';
            mlRes.on('data', (chunk) => { data += chunk; });
            mlRes.on('end', () => {
                // Clean up uploaded file
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error deleting temp file:', err);
                });

                // Parse ML response
                try {
                    const mlResult = JSON.parse(data);
                    res.status(mlRes.statusCode).json(mlResult);
                } catch (parseErr) {
                    res.status(500).json({
                        error: 'Lỗi phân tích response từ ML Service',
                        details: parseErr.message
                    });
                }
            });
        });

        mlReq.on('error', (err) => {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
            });
            console.error('ML Service request error:', err);
            res.status(503).json({
                error: 'ML Service không khả dụng',
                details: err.message
            });
        });

        mlReq.on('timeout', () => {
            mlReq.destroy();
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting temp file:', err);
            });
            res.status(504).json({
                error: 'ML Service timeout',
                details: 'Yêu cầu vượt quá thời gian cho phép'
            });
        });

        formData.pipe(mlReq);
    } catch (err) {
        if (req.file) {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
            });
        }
        console.error('Error in image search:', err);
        res.status(500).json({
            error: 'Lỗi server',
            details: err.message
        });
    }
});

// ─────────────────────────────────────────────────────────────────────────
// Get all colors (public)
// ─────────────────────────────────────────────────────────────────────────
router.get('/colors/list', async (req, res) => {
    try {
        const [colors] = await db.query('SELECT id, color, hex_code FROM colors ORDER BY id');
        res.json(colors || []);
    } catch (err) {
        console.error('Error fetching colors:', err);
        res.status(500).json({ error: 'Lỗi server', details: err.message });
    }
});

module.exports = router;
