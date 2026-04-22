import axios from 'axios';
import { getSessionId } from '../utils/sessionId';

// Sử dụng environment variable từ Vite, fallback về localhost để dev
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

// Bypass NGROK browser warning
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'any-value';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'any-value',
    },
});

// Interceptor để tự động thêm token vào request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Thêm X-Session-Id header cho guest tracking
        const sessionId = getSessionId();
        if (sessionId) {
            config.headers['X-Session-Id'] = sessionId;
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// Auth APIs
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    verify: (token) => api.get(`/auth/verify?token=${encodeURIComponent(token)}`),
    resendVerification: (email) => api.post('/auth/resend-verification', { email }),
    forgotPassword: (data) => api.post('/auth/forgot-password', data),
    resetPassword: (data) => api.post('/auth/reset-password', data),
    verifyResetToken: (token) => api.get(`/auth/verify-reset-token/${encodeURIComponent(token)}`),
};

// Products APIs
export const productsAPI = {
    getAll: (params) => api.get('/products', { params }), // This gets all variants (flat list)
    getBaseAll: (params) => api.get('/products/all', { params }), // This gets base products with filters
    getBaseById: (id) => api.get(`/products/base/${id}`),
    getVariantsByProductId: (id) => api.get(`/products/product/${id}`),
    getById: (id) => api.get(`/products/variant/${id}`), // This gets a single variant by its ID
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
};

// Cart APIs
export const cartAPI = {
    get: () => api.get('/cart'),
    add: (data) => api.post('/cart', data),
    update: (id, data) => api.put(`/cart/${id}`, data),
    remove: (id) => api.delete(`/cart/${id}`),
    clear: () => api.delete('/cart'),
};

// Orders APIs
export const ordersAPI = {
    create: (data) => api.post('/orders', data),
    getMyOrders: () => api.get('/orders/my-orders'),
    getAll: () => api.get('/orders'),
    getById: (id) => api.get(`/orders/${id}`),
    updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

// Users APIs
export const usersAPI = {
    getAll: () => api.get('/users'),
    getProfile: () => api.get('/users/profile'),
    updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
    delete: (id) => api.delete(`/users/${id}`),
};

// Behavior APIs (ML)
export const behaviorAPI = {
    log: (data) => api.post('/behavior/log', data),
    getViewed: (excludeProductId, topN = 8) =>
        api.get('/behavior/viewed', { params: { exclude_product_id: excludeProductId, top_n: topN } }),
    getRecommendations: (productId, topN = 10) =>
        api.get('/behavior/recommendations', { params: { product_id: productId, top_n: topN } }),
    getSimilar: (productId, topN = 8) =>
        api.get(`/behavior/similar/${productId}`, { params: { top_n: topN } }),
    getFrequentlyBought: (productId, topN = 6) =>
        api.get(`/behavior/frequently-bought/${productId}`, { params: { top_n: topN } }),
    getTrending: (topN = 10) =>
        api.get('/behavior/trending', { params: { top_n: topN } }),
};

// Favorites APIs (supports authenticated users and guests via session_id)
export const favoritesAPI = {
    add: (productId) => api.post('/favorites/add', { product_id: productId }),
    remove: (productId) => api.delete(`/favorites/remove/${productId}`),
    list: () => api.get('/favorites/list'),
    check: (productIds) => api.post('/favorites/check', { product_ids: productIds }),
};

// Brands APIs
export const brandsAPI = {
    getAll: () => api.get('/brands'),
    getById: (id) => api.get(`/brands/${id}`),
    create: (data) => api.post('/brands', data),
    update: (id, data) => api.put(`/brands/${id}`, data),
    delete: (id) => api.delete(`/brands/${id}`),
};

// Categories APIs
export const categoriesAPI = {
    getAll: () => api.get('/categories'),
    getById: (id) => api.get(`/categories/${id}`),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
};

export default api;
