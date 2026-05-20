import { Link, useLocation } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useState } from 'react';

export default function CheckEmail() {
  const { state } = useLocation();
  const email = state?.email || '';
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleResend = async () => {
    if (!email) {
      setMessage('Không có email để gửi lại. Hãy đăng ký lại.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await authAPI.resendVerification(email);
      setMessage('Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.');
    } catch (err) {
      const e = err?.response?.data?.error || err.message || 'Lỗi khi gửi lại email';
      setMessage(e);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
      <h2 className="text-2xl font-semibold mb-4">Hoàn tất đăng ký</h2>
      <p className="text-gray-700 mb-6">Cảm ơn bạn đã đăng ký. Chúng tôi đã gửi một email chứa đường dẫn xác thực đến địa chỉ bạn cung cấp.</p>
      <p className="text-gray-600 mb-6">Vui lòng mở email và nhấn vào đường link để kích hoạt tài khoản.</p>
      <p className="text-sm text-gray-500 mb-6">Nếu bạn không thấy email trong hộp thư chính, hãy kiểm tra thư mục Spam hoặc chờ vài phút.</p>
      <div className="flex items-center justify-center gap-3">
        <button onClick={handleResend} disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60">
          {loading ? 'Đang gửi...' : 'Gửi lại email xác thực'}
        </button>
        <Link to="/login" className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Quay lại đăng nhập</Link>
      </div>
      {message && <p className="mt-4 text-center text-sm text-gray-700">{message}</p>}
    </div>
  );
}
