import { Link, useLocation } from 'react-router-dom';

const Breadcrumb = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    // Map pathnames to Vietnamese names
    const pathMap = {
        'collections': 'Danh mục',
        'products': 'Sản phẩm',
        'all': 'Tất cả sản phẩm',
        'nam': 'Nam',
        'nu': 'Nữ',
        'sandalnam': 'Sandal Nam',
        'sandalnu': 'Sandal Nữ',
        'thethaonam': 'Thể Thao Nam', 
        'thethaounu': 'Thể Thao Nữ',
        'giaytaynam': 'Giày Tây Nam',
        'caogotnu': 'Cao Gót Nữ',
        'moi': 'Sản phẩm mới',
        'ban-chay': 'Bán chạy',
        'cart': 'Giỏ hàng',
        'checkout': 'Thanh toán',
        'account': 'Tài khoản',
        'orders': 'Đơn hàng của tôi',
        'profile': 'Thông tin cá nhân',
        'notifications': 'Thông báo',
        'reviews': 'Đánh giá của tôi',
        'login': 'Đăng nhập',
        'register': 'Đăng ký',
        'admin': 'Quản trị',
        'dashboard': 'Bảng điều khiển',
        'revenue': 'Doanh thu',
        'shipments': 'Giao hàng',
        'statistics': 'Thống kê',
        'users': 'Người dùng'
    };

    if (location.pathname === '/' || location.pathname.startsWith('/admin')) {
        return null; // Don't show on home or admin (admin has its own nav)
    }

    return (
        <nav className="bg-gray-50 py-3 mb-6">
            <div className="container mx-auto px-4 flex items-center text-sm font-medium text-gray-500">
                <Link to="/" className="hover:text-indigo-600 transition-colors">
                    Trang chủ
                </Link>
                {pathnames.map((value, index) => {
                    const last = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const name = pathMap[value] || value;

                    return (
                        <div key={to} className="flex items-center">
                            <span className="mx-2 text-gray-300">/</span>
                            {last ? (
                                <span className="text-gray-900 font-bold">{name}</span>
                            ) : (
                                <Link to={to} className="hover:text-indigo-600 transition-colors">
                                    {name}
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>
        </nav>
    );
};

export default Breadcrumb;
