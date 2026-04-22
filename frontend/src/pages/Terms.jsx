import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-4">Điều khoản sử dụng</h1>

      <p className="text-gray-700 mb-4">Chào mừng bạn đến với ShoeStore. Trước khi tạo tài khoản hoặc sử dụng dịch vụ, vui lòng đọc kỹ các điều khoản sử dụng dưới đây. Việc đăng ký hoặc sử dụng dịch vụ đồng nghĩa bạn đã đồng ý với các điều khoản này.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Định nghĩa</h2>
      <p className="text-gray-700">"Chúng tôi"/"Shoestore" chỉ trang web và dịch vụ do ShoeStore vận hành. "Người dùng" là cá nhân hoặc tổ chức sử dụng dịch vụ, tạo tài khoản hoặc mua hàng trên trang.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Tạo tài khoản</h2>
      <p className="text-gray-700">Khi tạo tài khoản, bạn cam kết cung cấp thông tin chính xác, hợp lệ và cập nhật. Bạn chịu trách nhiệm bảo mật thông tin đăng nhập; mọi hoạt động thực hiện bằng tài khoản của bạn được coi là do bạn thực hiện. Bạn không được sử dụng tài khoản cho hoạt động bất hợp pháp hoặc lừa đảo.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Đặt hàng và thanh toán</h2>
      <p className="text-gray-700">Đơn hàng được xử lý khi thanh toán thành công (nếu cần). Giá cả hiển thị có thể chưa bao gồm phí vận chuyển hoặc thuế; thông tin cuối cùng sẽ hiển thị tại bước thanh toán. Các phương thức thanh toán có thể gồm chuyển khoản ngân hàng, cổng thanh toán trực tuyến hoặc COD (nếu có).</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Giao hàng và đổi trả</h2>
      <p className="text-gray-700">Thời gian giao hàng phụ thuộc vào địa chỉ và tình trạng kho. Nếu sản phẩm bị lỗi, hư hỏng hoặc sai mô tả, bạn có thể yêu cầu đổi/trả trong thời hạn và theo điều kiện chúng tôi quy định. Chi tiết về phí đổi trả và thủ tục được nêu rõ trong trang chính sách đổi trả.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Bảo hành</h2>
      <p className="text-gray-700">Sản phẩm có thể đi kèm chính sách bảo hành từ nhà sản xuất hoặc ShoeStore. Thời hạn và điều kiện bảo hành sẽ được ghi trong thông tin sản phẩm hoặc hóa đơn.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Nội dung và quyền sở hữu trí tuệ</h2>
      <p className="text-gray-700">Mọi nội dung (hình ảnh, mô tả sản phẩm, nhãn hiệu, logo) thuộc sở hữu của ShoeStore hoặc đối tác. Người dùng không được sao chép, phân phối, tải lên lại hay sử dụng vì mục đích thương mại khi chưa có sự cho phép bằng văn bản.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Hành vi bị cấm</h2>
      <p className="text-gray-700">Cấm các hành vi lừa đảo, gian lận, đăng tải thông tin sai sự thật, hay xâm phạm quyền người khác. Chúng tôi có quyền xóa nội dung, tạm ngưng hoặc đóng tài khoản vi phạm.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">8. Trách nhiệm và giới hạn</h2>
      <p className="text-gray-700">Shoestore cố gắng đảm bảo thông tin chính xác nhưng không thể đảm bảo hoàn toàn về tính liên tục và an toàn tuyệt đối. Trong phạm vi pháp luật cho phép, chúng tôi không chịu trách nhiệm cho thiệt hại gián tiếp, mất lợi nhuận hay các tổn thất do sử dụng dịch vụ.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">9. Chấm dứt và hủy bỏ</h2>
      <p className="text-gray-700">Chúng tôi có quyền chấm dứt tài khoản hoặc ngừng cung cấp dịch vụ với người dùng có hành vi vi phạm điều khoản. Người dùng có thể yêu cầu hủy tài khoản theo quy trình trong chính sách bảo mật.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">10. Thay đổi điều khoản</h2>
      <p className="text-gray-700">Shoestore có thể cập nhật điều khoản này định kỳ. Mọi thay đổi sẽ được công bố trên website và có hiệu lực khi đăng tải. Việc bạn tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa bạn chấp nhận các điều khoản mới.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">11. Luật áp dụng</h2>
      <p className="text-gray-700">Các điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp sẽ được thương lượng hòa giải trước; nếu không giải quyết được sẽ giải quyết tại tòa án có thẩm quyền tại Việt Nam.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">12. Liên hệ</h2>
      <p className="text-gray-700">Mọi thắc mắc liên quan đến Điều khoản sử dụng, vui lòng liên hệ: <a href="mailto:support@shoestore.local" className="text-blue-600 hover:underline">support@shoestore.local</a>.</p>

      <div className="mt-8">
        <Link to="/register" className="text-blue-600 hover:underline">Quay lại đăng ký</Link>
      </div>
    </div>
  );
}
