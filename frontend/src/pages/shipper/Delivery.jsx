/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';

const Delivery = () => {
  const { isShipper, user } = useAuth();
  const navigate = useNavigate();
  const { modal, closeModal, showError, showSuccess, showWarning } = useModal();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [failedReason, setFailedReason] = useState('');
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const ORDERS_PER_PAGE = 5;

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/orders/shipper', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isShipper) {
      navigate('/');
      return;
    }
    fetchOrders();
  }, [isShipper, navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const updateStatus = async (orderId, status, note = '', payment_status = null) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/orders/${orderId}/status`,
        { status, note, payment_status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
      setShowFailedModal(false);
      setFailedReason('');
      setSelectedOrderId(null);
    } catch (error) {
      console.error('Error updating order:', error);
      showError('Lỗi', 'Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const handlePickup = (orderId) => {
    showWarning(
      'Xác nhận lấy hàng',
      'Bạn đã nhận đơn hàng này và chuẩn bị đi giao?',
      () => {
        updateStatus(orderId, 'shipping');
        closeModal();
      },
      true
    );
  };

  const handleDelivered = (orderId) => {
    showWarning(
      'Xác nhận giao thành công',
      'Đơn hàng này đã được giao đến tay khách hàng?',
      () => {
        updateStatus(orderId, 'delivered');
        closeModal();
      },
      true
    );
  };

  const handleFailedDelivery = (orderId) => {
    setSelectedOrderId(orderId);
    setShowFailedModal(true);
  };

  const confirmFailedDelivery = () => {
    if (!failedReason.trim()) {
      showError('Lỗi', 'Vui lòng nhập lý do giao thất bại');
      return;
    }
    updateStatus(selectedOrderId, 'failed_delivery_retry', failedReason);
  };

  const getStatusConfig = (status, retryCount = 0) => {
    const configs = {
      confirmed: { text: 'Chờ lấy hàng', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '📦' },
      shipping: { text: 'Đang giao', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '🚚' },
      delivered: { text: 'Đã giao', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '✅' },
      failed_delivery_retry: { text: `Giao thất bại (Lần ${retryCount || 1})`, color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '⚠️' },
      failed_delivery: { text: 'Giao thất bại', color: 'bg-red-100 text-red-700 border-red-200', icon: '❌' },
      return: { text: 'Đã trả về kho', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '↩️' },
      refund: { text: 'Đã hoàn tiền', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '💸' }
    };
    return configs[status] || { text: status, color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '?' };
  };

  const getShippingAddress = (order) => {
    const parts = [order?.address_detail, order?.ward_name, order?.district_name, order?.province_name].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Chưa cập nhật';
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'confirmed') return o.status === 'confirmed';
    if (filter === 'shipping') return ['shipping', 'failed_delivery_retry'].includes(o.status);
    if (filter === 'failed_delivery') return o.status === 'failed_delivery';
    if (filter === 'returned') return ['return', 'return_received', 'refund_pending', 'refund'].includes(o.status);
    if (filter === 'history') return o.status === 'delivered';
    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const startIdx = (currentPage - 1) * ORDERS_PER_PAGE;
  const pageOrders = filteredOrders.slice(startIdx, startIdx + ORDERS_PER_PAGE);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500 font-medium">Đang tải dữ liệu đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Header Area - Đã bỏ sticky top-0 để không bị đè */}
      <div className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 sm:p-6 sm:rounded-b-2xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <span></span> Quản lý giao hàng
                </h1>
                <p className="text-blue-100 mt-1 text-sm opacity-90">Tài xế: <span className="font-medium">{user?.email}</span></p>
              </div>
              <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                <span className="text-2xl"></span>
              </div>
            </div>
          </div>

          {/* Filter Tabs - Flex Wrap */}
          <div className="px-4 py-4">
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 pb-2">
              {[
                { id: 'all', label: 'Tất cả', count: orders.length, color: 'bg-slate-800 text-white' },
                { id: 'confirmed', label: 'Chờ lấy', count: orders.filter(o => o.status === 'confirmed').length, color: 'bg-blue-600 text-white' },
                { id: 'shipping', label: 'Đang giao', count: orders.filter(o => ['shipping', 'failed_delivery_retry'].includes(o.status)).length, color: 'bg-indigo-600 text-white' },
                { id: 'failed_delivery', label: 'Thất bại', count: orders.filter(o => o.status === 'failed_delivery').length, color: 'bg-red-500 text-white' },
                { id: 'returned', label: 'Đã hoàn', count: orders.filter(o => ['return', 'return_received', 'refund_pending', 'refund'].includes(o.status)).length, color: 'bg-slate-600 text-white' },
                { id: 'history', label: 'Đã giao', count: orders.filter(o => o.status === 'delivered').length, color: 'bg-emerald-600 text-white' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-4 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap flex items-center border ${
                    filter === tab.id 
                      ? `${tab.color} border-transparent shadow-md transform scale-105` 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${filter === tab.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 mt-4 space-y-5">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">📭</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Trống rỗng</h3>
            <p className="text-slate-500 text-sm">Chưa có đơn hàng nào trong mục này.</p>
          </div>
        ) : (
          pageOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status, order.retry_count);
            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Card Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-medium mb-1">Mã đơn hàng</span>
                    <span className="font-bold text-slate-900">#{order.id}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.color} flex items-center gap-1.5`}>
                      <span>{statusConfig.icon}</span> {statusConfig.text}
                    </span>
                    <span className="text-xs text-slate-400 mt-2 font-medium">
                      {new Date(order.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  {/* Customer Info */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                      <span className="text-lg">👤</span>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-bold text-slate-800 text-lg leading-none">{order.recipient_name || 'Chưa cập nhật'}</p>
                      {order.phone ? (
                        <a href={`tel:${order.phone}`} className="inline-flex items-center gap-1.5 mt-2 text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg text-sm transition-colors">
                          <span>📞</span> {order.phone}
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 mt-2 text-slate-500 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg text-sm">
                          <span>📞</span> Chưa cập nhật
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0 border border-rose-100">
                      <span className="text-lg">📍</span>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-xs text-slate-500 font-medium mb-0.5">Địa chỉ giao hàng</p>
                      <p className="text-slate-700 leading-snug">{getShippingAddress(order)}</p>
                    </div>
                  </div>

                  {/* Price & Payment */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                      <span className="text-lg">💰</span>
                    </div>
                    <div className="flex-1 pt-1 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-0.5">Tổng thu</p>
                        <span className="font-bold text-emerald-600 text-xl">
                          {Number(order.total || 0).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div>
                        {order.payment_method === 'cod' && order.payment_status !== 'paid' ? (
                          <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                            💵 THU TIỀN MẶT (COD)
                          </span>
                        ) : order.payment_status === 'paid' ? (
                          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                            💳 ĐÃ THANH TOÁN
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Note */}
                  {order.note && (
                    <div className="mt-2 ml-12 bg-amber-50/50 border border-amber-100 p-3 rounded-xl">
                      <p className="text-amber-800 text-sm flex gap-2">
                        <span>📝</span> 
                        <span className="italic font-medium">{order.note}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer / Actions */}
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => handlePickup(order.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      <span>📦</span> Nhận đơn đi giao
                    </button>
                  )}

                  {order.status === 'shipping' && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleFailedDelivery(order.id)}
                        className="w-full bg-white hover:bg-red-50 text-red-600 border border-red-200 font-semibold py-3 px-2 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <span>⚠️</span> Báo thất bại
                      </button>
                      <button
                        onClick={() => {
                          if (order.payment_status !== 'paid') {
                            showWarning(
                              'Xác nhận thu tiền',
                              `Xác nhận bạn đã thu đủ ${Number(order.total || 0).toLocaleString('vi-VN')}đ và giao hàng thành công?`,
                              () => {
                                updateStatus(order.id, 'delivered', '', 'paid');
                                closeModal();
                              },
                              true
                            );
                          } else {
                            handleDelivered(order.id);
                          }
                        }}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-2 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <span>✅</span> {order.payment_status === 'paid' ? 'Giao thành công' : 'Đã thu tiền & Giao'}
                      </button>
                    </div>
                  )}

                  {order.status === 'failed_delivery_retry' && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleFailedDelivery(order.id)}
                        className="w-full bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 font-semibold py-3 px-2 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <span>❌</span> Hủy giao
                      </button>
                      <button
                        onClick={() => {
                          showWarning(
                            'Xác nhận giao lại',
                            'Xác nhận giao hàng thành công ở lần thử lại này?',
                            () => {
                              updateStatus(order.id, 'delivered', '', order.payment_status === 'pending' ? 'paid' : null);
                              closeModal();
                            },
                            true
                          );
                        }}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-2 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <span>✅</span> Giao lại thành công
                      </button>
                    </div>
                  )}

                  {order.status === 'failed_delivery' && (
                    <button
                      onClick={() => {
                        showWarning(
                          'Xác nhận hoàn hàng',
                          'Xác nhận đơn hàng này đã được trả về kho an toàn?',
                          () => {
                            updateStatus(order.id, 'return');
                            closeModal();
                          },
                          true
                        );
                      }}
                      className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      <span>↩️</span> Xác nhận đã trả về kho
                    </button>
                  )}
                  
                  {['delivered', 'return', 'refund', 'refund_pending', 'return_received'].includes(order.status) && (
                    <div className="text-center py-2">
                      <span className="text-slate-400 text-sm font-medium italic">Đơn hàng đã hoàn tất tiến trình</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Pagination Controls */}
        {filteredOrders.length > ORDERS_PER_PAGE && (
          <div className="flex items-center justify-center gap-2 mt-8 pb-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <span>←</span> Trước
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg font-semibold transition-all ${page === currentPage ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              Tiếp <span>→</span>
            </button>

            <span className="text-slate-500 text-sm font-medium ml-2">
              Trang {currentPage}/{totalPages}
            </span>
          </div>
        )}
      </div>

      {/* Failed Delivery Modal */}
      {showFailedModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-fade-in-up">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Báo cáo giao thất bại</h3>
            <p className="text-slate-500 text-sm mb-5">Vui lòng chọn lý do chính xác để hệ thống ghi nhận.</p>
            
            <div className="space-y-4">
              <select
                value={failedReason}
                onChange={(e) => setFailedReason(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
              >
                <option value="">-- Chọn lý do --</option>
                <option value="Khách không nghe máy">📞 Khách không nghe máy</option>
                <option value="Sai địa chỉ">📍 Sai địa chỉ giao hàng</option>
                <option value="Khách hẹn giao lại">⏳ Khách hẹn dời lịch giao</option>
                <option value="Khách từ chối nhận">❌ Khách từ chối nhận hàng</option>
                <option value="Khác">✏️ Lý do khác...</option>
              </select>
              
              {failedReason === 'Khác' && (
                <textarea
                  placeholder="Nhập lý do chi tiết..."
                  onChange={(e) => setFailedReason(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm resize-none"
                  rows={3}
                  autoFocus
                />
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowFailedModal(false);
                  setFailedReason('');
                  setSelectedOrderId(null);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmFailedDelivery}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm shadow-red-200"
              >
                Xác nhận
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

export default Delivery;