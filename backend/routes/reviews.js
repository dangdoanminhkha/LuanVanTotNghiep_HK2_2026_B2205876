const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { createNotification } = require('./notifications');
const jwt = require('jsonwebtoken');
const upload = require('../middleware/uploadFile');

const parseNumericId = (value) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return null;
    }
    return parsed;
};

const getLikeSummary = async (reviewId, userId) => {
    const [rows] = await db.query(
        `SELECT 
            COALESCE(JSON_LENGTH(liked_user_ids), 0) AS like_count,
            JSON_CONTAINS(
                COALESCE(liked_user_ids, JSON_ARRAY()),
                JSON_QUOTE(CAST(? AS CHAR)),
                '$'
            ) AS user_liked
         FROM reviews
         WHERE id = ?`,
        [String(userId || 0), reviewId]
    );

    return {
        like_count: Number(rows[0]?.like_count || 0),
        user_liked: Boolean(rows[0]?.user_liked),
    };
};

// Lấy reviews của một sản phẩm (public)
router.get('/product/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        const { rating, has_images } = req.query;

        // Thử đọc user_id từ JWT (nếu có) để biết review nào user đã like
        let currentUserId = 0;
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded && decoded.id) {
                    currentUserId = decoded.id;
                }
            }
        } catch (e) {
            // Nếu token lỗi thì bỏ qua, vẫn trả về danh sách public
            currentUserId = 0;
        }

        const filters = ['r.product_id = ?'];
        const params = [currentUserId || 0, productId];

        // Bộ lọc theo rating (1-5). Dùng khoảng để hỗ trợ rating dạng thập phân
        if (rating) {
            const r = parseInt(rating, 10);
            switch (r) {
                case 5:
                    filters.push('r.overall_rating >= 4.5');
                    break;
                case 4:
                    filters.push('r.overall_rating >= 3.5 AND r.overall_rating < 4.5');
                    break;
                case 3:
                    filters.push('r.overall_rating >= 2.5 AND r.overall_rating < 3.5');
                    break;
                case 2:
                    filters.push('r.overall_rating >= 1.5 AND r.overall_rating < 2.5');
                    break;
                case 1:
                    filters.push('r.overall_rating < 1.5');
                    break;
                default:
                    break;
            }
        }

        // Bộ lọc chỉ lấy review có ảnh
        if (has_images === 'true') {
            filters.push('r.images IS NOT NULL AND JSON_LENGTH(r.images) > 0');
        }

        const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

        const [reviews] = await db.query(
            `SELECT 
                r.id,
                r.user_id,
                r.product_id,
                r.order_item_id,
                r.overall_rating,
                r.general_comment,
                r.images,
                r.created_at,
                r.updated_at,
                u.email,
                CONCAT(SUBSTRING(u.email, 1, 3), '***@', SUBSTRING_INDEX(u.email, '@', -1)) as masked_email,
                r.reply_text as admin_reply,
                admin_u.email as admin_email,
                r.reply_at as reply_created_at,
                r.admin_user_id,
                oi.size,
                oi.color,
                COALESCE(JSON_LENGTH(r.liked_user_ids), 0) AS like_count,
                JSON_CONTAINS(
                    COALESCE(r.liked_user_ids, JSON_ARRAY()),
                    JSON_QUOTE(CAST(? AS CHAR)),
                    '$'
                ) AS user_liked
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN users admin_u ON r.admin_user_id = admin_u.id
            LEFT JOIN order_items oi ON r.order_item_id = oi.id
            ${whereClause}
            ORDER BY r.created_at DESC`,
            params
        );
        res.json(reviews);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ error: 'Lỗi server', message: err.message });
    }
});

// Lấy thống kê rating của sản phẩm
router.get('/product/:productId/stats', async (req, res) => {
    try {
        const [stats] = await db.query(
            `SELECT 
                COUNT(*) as total_reviews,
                AVG(overall_rating) as average_rating,
                COUNT(CASE WHEN overall_rating >= 4 THEN 1 END) as positive_reviews,
                COUNT(CASE WHEN overall_rating >= 4.5 THEN 1 END) as five_star,
                COUNT(CASE WHEN overall_rating >= 3.5 AND overall_rating < 4.5 THEN 1 END) as four_star,
                COUNT(CASE WHEN overall_rating >= 2.5 AND overall_rating < 3.5 THEN 1 END) as three_star,
                COUNT(CASE WHEN overall_rating >= 1.5 AND overall_rating < 2.5 THEN 1 END) as two_star,
                COUNT(CASE WHEN overall_rating < 1.5 THEN 1 END) as one_star,
                COUNT(CASE WHEN images IS NOT NULL AND JSON_LENGTH(images) > 0 THEN 1 END) as with_images
            FROM reviews 
            WHERE product_id = ?`,
            [req.params.productId]
        );
        res.json(stats[0] || {
            total_reviews: 0,
            average_rating: 0,
            positive_reviews: 0,
            five_star: 0,
            four_star: 0,
            three_star: 0,
            two_star: 0,
            one_star: 0,
            with_images: 0
        });
    } catch (err) {
        console.error('Error fetching review stats:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Lấy các sản phẩm user có thể review
router.get('/reviewable', authenticateToken, async (req, res) => {
    try {
        const [items] = await db.query(
            `SELECT DISTINCT
                oi.id as order_item_id,
                oi.product_id,
                oi.size,
                oi.color,
                p.name,
                p.image,
                COALESCE(b.name, 'N/A') as brand,
                o.id as order_id,
                (SELECT created_at FROM order_status_logs WHERE order_id = o.id AND status_new = 'delivered' ORDER BY created_at DESC LIMIT 1) as delivered_at,
                r.id as existing_review_id
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN reviews r ON oi.id = r.order_item_id
            WHERE o.user_id = ? 
                AND o.status = 'delivered'
                AND o.payment_status = 'paid'
                AND EXISTS (SELECT 1 FROM order_status_logs WHERE order_id = o.id AND status_new = 'delivered')
            ORDER BY (SELECT created_at FROM order_status_logs WHERE order_id = o.id AND status_new = 'delivered' ORDER BY created_at DESC LIMIT 1) DESC`,
            [req.user.id]
        );
        res.json(items);
    } catch (err) {
        console.error('Error fetching reviewable items:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Upload ảnh đánh giá (multer)
router.post('/upload-images', authenticateToken, (req, res) => {
    upload.array('images', 6)(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message || 'Upload ảnh thất bại' });
        }

        const files = Array.isArray(req.files) ? req.files : [];
        if (!files.length) {
            return res.status(400).json({ error: 'Vui lòng chọn ít nhất 1 ảnh' });
        }

        const urls = files.map((file) => `/uploads/${file.filename}`);
        return res.json({
            message: 'Upload ảnh thành công',
            urls,
        });
    });
});

// Tạo review mới
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            order_item_id,
            product_id,
            rating,
            comment,
            material_rating,
            color_rating,
            description_rating,
            general_comment,
            images
        } = req.body;

        // Tính điểm cuối cùng: ưu tiên rating, fallback tính trung bình từ các rating chi tiết nếu có
        let finalRating = rating;
        if (!finalRating) {
            const parts = [material_rating, color_rating, description_rating]
                .map(v => Number(v))
                .filter(v => v >= 1 && v <= 5);
            if (parts.length > 0) {
                finalRating = parts.reduce((sum, v) => sum + v, 0) / parts.length;
            }
        }

        // Validate rating
        if (!finalRating || finalRating < 1 || finalRating > 5) {
            return res.status(400).json({ error: 'Rating phải từ 1-5' });
        }

        // Kiểm tra user có quyền review item này không
        const [orderItems] = await db.query(
            `SELECT oi.* FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             WHERE oi.id = ? AND o.user_id = ? AND o.status = 'delivered' AND o.payment_status = 'paid'`,
            [order_item_id, req.user.id]
        );

        if (orderItems.length === 0) {
            return res.status(403).json({ error: 'Bạn chỉ có thể đánh giá sản phẩm đã mua và nhận hàng' });
        }

        // Kiểm tra đã review chưa
        const [existingReview] = await db.query(
            'SELECT id FROM reviews WHERE order_item_id = ?',
            [order_item_id]
        );

        if (existingReview.length > 0) {
            return res.status(400).json({ error: 'Bạn đã đánh giá sản phẩm này rồi' });
        }

        // Chuẩn hoá comment và images (tuỳ chọn)
        const finalComment = (general_comment || comment || '').trim() || null;
        let imagesJson = null;
        if (Array.isArray(images) && images.length > 0) {
            const sanitized = images.filter(url => typeof url === 'string' && url.trim().length > 0);
            if (sanitized.length > 0) {
                imagesJson = JSON.stringify(sanitized.slice(0, 6)); // giới hạn tối đa 6 ảnh
            }
        }

        // Tạo review mới
        const [result] = await db.query(
            `INSERT INTO reviews (
                user_id, product_id, order_item_id,
                overall_rating, general_comment, images
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.id, product_id, order_item_id,
                finalRating, finalComment, imagesJson
            ]
        );

        // Ghi log hành vi review_rating để recommender học tín hiệu sao đánh giá
        await db.query(
            'INSERT INTO user_behavior_logs (user_id, action, product_id, extra_info) VALUES (?, ?, ?, ?)',
            [
                req.user.id,
                'review_rating',
                product_id,
                JSON.stringify({
                    source: 'review',
                    review_id: result.insertId,
                    order_item_id,
                    rating: Number(finalRating),
                }),
            ]
        ).catch((logErr) => {
            console.error('Error logging review_rating behavior:', logErr.message);
        });

        res.json({ 
            message: 'Đánh giá thành công',
            reviewId: result.insertId
        });
    } catch (err) {
        console.error('Error creating review:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Bạn đã đánh giá sản phẩm này rồi' });
        }
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Admin phản hồi review
router.post('/:id/reply', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { reply_text } = req.body;
        const reviewId = req.params.id;

        if (!reply_text || reply_text.trim().length === 0) {
            return res.status(400).json({ error: 'Nội dung phản hồi không được trống' });
        }

        // Kiểm tra review có tồn tại không
        const [reviews] = await db.query('SELECT id FROM reviews WHERE id = ?', [reviewId]);
        if (reviews.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đánh giá' });
        }

        // Tạo hoặc cập nhật reply
        await db.query(
            `UPDATE reviews 
             SET reply_text = ?,
                 admin_user_id = ?,
                 reply_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [reply_text.trim(), req.user.id, reviewId]
        );

        // Tạo thông báo cho người dùng về phản hồi
        try {
            const [reviewInfo] = await db.query(`
                SELECT r.user_id, p.name as product_name
                FROM reviews r 
                JOIN products p ON r.product_id = p.id 
                WHERE r.id = ?
            `, [reviewId]);
            
            if (reviewInfo.length > 0) {
                const userId = reviewInfo[0].user_id;
                const productName = reviewInfo[0].product_name;
                
                await createNotification(
                    userId,
                    'review_reply',
                    'Shop đã phản hồi đánh giá của bạn',
                    `Cửa hàng đã phản hồi đánh giá của bạn về sản phẩm "${productName}".`,
                    null,
                    reviewId
                );
            }
        } catch (notificationError) {
            console.error('Error creating review reply notification:', notificationError);
        }

        res.json({ message: 'Phản hồi thành công' });
    } catch (err) {
        console.error('Error replying to review:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Lấy reviews của user hiện tại
router.get('/my', authenticateToken, async (req, res) => {
    try {
        const [reviews] = await db.query(
            `SELECT 
                r.id,
                r.user_id,
                r.product_id,
                r.order_item_id,
                r.overall_rating as rating,
                r.general_comment as comment,
                r.images,
                r.created_at,
                p.name as product_name,
                p.image as product_image,
                r.reply_text as admin_reply,
                r.reply_at as reply_created_at,
                oi.size,
                oi.color
            FROM reviews r
            JOIN products p ON r.product_id = p.id
            LEFT JOIN order_items oi ON r.order_item_id = oi.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC`,
            [req.user.id]
        );
        res.json(reviews);
    } catch (err) {
        console.error('Error fetching user reviews:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Admin: Get all reviews
router.get('/admin/all', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [reviews] = await db.query(`
            SELECT 
                r.id,
                r.overall_rating,
                r.general_comment,
                r.images,
                r.created_at,
                u.email as user_email,
                p.name as product_name,
                p.image as product_image,
                r.reply_text as admin_reply,
                r.reply_at as reply_created_at,
                oi.size,
                oi.color
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN products p ON r.product_id = p.id
            LEFT JOIN order_items oi ON r.order_item_id = oi.id
            ORDER BY r.created_at DESC
        `);

        res.json(reviews);
    } catch (error) {
        console.error('Error fetching admin reviews:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy danh sách đánh giá' });
    }
});

// User like một review
router.post('/:id/like', authenticateToken, async (req, res) => {
    try {
        const reviewId = parseNumericId(req.params.id);
        const userId = parseNumericId(req.user.id);

        if (!reviewId || !userId) {
            return res.status(400).json({ error: 'review_id hoặc user_id không hợp lệ' });
        }

        const [existing] = await db.query('SELECT id FROM reviews WHERE id = ?', [reviewId]);
        if (!existing.length) {
            return res.status(404).json({ error: 'Không tìm thấy đánh giá' });
        }

        await db.query(
            `UPDATE reviews
             SET liked_user_ids = CASE
                 WHEN liked_user_ids IS NULL THEN JSON_ARRAY(CAST(? AS CHAR))
                 WHEN JSON_CONTAINS(liked_user_ids, JSON_QUOTE(CAST(? AS CHAR)), '$') THEN liked_user_ids
                 ELSE JSON_ARRAY_APPEND(liked_user_ids, '$', CAST(? AS CHAR))
             END
             WHERE id = ?`,
            [String(userId), String(userId), String(userId), reviewId]
        );

        const summary = await getLikeSummary(reviewId, userId);

        res.json(summary);
    } catch (error) {
        console.error('Error liking review:', error);
        res.status(500).json({ error: 'Lỗi server khi like đánh giá' });
    }
});

// User bỏ like review
router.delete('/:id/like', authenticateToken, async (req, res) => {
    try {
        const reviewId = parseNumericId(req.params.id);
        const userId = parseNumericId(req.user.id);

        if (!reviewId || !userId) {
            return res.status(400).json({ error: 'review_id hoặc user_id không hợp lệ' });
        }

        const [existing] = await db.query('SELECT id FROM reviews WHERE id = ?', [reviewId]);
        if (!existing.length) {
            return res.status(404).json({ error: 'Không tìm thấy đánh giá' });
        }

        await db.query(
            `UPDATE reviews
             SET liked_user_ids = CASE
                 WHEN liked_user_ids IS NULL THEN JSON_ARRAY()
                 WHEN JSON_SEARCH(liked_user_ids, 'one', CAST(? AS CHAR)) IS NOT NULL
                      THEN JSON_REMOVE(liked_user_ids, JSON_UNQUOTE(JSON_SEARCH(liked_user_ids, 'one', CAST(? AS CHAR))))
                 ELSE liked_user_ids
             END
             WHERE id = ?`,
            [String(userId), String(userId), reviewId]
        );

        const summary = await getLikeSummary(reviewId, userId);

        res.json(summary);
    } catch (error) {
        console.error('Error unliking review:', error);
        res.status(500).json({ error: 'Lỗi server khi bỏ like đánh giá' });
    }
});

module.exports = router;