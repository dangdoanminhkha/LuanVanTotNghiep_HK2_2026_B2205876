import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { useAuth } from './context/useAuth';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Breadcrumb from './components/Breadcrumb';
import ScrollToTopButton from './components/ScrollToTopButton';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Products from './pages/Products';
import Collections from './pages/Collections';
import BrandCollection from './pages/BrandCollection';
import ProductDetail from './pages/ProductDetail';
import GenderHome from './pages/GenderHome';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentReturn from './pages/PaymentReturn';
import PaymentDemo from './pages/PaymentDemo';
import PaymentSuccess from './pages/PaymentSuccess';
import MyOrders from './pages/MyOrders';
import MyReviews from './pages/MyReviews';
import Reviews from './pages/Reviews';
import UserAccountLayout from './pages/UserAccountLayout';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Recommendations from './pages/Recommendations';
import Favorites from './pages/Favorites';
import ImageSearch from './pages/ImageSearch';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminProductDetail from './pages/admin/ProductDetail';
import VariantDetail from './pages/admin/VariantDetail';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminUserDetail from './pages/admin/UserDetail';
import AdminReviews from './pages/admin/AdminReviews';
import AdminRevenue from './pages/admin/Revenue';
import VoucherManager from './pages/admin/VoucherManager';
import InventoryManager from './pages/admin/InventoryManager';
import ShipperDelivery from './pages/shipper/Delivery';
import PrivateRoute from './components/PrivateRoute';
import CheckEmail from './pages/CheckEmail';
import Verify from './pages/Verify';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import ReturnPolicy from './pages/ReturnPolicy';
import WarrantyPolicy from './pages/WarrantyPolicy';

const AppRoutes = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  
  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  // Show breadcrumb on collections and product detail pages
  const showBreadcrumb = location.pathname.startsWith('/collections/') || 
    location.pathname.startsWith('/products/');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      {showBreadcrumb && <Breadcrumb />}
      {/* Admin pages have their own layout, so use full width. Customer pages use container */}
      <div className={isAdmin ? "flex-1" : "flex-1 container mx-auto px-4 py-8"}>
        <Routes>
          {/* If admin is logged in, redirect root and public paths to dashboard */}
          <Route path="/" element={isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Home />} />
          <Route path="/login" element={isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Login />} />
          <Route path="/forgot-password" element={isAdmin ? <Navigate to="/admin/dashboard" replace /> : <ForgotPassword />} />
          <Route path="/reset-password/:token" element={isAdmin ? <Navigate to="/admin/dashboard" replace /> : <ResetPassword />} />
          
          <Route path="/register" element={isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Register />} />
          <Route path="/check-email" element={<CheckEmail />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/return-policy" element={<ReturnPolicy />} />
          <Route path="/warranty-policy" element={<WarrantyPolicy />} />
          
          {/* Collections routes - browse/filter products */}
          <Route path="/collections" element={<Navigate to="/collections/all" replace />} />
          <Route path="/collections/brand/:brandSlug" element={isAdmin ? <Navigate to="/admin/dashboard" replace /> : <BrandCollection />} />
          <Route path="/collections/:collection" element={isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Collections />} />
          
          {/* Product detail - with slug */}
          <Route path="/products/:slug" element={isAdmin ? <Navigate to="/admin/dashboard" replace /> : <ProductDetail />} />
          
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
          {/* Primary VNPay sandbox return route */}
          <Route path="/payment/vnpay-return" element={<PaymentReturn />} />

          {/* Demo fallback routes: giữ lại để khôi phục nhanh khi sandbox lỗi */}
          <Route path="/payment/success" element={<PaymentSuccess />} />

          <Route path="/payment/demo" element={<PrivateRoute><PaymentDemo /></PrivateRoute>} />
          <Route path="/my-reviews" element={<PrivateRoute><MyReviews /></PrivateRoute>} />
          <Route path="/account" element={<PrivateRoute><UserAccountLayout /></PrivateRoute>}>
            <Route path="profile" element={<Profile />} />
            <Route path="orders" element={<MyOrders />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="reviews" element={<Reviews />} />
            <Route index element={<Profile />} />
          </Route>
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
          <Route path="/favorites" element={isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Favorites />} />
          <Route path="/recommendations" element={<PrivateRoute><Recommendations /></PrivateRoute>} />
          <Route path="/search-image" element={isAdmin ? <Navigate to="/admin/dashboard" replace /> : <ImageSearch />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<PrivateRoute requireAdmin><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/products" element={<PrivateRoute requireAdmin><AdminProducts /></PrivateRoute>} />
          <Route path="/admin/products/:slug" element={<PrivateRoute requireAdmin><AdminProductDetail /></PrivateRoute>} />
          <Route path="/admin/variant/:id" element={<PrivateRoute requireAdmin><VariantDetail /></PrivateRoute>} />
          <Route path="/admin/inventory" element={<PrivateRoute requireAdmin><InventoryManager /></PrivateRoute>} />
          <Route path="/admin/orders" element={<PrivateRoute requireAdmin><AdminOrders /></PrivateRoute>} />
          <Route path="/admin/reviews" element={<PrivateRoute requireAdmin><AdminReviews /></PrivateRoute>} />
          <Route path="/admin/revenue" element={<PrivateRoute requireAdmin><AdminRevenue /></PrivateRoute>} />
          <Route path="/admin/vouchers" element={<PrivateRoute requireAdmin><VoucherManager /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute requireAdmin><AdminUsers /></PrivateRoute>} />
          <Route path="/admin/users/:id" element={<PrivateRoute requireAdmin><AdminUserDetail /></PrivateRoute>} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          
          {/* Shipper Routes */}
          <Route path="/shipper/delivery" element={<PrivateRoute requireShipper><ShipperDelivery /></PrivateRoute>} />
          <Route path="/shipper" element={<Navigate to="/shipper/delivery" replace />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <ScrollToTopButton />
      {!location.pathname.startsWith('/admin') && !location.pathname.startsWith('/shipper') && <Footer />}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick pauseOnHover />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppRoutes />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}


export default App;
