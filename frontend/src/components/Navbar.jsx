import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

const Navbar = () => {
  const { isAuthenticated, user, logout, isAdmin, isShipper } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [brands, setBrands] = useState([]);
  const [categoriesMale, setCategoriesMale] = useState([]);
  const [categoriesFemale, setCategoriesFemale] = useState([]);
  const location = useLocation();
  const [isCollapsedMode, setIsCollapsedMode] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const currentSearch = new URLSearchParams(location.search).get('search') || '';
    setNavSearch(currentSearch);
  }, [location.pathname, location.search]);

  const handleNavSearch = (e) => {
    e.preventDefault();
    const q = navSearch.trim();
    if (q) {
      navigate(`/collections/all?search=${encodeURIComponent(q)}`);
    } else {
      navigate('/collections/all');
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandsRes, categoriesRes] = await Promise.all([
          axios.get(`${API_URL}/brands`),
          axios.get(`${API_URL}/categories`)
        ]);
        setBrands(brandsRes.data || []);
        const cats = categoriesRes.data || [];
        setCategoriesMale(cats.filter(c => c.gender_applicable === 'nam' || c.gender_applicable === 'unisex'));
        setCategoriesFemale(cats.filter(c => c.gender_applicable === 'nu' || c.gender_applicable === 'unisex'));
      } catch (error) {
        console.error('Error fetching nav data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const check = () => {
      const collapsed = window.innerWidth < 1024; // match Tailwind lg
      setIsCollapsedMode(collapsed);
      if (!collapsed) setShowMobileMenu(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
        const data = res.data || [];
        setNotifications(data);
        setUnreadCount((data.filter(n => !n.is_read)).length);
      } catch (err) {
        console.error('Error fetching notifications', err);
      }
    };
    // fetch now
    fetchNotifications();
  }, [isAuthenticated]);

  const refreshNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data || [];
      setNotifications(data);
      setUnreadCount((data.filter(n => !n.is_read)).length);
    } catch (err) {
      console.error('Error refreshing notifications', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error('Error marking read', err);
      // on error, refresh from server
      refreshNotifications();
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Close notification dropdown
    setShowNotifications(false);

    // Navigate based on notification type
    if (notification.type === 'order_status' && notification.order_id) {
      // For admin, navigate to admin orders page
      if (isAdmin) {
        navigate('/admin/orders', {
          state: {
            initialFilter: 'all',
            initialRange: 'all',
            highlightOrderId: notification.order_id
          }
        });
      } else {
        // For customer, navigate to account orders
        navigate('/account/orders', {
          state: {
            highlightOrderId: notification.order_id
          }
        });
      }
    } else if (notification.type === 'review_reply') {
      navigate('/account/reviews');
    } else {
      // Default: navigate to notifications page
      navigate('/notifications');
    }
  };

  const deleteNotification = async (id) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/notifications/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      refreshNotifications();
    } catch (err) {
      console.error('Error deleting notification', err);
    }
  };

  const markAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/notifications/mark-all-read`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error('Error marking all read', err);
      refreshNotifications();
    }
  };

  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const renderMobileMenu = (includeAdminQuick = false) => (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="text-2xl font-bold text-gray-900" onClick={() => setShowMobileMenu(false)}>ShoeStore</Link>
        <button onClick={() => setShowMobileMenu(false)} className="p-2 rounded-lg bg-gray-100">Đóng ✕</button>
      </div>

      <div className="space-y-4 text-gray-800">
        <form onSubmit={handleNavSearch} className="mb-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Tìm sản phẩm..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
              Tìm
            </button>
          </div>
        </form>

        {includeAdminQuick && (
          <div className="pb-4 border-b">
            <Link to="/admin/dashboard" className="block py-2 font-semibold text-gray-900" onClick={() => setShowMobileMenu(false)}>Admin Dashboard</Link>
            <Link to="/admin/products" className="block py-2 font-semibold text-gray-900" onClick={() => setShowMobileMenu(false)}>Quản lý sản phẩm</Link>
          </div>
        )}

        <div className="divide-y">
          <div className="py-3">
            <button className="w-full flex items-center justify-between text-left font-semibold text-lg" onClick={() => toggleSection('nam')}>
              <span>Nam</span>
              <span className="text-gray-400">{expandedSections['nam'] ? '▾' : '›'}</span>
            </button>
            {expandedSections['nam'] && (
              <div className="mt-2 pl-4">
                {categoriesMale.length > 0 ? categoriesMale.map(cat => (
                  <Link key={cat.id || cat.category_id} to={`/collections/${cat.slug}-nam`} className="block py-2 text-gray-900 hover:bg-white/60 rounded" onClick={() => setShowMobileMenu(false)}>{cat.name}</Link>
                )) : <div className="text-gray-500 py-2">Đang tải...</div>}
              </div>
            )}
          </div>

          <div className="py-3">
            <button className="w-full flex items-center justify-between text-left font-semibold text-lg" onClick={() => toggleSection('nu')}>
              <span>Nữ</span>
              <span className="text-gray-400">{expandedSections['nu'] ? '▾' : '›'}</span>
            </button>
            {expandedSections['nu'] && (
              <div className="mt-2 pl-4">
                {categoriesFemale.length > 0 ? categoriesFemale.map(cat => (
                  <Link key={cat.id || cat.category_id} to={`/collections/${cat.slug}-nu`} className="block py-2 text-gray-900 hover:bg-white/60 rounded" onClick={() => setShowMobileMenu(false)}>{cat.name}</Link>
                )) : <div className="text-gray-500 py-2">Đang tải...</div>}
              </div>
            )}
          </div>

          <div className="py-3">
            <button className="w-full flex items-center justify-between text-left font-semibold text-lg" onClick={() => toggleSection('brand')}>
              <span>Brand</span>
              <span className="text-gray-400">{expandedSections['brand'] ? '▾' : '›'}</span>
            </button>
            {expandedSections['brand'] && (
              <div className="mt-2 pl-4">
                <Link to="/collections/brand" className="block py-2 text-indigo-600 font-semibold" onClick={() => setShowMobileMenu(false)}>Tất cả thương hiệu</Link>
                {brands.map(brand => (
                  <Link key={brand.id || brand.brand_id} to={`/collections/brand/${brand.slug || brand.name.toLowerCase().replace(/\s+/g, '-')}`} className="block py-2 text-gray-900 hover:bg-white/60 rounded" onClick={() => setShowMobileMenu(false)}>{brand.name}</Link>
                ))}
              </div>
            )}
          </div>

          <div className="py-3">
            <Link to="/collections/moi" className="block py-2 text-gray-900 font-semibold" onClick={() => setShowMobileMenu(false)}>Mới</Link>
            <Link to="/collections/ban-chay" className="block py-2 text-gray-900 font-semibold" onClick={() => setShowMobileMenu(false)}>Bán chạy</Link>
            <Link to="/collections/sale" className="block py-2 text-gray-900 font-semibold" onClick={() => setShowMobileMenu(false)}>Sale %</Link>
            <Link to="/search-image" className="block py-2 text-indigo-600 font-semibold" onClick={() => setShowMobileMenu(false)}>📸 Tìm sản phẩm bằng ảnh</Link>
          </div>
        </div>

        <div className="pt-4">
          {isAuthenticated ? (
            <div className="space-y-2">
              <div className="font-semibold text-gray-900">{user?.username || 'User'}</div>
              <Link to="/account" className="block py-2 text-gray-900" onClick={() => setShowMobileMenu(false)}>Quản lý tài khoản</Link>
              {isAdmin && <Link to="/admin/dashboard" className="block py-2 text-gray-900" onClick={() => setShowMobileMenu(false)}>Quản trị</Link>}
              <button onClick={() => { logout(); setShowMobileMenu(false); }} className="w-full text-left py-2 text-white bg-red-600 rounded shadow">Đăng xuất</button>
            </div>
          ) : (
            <Link to="/login" className="block py-2 text-indigo-700 font-semibold" onClick={() => setShowMobileMenu(false)}>Đăng nhập</Link>
          )}
        </div>
      </div>
    </div>
  );

  const renderNotificationsPanel = () => (
    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="font-medium">Thông báo</div>
        <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">Đánh dấu tất cả</button>
      </div>
      <div className="max-h-64 overflow-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Không có thông báo</div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b cursor-pointer hover:bg-gray-100 ${n.is_read ? 'bg-white' : 'bg-indigo-50'}`} onClick={() => handleNotificationClick(n)}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{n.title || n.message}</div>
                <div className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleString('vi-VN')}</div>
              </div>
              <div className="flex items-start flex-col gap-2">
                <button onClick={(e) => { e.stopPropagation(); if (!n.is_read) markAsRead(n.id); }} className="text-xs text-indigo-600 hover:text-indigo-700">Đã đọc</button>
                <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} className="text-xs text-red-500 hover:text-red-700">Xoá</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderAdminMobileMenu = () => (
    <div className="fixed inset-0 z-50 bg-gray-900 text-white overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Link to="/admin/dashboard" className="text-2xl font-bold" onClick={() => setShowMobileMenu(false)}>Admin</Link>
        <button onClick={() => setShowMobileMenu(false)} className="p-2 rounded-lg bg-gray-800">Đóng ✕</button>
      </div>

      <div className="space-y-4 text-gray-100">
        <Link to="/admin/dashboard" className="block py-3 px-2 text-lg font-semibold hover:bg-white/5 rounded" onClick={() => setShowMobileMenu(false)}>Dashboard</Link>
        <Link to="/admin/products" className="block py-3 px-2 text-lg font-semibold hover:bg-white/5 rounded" onClick={() => setShowMobileMenu(false)}>Quản lý sản phẩm</Link>
        <Link to="/admin/orders" className="block py-3 px-2 text-lg font-semibold hover:bg-white/5 rounded" onClick={() => setShowMobileMenu(false)}>Quản lý đơn hàng</Link>
        <Link to="/admin/reviews" className="block py-3 px-2 text-lg font-semibold hover:bg-white/5 rounded" onClick={() => setShowMobileMenu(false)}>Quản lý đánh giá</Link>
        <Link to="/admin/revenue" className="block py-3 px-2 text-lg font-semibold hover:bg-white/5 rounded" onClick={() => setShowMobileMenu(false)}>Doanh thu</Link>
        <Link to="/admin/shipment" className="block py-3 px-2 text-lg font-semibold hover:bg-white/5 rounded" onClick={() => setShowMobileMenu(false)}>Quản lý giao hàng</Link>
        <Link to="/admin/users" className="block py-3 px-2 text-lg font-semibold hover:bg-white/5 rounded" onClick={() => setShowMobileMenu(false)}>Người dùng</Link>

        <div className="pt-6">
          <button onClick={() => { logout(); setShowMobileMenu(false); }} className="w-full text-left py-3 bg-red-600 text-white rounded">Đăng xuất</button>
        </div>
      </div>
    </div>
  );

  // Shipper Navbar
  if (isShipper && location.pathname.startsWith('/shipper')) {
    return (
      <nav className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <Link to="/shipper/delivery" className="text-2xl font-bold text-white flex-shrink-0">🚚 Shipper Panel</Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-blue-100">{user?.email}</span>
              <button onClick={logout} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition">Đăng xuất</button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Admin Navbar - Không hiển thị, sidebar được xử lý ở AdminLayout
  if (isAdmin && location.pathname.startsWith('/admin')) {
    return null;
  }

  // Customer collapsed/mobile navbar
  if (isCollapsedMode) {
    return (
      <nav className="bg-white shadow sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <Link to="/" className="text-2xl font-bold text-gray-900 flex-shrink-0">ShoeStore</Link>

            <div className="flex items-center gap-4">
              <div className="relative" ref={notificationRef}>
                <button aria-label="Thông báo" onClick={() => setShowNotifications(prev => !prev)} className="relative text-xl text-gray-700 hover:text-indigo-600">
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </button>
                {showNotifications && renderNotificationsPanel()}
              </div>

              <Link to="/favorites" className="text-gray-700 text-xl hover:text-red-500 transition-colors" title="Sản phẩm yêu thích">❤️</Link>

              <Link to="/cart" className="text-gray-700 text-xl relative" title="Giỏ hàng">🛒{getCartCount() > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{getCartCount() > 99 ? '99+' : getCartCount()}</span>
              )}</Link>

              <button aria-label="Mở menu" onClick={() => setShowMobileMenu(true)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 12H20" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 18H20" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>

        {showMobileMenu && renderMobileMenu(false)}
      </nav>
    );
  }

  // Desktop customer navbar
  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold text-gray-900 flex-shrink-0">ShoeStore</Link>

          <div className="hidden lg:flex items-center space-x-10 flex-1 justify-center text-[13px] font-bold uppercase tracking-wider">
            <div className="relative group py-4">
              <Link to="/collections/nam" className="text-gray-900 hover:text-indigo-600 transition-colors flex items-center gap-1">Nam <span className="text-[10px] opacity-50 transform transition-transform duration-300 group-hover:rotate-90">›</span></Link>
              <div className="absolute top-full left-0 w-56 min-w-[14rem] bg-white border border-gray-100 shadow-2xl rounded-b-xl py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-[100]">
                {categoriesMale.length > 0 ? categoriesMale.map(cat => (
                  <Link key={cat.id || cat.category_id} to={`/collections/${cat.slug}-nam`} className="block px-6 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors normal-case">{cat.name}</Link>
                )) : <div className="px-6 py-2.5 text-gray-500 text-sm">Đang tải danh mục...</div>}
              </div>
            </div>

            <div className="relative group py-4">
              <Link to="/collections/nu" className="text-gray-900 hover:text-indigo-600 transition-colors flex items-center gap-1">Nữ <span className="text-[10px] opacity-50 transform transition-transform duration-300 group-hover:rotate-90">›</span></Link>
              <div className="absolute top-full left-0 w-56 min-w-[14rem] bg-white border border-gray-100 shadow-2xl rounded-b-xl py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-[100]">
                {categoriesFemale.length > 0 ? categoriesFemale.map(cat => (
                  <Link key={cat.id || cat.category_id} to={`/collections/${cat.slug}-nu`} className="block px-6 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors normal-case">{cat.name}</Link>
                )) : <div className="px-6 py-2.5 text-gray-500 text-sm">Đang tải danh mục...</div>}
              </div>
            </div>

            <div className="relative group py-4">
              <Link to="/collections/brand" className="text-gray-900 hover:text-indigo-600 transition-colors flex items-center gap-1">Brand <span className="text-[10px] opacity-50 transform transition-transform duration-300 group-hover:rotate-90">›</span></Link>
              <div className="absolute top-full left-0 w-56 min-w-[14rem] bg-white border border-gray-100 shadow-2xl rounded-b-xl py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-[100]">
                <Link to="/collections/brand" className="block px-6 py-2.5 text-indigo-600 hover:bg-gray-50 font-semibold transition-colors normal-case border-b border-gray-100">Tất cả thương hiệu</Link>
                {brands.map(brand => (
                  <Link key={brand.id || brand.brand_id} to={`/collections/brand/${brand.slug || brand.name.toLowerCase().replace(/\s+/g, '-')}`} className="block px-6 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors normal-case">{brand.name}</Link>
                ))}
              </div>
            </div>

            <Link to="/collections/moi" className="text-gray-900 hover:text-indigo-600 transition-colors py-4">Mới</Link>
            <Link to="/collections/ban-chay" className="text-gray-900 hover:text-indigo-600 transition-colors py-4">Bán chạy</Link>
            <Link to="/collections/sale" className="text-gray-900 hover:text-indigo-600 transition-colors py-4">Sale %</Link>
            <Link to="/search-image" className="text-gray-900 hover:text-indigo-600 transition-colors py-4 flex items-center gap-1">📸 Tìm ảnh</Link>
          </div>

            <div className="flex items-center space-x-6 flex-shrink-0">
                <form onSubmit={handleNavSearch} className="hidden xl:flex items-center gap-2">
                  <input
                    type="text"
                    value={navSearch}
                    onChange={(e) => setNavSearch(e.target.value)}
                    placeholder="Tìm sản phẩm..."
                    className="w-52 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Tìm
                  </button>
                </form>

              <div className="relative" ref={notificationRef}>
                <button aria-label="Thông báo" onClick={() => setShowNotifications(prev => !prev)} className="relative text-xl text-gray-700 hover:text-indigo-600">
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </button>
                {showNotifications && renderNotificationsPanel()}
              </div>

              <Link to="/cart" className="text-gray-700 text-xl relative" title="Giỏ hàng">
                🛒{getCartCount() > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{getCartCount() > 99 ? '99+' : getCartCount()}</span>
                )}
              </Link>

            <button aria-label="Mở menu" onClick={() => setShowMobileMenu(true)} className="lg:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 12H20" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 18H20" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>

            <Link to="/favorites" className="text-gray-700 text-xl hover:text-red-500 transition-colors" title="Sản phẩm yêu thích">❤️</Link>

            <div className="relative" ref={userMenuRef}>
              {isAuthenticated ? (
                <>
                  <button onClick={() => setShowUserMenu(!showUserMenu)} className="text-gray-700 hover:text-blue-600 text-xl" title="Tài khoản">👤</button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-semibold">{user?.username || 'User'}</p>
                      </div>
                      <Link to="/account" className="block px-4 py-2 text-sm hover:bg-gray-50">Quản lý tài khoản</Link>
                      <button onClick={() => { logout(); setShowUserMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Đăng xuất</button>
                    </div>
                  )}
                </>
              ) : (
                <Link to="/login" className="text-indigo-600 font-semibold">Đăng nhập</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
