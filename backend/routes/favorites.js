const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateTokenOrSession = require('../middleware/authenticateTokenOrSession');

const getIdentity = (req) => {
  if (req.user?.id) {
    return { column: 'user_id', value: req.user.id };
  }
  if (req.sessionId) {
    return { column: 'session_id', value: req.sessionId };
  }
  return null;
};

const sanitizeProductIds = (productIds) => {
  if (!Array.isArray(productIds)) return [];
  const normalized = productIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
  return [...new Set(normalized)];
};

// ────────────────────────────────────────────────────────────────────────────
// ADD TO FAVORITES
// ────────────────────────────────────────────────────────────────────────────
router.post('/add', authenticateTokenOrSession, async (req, res) => {
  try {
    const identity = getIdentity(req);
    if (!identity) {
      return res.status(401).json({ status: 'error', message: 'Missing authentication or session' });
    }

    const productId = Number(req.body?.product_id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ status: 'error', message: 'product_id is required' });
    }

    // Check if product exists
    const [products] = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    // Add to favorites (IGNORE if duplicate)
    const [insertResult] = await db.query(
      `INSERT IGNORE INTO favorites (${identity.column}, product_id) VALUES (?, ?)`,
      [identity.value, productId]
    );

    // Ghi log like khi thêm mới vào favorites
    if (insertResult && insertResult.affectedRows > 0) {
      await db.query(
        'INSERT INTO user_behavior_logs (user_id, session_id, action, product_id, extra_info) VALUES (?, ?, ?, ?, ?)',
        [req.user?.id || null, req.sessionId || null, 'like', productId, JSON.stringify({ source: 'favorites' })]
      ).catch((logErr) => {
        console.error('Error logging like behavior:', logErr.message);
      });
    }

    res.json({ status: 'success', message: 'Added to favorites' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// REMOVE FROM FAVORITES
// ────────────────────────────────────────────────────────────────────────────
router.delete('/remove/:product_id', authenticateTokenOrSession, async (req, res) => {
  try {
    const identity = getIdentity(req);
    if (!identity) {
      return res.status(401).json({ status: 'error', message: 'Missing authentication or session' });
    }

    const productId = Number(req.params?.product_id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid product_id' });
    }

    await db.query(
      `DELETE FROM favorites WHERE ${identity.column} = ? AND product_id = ?`,
      [identity.value, productId]
    );

    res.json({ status: 'success', message: 'Removed from favorites' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET USER FAVORITES
// ────────────────────────────────────────────────────────────────────────────
router.get('/list', authenticateTokenOrSession, async (req, res) => {
  try {
    const identity = getIdentity(req);
    if (!identity) {
      return res.status(401).json({ status: 'error', message: 'Missing authentication or session' });
    }

    const query = `
      SELECT 
        p.id, p.name, p.description, p.price,
        p.image,
        f.created_at as added_at
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      WHERE f.${identity.column} = ?
      ORDER BY f.created_at DESC
    `;

    const [favorites] = await db.query(query, [identity.value]);

    res.json({ 
      status: 'success',
      favorites: favorites.map(fav => ({
        id: fav.id,
        name: fav.name,
        description: fav.description,
        price: fav.price,
        image: fav.image,
        added_at: fav.added_at
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// CHECK IF PRODUCTS ARE FAVORITED
// ────────────────────────────────────────────────────────────────────────────
router.post('/check', authenticateTokenOrSession, async (req, res) => {
  try {
    const identity = getIdentity(req);
    if (!identity) {
      return res.status(401).json({ status: 'error', message: 'Missing authentication or session' });
    }

    const productIds = sanitizeProductIds(req.body?.product_ids);

    if (productIds.length === 0) {
      return res.json({ status: 'success', favorited: {} });
    }

    const placeholders = productIds.map(() => '?').join(',');
    const query = `
      SELECT product_id FROM favorites 
      WHERE ${identity.column} = ? AND product_id IN (${placeholders})
    `;

    const [rows] = await db.query(query, [identity.value, ...productIds]);
    
    const favorited = {};
    rows.forEach(row => {
      favorited[row.product_id] = true;
    });

    res.json({ status: 'success', favorited });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
