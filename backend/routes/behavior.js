const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const authenticateTokenOrSession = require('../middleware/authenticateTokenOrSession');
const http = require('http');

// URL của Python ML Service (có thể đổi qua env)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

const ACTION_WEIGHTS = Object.freeze({
    view: 1,
    add_to_cart: 3,
    like: 3,
    purchase: 5,
    return: -4,
    review_rating: 0,
});

const ALLOWED_BEHAVIOR_ACTIONS = new Set(['search', ...Object.keys(ACTION_WEIGHTS)]);

const getReviewRatingScore = (ratingValue) => {
    const rating = Number(ratingValue);
    if (!Number.isFinite(rating)) return 0;
    if (rating >= 4.5) return 4;
    if (rating >= 3.5) return 2;
    if (rating >= 2.5) return 0;
    if (rating >= 1.5) return -2;
    return -4;
};

const getReviewRatingScoreSql = (extraInfoColumn = 'extra_info') => `
    CASE
        WHEN JSON_EXTRACT(${extraInfoColumn}, '$.rating') IS NULL THEN 0
        WHEN CAST(JSON_UNQUOTE(JSON_EXTRACT(${extraInfoColumn}, '$.rating')) AS DECIMAL(4,2)) >= 4.5 THEN 4
        WHEN CAST(JSON_UNQUOTE(JSON_EXTRACT(${extraInfoColumn}, '$.rating')) AS DECIMAL(4,2)) >= 3.5 THEN 2
        WHEN CAST(JSON_UNQUOTE(JSON_EXTRACT(${extraInfoColumn}, '$.rating')) AS DECIMAL(4,2)) >= 2.5 THEN 0
        WHEN CAST(JSON_UNQUOTE(JSON_EXTRACT(${extraInfoColumn}, '$.rating')) AS DECIMAL(4,2)) >= 1.5 THEN -2
        ELSE -4
    END
`;

const getBehaviorScoreCaseSql = (actionColumn = 'action', extraInfoColumn = 'extra_info') => `
    CASE
        WHEN ${actionColumn} = 'view' THEN 1
        WHEN ${actionColumn} = 'add_to_cart' THEN 3
        WHEN ${actionColumn} = 'like' THEN 3
        WHEN ${actionColumn} = 'purchase' THEN 5
        WHEN ${actionColumn} = 'return' THEN -4
        WHEN ${actionColumn} = 'review_rating' THEN ${getReviewRatingScoreSql(extraInfoColumn)}
        ELSE 0
    END
`;

/**
 * Gọi HTTP GET đến ML service.
 * @returns {Promise<object>} JSON response hoặc null nếu lỗi.
 */
function callMLService(path) {
    return new Promise((resolve) => {
        // Fail-open: mọi lỗi ML đều resolve null để backend fallback sang query DB.
        const options = {
            hostname: new URL(ML_SERVICE_URL).hostname,
            port: new URL(ML_SERVICE_URL).port || 80,
            path,
            method: 'GET',
            timeout: 5000,
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { resolve(null); }
            });
        });

        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.end();
    });
}

/**
 * Lấy product data với các trường được tính toán (average_rating, total_ratings, sold, variant_count, etc.)
 * @param {string} whereClause - Điều kiện WHERE, ví dụ: "p.id IN (?, ?, ?)" hoặc "p.id = ?"
 * @param {array} params - Các tham số cho query
 * @returns {string, array} - [SQL query, params]
 */
function getEnrichedProductsQuery(whereClause, params) {
    const query = `
        SELECT 
            p.*,
            COALESCE(AVG(r.overall_rating), 0) as average_rating,
            COALESCE(COUNT(r.id), 0) as total_ratings,
            COALESCE((SELECT SUM(pv.sold) FROM product_variants pv WHERE pv.product_id = p.id), 0) as sold,
            COALESCE((SELECT COUNT(DISTINCT pv.color_id) FROM product_variants pv WHERE pv.product_id = p.id), 0) as variant_count
        FROM products p
        LEFT JOIN reviews r ON p.id = r.product_id
        ${whereClause ? 'WHERE ' + whereClause : ''}
        GROUP BY p.id
    `;
    return [query, params];
}

/**
 * Gọi POST /retrain đến ML service (không chờ kết quả).
 * Chạy retrain trong background.
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
                const result = JSON.parse(data);
            } catch {}
        });
    });

    req.on('error', (err) => {
        // Silently fail
    });
    req.on('timeout', () => req.destroy());
    req.end();
}

// Bộ đếm hành vi tổng để quyết định khi nào retrain
let behavior_log_count = 0;
const RETRAIN_TRIGGER_COUNT = 5;  // Retrain mỗi 5 hành vi

// Ghi log hành vi người dùng (Guest or Authenticated)
router.post('/log', authenticateTokenOrSession, async (req, res) => {
    try {
        const { action, product_id, extra_info } = req.body;
        const userId = req.user ? req.user.id : null;
        const sessionId = req.sessionId || null;

        if (!action || !ALLOWED_BEHAVIOR_ACTIONS.has(action)) {
            return res.status(400).json({ error: 'Action không hợp lệ' });
        }

        const normalizedProductId = (product_id === null || typeof product_id === 'undefined')
            ? null
            : Number(product_id);

        if (normalizedProductId !== null && Number.isNaN(normalizedProductId)) {
            return res.status(400).json({ error: 'product_id không hợp lệ' });
        }

        const actionsRequireProduct = new Set(['view', 'add_to_cart', 'like', 'purchase', 'return', 'review_rating']);
        if (actionsRequireProduct.has(action) && !normalizedProductId) {
            return res.status(400).json({ error: 'Action này yêu cầu product_id' });
        }

        const normalizedExtraInfo = (extra_info && typeof extra_info === 'object' && !Array.isArray(extra_info))
            ? { ...extra_info }
            : {};

        if (action === 'review_rating') {
            const normalizedRating = Number(normalizedExtraInfo.rating);
            if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
                return res.status(400).json({ error: 'review_rating yêu cầu extra_info.rating từ 1-5' });
            }
            normalizedExtraInfo.rating = Number(normalizedRating.toFixed(2));
            normalizedExtraInfo.rating_score = getReviewRatingScore(normalizedExtraInfo.rating);
        }
        
        // Insert behavior log with either user_id (authenticated) or session_id (guest)
        await db.query(
            'INSERT INTO user_behavior_logs (user_id, session_id, action, product_id, extra_info) VALUES (?, ?, ?, ?, ?)',
            [userId, sessionId, action, normalizedProductId, JSON.stringify(normalizedExtraInfo)]
        );
        
        // Trigger retrain nếu đạt ngưỡng
        behavior_log_count++;
        if (behavior_log_count >= RETRAIN_TRIGGER_COUNT) {
            triggerMLRetrain();
            behavior_log_count = 0;  // Reset counter
        }
        
        res.json({ message: 'Đã ghi log hành vi' });
    } catch (err) {
        console.error('Error logging behavior:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Lấy gợi ý sản phẩm cho user – gọi sang Python ML Service, fallback về DB đơn giản
router.get('/recommendations', authenticateTokenOrSession, async (req, res) => {
    const userId     = req.user ? req.user.id : null;
    const sessionId  = req.sessionId || null;
    const productId  = req.query.product_id ? parseInt(req.query.product_id) : null;
    const topN       = Math.min(parseInt(req.query.top_n) || 10, 50);

    try {
        // 1. Thử gọi Python ML Service (chỉ cho authenticated users)
        if (!userId && !sessionId) {
            return res.json({ source: 'no_user', recommendations: [] });
        }
        
        // Convert sessionId to numeric for ML API (which only accepts integer user_id)
        let mlUserId = userId;
        if (!mlUserId && sessionId) {
            // Create numeric ID from session UUID by hashing
            // ML API hiện chỉ nhận user_id kiểu số nên cần ánh xạ tạm session -> int.
            mlUserId = Math.abs(sessionId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 999999 + 1000000;
        }
        
        const mlPath = `/recommend?user_id=${mlUserId}${productId ? `&product_id=${productId}` : ''}&top_n=${topN}`;
        const mlResult = await callMLService(mlPath);

        if (mlResult && Array.isArray(mlResult.recommendations) && mlResult.recommendations.length > 0) {
            const ids = mlResult.recommendations;
            const placeholders = ids.map(() => '?').join(',');
            const [products] = await db.query(
                `SELECT * FROM products WHERE id IN (${placeholders})`,
                ids
            );
            // Giữ thứ tự từ ML service
            const ordered = ids.map(id => products.find(p => p.id === id)).filter(Boolean);
            return res.json({
                source: mlResult.is_cold_start ? 'cbf_cold_start' : 'hybrid_ml',
                recommendations: ordered,
            });
        }

        // 2. Fallback: dùng logic hành vi đơn giản từ DB nếu ML service không sẵn sàng
        let whereClause = 'WHERE product_id IS NOT NULL';
        let params = [topN];
        
        if (userId) {
            whereClause = 'WHERE user_id = ? AND product_id IS NOT NULL';
            params = [userId, topN];
        } else if (sessionId) {
            whereClause = 'WHERE session_id = ? AND product_id IS NOT NULL';
            params = [sessionId, topN];
        }
        
        const [behaviorData] = await db.query(`
            SELECT 
                product_id,
                SUM(${getBehaviorScoreCaseSql('action', 'extra_info')}) as score
            FROM user_behavior_logs
            ${whereClause}
            GROUP BY product_id
            HAVING score > 0
            ORDER BY score DESC
            LIMIT ?
        `, params);
        // Fallback này giúp recommendation vẫn hoạt động khi ML service down/retraining.

        if (behaviorData.length === 0) {
            const [rows] = await db.query('SELECT * FROM products ORDER BY id DESC LIMIT ?', [topN]);
            return res.json({ source: 'popular_fallback', recommendations: rows });
        }

        const productIds = behaviorData.map(b => b.product_id);
        const placeholders = productIds.map(() => '?').join(',');
        const [products] = await db.query(
            `SELECT * FROM products WHERE id IN (${placeholders})`, productIds
        );
        const scoredProducts = products
            .map(p => ({ ...p, behavior_score: behaviorData.find(b => b.product_id === p.id)?.score || 0 }))
            .sort((a, b) => b.behavior_score - a.behavior_score);

        res.json({ source: 'behavior_fallback', recommendations: scoredProducts });

    } catch (err) {
        console.error('Recommendations error:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Lấy danh sách sản phẩm user/guest đã xem gần đây
router.get('/viewed', authenticateTokenOrSession, async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        const sessionId = req.sessionId || null;
        const identityColumn = userId ? 'user_id' : 'session_id';
        const identityValue = userId || sessionId;

        if (!identityValue) {
            return res.json([]);
        }

        const topN = Math.min(Math.max(parseInt(req.query.top_n) || 8, 1), 20);
        const excludeProductIdRaw = Number(req.query.exclude_product_id);
        const hasExcludeProductId = Number.isInteger(excludeProductIdRaw) && excludeProductIdRaw > 0;

        let whereClause = `WHERE ${identityColumn} = ? AND action = 'view' AND product_id IS NOT NULL`;
        const params = [identityValue];

        if (hasExcludeProductId) {
            whereClause += ' AND product_id != ?';
            params.push(excludeProductIdRaw);
        }

        params.push(topN);

        const [viewedRows] = await db.query(
            `SELECT product_id, MAX(timestamp) AS last_viewed
             FROM user_behavior_logs
             ${whereClause}
             GROUP BY product_id
             ORDER BY last_viewed DESC
             LIMIT ?`,
            params
        );

        if (!viewedRows.length) {
            return res.json([]);
        }

        const productIds = viewedRows.map((row) => row.product_id);
        const placeholders = productIds.map(() => '?').join(',');
        const [enrichedQuery, enrichedParams] = getEnrichedProductsQuery(`p.id IN (${placeholders})`, productIds);
        const [products] = await db.query(enrichedQuery, enrichedParams);

        const orderedProducts = productIds
            .map((id) => products.find((product) => product.id === id))
            .filter(Boolean);

        return res.json(orderedProducts);
    } catch (err) {
        console.error('Viewed products error:', err);
        return res.status(500).json({ error: 'Lỗi server' });
    }
});

// Lấy sản phẩm tương tự (proxy sang ML /similar)
router.get('/similar/:productId', async (req, res) => {
    const productId = parseInt(req.params.productId);
    const topN = Math.min(parseInt(req.query.top_n) || 8, 20);

    try {
        const mlResult = await callMLService(`/similar?product_id=${productId}&top_n=${topN}`);

        if (mlResult && Array.isArray(mlResult.similar) && mlResult.similar.length > 0) {
            const ids = mlResult.similar;
            const placeholders = ids.map(() => '?').join(',');
            const [enrichedQuery, enrichedParams] = getEnrichedProductsQuery(`p.id IN (${placeholders})`, ids);
            const [products] = await db.query(enrichedQuery, enrichedParams);
            const ordered = ids.map(id => products.find(p => p.id === id)).filter(Boolean);
            return res.json(ordered);
        }

        // Fallback: trả về sản phẩm cùng loại
        const [product] = await db.query('SELECT category_id FROM products WHERE id = ?', [productId]);
        if (product.length > 0) {
            const [fallbackQuery, fallbackParams] = getEnrichedProductsQuery(
                `p.category_id = ? AND p.id != ?`,
                [product[0].category_id, productId]
            );
            const [similar] = await db.query(fallbackQuery + ` LIMIT ?`, [...fallbackParams, topN]);
            return res.json(similar);
        }
        res.json([]);

    } catch (err) {
        console.error('Similar products error:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Lấy sản phẩm "Khách hàng mua sản phẩm này cũng mua" (Item-based CF)
router.get('/frequently-bought/:productId', async (req, res) => {
    const productId = parseInt(req.params.productId);
    const topN = Math.min(parseInt(req.query.top_n) || 6, 20);

    try {
        // Lấy gender của sản phẩm gốc để filter kết quả
        const [sourceProduct] = await db.query('SELECT gender FROM products WHERE id = ?', [productId]);
        const sourceGender = sourceProduct.length > 0 ? sourceProduct[0].gender : null;
        let genderFilter = '';
        let filterParams = [];

        // Nếu sản phẩm gốc có giới tính rõ → chỉ gợi ý cùng giới tính hoặc unisex
        if (sourceGender && ['male', 'female'].includes(sourceGender.toLowerCase())) {
            const opposite = sourceGender.toLowerCase() === 'male' ? 'female' : 'male';
            genderFilter = ` AND (p.gender IS NULL OR p.gender = '' OR LOWER(p.gender) = ? OR LOWER(p.gender) = ?)`;
            filterParams = [sourceGender.toLowerCase(), 'unisex'];
        }

        // Tìm tất cả user đã tương tác với sản phẩm này
        const [userRows] = await db.query(
            `SELECT DISTINCT user_id FROM user_behavior_logs WHERE product_id = ? AND action IN ('purchase', 'add_to_cart', 'like')`,
            [productId]
        );

        let resultIds = [];

        if (userRows.length === 0) {
            // Fallback: sản phẩm bán chạy nhất (có gender filter)
            const [popular] = await db.query(
                `SELECT p.id FROM products p
                 JOIN user_behavior_logs b ON p.id = b.product_id
                 WHERE b.action = 'purchase' AND p.id != ?${genderFilter}
                 GROUP BY p.id ORDER BY COUNT(*) DESC LIMIT ?`,
                [productId, ...filterParams, topN]
            );
            resultIds = popular.map(r => r.id);
        } else {
            const userIds = userRows.map(r => r.user_id);
            const userPlaceholders = userIds.map(() => '?').join(',');

            // Tìm các sản phẩm khác mà những users này đã mua (có gender filter)
            const [rows] = await db.query(
                `SELECT p.id FROM products p
                 JOIN user_behavior_logs b ON p.id = b.product_id
                 WHERE b.user_id IN (${userPlaceholders})
                 AND b.action IN ('purchase', 'add_to_cart', 'like')
                 AND p.id != ?${genderFilter}
                 GROUP BY p.id
                 ORDER BY COUNT(*) DESC
                 LIMIT ?`,
                [...userIds, productId, ...filterParams, topN]
            );
            resultIds = rows.map(r => r.id);
        }

        // Fetch enriched product data
        if (resultIds.length === 0) {
            return res.json([]);
        }

        const placeholders = resultIds.map(() => '?').join(',');
        const [query, params] = getEnrichedProductsQuery(`p.id IN (${placeholders})`, resultIds);
        const [products] = await db.query(query, params);
        
        // Maintain order from co-occurrence ranking
        const ordered = resultIds.map(id => products.find(p => p.id === id)).filter(Boolean);
        res.json(ordered);

    } catch (err) {
        console.error('Frequently bought error:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Lấy sản phẩm trending (bán chạy nhất 7 ngày qua) - dùng cho cold start
router.get('/trending', async (req, res) => {
    const topN = Math.min(parseInt(req.query.top_n) || 10, 30);
    const userId = req.query.user_id ? parseInt(req.query.user_id) : null;
    let genderFilter = '';
    let filterParams = [];

    try {
        // Nếu có user_id, check xem user chỉ tương tác 1 giới tính không
        if (userId) {
            const [userGenderStats] = await db.query(`
                SELECT LOWER(p.gender) as gender, COUNT(*) as count
                FROM user_behavior_logs b
                JOIN products p ON b.product_id = p.id
                WHERE b.user_id = ? AND LOWER(p.gender) IN ('male', 'female')
                GROUP BY LOWER(p.gender)
            `, [userId]);

            // Nếu user chỉ tương tác 1 giới tính (ngoài unisex/null) → filter bắt buộc
            if (userGenderStats.length === 1) {
                const userGender = userGenderStats[0].gender;
                genderFilter = ` AND (p.gender IS NULL OR p.gender = '' OR LOWER(p.gender) = ? OR LOWER(p.gender) = ?)`;
                filterParams = [userGender, 'unisex'];
            }
        }

        const [rows] = await db.query(
            `SELECT p.id,
                SUM(${getBehaviorScoreCaseSql('b.action', 'b.extra_info')}) AS trend_score
             FROM products p
             JOIN user_behavior_logs b ON p.id = b.product_id
             WHERE b.timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)${genderFilter}
             GROUP BY p.id
             ORDER BY trend_score DESC
             LIMIT ?`,
            [...filterParams, topN]
        );
        
        // Fallback nếu chưa có log mới trong 7 ngày
        if (rows.length === 0) {
            const fallbackFilter = genderFilter ? 
                ` AND (p.gender IS NULL OR p.gender = '' OR LOWER(p.gender) IN (?, ?))` : '';
            const fallbackParams = genderFilter ? filterParams : [];
            const [fallbackQuery, fallbackQueryParams] = getEnrichedProductsQuery(
                `1=1${fallbackFilter}`,
                fallbackParams
            );
            const [fallback] = await db.query(fallbackQuery + ` ORDER BY p.id DESC LIMIT ?`, [...fallbackQueryParams, topN]);
            return res.json(fallback);
        }

        // Get enriched product data for trending products
        const trendingIds = rows.map(r => r.id);
        const placeholders = trendingIds.map(() => '?').join(',');
        const [enrichedQuery, enrichedParams] = getEnrichedProductsQuery(`p.id IN (${placeholders})`, trendingIds);
        const [trendingProducts] = await db.query(enrichedQuery, enrichedParams);

        // Maintain order from trend_score ranking
        const orderedProducts = trendingIds.map(id => trendingProducts.find(p => p.id === id)).filter(Boolean);
        res.json(orderedProducts);

    } catch (err) {
        console.error('Trending error:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Lấy thống kê hành vi (đồng bộ trọng số với recommender)
router.get('/stats', authenticateTokenOrSession, async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        const sessionId = req.sessionId || null;
        
        let whereClause = 'WHERE 1=0'; // Default: no data
        let params = [];
        
        if (userId) {
            whereClause = 'WHERE user_id = ?';
            params = [userId];
        } else if (sessionId) {
            whereClause = 'WHERE session_id = ?';
            params = [sessionId];
        }
        
        const [stats] = await db.query(`
            SELECT 
                action,
                COUNT(*) as count
            FROM user_behavior_logs
            ${whereClause}
            GROUP BY action
        `, params);

        const [weightedRows] = await db.query(`
            SELECT COALESCE(SUM(${getBehaviorScoreCaseSql('action', 'extra_info')}), 0) AS weighted_score
            FROM user_behavior_logs
            ${whereClause}
        `, params);

        const weightedScore = Number(weightedRows[0]?.weighted_score || 0);

        res.json({
            stats,
            weighted_score: weightedScore
        });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
