import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

// ================== [DEMO_FALLBACK_SUCCESS_START] ==================
// Trang success cho nhánh demo nội bộ.
// Khi quay lại dùng sandbox thật, trang chính là /payment/vnpay-return.
const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(true);
  const orderId = searchParams.get('orderId');
  const txnRef = searchParams.get('txnRef');
  const effectRan = useRef(false);

  useEffect(() => {
    const updateOrderPayment = async () => {
      if (!orderId) {
        setUpdating(false);
        return;
      }

      try {
        await api.post('/payment/demo/confirm', {
          orderId: String(orderId),
          txnRef: txnRef || `PAYMENT_SUCCESS_${Date.now()}`,
          success: true,
          method: 'demo',
        });
      } catch (error) {
        // Ignore and allow user to continue; order screen can retry payment if needed.
      } finally {
        setTimeout(() => setUpdating(false), 500);
      }
    };

    // This logic correctly handles React 18+ Strict Mode
    if (effectRan.current === false) {
      updateOrderPayment();
    }

    return () => {
      effectRan.current = true;
    };
    
  }, [orderId, txnRef]); // Dependencies remain to re-run if they change (though they shouldn't on this page)

  if (updating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-semibold text-gray-700">Đang xác nhận thanh toán...</p>
          <p className="text-gray-500">Vui lòng chờ trong giây lát.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h2>
        <p className="text-gray-600 mb-6">Cảm ơn bạn đã hoàn tất thanh toán.</p>

        {orderId && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-left">
            <div className="flex justify-between">
              <span className="text-gray-500">Mã đơn hàng:</span>
              <span className="font-semibold">#{orderId}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            Tiếp tục mua sắm
          </button>
          <button
            onClick={() => navigate('/account/orders')}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
          >
            Xem đơn hàng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
// ================== [DEMO_FALLBACK_SUCCESS_END] ==================
