const express = require('express');
const router = express.Router();

// Simple test route
router.get('/', (req, res) => {
  res.json({ message: 'Brands API working!' });
});

router.get('/test', (req, res) => {
  res.json({ message: 'Test route working!' });
});

module.exports = router;