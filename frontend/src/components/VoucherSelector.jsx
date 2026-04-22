import { useState, useEffect } from 'react';
import axios from 'axios';
import { AiOutlineCheckCircle, AiOutlineClose } from 'react-icons/ai';
import { MdEdit } from 'react-icons/md';

const VoucherSelector = ({ orderTotal = 0, selectedVoucher = null, onVoucherSelect = () => {} }) => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [applyingVoucherId, setApplyingVoucherId] = useState(null);

  useEffect(() => {
    fetchAvailableVouchers();
  }, [orderTotal]);

  const fetchAvailableVouchers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setVouchers([]);
        return;
      }

      const res = await axios.get('http://localhost:5000/api/vouchers/available', {
        params: { order_total: orderTotal },
        headers: { Authorization: `Bearer ${token}` }
      });

      setVouchers(res.data.vouchers || []);
    } catch (err) {
      console.error('Error fetching vouchers:', err);
      setError('Không thể tải danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVoucher = async (voucher) => {
    if (!voucher.user_can_use) {
      setError(voucher.reason);
      return;
    }

    try {
      setApplyingVoucherId(voucher.id);
      const token = localStorage.getItem('token');
      const validateRes = await axios.post(
        'http://localhost:5000/api/vouchers/validate',
        {
          voucher_code: voucher.code,
          order_total: orderTotal
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (validateRes.data.status === 'success') {
        onVoucherSelect({
          id: voucher.id,
          code: voucher.code,
          type: voucher.type,
          discount: voucher.discount,
          description: voucher.description
        });
        setError('');
        setShowModal(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể áp dụng voucher');
    } finally {
      setApplyingVoucherId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <p className="text-gray-600 text-sm">Đang tải mã giảm giá...</p>
      </div>
    );
  }

  return (
    <>
      {/* Nếu đã chọn voucher, hiển thị tên simplistically */}
      {selectedVoucher ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AiOutlineCheckCircle className="text-green-600" size={20} />
            <div>
              <p className="text-sm text-gray-600">Mã giảm giá</p>
              <p className="font-semibold text-gray-900">{selectedVoucher.code}</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition"
            title="Chọn mã giảm giá khác"
          >
            <MdEdit size={18} />
            <span className="text-sm font-semibold">Thay đổi</span>
          </button>
        </div>
      ) : (
        /* Nếu chưa chọn, hiển thị nút */
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 font-semibold hover:border-blue-400 hover:bg-blue-50 transition flex items-center justify-center gap-2"
        >
          <span>✓ Lựa chọn voucher (bạn có thể thay đổi)</span>
        </button>
      )}

      {/* Modal chọn voucher */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Chọn Mã Giảm Giá</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <AiOutlineClose size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Đang tải...</p>
                </div>
              ) : vouchers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">
                    {orderTotal === 0 
                      ? 'Thêm sản phẩm vào giỏ để xem mã giảm giá khả dụng'
                      : 'Không có mã giảm giá phù hợp cho đơn hàng này'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vouchers.map((voucher) => (
                    <div
                      key={voucher.id}
                      className={`border rounded-lg p-4 transition ${
                        voucher.user_can_use
                          ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900">{voucher.code}</span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                voucher.user_can_use
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {voucher.user_can_use ? '✓ Dùng được' : voucher.reason}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{voucher.description}</p>
                        </div>
                        {voucher.discount && (
                          <div className="text-right">
                            <p className="font-bold text-lg text-blue-600">
                              -{voucher.discount.toLocaleString('vi-VN')}
                            </p>
                            <p className="text-xs text-blue-600">VND</p>
                          </div>
                        )}
                      </div>

                      {/* Chi tiết nhỏ */}
                      <div className="grid grid-cols-3 gap-3 mb-3 py-2 border-y border-gray-100 text-xs">
                        <div>
                          <p className="text-gray-500">Loại</p>
                          <p className="font-semibold text-gray-900">
                            {voucher.type === 'discount' ? 'Giảm giá' : 'Miễn phí VC'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Hết hạn</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(voucher.expires_at).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Số lần dùng</p>
                          <p className="font-semibold text-gray-900">
                            {voucher.user_used_count ?? 0}/{voucher.max_usage_per_user ?? '∞'}
                          </p>
                        </div>
                      </div>

                      {/* Button */}
                      {voucher.user_can_use && (
                        <button
                          onClick={() => handleSelectVoucher(voucher)}
                          disabled={applyingVoucherId === voucher.id}
                          className="w-full py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {applyingVoucherId === voucher.id ? 'Đang xử lý...' : 'Dùng Ngay'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoucherSelector;
