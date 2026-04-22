import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import OrderTimeline from '../components/OrderTimeline';
import Modal from '../components/Modal';
import { useModal } from '../hooks/useModal';
import { normalizeImageUrl } from '../utils/imageUrl';

const MyOrders = () => {
  const { modal, closeModal, showError, showSuccess, showWarning } = useModal();
  const { addToCart, updateCartItem } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchParams] = useSearchParams();
  const [activeGroup, setActiveGroup] = useState('order');
  const [activeFilter, setActiveFilter] = useState('all');
  const [retryingOrder, setRetryingOrder] = useState(null);
  const [repurchasingOrder, setRepurchasingOrder] = useState(null);
  const [returnModal, setReturnModal] = useState(null); // orderId when open
  const [returnReason, setReturnReason] = useState('');
  const [returnFiles, setReturnFiles] = useState([]);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnError, setReturnError] = useState('');
  const location = useLocation();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const open = searchParams.get('open');
    if (open) setSelectedOrder(Number(open));
  }, [searchParams]);

  // Auto-expand order if coming from notification
  useEffect(() => {
    if (location.state?.highlightOrderId && orders.length > 0) {
      setSelectedOrder(location.state.highlightOrderId);
    }
  }, [orders, location.state?.highlightOrderId]);

  const ORDER_STATUSES = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];
  const RETURN_STATUSES = ['return_requested', 'return_rejected', 'return_approved', 'return_received', 'refund'];

  const filterOrders = useCallback(() => {
    let filtered;
    if (activeFilter === 'all') {
      filtered = orders.filter(order =>
        activeGroup === 'order'
          ? ORDER_STATUSES.includes(order.status)
          : RETURN_STATUSES.includes(order.status)
      );
    } else {
      filtered = orders.filter(order => order.status === activeFilter);
    }
    
    // Sort by created_at descending (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || a.updated_at);
      const dateB = new Date(b.created_at || b.updated_at);
      return dateB - dateA;
    });
    
    setFilteredOrders(filtered);
  }, [orders, activeFilter, activeGroup]);

  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.data);
    } catch (err) {
      setError('Không thể tải danh sách đơn hàng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này? Không thể hoàn tác.')) {
      return;
    }

    try {
      await api.put(`/orders/${orderId}/cancel`);
      showSuccess('Thành công', 'Hủy đơn hàng thành công');
      fetchOrders(); // Refresh danh sách
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể hủy đơn hàng';
      showError('Lỗi', message);
      console.error(err);
    }
  };

  const handleRetryPayment = async (orderId) => {
    if (retryingOrder === orderId) return;
    
    setRetryingOrder(orderId);
    try {
      const response = await api.post('/payment/vnpay/retry', { orderId });
      
      if (response.data.success) {
        window.location.href = response.data.paymentUrl;
      } else {
        throw new Error(response.data.message || 'Không thể tạo thanh toán mới');
      }
    } catch (err) {
      // Handle inventory insufficient case
      if (err.response?.status === 409 && err.response?.data?.type === 'inventory_insufficient') {
        const errorData = err.response.data;
        
        let message = `${errorData.message}:\n\n`;
        message += errorData.unavailableItems.map(item => 
          `• ${item.product_name}: Đã đặt ${item.ordered}, chỉ còn ${item.available}`
        ).join('\n');
        message += `\n\n${errorData.restoredItems > 0 ? 
          `Đã khôi phục ${errorData.restoredItems} sản phẩm còn hàng vào giỏ hàng.` : 
          'Không có sản phẩm nào được khôi phục.'}`;
        
        showWarning('Thông báo', message);
        fetchOrders();
        return;
      }
      
      showError('Lỗi', err.response?.data?.message || 'Không thể thử lại. Vui lòng liên hệ hỗ trợ.');
      setRetryingOrder(null);
    }
  };

  const handleRepurchase = async (order) => {
    if (repurchasingOrder === order.id) return;
    
    setRepurchasingOrder(order.id);
    try {
      let addedCount = 0;
      
      // Add ALL items from the order to cart, even if out of stock
      for (const item of order.items) {
        try {
          // Fetch current variants from database
          const variantsResponse = await api.get(`/products/product/${item.product_id}`);
          const variants = variantsResponse.data || [];
          
          // Find matching variant by color and size
          const matchingVariant = variants.find(v => 
            v.color === item.color && v.size === item.size
          );
          
          const availableQty = matchingVariant 
            ? (matchingVariant.quantity - matchingVariant.sold)
            : 0;
          
          // ALWAYS add to cart, but mark as outOfStock if insufficient or not available
          const isOutOfStock = !matchingVariant || availableQty <= 0;
          const quantityToAdd = isOutOfStock ? 1 : Math.min(item.quantity, availableQty);
          
          addToCart({
            product_id: item.product_id,
            variant_id: matchingVariant?.id || null,
            name: item.name,
            price: item.price,
            color: item.color,
            size: item.size,
            salePrice: item.salePrice,
            image: matchingVariant?.image || item.image,
            quantity: quantityToAdd,
            outOfStock: isOutOfStock, // Mark as out of stock so user knows
            brand: item.brand,
            slug: item.slug || String(item.product_id)
          });
          addedCount++;
        } catch (err) {
          console.error(`Lỗi kiểm tra hàng cho sản phẩm ${item.product_id}:`, err);
          // Even if error, still add with minimal qty so user can adjust
          addToCart({
            product_id: item.product_id,
            variant_id: null,
            name: item.name,
            price: item.price,
            color: item.color,
            size: item.size,
            salePrice: item.salePrice,
            image: item.image,
            quantity: 1,
            outOfStock: true,
            brand: item.brand,
            slug: item.slug || String(item.product_id)
          });
          addedCount++;
        }
      }
      
      // Show success and navigate to cart
      showSuccess('Thành công', `Tất cả ${addedCount} sản phẩm từ đơn hàng đã được thêm vào giỏ.\n\nVui lòng kiểm tra lại số lượng, chọn lại color/size nếu cần, và xóa các sản phẩm hết hàng trước khi thanh toán.`);
      navigate('/cart');
    } catch (err) {
      showError('Lỗi', 'Không thể mua lại đơn hàng. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setRepurchasingOrder(null);
    }
  };

  const canCancelOrder = (status) => {
    return ['pending', 'confirmed'].includes(status);
  };

  // Retry payment eligible: VNPay, order still pending, payment not completed, and within hold window (15 minutes)
  const canRetryPayment = (order) => {
    if (!order) return false;
    if (order.payment_method !== 'vnpay') return false;
    // allow retry if payment not paid yet (pending or failed)
    if (order.payment_status === 'paid') return false;
    if (order.status !== 'pending') return false;

    // Prefer hold_expires_at if present
    if (order.hold_expires_at) {
      return new Date(order.hold_expires_at).getTime() > Date.now();
    }

    // Fallback: created_at + 15 minutes
    const created = new Date(order.created_at).getTime();
    return (created + (15 * 60 * 1000)) > Date.now();
  };

  // Chỉ cho đơn đã giao (delivered) và thanh toán (paid) trong vòng 7 ngày
  const canRequestReturn = (order) => {
    if (order.status !== 'delivered') return false;
    if (order.payment_status !== 'paid') return false;
    const deliveredAt = order.delivered_at || order.created_at;
    const deliveredTime = new Date(deliveredAt).getTime();
    if (Number.isNaN(deliveredTime)) return false;
    const days = (Date.now() - deliveredTime) / (1000 * 60 * 60 * 24);
    return days <= 7;
  };

  const handleReturnRequest = async () => {
    if (!returnReason) { setReturnError('Vui lòng chọn lý do'); return; }
    setReturnSubmitting(true);
    setReturnError('');
    try {
      const formData = new FormData();
      formData.append('reason', returnReason);
      returnFiles.forEach(f => formData.append('evidence', f));
      await api.post(`/orders/${returnModal}/return-request`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showSuccess('Thành công', 'Yêu cầu hoàn trả đã được gửi thành công!');
      setReturnModal(null);
      setReturnReason('');
      setReturnFiles([]);
      fetchOrders();
    } catch (err) {
      setReturnError(err.response?.data?.error || 'Không thể gửi yêu cầu');
    } finally {
      setReturnSubmitting(false);
    }
  };

  const orderStatusTabs = [
    { key: 'all', label: 'Tất cả', statuses: ORDER_STATUSES },
    { key: 'pending', label: 'Chờ xác nhận', statuses: ['pending'] },
    { key: 'confirmed', label: 'Đã xác nhận', statuses: ['confirmed'] },
    { key: 'shipping', label: 'Đang giao', statuses: ['shipping'] },
    { key: 'delivered', label: 'Đã giao', statuses: ['delivered'] },
    { key: 'cancelled', label: 'Đã hủy', statuses: ['cancelled'] },
  ];

  const returnStatusTabs = [
    { key: 'all', label: 'Tất cả', statuses: RETURN_STATUSES },
    { key: 'return_requested', label: 'Yêu cầu hoàn', statuses: ['return_requested'] },
    { key: 'return_rejected', label: 'Từ chối hoàn', statuses: ['return_rejected'] },
    { key: 'return_approved', label: 'Chấp nhận hoàn', statuses: ['return_approved'] },
    { key: 'return_received', label: 'Đã hoàn hàng', statuses: ['return_received'] },
    { key: 'refund', label: 'Đã hoàn tiền', statuses: ['refund'] },
  ];

  const currentStatusTabs = activeGroup === 'order' ? orderStatusTabs : returnStatusTabs;

  const getTabCount = (tab) => {
    return orders.filter(o => tab.statuses.includes(o.status)).length;
  };

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0, minimumFractionDigits: 0 }) + 'đ';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { text: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
      shipping: { text: 'Đang giao', color: 'bg-purple-100 text-purple-800' },
      delivered: { text: 'Đã giao', color: 'bg-green-100 text-green-800' },
      cancelled: { text: 'Đã hủy', color: 'bg-red-100 text-red-800' },
      return_requested: { text: '⏳ Chờ duyệt hoàn', color: 'bg-orange-100 text-orange-800' },
      return_approved: { text: '✅ Hoàn được duyệt', color: 'bg-blue-100 text-blue-800' },
      return_rejected: { text: '❌ Hoàn bị từ chối', color: 'bg-red-100 text-red-800' },
      return_received: { text: '✅ Đã nhận hàng hoàn', color: 'bg-green-100 text-green-800' },
    };
    const s = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${s.color}`}>
        {s.text}
      </span>
    );
  };

  const getPaymentMethodText = (method) => {
    const methods = {
      cod: '💵 Thanh toán khi nhận hàng (COD)',
      bank: '🏦 Chuyển khoản ngân hàng',
      vnpay: '💳 VNPay'
    };
    return methods[method] || method;
  };

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      pending: { text: 'Chưa thanh toán', color: 'bg-orange-100 text-orange-800' },
      paid: { text: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
      failed: { text: 'Thanh toán thất bại', color: 'bg-red-100 text-red-800' }
    };
    const s = statusMap[status] || { text: status || 'Chưa thanh toán', color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${s.color}`}>
        {s.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Đơn hàng của tôi</h1>
        <p className="text-gray-600 text-sm">Theo dõi tình trạng và lịch sử đơn hàng</p>
      </div>

      {/* Group Tabs */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <button
            onClick={() => {
              setActiveGroup('order');
              setActiveFilter('all');
            }}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeGroup === 'order'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-800 bg-white'
            }`}
          >
            Quản lý đơn hàng
          </button>
          <button
            onClick={() => {
              setActiveGroup('return');
              setActiveFilter('all');
            }}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeGroup === 'return'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-800 bg-white'
            }`}
          >
            Quản lý hoàn hàng
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex flex-wrap border-b border-gray-200">
          {currentStatusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-4 py-3 text-sm font-medium text-center border-b-2 transition-colors flex-1 min-w-[140px] ${
                activeFilter === tab.key
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {getTabCount(tab) > 0 && (
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeFilter === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {getTabCount(tab)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            {orders.length === 0 ? 'Bạn chưa có đơn hàng nào' : `Không có đơn hàng ${currentStatusTabs.find(t => t.key === activeFilter)?.label.toLowerCase()}`}
          </h2>
          <p className="text-gray-500 mb-6">
            {orders.length === 0 ? 'Hãy khám phá các sản phẩm của chúng tôi' : 'Thử chọn tab khác để xem đơn hàng'}
          </p>
          {orders.length === 0 && (
            <Link 
              to="/products" 
              className="inline-block bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition"
            >
              Mua sắm ngay
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-4 py-3 border-b flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold text-gray-800">
                      Đơn #{order.id}
                    </span>
                    {getStatusBadge(order.status)}
                    {getPaymentStatusBadge(order.payment_status)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(order.created_at)}
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <div className="space-y-4">
                    {order.items?.slice(0, selectedOrder === order.id ? undefined : 2).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <Link to={`/products/${item.product_id}`}>
                          <img 
                            src={normalizeImageUrl(item.variant_image || item.image || '')} 
                            alt={item.name}
                            className="w-20 h-20 object-contain rounded-lg border hover:shadow-lg transition-shadow cursor-pointer"
                          />
                        </Link>
                        <div className="flex-1">
                          <Link 
                            to={`/products/${item.product_id}`}
                            className="font-medium text-gray-800 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            <h3>{item.name}</h3>
                          </Link>
                          <p className="text-sm text-gray-500">{item.brand}</p>
                          <div className="flex gap-4 mt-1 text-sm text-gray-500">
                            {item.color && <span> Màu: {item.color}</span>}
                            {item.size && <span> Size: {item.size}</span>}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Số lượng: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-pink-600">{formatPrice(item.price)}</p>
                          <p className="text-sm text-gray-500">x{item.quantity}</p>
                        </div>
                      </div>
                    ))}
                    
                    {order.items?.length > 2 && selectedOrder !== order.id && (
                      <button 
                        onClick={() => setSelectedOrder(order.id)}
                        className="text-pink-500 hover:text-pink-600 text-sm font-medium"
                      >
                        Xem thêm {order.items.length - 2} sản phẩm...
                      </button>
                    )}
                  </div>

                  {/* Order Details */}
                  {selectedOrder === order.id && (
                    <div className="mt-6 pt-6 border-t space-y-3">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Thông tin giao hàng</h4>
                          <p className="text-gray-600">
                            <span className="font-medium">{order.recipient_name}</span>
                          </p>
                          <p className="text-gray-600">{order.phone}</p>
                          <p className="text-gray-600">{order.shipping_address}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Thanh toán</h4>
                          <p className="text-gray-600">{getPaymentMethodText(order.payment_method)}</p>
                          {order.payment_ref && (
                            <p className="text-sm text-gray-500">Mã GD: {order.payment_ref}</p>
                          )}
                        </div>
                      </div>
                      {order.note && (
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-1">Ghi chú</h4>
                          <p className="text-gray-600">{order.note}</p>
                        </div>
                      )}
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="font-semibold text-gray-700 mb-4">Quy trình xử lý đơn hàng</h4>
                        <OrderTimeline order={order} />
                      </div>
                      <button 
                        onClick={() => setSelectedOrder(null)}
                        className="text-gray-500 hover:text-gray-600 text-sm mt-4"
                      >
                        Thu gọn
                      </button>
                    </div>
                  )}
                </div>

                {/* Order Footer */}
                <div className="bg-gray-50 px-4 py-3 border-t flex flex-wrap justify-between items-center gap-3">
                  <div className="flex gap-3 items-center flex-wrap">
                    {selectedOrder !== order.id && (
                      <button 
                        onClick={() => setSelectedOrder(order.id)}
                        className="text-pink-500 hover:text-pink-600 font-medium text-sm"
                      >
                        Xem chi tiết
                      </button>
                    )}

                    {/* Cancel / Retry Payment Buttons */}
                    {canCancelOrder(order.status) && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-3 py-1 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 text-sm font-medium"
                        title="Hủy đơn"
                      >
                        ❌ Hủy
                      </button>
                    )}

                    {canRetryPayment(order) && (
                      <button
                        onClick={() => handleRetryPayment(order.id)}
                        disabled={retryingOrder === order.id}
                        className={`px-3 py-1 rounded-lg border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 text-sm font-medium ${retryingOrder === order.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                        title="Thanh toán lại"
                      >
                        {retryingOrder === order.id ? '⏳...' : '🔁 Thanh toán lại'}
                      </button>
                    )}

                    {/* Repurchase Button */}
                    <button
                      onClick={() => handleRepurchase(order)}
                      disabled={repurchasingOrder === order.id}
                      className={`text-green-600 hover:text-green-700 font-medium text-sm border border-green-300 px-3 py-1 rounded-lg hover:bg-green-50 ${repurchasingOrder === order.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                      title="Mua lại đơn hàng này"
                    >
                      {repurchasingOrder === order.id ? '⏳...' : '🛒 Mua lại'}
                    </button>

                    {/* Return Request Button */}
                    {canRequestReturn(order) && (
                      <button
                        onClick={() => { setReturnModal(order.id); setReturnReason(''); setReturnFiles([]); setReturnError(''); }}
                        className="text-orange-600 hover:text-orange-700 font-medium text-sm border border-orange-300 px-3 py-1 rounded-lg hover:bg-orange-50"
                      >
                        📦 Yêu cầu hoàn trả
                      </button>
                    )}
                    {order.status === 'return_approved' && (
                      <span className="text-sm text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                        📦 Hãy gửi hàng về kho theo hướng dẫn qua thông báo
                      </span>
                    )}
                    {order.status === 'return_rejected' && order.return_rejection_reason && (
                      <span className="text-sm text-red-700 bg-red-50 px-3 py-1 rounded-lg border border-red-200">
                        Từ chối: {order.return_rejection_reason}
                      </span>
                    )}
                  </div>

                  {/* Total Price */}
                  <div className="text-right">
                    <span className="text-gray-500">Tổng tiền: </span>
                    <span className="text-xl font-bold text-pink-600">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Modal yêu cầu hoàn trả */}
      {returnModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-bold">📦 Yêu cầu hoàn trả đơn #{returnModal}</h3>
              <button onClick={() => setReturnModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {returnError && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded text-sm">{returnError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do hoàn trả <span className="text-red-500">*</span></label>
                <select
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">-- Chọn lý do --</option>
                  <option value="Giao sai màu / size">Giao sai màu / size</option>
                  <option value="Sản phẩm bị lỗi / hư hỏng">Sản phẩm bị lỗi / hư hỏng</option>
                  <option value="Lỗi nhà sản xuất">Lỗi nhà sản xuất</option>
                  <option value="Không vừa (rộng / chật)">Không vừa (rộng / chật)</option>
                  <option value="Sản phẩm không đúng mô tả">Sản phẩm không đúng mô tả</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh minh chứng (tối đa 5 ảnh)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => setReturnFiles(Array.from(e.target.files).slice(0, 5))}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                {returnFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {returnFiles.map((f, i) => (
                      <div key={i} className="relative">
                        <img src={URL.createObjectURL(f)} className="w-16 h-16 object-cover rounded border" alt="preview" />
                        <button onClick={() => setReturnFiles(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">&times;</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
                ⚠️ Điều kiện: Đơn hàng đã giao và đã thanh toán. Trong vòng 7 ngày kể từ khi nhận hàng. Hàng còn nguyên vẹn, có tem mác.
              </div>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-3">
              <button onClick={() => setReturnModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Hủy</button>
              <button
                onClick={handleReturnRequest}
                disabled={returnSubmitting}
                className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {returnSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default MyOrders;
