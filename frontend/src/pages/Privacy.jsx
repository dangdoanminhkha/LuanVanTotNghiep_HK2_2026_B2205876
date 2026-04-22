import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-4">Chính sách bảo mật</h1>

      <p className="text-gray-700 mb-4">Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn. Chính sách này mô tả loại dữ liệu chúng tôi thu thập, cách sử dụng, lưu trữ và quyền của bạn liên quan đến dữ liệu đó.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Dữ liệu chúng tôi thu thập</h2>
      <ul className="list-disc list-inside text-gray-700 mb-4">
        <li>Thông tin tài khoản: email, họ tên, số điện thoại, địa chỉ giao hàng.</li>
        <li>Thông tin giao dịch: lịch sử đơn hàng, phương thức thanh toán (một phần thông tin thanh toán do cổng thanh toán xử lý).</li>
        <li>Dữ liệu thiết bị & hành vi: địa chỉ IP, cookie, dữ liệu truy cập để cải thiện dịch vụ và chống gian lận.</li>
        <li>Thông tin bạn cung cấp khi liên hệ với chúng tôi (hỗ trợ, khiếu nại).</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Mục đích sử dụng</h2>
      <p className="text-gray-700">Chúng tôi sử dụng dữ liệu để:</p>
      <ul className="list-disc list-inside text-gray-700 mb-4">
        <li>Xử lý đơn hàng, giao hàng và thanh toán.</li>
        <li>Cải thiện trải nghiệm người dùng và cá nhân hoá nội dung.</li>
        <li>Gửi thông báo liên quan đến đơn hàng, khuyến mãi hoặc thay đổi dịch vụ (khi bạn đồng ý nhận thông tin).</li>
        <li>Phòng chống gian lận và tuân thủ quy định pháp luật.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Chia sẻ dữ liệu</h2>
      <p className="text-gray-700">Chúng tôi có thể chia sẻ dữ liệu với bên thứ ba trong các trường hợp:</p>
      <ul className="list-disc list-inside text-gray-700 mb-4">
        <li>Đơn vị vận chuyển và đối tác thanh toán để hoàn tất đơn hàng.</li>
        <li>Nhà cung cấp dịch vụ phân tích (analytics) để cải thiện sản phẩm — dữ liệu được xử lý theo hợp đồng bảo mật.</li>
        <li>Khi được pháp luật yêu cầu hoặc để bảo vệ quyền lợi hợp pháp của chúng tôi.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Cookie và công nghệ tương tự</h2>
      <p className="text-gray-700">Chúng tôi sử dụng cookie để lưu trạng thái người dùng, phân tích lưu lượng và cá nhân hóa quảng cáo. Bạn có thể tắt cookie trong trình duyệt nhưng một số tính năng có thể không hoạt động.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Bảo mật dữ liệu</h2>
      <p className="text-gray-700">Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức phù hợp để bảo vệ dữ liệu. Tuy nhiên, không có hệ thống nào an toàn tuyệt đối; bạn cũng nên bảo mật thông tin đăng nhập và không chia sẻ mật khẩu với người khác.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Lưu trữ và xóa dữ liệu</h2>
      <p className="text-gray-700">Dữ liệu sẽ được lưu trữ trong khoảng thời gian cần thiết để hoàn thành mục đích thu thập và tuân thủ các nghĩa vụ pháp lý. Bạn có thể yêu cầu truy cập, điều chỉnh hoặc xóa dữ liệu của mình theo quy định pháp luật; vui lòng liên hệ chúng tôi để thực hiện.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Quyền của bạn</h2>
      <p className="text-gray-700">Bạn có quyền truy cập, sửa đổi, xóa, hoặc yêu cầu giới hạn xử lý dữ liệu. Để thực hiện quyền, vui lòng gửi yêu cầu đến email: <a href="mailto:support@shoestore.local" className="text-blue-600 hover:underline">support@shoestore.local</a>. Chúng tôi sẽ trả lời trong thời gian hợp lý theo quy định pháp luật.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">8. Trẻ em</h2>
      <p className="text-gray-700">Dịch vụ không dành cho trẻ em dưới 13 tuổi (hoặc theo quy định địa phương). Nếu phát hiện thông tin trẻ em, chúng tôi sẽ xóa hoặc vô hiệu hóa dữ liệu theo yêu cầu của cha mẹ/người giám hộ.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">9. Thay đổi chính sách</h2>
      <p className="text-gray-700">Chính sách có thể được cập nhật. Mọi thay đổi sẽ được thông báo trên website và có hiệu lực khi đăng tải. Chúng tôi khuyến nghị bạn kiểm tra chính sách định kỳ.</p>

      <div className="mt-8">
        <p className="text-gray-700">Bạn có câu hỏi về chính sách bảo mật? Liên hệ chúng tôi: <a href="mailto:support@shoestore.local" className="text-blue-600 hover:underline">support@shoestore.local</a></p>
        <Link to="/register" className="text-blue-600 hover:underline">Quay lại đăng ký</Link>
      </div>
    </div>
  );
}
