import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';

// ================== [DEMO_FALLBACK_PAGE_START] ==================
// Trang demo nội bộ để mô phỏng thanh toán khi sandbox VNPay gặp sự cố.
// Luồng này được gọi khi backend trả về paymentUrl dạng /payment/demo
// (PAYMENT_DEMO_MODE=true).
const PaymentDemo = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { modal, closeModal, showError, showSuccess } = useModal();
  const [processing, setProcessing] = useState(false);
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [userAccountNumber, setUserAccountNumber] = useState('');
  const [userAccountName, setUserAccountName] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const txnRef = searchParams.get('txnRef');

  // Fetch banks on mount
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await api.get('/payment/vnpay/banks');
        setBanks(response.data);
      } catch (error) {
        console.error('Error fetching banks:', error);
      }
    };
    fetchBanks();
  }, []);

  // Update date/time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0, minimumFractionDigits: 0 }) + 'đ';
  };

  const formatDateTime = (date) => {
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  };

  // Mock destination account data based on selected bank
  const getDestinationAccount = () => {
    const accountMap = {
      'NCB': { number: '001234567890', holder: 'SHOE STORE VIETNAM', type: 'Thẻ ATM nội địa' },
      'VIETCOMBANK': { number: '0123456789123', holder: 'SHOP GIAY VIET NAM', type: 'Tài khoản thường' },
      'VIETINBANK': { number: '123456789012', holder: 'SIEU THI GIAY', type: 'Tài khoản tiết kiệm' },
      'BIDV': { number: '12345678901234', holder: 'CONG TY GIAY TT', type: 'Tài khoản kinh doanh' },
      'TECHCOMBANK': { number: '9876543210123', holder: 'STORE SHOES VIETNAM', type: 'Tài khoản cua hang' },
      'MBBANK': { number: '0011223344556', holder: 'THUONG MAI GIAY', type: 'Tài khoản thanh toan' },
      'ACB': { number: '98765432109876', holder: 'RETAIL SHOES VN', type: 'Tài khoản ban hang' }
    };
    return accountMap[selectedBank] || { number: '1234567890123', holder: 'SHOE STORE DEMO', type: 'Tài khoản demo' };
  };

  const destAccount = getDestinationAccount();

  const handlePayment = async (success) => {
    // Validate user input when paying
    if (success) {
      if (!userAccountNumber.trim()) {
        showError('Thông báo', 'Vui lòng nhập số tài khoản của bạn');
        return;
      }
      if (!userAccountName.trim()) {
        showError('Thông báo', 'Vui lòng nhập tên chủ tài khoản');
        return;
      }
    }

    setProcessing(true);
    
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (success) {
        // JUST redirect. The success page is responsible for confirming the payment.
        navigate(`/payment/success?orderId=${orderId}&txnRef=${txnRef}`);
      } else {
        // For cancellation, we can optionally notify the backend, but for now, just redirect.
        navigate(`/account/orders?open=${orderId}&status=cancelled`);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi điều hướng';
      showError('Lỗi', errorMsg);
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">Chuyển tiền ngân hàng</h1>
          <p className="text-blue-100 text-sm mt-1">Môi trường thử nghiệm (Demo Mode)</p>
          <p className="text-blue-100 text-xs mt-2 font-mono">{formatDateTime(currentDateTime)}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-indigo-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Thông tin đơn hàng</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Mã đơn hàng:</span>
                <span className="font-bold text-gray-900">#{orderId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Mã giao dịch:</span>
                <span className="font-mono text-sm text-gray-700">{txnRef?.substring(0, 20)}...</span>
              </div>
              <div className="border-t border-indigo-200 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Số tiền cần chuyển:</span>
                  <span className="text-2xl font-bold text-indigo-600">{formatPrice(amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Selection */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3">1. Chọn ngân hàng của bạn</h3>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              disabled={processing}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 font-medium focus:outline-none focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">-- Chọn ngân hàng --</option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Account Info */}
          {selectedBank && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-orange-300">
              <h3 className="text-sm font-bold text-gray-700 mb-3">2. Tài khoản nhận tiền (Shop)</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Ngân hàng:</p>
                  <p className="text-lg font-bold text-gray-900">{banks.find(b => b.code === selectedBank)?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Loại tài khoản:</p>
                  <p className="text-base text-gray-800">{destAccount.type}</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600 font-medium">Số tài khoản:</p>
                  <p className="text-lg font-mono font-bold text-blue-600 break-all">{destAccount.number}</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600 font-medium">Chủ tài khoản:</p>
                  <p className="text-lg font-bold text-gray-900">{destAccount.holder}</p>
                </div>
                <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
                  Vui lòng chuyển tiền vào tài khoản trên với đúng số tiền: <span className="font-bold">{formatPrice(amount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* User Bank Account Input */}
          {selectedBank && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3">3. Nhập thông tin tài khoản của bạn</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600 font-medium block mb-1">Số tài khoản của bạn:</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 123456789012"
                    value={userAccountNumber}
                    onChange={(e) => setUserAccountNumber(e.target.value)}
                    disabled={processing}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:border-purple-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium block mb-1">Tên chủ tài khoản:</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: NGUYEN VAN A"
                    value={userAccountName}
                    onChange={(e) => setUserAccountName(e.target.value.toUpperCase())}
                    disabled={processing}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Demo Notice */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded p-4">
            <p className="text-yellow-800 font-medium text-sm">Lưu ý:</p>
            <ul className="text-yellow-700 text-xs mt-2 space-y-1 list-disc list-inside">
              <li>Đây là môi trường thử nghiệm (Sandbox), không có tiền thật được chuyển</li>
              <li>Thông tin ngân hàng và tài khoản ở trên chỉ là mẫu demo</li>
              <li>Nhấn nút "Thanh toán thành công" để hoàn tất giao dịch demo</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handlePayment(true)}
              disabled={processing || !selectedBank}
              className="w-full py-4 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  Thanh toán thành công
                </>
              )}
            </button>
            
            <button
              onClick={() => handlePayment(false)}
              disabled={processing}
              className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy thanh toán
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center border-t">
          <p className="text-xs text-gray-500 font-medium">
            Luận văn Demo - Shoe Store | Sandbox Test Environment
          </p>
        </div>
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

export default PaymentDemo;
// ================== [DEMO_FALLBACK_PAGE_END] ==================
