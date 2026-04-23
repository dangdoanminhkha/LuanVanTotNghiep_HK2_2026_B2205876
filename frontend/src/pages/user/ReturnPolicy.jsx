import React from 'react';
import { Link } from 'react-router-dom';

const ReturnPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <h1 className="text-3xl font-black mb-6">Chính sách đổi trả</h1>
      <p className="mb-4">Chúng tôi mong muốn bạn hài lòng với mọi sản phẩm đã mua tại ShoeStore. Nếu sản phẩm không như mô tả, bị lỗi kỹ thuật hoặc sai kích cỡ, bạn có thể yêu cầu đổi hoặc trả trong vòng 7 ngày kể từ ngày nhận hàng theo các điều kiện sau:</p>
      <ul className="list-disc pl-6 mb-4">
        <li>Sản phẩm còn nguyên tem, nhãn, chưa qua sử dụng và đầy đủ phụ kiện kèm theo.</li>
        <li>Giữ lại hoá đơn hoặc biên lai giao hàng làm chứng từ.</li>
        <li>Sản phẩm bị lỗi do nhà sản xuất hoặc không đúng mô tả sẽ được đổi mới hoặc hoàn tiền.</li>
        <li>Chi phí vận chuyển đổi/trả có thể do khách hàng chịu trừ khi lỗi thuộc về chúng tôi.</li>
      </ul>
      <p className="mb-4">Để yêu cầu đổi/trả, vui lòng liên hệ bộ phận chăm sóc khách hàng qua số điện thoại hoặc email trên website và cung cấp mã đơn hàng cùng mô tả vấn đề.</p>
      <p className="text-sm text-gray-600">Ghi chú: Chính sách này chỉ áp dụng cho hàng bán lẻ và không áp dụng cho các sản phẩm giảm giá đặc biệt nếu có quy định riêng.</p>
      <div className="mt-8">
        <Link to="/" className="text-indigo-600 hover:underline">Trở về trang chủ</Link>
      </div>
    </div>
  );
};

export default ReturnPolicy;
