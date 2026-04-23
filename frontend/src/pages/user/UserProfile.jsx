import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import axios from 'axios';

const UserProfile = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/notifications/unread-count', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadCount(response.data.unread_count);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
  }, []);

  const menuItems = [
    {
      path: '/profile',
      label: 'Thông tin cá nhân',
      icon: '👤',
      description: 'Quản lý thông tin tài khoản và mật khẩu'
    },
    {
      path: '/account/orders',
      label: 'Đơn hàng',
      icon: '📦',
      description: 'Lịch sử và theo dõi đơn hàng của bạn'
    },
    {
      path: '/notifications',
      label: 'Thông báo',
      icon: '🔔',
      description: 'Các thông báo về đơn hàng và tài khoản',
      badge: unreadCount > 0 ? unreadCount : null
    },
    {
      path: '/my-reviews',
      label: 'Đánh giá của tôi',
      icon: '⭐',
      description: 'Quản lý và xem các đánh giá sản phẩm'
    },
    {
      path: '/account/addresses',
      label: 'Sổ địa chỉ',
      icon: '📍',
      description: 'Quản lý danh sách địa chỉ nhận hàng'
    }
  ];

  // Check if we're on a child route
  const isChildRoute = location.pathname !== '/account';

  if (isChildRoute) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Xin chào, {user?.email || 'Người dùng'}!
              </h1>
              <p className="text-gray-600">
                Quản lý thông tin tài khoản và theo dõi đơn hàng của bạn
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 p-6 group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl group-hover:bg-blue-50 transition-colors">
                    {item.icon}
                  </div>
                  {item.badge && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {item.badge > 99 ? '99+' : item.badge}
                    </div>
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {item.label}
                </h3>
                
                <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                  {item.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đơn hàng trong tháng</p>
                <p className="text-2xl font-bold text-blue-600">0</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sản phẩm yêu thích</p>
                <p className="text-2xl font-bold text-red-600">0</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">❤️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Điểm tích lũy</p>
                <p className="text-2xl font-bold text-green-600">0</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <h2 className="font-semibold text-gray-900 mb-4">Hoạt động gần đây</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                📦
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Chưa có hoạt động nào
                </p>
                <p className="text-xs text-gray-600">
                  Các hoạt động mua sắm sẽ hiển thị ở đây
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;