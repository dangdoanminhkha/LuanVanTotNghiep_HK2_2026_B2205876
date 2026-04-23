import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import axios from 'axios';

const UserAccountLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  useEffect(() => {
    // Fetch notification count on component mount
    fetchUnreadCount();  // eslint-disable-line
  }, [fetchUnreadCount]);

  const menuItems = [
    {
      path: '/account/profile',
      label: 'Thông tin tài khoản',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      path: '/account/orders',
      label: 'Quản lý đơn hàng',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      )
    },
    {
      path: '/account/notifications',
      label: 'Thông báo',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
      ),
      badge: unreadCount > 0 ? unreadCount : null
    },
    {
      path: '/account/addresses',
      label: 'Sổ địa chỉ',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      path: '/account/reviews',
      label: 'Đánh giá của tôi',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    }
  ];

  // Tạo avatar từ tên/email
  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto py-8 px-2 flex gap-2">
        {/* Cột trái: thông tin + menu (không còn sidebar cố định) */}
        <div className="w-64 flex-shrink-0 space-y-3">
          {/* User Profile Card */}
          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-base shadow-lg">
                {getInitials()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium text-gray-900 truncate">
                  Xin chào {user?.full_name?.split(' ').slice(-1)[0] || user?.email?.split('@')[0]}
                </h3>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="bg-white rounded-lg shadow-sm">
            <nav className="py-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-4 mx-0 my-1 text-base rounded-lg transition-all duration-200 relative ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700 shadow-sm border-l-4 border-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  >
            <span className={`mr-3 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {item.icon}
                    </span>
                    <span className="font-medium flex-1">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    {isActive && (
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-full"></div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Logout link đơn giản */}
          <button
            type="button"
            className="flex items-center text-sm text-gray-500 hover:text-red-600 transition-colors"
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
            Đăng xuất
          </button>
        </div>

        {/* Cột phải: nội dung trang, khoảng trống tối thiểu */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header nhỏ cho từng trang tài khoản */}
          <div className="bg-white rounded-lg shadow-sm px-4 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">
              {menuItems.find(item => item.path === location.pathname)?.label || 'Tài khoản của tôi'}
            </h1>
            <span className="text-sm text-gray-500">{user?.email}</span>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-5">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAccountLayout;