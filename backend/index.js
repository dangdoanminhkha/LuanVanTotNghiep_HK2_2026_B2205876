const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const extractSessionId = require('./middleware/sessionId');
const { startOrderHoldWatcher } = require('./jobs/orderHoldWatcher');

// Bypass NGROK browser warning
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'any-value';

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGINS = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(origin => origin.trim()) : ['http://localhost:5173'];

app.use(cors({
  origin: FRONTEND_ORIGINS,
  credentials: true
}));
app.use(express.json());

// Apply session ID middleware globally to extract guest session_id from headers
app.use(extractSessionId);

// Serve static files từ uploads folder
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/upload', require('./routes/upload'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth', require('./routes/googleAuth'));
// Mount route để xử lý xác thực email (GET /api/auth/verify?token=...)
app.use('/api/auth/verify', require('./routes/verification'));
app.use('/api/cat-test', require('./routes/cat-simple'));
app.use('/api/products', require('./routes/products'));
try {
  const brandsRoute = require('./routes/brands');
  app.use('/api/brands', brandsRoute);
} catch (error) {
  console.error('Error loading brands route:', error.message);
}
try {
  const categoriesRoute = require('./routes/categories-new');
  app.use('/api/categories-new', categoriesRoute);
  app.use('/api/categories', categoriesRoute); // Alias for frontend
} catch (error) {
  console.error('Error loading categories route:', error.message);
}
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/users', require('./routes/users'));
app.use('/api/behavior', require('./routes/behavior'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/vouchers', require('./routes/vouchers'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/colors', require('./routes/colors'));
app.use('/api/admin/dashboard', require('./routes/admin-dashboard'));
// Admin revenue analytics
try {
  app.use('/api/admin/revenue', require('./routes/revenue'));
  app.use('/api/admin/expenses', require('./routes/expenses'));
} catch (err) {
  console.error('Could not mount admin routes:', err.message);
}

// Provinces proxy (avoid CORS issues on the frontend)
const PROVINCES_VN_API = 'https://provinces.open-api.vn/api';
app.get('/api/provinces', async (req, res) => {
  try {
    const response = await axios.get(`${PROVINCES_VN_API}/p/`);
    res.json({ results: response.data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch provinces' });
  }
});
app.get('/api/provinces/:provinceId/districts', async (req, res) => {
  try {
    const response = await axios.get(`${PROVINCES_VN_API}/p/${req.params.provinceId}?depth=2`);
    res.json({ results: response.data.districts || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch districts' });
  }
});
app.get('/api/provinces/:provinceId/districts/:districtId/wards', async (req, res) => {
  try {
    const response = await axios.get(`${PROVINCES_VN_API}/d/${req.params.districtId}?depth=2`);
    res.json({ results: response.data.wards || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wards' });
  }
});

app.get('/', (req, res) => {
    res.send('API backend bán giày hoạt động!');
});

startOrderHoldWatcher();

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
