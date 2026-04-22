import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/useAuth';
import { normalizeImageUrl } from '../utils/imageUrl';
import AddressForm from '../components/AddressForm';
import VoucherSelector from '../components/VoucherSelector';
import Modal from '../components/Modal';
import { useModal } from '../hooks/useModal';
import api from '../services/api';

const FALLBACK_SVG_CART = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23E5E7EB" width="100" height="100"/><text x="50%" y="50%" font-family="Arial" font-size="8" fill="%239CA3AF" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>')}`;

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { modal, closeModal, showModal, showError } = useModal();
  
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [note, setNote] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const goToCartWithOutOfStock = (outOfStockItems = []) => {
    closeModal();
    navigate('/cart', {
      state: {
        fromCheckoutOutOfStock: true,
        outOfStockItems: Array.isArray(outOfStockItems) ? outOfStockItems : [],
      },
    });
  };

  // Redirect if cart is empty - but skip if we're processing payment
  useEffect(() => {
    if (!isProcessingPayment && (!cart || cart.length === 0)) {
      navigate('/cart');
    }
  }, [cart, navigate, isProcessingPayment]);

  // Fetch user addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) {
        setLoading(false);
        setShowAddressForm(true);
        return;
      }

      try {
        const response = await api.get('/addresses');
        const userAddresses = response.data;
        setAddresses(userAddresses);
        
        // Auto-select default address
        const defaultAddr = userAddresses.find(a => a.is_default);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (userAddresses.length > 0) {
          setSelectedAddressId(userAddresses[0].id);
        } else {
          setShowAddressForm(true);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
        setShowAddressForm(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [user]);

  // Fetch VNPay banks list
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        setLoadingBanks(true);
        const response = await api.get('/payment/vnpay/banks');
        setBanks(response.data || []);
        if (response.data && response.data.length > 0) {
          setSelectedBank(response.data[0].code);
        }
      } catch (error) {
        console.error('Error fetching banks:', error);
      } finally {
        setLoadingBanks(false);
      }
    };

    fetchBanks();
  }, []);

  const handleAddressSave = async (formData) => {
    try {
      setSubmitting(true);
      
      if (editingAddress) {
        // Update existing address
        const response = await api.put(`/addresses/${editingAddress.id}`, formData);
        const updatedAddress = response.data;
        setAddresses(prev => prev.map(a => 
          a.id === editingAddress.id ? updatedAddress : a
        ));
      } else {
        // Create new address
        const response = await api.post('/addresses', formData);
        const newAddress = response.data;
        setAddresses(prev => [...prev, newAddress]);
        setSelectedAddressId(newAddress.id);
      }
      
      setShowAddressForm(false);
      setEditingAddress(null);
    } catch (error) {
      console.error('Error saving address:', error);
      showError('Lỗi', 'Không thể lưu địa chỉ. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    
    try {
      await api.delete(`/addresses/${addressId}`);
      setAddresses(prev => prev.filter(a => a.id !== addressId));
      if (selectedAddressId === addressId) {
        setSelectedAddressId(addresses.find(a => a.id !== addressId)?.id || null);
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      showError('Lỗi', 'Không thể xóa địa chỉ');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId && !showAddressForm) {
      showError('Lỗi', 'Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    if (!selectedAddress && user) {
      showError('Lỗi', 'Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    // Kiểm tra số điện thoại (bắt buộc cho giao hàng)
    if (selectedAddress && (!selectedAddress.phone || selectedAddress.phone.trim() === '')) {
      showError('Lỗi', 'Địa chỉ giao hàng phải có số điện thoại để shipper liên hệ. Vui lòng cập nhật địa chỉ.');
      return;
    }

    // Kiểm tra user Google chưa có phone trong profile
    if (user && user.google_id && (!user.phone || user.phone.trim() === '')) {
      if (confirm('Bạn cần cập nhật số điện thoại trong tài khoản để đặt hàng. Chuyển đến trang cập nhật thông tin?')) {
        navigate('/account/profile');
      }
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        items: cart.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          price: item.discount ? item.price * (1 - item.discount / 100) : item.price
        })),
        address: selectedAddress ? {
          // Gửi user_address_id để backend gắn đúng FK vào orders.user_address_id
          id: selectedAddress.id,
          user_address_id: selectedAddress.id,
          full_name: selectedAddress.full_name,
          phone: selectedAddress.phone,
          province: selectedAddress.province_name,
          district: selectedAddress.district_name,
          ward: selectedAddress.ward_name,
          address_detail: selectedAddress.address_detail
        } : null,
        payment_method: paymentMethod,
        note: note,
        total: total,
        voucher: selectedVoucher ? {
          id: selectedVoucher.id,
          code: selectedVoucher.code,
          discount: discount
        } : null
      };

      // Tạo đơn hàng
      const response = await api.post('/orders', orderData);
      const orderId = response.data.orderId;

      // ================== [VNPAY_SANDBOX_FLOW_START] ==================
      // Backend sẽ trả paymentUrl:
      // - demoMode=true  -> URL trang demo nội bộ
      // - demoMode=false -> URL sandbox.vnpayment.vn
      if (paymentMethod === 'vnpay') {
        const paymentResponse = await api.post('/payment/vnpay/create', {
          orderId: orderId,
          amount: total,
          orderInfo: `Thanh toan don hang #${orderId}`,
          bankCode: selectedBank
        });

        const { success, paymentUrl } = paymentResponse.data || {};
        if (!success || !paymentUrl) {
          throw new Error('Không tạo được URL thanh toán VNPay');
        }

        setIsProcessingPayment(true);
        clearCart();
        window.location.href = paymentUrl;
        return;
      }
      // ================== [VNPAY_SANDBOX_FLOW_END] ==================

      // Clear cart and navigate to orders (for COD and other methods)
      setIsProcessingPayment(true);
      clearCart();
      navigate('/account/orders', { 
        state: { 
          success: true, 
          orderId: orderId 
        } 
      });
    } catch (error) {
      console.error('Error placing order:', error);
      const responseData = error.response?.data || {};
      const statusCode = error.response?.status;
      const fallbackMessage = statusCode === 409
        ? 'Sản phẩm bạn chọn vừa được khách khác giữ/mua. Vui lòng quay về giỏ hàng để loại bỏ sản phẩm hết hàng.'
        : 'Không thể đặt hàng. Vui lòng thử lại.';

      if (statusCode === 409 || responseData.code === 'OUT_OF_STOCK') {
        showModal({
          type: 'error',
          title: 'Sản phẩm hết hàng',
          message: responseData.message || responseData.error || fallbackMessage,
          confirmText: 'Trở về giỏ hàng',
          cancelText: 'Ở lại trang thanh toán',
          showCancel: true,
          onConfirm: () => goToCartWithOutOfStock(responseData.outOfStockItems),
        });
        return;
      }

      showError(
        'Lỗi',
        responseData.message || responseData.error || error.message || fallbackMessage
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0, minimumFractionDigits: 0 }) + 'đ';
  };

  // Xác định miền từ tên tỉnh/thành
  const getRegion = (provinceName) => {
    if (!provinceName) return 'south'; // Default: miền Nam

    const northProvinces = [
      'Hà Nội', 'Hải Phòng', 'Hà Giang', 'Cao Bằng', 'Bắc Kạn', 'Tuyên Quang',
      'Lạng Sơn', 'Bắc Giang', 'Vĩnh Phúc', 'Phú Thọ', 'Thái Nguyên', 
      'Yên Bái', 'Sơn La', 'Hòa Bình', 'Hải Dương', 'Hưng Yên', 'Nam Định',
      'Ninh Bình', 'Thái Bình', 'Quảng Ninh', 'Ba Vì'
    ];

    const centralProvinces = [
      'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị',
      'Thừa Thiên Huế', 'Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định',
      'Phú Yên', 'Khánh Hòa', 'Ninh Thuận', 'Bình Thuận', 'Lâm Đồng'
    ];

    if (northProvinces.some(p => provinceName.includes(p))) return 'north';
    if (centralProvinces.some(p => provinceName.includes(p))) return 'central';
    return 'south'; // Default: miền Nam
  };

  // Tính phí vận chuyển theo miền
  const getShippingFee = (region) => {
    switch (region) {
      case 'north': return 30000;   // Miền Bắc: 30.000đ
      case 'central': return 20000; // Miền Trung: 20.000đ
      case 'south': return 10000;   // Miền Nam: 10.000đ
      default: return 10000;
    }
  };

  // Lấy phí vận chuyển dựa vào địa chỉ được chọn
  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  const region = selectedAddress ? getRegion(selectedAddress.province_name) : 'south';
  const shippingFee = getShippingFee(region);
  
  let discount = 0;
  const subtotal = getCartTotal();
  
  // Tính discount từ voucher
  if (selectedVoucher) {
    if (selectedVoucher.type === 'discount') {
      discount = selectedVoucher.discount || 0;
    } else if (selectedVoucher.type === 'free_shipping') {
      discount = shippingFee;
    }
  }
  
  const total = subtotal + shippingFee - discount;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Thanh toán</h1>
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
          >
            Trở về giỏ hàng
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Address & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  Địa chỉ giao hàng
                </h2>
                {!showAddressForm && user && (
                  <button
                    onClick={() => {
                      setEditingAddress(null);
                      setShowAddressForm(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                  >
                    + Thêm địa chỉ mới
                  </button>
                )}
              </div>

              {!user && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-yellow-800 text-sm">
                    <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
                      Đăng nhập
                    </Link>
                    {' '}để lưu địa chỉ và theo dõi đơn hàng
                  </p>
                </div>
              )}

              {showAddressForm ? (
                <AddressForm
                  onSubmit={handleAddressSave}
                  onCancel={addresses.length > 0 ? () => {
                    setShowAddressForm(false);
                    setEditingAddress(null);
                  } : null}
                  initialData={editingAddress}
                  loading={submitting}
                />
              ) : (
                <div className="space-y-3">
                  {addresses.map(addr => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition ${
                        selectedAddressId === addr.id 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-1 w-4 h-4 text-indigo-600"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">
                              {addr.full_name}
                              {Boolean(addr.is_default) && (
                                <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                                  Mặc định
                                </span>
                              )}
                            </p>
                            <p className="text-gray-600 text-sm">{addr.phone}</p>
                            <p className="text-gray-600 text-sm mt-1">
                              {addr.address_detail}, {addr.ward_name}, {addr.district_name}, {addr.province_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAddress(addr);
                              setShowAddressForm(true);
                            }}
                            className="text-gray-500 hover:text-indigo-600 text-sm"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAddress(addr.id);
                            }}
                            className="text-gray-500 hover:text-red-600 text-sm"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                Phương thức thanh toán
              </h2>
              
              <div className="space-y-3">
                {/* COD */}
                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                    paymentMethod === 'cod' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💵</span>
                    <div>
                      <p className="font-medium text-gray-900">Thanh toán khi nhận hàng (COD)</p>
                      <p className="text-sm text-gray-500">Thanh toán bằng tiền mặt khi nhận hàng</p>
                    </div>
                  </div>
                </label>

                {/* VNPay */}
                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                    paymentMethod === 'vnpay' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="vnpay"
                    checked={paymentMethod === 'vnpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏦</span>
                    <div>
                      <p className="font-medium text-gray-900">Trả góp & Ví điện tử VNPay</p>
                      <p className="text-sm text-gray-500">Thanh toán an toàn qua VNPay</p>
                    </div>
                  </div>
                </label>

                {/* VNPay Bank Selection */}
                {paymentMethod === 'vnpay' && (
                  <div className="ml-11 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Chọn ngân hàng
                    </label>
                    {loadingBanks ? (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        <p className="text-gray-500 text-sm mt-2">Đang tải...</p>
                      </div>
                    ) : (
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        {banks.map(bank => (
                          <option key={bank.code} value={bank.code}>
                            {bank.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* Note */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                Ghi chú
              </h2>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ghi chú cho đơn hàng (không bắt buộc)"
                rows={3}
              />
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Đơn hàng của bạn</h2>
              
              <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
                {cart.map((item, index) => {
                  const salePrice = item.discount ? item.price * (1 - item.discount / 100) : item.price;
                  return (
                    <div key={index} className="flex gap-3">
                      <img
                        src={normalizeImageUrl(item.variant_image || item.image || '')}
                        alt={item.name}
                        className="w-16 h-16 object-contain rounded-lg flex-shrink-0"
                        onError={(e) => e.target.src = FALLBACK_SVG_CART}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {item.color} / Size {item.size} x{item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-indigo-600">
                          {formatPrice(salePrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Voucher Selector */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Mã Giảm Giá & Voucher
                </label>
                <VoucherSelector 
                  orderTotal={subtotal} 
                  selectedVoucher={selectedVoucher}
                  onVoucherSelect={setSelectedVoucher}
                />
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển ({region === 'north' ? 'Miền Bắc' : region === 'central' ? 'Miền Trung' : 'Miền Nam'})</span>
                  <span>{formatPrice(shippingFee)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Giảm giá ({selectedVoucher?.code})</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                  <span>Tổng cộng</span>
                  <span className="text-indigo-600">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={submitting || (!selectedAddressId && !showAddressForm)}
                className="w-full mt-6 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Bằng việc đặt hàng, bạn đồng ý với{' '}
                <Link to="/terms" className="text-indigo-600 hover:underline">Điều khoản dịch vụ</Link>
                {' '}và{' '}
                <Link to="/privacy" className="text-indigo-600 hover:underline">Chính sách bảo mật</Link>
              </p>
            </div>
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
    </div>
  );
};

export default Checkout;
