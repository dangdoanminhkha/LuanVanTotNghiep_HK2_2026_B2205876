import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const result = searchParams.get('result');
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('Đang xác thực...');

  useEffect(() => {
    // If frontend was redirected with a result flag, trust that and skip API call
    if (result) {
      if (result === 'success') {
        setStatus('success');
        setMessage('Xác thực thành công. Bạn có thể đăng nhập.');
      } else if (result === 'expired') {
        setStatus('error');
        setMessage('Token đã hết hạn hoặc không hợp lệ. Vui lòng gửi lại email xác thực.');
      } else {
        setStatus('error');
        setMessage('Lỗi khi xác thực.');
      }
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('Token không hợp lệ');
      return;
    }

    authAPI.verify(token)
      .then(res => {
        setStatus('success');
        setMessage(res.data.message || 'Xác thực thành công. Bạn có thể đăng nhập.');
      })
      .catch(err => {
        const e = err?.response?.data?.error || err.message || 'Lỗi khi xác thực';
        setStatus('error');
        setMessage(e);
      });
  }, [token]);

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
      {status === 'pending' && <p className="text-gray-700">{message}</p>}
      {status === 'success' && (
        <>
          <h2 className="text-2xl font-semibold mb-4">Xác thực thành công</h2>
          <p className="text-gray-700 mb-6">{message}</p>
          <Link to="/login" className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Đăng nhập</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <h2 className="text-2xl font-semibold mb-4 text-red-600">Xác thực thất bại</h2>
          <p className="text-gray-700 mb-6">{message}</p>
          <Link to="/" className="inline-block px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Về trang chính</Link>
        </>
      )}
    </div>
  );
}
