const express = require('express');
const router = express.Router();
const db = require('../db');

// Simple test route
router.get('/', async (req, res) => {
  try {
    const { gender } = req.query;
    const categories = await db.query('SELECT * FROM categories WHERE is_active = 1');
    res.json({ 
      message: 'Categories API works!', 
      gender: gender || 'all',
      count: categories.length,
      data: categories 
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

module.exports = router;