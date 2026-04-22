import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Star, 
  Users, 
  LineChart, 
  Ticket, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Warehouse
} from 'lucide-react'; // Import bộ icon

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    // Check on mount
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Thay thế thuộc tính 'short' bằng 'icon'
  const adminMenuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/products', label: 'Sản phẩm', icon: Package },
    { path: '/admin/inventory', label: 'Kho hàng', icon: Warehouse },
    { path: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart },
    { path: '/admin/reviews', label: 'Đánh giá', icon: Star },
    { path: '/admin/users', label: 'Người dùng', icon: Users },
    { path: '/admin/revenue', label: 'Doanh thu', icon: LineChart },
    { path: '/admin/vouchers', label: 'Voucher', icon: Ticket }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-gray-900 text-white shadow-xl transition-all duration-300 flex flex-col sticky top-0 h-screen`}>
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              ADMIN PRO
            </h1>
          )}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white ${sidebarCollapsed ? 'mx-auto' : ''}`}
            title={sidebarCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          {adminMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                title={sidebarCollapsed ? item.label : ''} // Chỉ hiện tooltip khi thu gọn
                className={`flex items-center rounded-xl transition-all duration-200 group
                  ${sidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3'}
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                  }`}
              >
                <Icon size={22} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-100'}`} />
                
                {!sidebarCollapsed && (
                  <span className="ml-3 text-sm font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm shadow-inner flex-shrink-0 uppercase border border-gray-700">
              {user?.username?.charAt(0) || 'A'}
            </div>
            
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-gray-100">{user?.username || 'Admin User'}</p>
                <p className="text-xs text-gray-500 font-medium truncate">Quản trị viên</p>
              </div>
            )}
          </div>

          <button
            onClick={() => logout()}
            title={sidebarCollapsed ? 'Đăng xuất' : ''}
            className={`w-full mt-4 flex items-center justify-center py-2.5 rounded-lg transition-colors font-medium
              ${sidebarCollapsed ? 'px-0 bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'px-4 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 gap-2'}`}
          >
            <LogOut size={18} className={sidebarCollapsed ? 'mx-auto' : ''} />
            {!sidebarCollapsed && <span className="text-sm">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;