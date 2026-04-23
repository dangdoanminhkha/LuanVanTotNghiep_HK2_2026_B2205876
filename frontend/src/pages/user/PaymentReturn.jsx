import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { modal, closeModal, showError, showSuccess } = useModal();
  const [status, setStatus] = useState('processing'); // processing, success, failed
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const handleRetryPayment = async () => {
    if (!paymentInfo?.orderId || retrying) return;
    
    console.log('🔄 Retrying with orderId:', paymentInfo.orderId, typeof paymentInfo.orderId);
    
    setRetrying(true);
    try {
      // Gọi API retry với orderId đã tồn tại
      const response = await api.post('/payment/vnpay/retry', {
        orderId: paymentInfo.orderId
      });
      
      if (response.data.success) {
        // Redirect đến VNPay với mã giao dịch mới
        window.location.href = response.data.paymentUrl;
      } else {
        throw new Error(response.data.message || 'Không thể tạo thanh toán mới');
      }
    } catch (err) {
      console.error('Retry payment error:', err);
      
      // Handle inventory insufficient case
      if (err.response?.status === 409 && err.response?.data?.type === 'inventory_insufficient') {
        const errorData = err.response.data;
        
        // Build detailed message
        let message = `${errorData.message}:\n\n`;
        message += errorData.unavailableItems.map(item => 
          `• ${item.product_name}: Đã đặt ${item.ordered}, chỉ còn ${item.available}`
        ).join('\n');
        message += `\n\n${errorData.restoredItems > 0 ? 
          `Đã khôi phục ${errorData.restoredItems} sản phẩm còn hàng vào giỏ hàng.` : 
          'Không có sản phẩm nào được khôi phục.'}`;
        
        showError('Lỗi', message);
        
        // Redirect to cart
        navigate('/cart');
        return;
      }
      
      showError('Lỗi', err.response?.data?.message || 'Không thể thử lại. Vui lòng liên hệ hỗ trợ.');
      setRetrying(false);
    }
  };

  // ================== [PAYMENT_RETURN_FLOW_START] ==================
  // - Nếu có cờ demo=true: hiển thị failed UI local (nhánh demo)
  // - Nếu có vnp_ResponseCode: gọi backend xác thực return từ VNPay sandbox
  useEffect(() => {
    const processPayment = async () => {
      // Lấy tất cả params từ URL
      const params = Object.fromEntries(searchParams.entries());
      
      // If demo flag present, show failed UI locally without calling backend
      if (params.demo === 'true' || params.demo === '1') {
        setStatus('failed');
        setPaymentInfo({
          orderId: params.orderId,
          amount: params.amount,
          txnRef: params.txnRef,
          method: params.method
        });
        return;
      }

      // Xác định loại payment gateway
      const isVnpay = params.vnp_ResponseCode !== undefined;

      try {
        let response;
        
        if (isVnpay) {
          // Gọi API xử lý VNPay return
          response = await api.get('/payment/vnpay/return', { params });
        } else {
          throw new Error('Không xác định được phương thức thanh toán');
        }

        if (response.data.success) {
          setStatus('success');
          setPaymentInfo(response.data);
        } else {
          setStatus('failed');
          setPaymentInfo(response.data);
        }
      } catch (err) {
        console.error('Payment processing error:', err);
        setStatus('failed');
        setError(err.response?.data?.message || err.message);
      }
    };

    processPayment();
  }, [searchParams]);
  // ================== [PAYMENT_RETURN_FLOW_END] ==================

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0, minimumFractionDigits: 0 }) + 'đ';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-6"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Đang xử lý thanh toán...</h2>
            <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h2>
            <p className="text-gray-600 mb-6">Đơn hàng của bạn đã được thanh toán</p>
            
            {paymentInfo && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mã đơn hàng:</span>
                    <span className="font-semibold">#{paymentInfo.orderId}</span>
                  </div>
                  {paymentInfo.amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Số tiền:</span>
                      <span className="font-semibold text-indigo-600">{formatPrice(paymentInfo.amount)}</span>
                    </div>
                  )}
                  {paymentInfo.bankCode && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ngân hàng:</span>
                      <span className="font-semibold">{paymentInfo.bankCode}</span>
                    </div>
                  )}
                  {paymentInfo.transactionNo && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mã giao dịch:</span>
                      <span className="font-semibold">{paymentInfo.transactionNo}</span>
                    </div>
                  )}
                  {paymentInfo.transId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mã giao dịch:</span>
                      <span className="font-semibold">{paymentInfo.transId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Link
                to="/account/orders"
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                Xem đơn hàng
              </Link>
              <Link
                to="/"
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                Về trang chủ
              </Link>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thất bại</h2>
            <p className="text-gray-600 mb-4">
              {error || paymentInfo?.message || 'Đã có lỗi xảy ra trong quá trình thanh toán'}
            </p>
            
            {paymentInfo?.orderId && (
              <p className="text-sm text-gray-500 mb-6">
                Mã đơn hàng: #{paymentInfo.orderId}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleRetryPayment}
                disabled={retrying || !paymentInfo?.orderId}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {retrying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang xử lý...
                  </>
                ) : (
                  'Thử lại'
                )}
              </button>
              <Link
                to="/cart"
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                Về giỏ hàng
              </Link>
            </div>
          </>
        )}
      </div>

      <Modal 
        isOpen={modal.isOpen} 
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
        onConfirm={modal.onConfirm || closeModal}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        showCancel={modal.showCancel}
      />
    </div>
  );
};

export default PaymentReturn;
