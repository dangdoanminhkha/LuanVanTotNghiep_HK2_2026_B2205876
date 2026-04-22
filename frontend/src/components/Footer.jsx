import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">ShoeStore</h3>
            <p className="text-gray-300 text-sm mb-4">
              Cửa hàng giày trực tuyến hàng đầu với các sản phẩm chất lượng cao và gợi ý thông minh.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">
                <i className="fab fa-facebook-f"></i> Facebook
              </a>
            </div>
          </div>

          {/* Information */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Thông tin</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/terms" target="_blank" className="hover:text-white">Điều khoản sử dụng</Link></li>
              <li><Link to="/privacy" target="_blank" className="hover:text-white">Chính sách bảo mật</Link></li>
              <li><Link to="/return-policy" className="hover:text-white">Chính sách đổi trả</Link></li>
              <li><Link to="/warranty-policy" className="hover:text-white">Chính sách bảo hành</Link></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Hỗ trợ khách hàng</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <strong>Gọi mua hàng (08:00 - 21:00)</strong>
                <br />
                <a href="tel:0825544830" className="hover:text-white text-lg font-bold">0825.544.830</a>
              </li>
              <li className="mt-3">
                <strong>Email</strong>
                <br />
                <a href="mailto:support@shoestore.local" className="hover:text-white">support@shoestore.local</a>
              </li>
            </ul>
          </div>

          {/* Newsletter removed per request */}
        </div>

        {/* Divider */}
        <hr className="border-gray-700 mb-8" />

        {/* Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Store Info */}
          <div>
            <h4 className="font-semibold mb-2">Hệ thống cửa hàng</h4>
            <p className="text-gray-300 text-sm">
              Khom 3, Phuong 1, Thi xa Nga Nam, tinh Soc Trang
            </p>
            <p className="text-gray-300 text-sm mt-2">
              Mở cửa: Thứ 2 - Chủ Nhật, 09:00 - 22:00
            </p>
          </div>

          {/* Categories - split into male/female columns */}
          <div>
            <h4 className="font-semibold mb-2">Danh mục</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="text-gray-400 mb-2 font-medium">Danh mục Nam</h5>
                <ul className="space-y-1 text-gray-300">
                  <li><Link to="/collections/giay-nam" className="hover:text-white">Giày nam</Link></li>
                  <li><Link to="/collections/giay-the-thao" className="hover:text-white">Giày thể thao</Link></li>
                  <li><Link to="/collections/giay-luoi" className="hover:text-white">Giày lười</Link></li>
                  <li><Link to="/collections/boots" className="hover:text-white">Boots</Link></li>
                  <li><Link to="/collections/dep-nam" className="hover:text-white">Dép nam</Link></li>
                </ul>
              </div>
              <div>
                <h5 className="text-gray-400 mb-2 font-medium">Danh mục Nữ</h5>
                <ul className="space-y-1 text-gray-300">
                  <li><Link to="/collections/giay-nu" className="hover:text-white">Giày nữ</Link></li>
                  <li><Link to="/collections/giay-cao-got" className="hover:text-white">Giày cao gót</Link></li>
                  <li><Link to="/collections/giay-bup-be" className="hover:text-white">Giày búp bê</Link></li>
                  <li><Link to="/collections/dep-sandal" className="hover:text-white">Dép và sandal</Link></li>
                  <li><Link to="/collections/tui-xach" className="hover:text-white">Túi xách & phụ kiện</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h4 className="font-semibold mb-2">Phương thức thanh toán</h4>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>✓ Chuyển khoản ngân hàng</li>
              <li>✓ Thanh toán online</li>
              <li>✓ Thanh toán khi nhận hàng (COD)</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <hr className="border-gray-700 mb-4" />
        <div className="text-center text-gray-400 text-sm">
          <p>&copy; 2026 ShoeStore. Bản quyền được bảo lưu. Đã đăng ký với Bộ Công Thương.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
