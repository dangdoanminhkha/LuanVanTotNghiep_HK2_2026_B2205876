import React from 'react';
import { Link } from 'react-router-dom';

const WarrantyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <h1 className="text-3xl font-black mb-6">Chính sách bảo hành</h1>
      <p className="mb-4">ShoeStore cam kết cung cấp sản phẩm chất lượng. Các sản phẩm do chúng tôi phân phối được bảo hành trong thời gian quy định như sau:</p>
      <ul className="list-disc pl-6 mb-4">
        <li>Thời gian bảo hành tiêu chuẩn: 3 tháng kể từ ngày mua (trừ các sản phẩm có ghi chú khác).</li>
        <li>Bảo hành bao gồm các lỗi kỹ thuật do nhà sản xuất như đế bị bong, đứt đường may do lỗi cấu tạo.</li>
        <li>Không bảo hành trong các trường hợp hư hỏng do sử dụng sai cách, va đập mạnh, hoặc tác động vật lý.</li>
      </ul>
      <p className="mb-4">Khi cần bảo hành, vui lòng liên hệ với chúng tôi kèm theo hoá đơn mua hàng và mô tả lỗi. Chúng tôi sẽ hướng dẫn thủ tục gửi sản phẩm và thời gian xử lý.</p>
      <p className="text-sm text-gray-600">Lưu ý: Điều khoản bảo hành có thể thay đổi theo loại sản phẩm hoặc chương trình khuyến mãi; vui lòng tham khảo thông tin kèm theo từng sản phẩm.</p>
      <div className="mt-8">
        <Link to="/" className="text-indigo-600 hover:underline">Trở về trang chủ</Link>
      </div>
    </div>
  );
};

export default WarrantyPolicy;
