import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import OrderTimeline from '../../components/OrderTimeline';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';
import { normalizeImageUrl } from '../../utils/imageUrl';
import AdminLayout from '../../components/AdminLayout';
import { Eye, EyeOff } from 'lucide-react';

// Fallback placeholder as inline SVG data URI
const FALLBACK_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
    <rect width='100%' height='100%' fill='%23f3f4f6'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial,Helvetica,sans-serif' font-size='12'>No Img</text>
  </svg>
`)}`;

const Orders = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const location = useLocation();
  // Define TABS object first (before using it in useState)
  const TABS = {
    ALL: 'all',
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    SHIPPING: 'shipping',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    FAILED_DELIVERY: 'failed_delivery',
    RETURN_REQUESTED: 'return_requested',
    RETURN_PENDING: 'return_pending',
    RETURN_RECEIVED: 'return_received',
    REFUNDED: 'refunded',
    UNSETTLED: 'unsettled',
  };

  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { modal, closeModal, showError, showSuccess, showWarning } = useModal();
  const [orders, setOrders] = useState([]);
  const [unsettledOrders, setUnsettledOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUnsettled, setLoadingUnsettled] = useState(false);
  const [filter, setFilter] = useState(location.state?.initialFilter || TABS.ALL);
  const now = new Date();
  const [range, setRange] = useState(location.state?.initialRange === 'thisMonth' ? 'thisMonth' : location.state?.initialRange === 'thisYear' ? 'thisYear' : location.state?.initialRange || 'all');
  const [selectedMonth, setSelectedMonth] = useState(location.state?.initialMonth || now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(location.state?.initialYear || now.getFullYear());
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [returnRejectReason, setReturnRejectReason] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [returnReviewLoading, setReturnReviewLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [expandedOrderDetail, setExpandedOrderDetail] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Handle range change
  const handleRangeChange = (newRange) => {
    setRange(newRange);
    if (newRange === 'custom') {
      // Keep custom dates, don't reset
    } else {
      // Reset custom dates when switching away from custom mode
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  // Fetch full order detail khi click expand
  const handleExpandOrder = async (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      setExpandedOrderDetail(null);
      return;
    }

    setExpandedOrderId(orderId);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpandedOrderDetail(response.data);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      setExpandedOrderDetail(null);
    }
  };

  // Helper function to get date range
  const getDateRange = (rangeType) => {
    let startDate;

    switch (rangeType) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'thisMonth':
        startDate = new Date(selectedYear, selectedMonth - 1, 1);
        break;
      case 'thisYear':
        startDate = new Date(selectedYear, 0, 1);
        break;
      case 'custom':
        if (customStartDate) {
          startDate = new Date(customStartDate);
        } else {
          startDate = new Date('1970-01-01');
        }
        break;
      default:
        startDate = new Date('1970-01-01');
    }

    return startDate;
  };

  const getEndDate = () => {
    if (range === 'custom' && customEndDate) {
      const endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
      return endDate;
    }
    if (range === 'thisMonth') {
      const endDate = new Date(selectedYear, selectedMonth, 0);
      endDate.setHours(23, 59, 59, 999);
      return endDate;
    }
    if (range === 'thisYear') {
      const endDate = new Date(selectedYear, 11, 31);
      endDate.setHours(23, 59, 59, 999);
      return endDate;
    }
    return new Date();
  };

  // Filter and sort orders by date and status
  const filterAndSortOrders = (ordersToFilter) => {
    const startDate = getDateRange(range);
    const endDate = getEndDate();

    const filtered = ordersToFilter.filter((order) => {
      // Use specific datetime fields based on order status:
      // - 'delivered': use delivered_at (when actually delivered)
      // - 'return_rejected': use return_rejected_at (when rejection was finalized)
      // - others: use created_at (when order was placed)
      let orderDate;
      
      if (order.status === 'delivered' && order.delivered_at) {
        orderDate = new Date(order.delivered_at);
      } else if (order.status === 'return_rejected' && order.return_rejected_at) {
        orderDate = new Date(order.return_rejected_at);
      } else {
        orderDate = new Date(order.created_at || order.updated_at);
      }
      
      // Apply date range filter
      const isInDateRange = orderDate >= startDate && orderDate <= endDate;
      
      // Apply search filter
      let matchesSearch = true;
      if (searchText.trim()) {
        const searchLower = searchText.toLowerCase().trim();
        const orderId = order.id?.toString().includes(searchText);
        const customerName = order.recipient_name?.toLowerCase().includes(searchLower);
        const email = order.email?.toLowerCase().includes(searchLower);
        const phone = order.phone?.includes(searchText);
        matchesSearch = orderId || customerName || email || phone;
      }
      
      return isInDateRange && matchesSearch;
    });

    // Sort by created_at descending (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || a.updated_at);
      const dateB = new Date(b.created_at || b.updated_at);
      return dateB - dateA;
    });
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    // Sync with Dashboard range if provided
    if (location.state?.initialRange === 'thisMonth') {
      setRange('thisMonth');
      if (location.state?.initialMonth) setSelectedMonth(location.state.initialMonth);
      if (location.state?.initialYear) setSelectedYear(location.state.initialYear);
    } else if (location.state?.initialRange === 'thisYear') {
      setRange('thisYear');
      if (location.state?.initialYear) setSelectedYear(location.state.initialYear);
    }
    fetchOrders();
    fetchUnsettledOrders();
  }, [isAdmin, navigate]);

  // Auto-expand order if coming from notification
  useEffect(() => {
    if (location.state?.highlightOrderId && (orders.length > 0 || unsettledOrders.length > 0)) {
      const highlightId = location.state.highlightOrderId;
      handleExpandOrder(highlightId);
    }
  }, [orders, unsettledOrders, location.state?.highlightOrderId]);

  const totalOrdersCount = orders.length + unsettledOrders.length;

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const fetchUnsettledOrders = async () => {
    try {
      setLoadingUnsettled(true);
      const token = localStorage.getItem('token');
      console.log('Fetching unsettled orders with token:', token ? 'YES' : 'NO');
      const response = await axios.get('http://localhost:5000/api/orders/unsettled', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Unsettled response:', response.data);
      setUnsettledOrders(response.data || []);
      setLoadingUnsettled(false);
    } catch (error) {
      console.error('Error fetching unsettled orders:', error.response?.status, error.message);
      setLoadingUnsettled(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      setLoadingDetails(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrderDetails(response.data);
      setSelectedOrder(orderId);
      setLoadingDetails(false);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setLoadingDetails(false);
    }
  };

  const updateOrderPayment = async (orderId, payment_status) => {
    showWarning(
      'Xác nhận thanh toán',
      `Xác nhận đánh dấu đơn hàng #${orderId} là đã thanh toán?`,
      async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.put(
            `http://localhost:5000/api/orders/${orderId}/status`,
            { payment_status },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          fetchOrders();
          if (selectedOrder === orderId) {
            fetchOrderDetails(orderId);
          }
          closeModal();
          showSuccess('Thành công', 'Cập nhật trạng thái thanh toán thành công');
        } catch (error) {
          console.error('Error updating payment:', error);
          closeModal();
          showError('Lỗi', 'Lỗi cập nhật trạng thái thanh toán');
        }
      },
      true
    );
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
      if (selectedOrder === orderId) {
        fetchOrderDetails(orderId);
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleRefundFromRow = async (orderId) => {
    showWarning(
      'Xác nhận hoàn tiền',
      `Xác nhận hoàn tiền cho đơn #${orderId}?`,
      async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.post(
            `http://localhost:5000/api/orders/${orderId}/process-refund`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          fetchOrders();
          // Also refetch unsettled orders if currently viewing that tab
          if (filter === TABS.UNSETTLED) {
            fetchUnsettledOrders();
          }
          closeModal();
          showSuccess('Thành công', 'Đã xác nhận hoàn tiền cho khách hàng.');
        } catch (err) {
          console.error('Error confirming refund:', err);
          closeModal();
          showError('Lỗi', err.response?.data?.message || 'Lỗi khi xác nhận hoàn tiền');
        }
      },
      true
    );
  };

  const handleCancelFailedDeliveryFromRow = async (orderId) => {
    showWarning(
      'Hủy đơn',
      `Xác nhận hủy đơn #${orderId} và chuyển vào flow hoàn trả?`,
      async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.put(
            `http://localhost:5000/api/orders/${orderId}/status`,
            { status: 'return_approved' },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          fetchOrders();
          closeModal();
          showSuccess('Thành công', 'Đơn đã được chuyển vào flow hoàn trả');
        } catch (err) {
          console.error('Error canceling failed delivery:', err);
          closeModal();
          showError('Lỗi', err.response?.data?.message || 'Lỗi khi hủy đơn');
        }
      },
      true
    );
  };

  const handleConfirmReturnReceivedFromRow = async (orderId) => {
    showWarning(
      'Xác nhận nhận hàng',
      `Xác nhận đã nhận lại hàng hoàn cho đơn #${orderId}?`,
      async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.put(
            `http://localhost:5000/api/orders/${orderId}/status`,
            { status: 'return_received' },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          fetchOrders();
          closeModal();
          showSuccess('Thành công', 'Đã xác nhận nhận hàng hoàn');
        } catch (err) {
          console.error('Error confirming return received:', err);
          closeModal();
          showError('Lỗi', err.response?.data?.message || 'Lỗi khi xác nhận nhận hàng');
        }
      },
      true
    );
  };

  const confirmRefund = async (orderId) => {
    showWarning(
      'Xác nhận hoàn tiền',
      `Xác nhận hoàn tiền cho đơn #${orderId}?`,
      async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.post(
            `http://localhost:5000/api/orders/${orderId}/process-refund`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          fetchOrders();
          if (selectedOrder === orderId) fetchOrderDetails(orderId);
          closeModal();
          showSuccess('Thành công', 'Đã xác nhận hoàn tiền cho khách hàng.');
        } catch (err) {
          console.error('Error confirming refund:', err);
          closeModal();
          showError('Lỗi', err.response?.data?.message || 'Lỗi khi xác nhận hoàn tiền');
        }
      },
      true
    );
  };

  const handleReturnReview = async (orderId, action) => {
    if (action === 'reject' && !returnRejectReason.trim()) {
      showError('Lỗi', 'Vui lòng nhập lý do từ chối');
      return;
    }
    setReturnReviewLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/orders/${orderId}/return-review`,
        { action, rejection_reason: returnRejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReturnRejectReason('');
      fetchOrders();
      fetchOrderDetails(orderId);
    } catch (err) {
      showError('Lỗi', err.response?.data?.error || 'Lỗi khi xử lý yêu cầu');
    } finally {
      setReturnReviewLoading(false);
    }
  };

  const getStatusConfig = (status, retryCount = 0) => {
    const configs = {
      pending: { text: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      confirmed: { text: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800', icon: '✓' },
      shipping: { text: 'Đang giao', color: 'bg-purple-100 text-purple-800', icon: '🚚' },
      delivered: { text: 'Đã giao', color: 'bg-green-100 text-green-800', icon: '✅' },
      cancelled: { text: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: '❌' },
      failed_delivery_retry: { text: `Giao thất bại (Lần ${retryCount || 1})`, color: 'bg-orange-100 text-orange-800', icon: '⚠️' },
      failed_delivery: { text: 'Giao thất bại cuối cùng', color: 'bg-red-100 text-red-800', icon: '❌' },
      return: { text: 'Đã trả về kho', color: 'bg-gray-100 text-gray-800', icon: '↩️' },
      refund: { text: 'Đã hoàn tiền', color: 'bg-green-100 text-green-800', icon: '✅' },
      refund_pending: { text: 'Chờ hoàn tiền', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      refunded: { text: 'Đã hoàn tiền', color: 'bg-green-100 text-green-800', icon: '💰' },
      returned: { text: 'Đã hoàn hàng', color: 'bg-gray-100 text-gray-800', icon: '↩️' },
      return_requested: { text: 'Yêu cầu hoàn trả', color: 'bg-amber-100 text-amber-800', icon: '📋' },
      return_approved: { text: 'Chờ hoàn trả', color: 'bg-cyan-100 text-cyan-800', icon: '⏳' },
      return_rejected: { text: 'Từ chối hoàn trả', color: 'bg-red-100 text-red-800', icon: '❌' },
      return_received: { text: 'Đã hoàn', color: 'bg-slate-100 text-slate-800', icon: '📦' },
    };
    return configs[status] || { text: status, color: 'bg-gray-100 text-gray-800', icon: '?' };
  };

  const ActionBadge = ({ children }) => (
    <span className="px-2 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">{children}</span>
  );

  const isRefundCandidate = (o) => {
    const refundableStatuses = ['failed_delivery', 'return', 'return_received'];
    return o.status === 'refund' || o.status === 'refund_pending' || (refundableStatuses.includes(o.status) && o.payment_status === 'paid');
  };

  const isReturnRelated = (o) => {
    const returnStatuses = ['return_received', 'return_rejected', 'return_requested', 'return_approved', 'return'];
    return returnStatuses.includes(o.status) && !isRefundCandidate(o);
  };

  const filteredOrders = (() => {
    let baseOrders = [];
    
    if (filter === TABS.UNSETTLED) {
      // Gộp unsettledOrders + cancelled orders
      baseOrders = [...unsettledOrders, ...orders.filter(o => o.status === 'cancelled')];
    } else if (filter === TABS.ALL) {
      baseOrders = orders;
    } else if (filter === TABS.SHIPPING) {
      baseOrders = orders.filter(o => ['shipping', 'failed_delivery_retry'].includes(o.status));
    } else if (filter === TABS.RETURN_REQUESTED) {
      baseOrders = orders.filter(o => o.status === 'return_requested');
    } else if (filter === TABS.RETURN_PENDING) {
      baseOrders = orders.filter(o => o.status === 'return_approved');
    } else if (filter === TABS.RETURN_RECEIVED) {
      // Tab "Đã hoàn" bao gồm: return_received (đã nhận hàng) + refund_pending (chờ hoàn tiền)
      baseOrders = orders.filter(o => ['return_received', 'refund_pending'].includes(o.status));
    } else if (filter === TABS.REFUNDED) {
      // Tab "Hoàn tiền" chỉ show các đơn đã hoàn tiền
      baseOrders = orders.filter(o => o.status === 'refund');
    } else if (filter === TABS.DELIVERED) {
      // Tab "Đã giao" chỉ show delivered status + return_rejected (đơn bị từ chối hoàn hàng nhưng đã giao)
      baseOrders = orders.filter(o => ['delivered', 'return_rejected'].includes(o.status));
    } else if (filter === TABS.FAILED_DELIVERY) {
      // Tab "Giao thất bại" show cả failed_delivery_retry (lần 1,2) và failed_delivery (lần 3)
      baseOrders = orders.filter(o => ['failed_delivery_retry', 'failed_delivery'].includes(o.status));
    } else {
      baseOrders = orders.filter(o => o.status === filter);
    }
    
    return filterAndSortOrders(baseOrders);
  })();

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    if (filter === TABS.UNSETTLED && unsettledOrders.length === 0) {
      fetchUnsettledOrders();
    }
  }, [filter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="text-center">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quản lý đơn hàng</h1>

        {/* Time Range Filter */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => handleRangeChange('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${range === 'all' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => handleRangeChange('thisMonth')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${range === 'thisMonth' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Theo Tháng
            </button>
            <button
              onClick={() => handleRangeChange('thisYear')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${range === 'thisYear' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Theo Năm
            </button>
            <button
              onClick={() => handleRangeChange('custom')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${range === 'custom' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Tuỳ chỉnh khoảng ngày
            </button>
          </div>

          {range === 'thisMonth' && (
            <div className="flex gap-2 flex-wrap items-center">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Tháng {i + 1}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none cursor-pointer"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      Nam {year}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {range === 'thisYear' && (
            <div className="flex gap-2 flex-wrap items-center">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none cursor-pointer"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      Năm {year}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {range === 'custom' && (
            <div className="flex gap-2 flex-wrap items-center bg-white p-3 rounded-lg border border-gray-300">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none"
                placeholder="Ngày bắt đầu"
              />
              <span className="text-gray-600 font-semibold">đến</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none"
                placeholder="Ngày kết thúc"
              />
              {(customStartDate || customEndDate) && (
                <button
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                    setRange('all');
                  }}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-200 transition"
                >
                  Xoá bộ lọc
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Search Box */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tìm theo ID, tên khách hàng, email, số điện thoại..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-300 transition"
              >
                Xoá
              </button>
            )}
          </div>

          {/* Status Tabs - Order Management */}
          <div className="space-y-3">
            {/* Quản lý đơn hàng (Order Management) */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 px-2">📦 Quản lý đơn hàng</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter(TABS.ALL)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${filter === TABS.ALL ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Tất cả ({totalOrdersCount})
                </button>
                <button
                  onClick={() => setFilter(TABS.PENDING)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${filter === TABS.PENDING ? 'bg-yellow-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  ⏳ Chờ xác nhận ({orders.filter(o => o.status === 'pending').length})
                </button>
                <button
                  onClick={() => setFilter(TABS.CONFIRMED)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${filter === TABS.CONFIRMED ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  ✓ Đã xác nhận ({orders.filter(o => o.status === 'confirmed').length})
                </button>
                <button
                  onClick={() => setFilter(TABS.SHIPPING)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${filter === TABS.SHIPPING ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  🚚 Đang giao ({orders.filter(o => ['shipping', 'failed_delivery_retry'].includes(o.status)).length})
                </button>
                <button
                  onClick={() => setFilter(TABS.DELIVERED)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${filter === TABS.DELIVERED ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  ✅ Đã giao ({orders.filter(o => ['delivered', 'return_rejected'].includes(o.status)).length})
                </button>
                <button
                  onClick={() => setFilter(TABS.FAILED_DELIVERY)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${filter === TABS.FAILED_DELIVERY ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  ⚠️ Giao thất bại ({orders.filter(o => ['failed_delivery_retry', 'failed_delivery'].includes(o.status)).length})
                </button>
                <button
                  onClick={() => setFilter(TABS.UNSETTLED)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${filter === TABS.UNSETTLED ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  ⚡ Chưa thiết lập ({unsettledOrders.length + orders.filter(o => o.status === 'cancelled').length})
                </button>
              </div>
            </div>

            {/* Quản lý hoàn hàng (Return Management) */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 px-2">↩️ Quản lý hoàn hàng</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter(TABS.RETURN_REQUESTED)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${filter === TABS.RETURN_REQUESTED ? 'bg-amber-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  📋 Yêu cầu hoàn trả ({orders.filter(o => o.status === 'return_requested').length})
                </button>
                <button
                  onClick={() => setFilter(TABS.RETURN_PENDING)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${filter === TABS.RETURN_PENDING ? 'bg-cyan-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  ⏳ Chờ hoàn trả ({orders.filter(o => o.status === 'return_approved').length})
                </button>
                <button
                  onClick={() => setFilter(TABS.RETURN_RECEIVED)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${filter === TABS.RETURN_RECEIVED ? 'bg-slate-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  📦 Đã hoàn ({orders.filter(o => ['return_received', 'refund_pending'].includes(o.status)).length})
                </button>
                <button
                  onClick={() => setFilter(TABS.REFUNDED)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${filter === TABS.REFUNDED ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  💰 Hoàn tiền ({orders.filter(o => o.status === 'refund').length})
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Khách hàng</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tổng tiền</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Thanh toán</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => {
                    const statusConfig = getStatusConfig(order.status, order.retry_count);
                    return (
                      <>
                      <tr 
                        key={order.id} 
                        className={`border-t hover:bg-gray-50`}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">#{order.id}</td>
                        <td className="px-4 py-3 text-sm">
                          <div>
                            <p className="font-medium text-gray-900">{order.recipient_name || 'N/A'}</p>
                            <p className="text-xs text-gray-500">📧 {order.email || 'N/A'}</p>
                            {order.phone && <p className="text-xs text-gray-500">📞 {order.phone}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                          {Number(order.total || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}đ
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              order.payment_method === 'vnpay' ? 'bg-blue-100 text-blue-800' :
                              order.payment_method === 'bank' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.payment_method === 'vnpay' ? '💳 VNPay' :
                               order.payment_method === 'bank' ? '🏦 CK' :
                               '💵 COD'}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                              order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.payment_status === 'paid' ? '✅ Đã TT' :
                               order.payment_status === 'failed' ? '❌ Lỗi' :
                               '⏳ Chờ TT'}
                            </span>
                            {/* Nút xác nhận thanh toán nhanh cho Admin (đơn chuyển khoản) */}
                            {order.payment_status !== 'paid' && order.payment_method === 'bank' && (
                              <button
                                onClick={() => updateOrderPayment(order.id, 'paid')}
                                className="mt-1 text-[10px] bg-blue-600 text-white px-1 py-0.5 rounded hover:bg-blue-700"
                              >
                                Xác nhận đã nhận tiền
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                            {statusConfig.icon} {statusConfig.text}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2 flex-wrap items-center justify-between">
                            <div className="flex gap-2 flex-wrap items-center">
                              {order.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                  >
                                    ✓ Xác thực
                                  </button>
                                  <button
                                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
                                  >
                                    ❌ Hủy
                                  </button>
                                </>
                              ) : order.status === 'return_requested' ? (
                                <>
                                  <button
                                    onClick={() => handleExpandOrder(order.id)}
                                    className="px-3 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 transition"
                                  >
                                    ⚡ Chi tiết
                                  </button>
                                </>
                              ) : order.status === 'return_approved' ? (
                                <button
                                  onClick={() => handleConfirmReturnReceivedFromRow(order.id)}
                                  className="px-3 py-1 text-xs bg-cyan-600 text-white rounded hover:bg-cyan-700 transition"
                                >
                                  📦 Nhận hàng
                                </button>
                              ) : order.status === 'return_received' || order.status === 'refund_pending' ? (
                                <button
                                  onClick={() => handleRefundFromRow(order.id)}
                                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                                >
                                  💰 Hoàn tiền
                                </button>
                              ) : order.status === 'failed_delivery' ? (
                                <button
                                  onClick={() => handleCancelFailedDeliveryFromRow(order.id)}
                                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
                                >
                                  🗑️ Hủy đơn
                                </button>
                              ) : null}
                            </div>
                            <button
                              onClick={() => handleExpandOrder(order.id)}
                              className="text-gray-600 hover:text-blue-600 transition flex-shrink-0 ml-auto"
                              title="Xem chi tiết"
                            >
                              {expandedOrderId === order.id ? (
                                <EyeOff size={20} />
                              ) : (
                                <Eye size={20} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Details Row */}
                      {expandedOrderId === order.id && expandedOrderDetail && (
                        <tr className="bg-blue-50 border-t">
                          <td colSpan="6" className="px-6 py-6">
                            <div className="grid grid-cols-2 gap-8">
                              {/* Thông tin giao hàng */}
                              <div>
                                <h4 className="font-bold text-gray-900 mb-4">Thông tin giao hàng</h4>
                                <div className="space-y-3 text-sm text-gray-700">
                                  <p><span className="font-semibold">Người nhận:</span> {expandedOrderDetail.recipient_name || order.recipient_name || 'N/A'}</p>
                                  <p><span className="font-semibold">Email:</span> {expandedOrderDetail.email || order.email || 'N/A'}</p>
                                  <p><span className="font-semibold">Điện thoại:</span> {expandedOrderDetail.phone || order.phone || 'N/A'}</p>
                                  <p><span className="font-semibold">Địa chỉ:</span> {expandedOrderDetail.shipping_address || expandedOrderDetail.address || expandedOrderDetail.delivery_address || 'Chưa cập nhật'}</p>
                                </div>
                              </div>

                              {/* Sản phẩm */}
                              <div>
                                <h4 className="font-bold text-gray-900 mb-4">Sản phẩm</h4>
                                <div className="space-y-2 text-sm text-gray-700 max-h-48 overflow-y-auto">
                                  {expandedOrderDetail.items && expandedOrderDetail.items.length > 0 ? (
                                    expandedOrderDetail.items.map((item, idx) => (
                                      <div key={idx} className="flex justify-between p-2 bg-white rounded border border-gray-200">
                                        <div className="flex-1">
                                          <p className="font-semibold">{item.name || `Sản phẩm #${item.product_id}`}</p>
                                          <p className="text-xs text-gray-500">Size: {item.size || 'N/A'}, Màu: {item.color || 'N/A'}</p>
                                        </div>
                                        <div className="text-right ml-4">
                                          <p className="font-semibold">{item.quantity} x {Number(item.price || 0).toLocaleString('vi-VN')}đ</p>
                                          <p className="text-xs text-green-600 font-bold">{(item.quantity * item.price).toLocaleString('vi-VN')}đ</p>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-gray-500">Không có sản phẩm</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Tóm tắt */}
                            <div className="mt-6 pt-6 border-t border-blue-200">
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600 mb-1">Tổng tiền</p>
                                  <p className="font-bold text-lg text-gray-900">{Number(expandedOrderDetail.total || order.total || 0).toLocaleString('vi-VN')}đ</p>
                                </div>
                                <div>
                                  <p className="text-gray-600 mb-1">Phương thức thanh toán</p>
                                  <p className="font-semibold text-gray-900">
                                    {(expandedOrderDetail.payment_method || order.payment_method) === 'vnpay' ? 'VNPay' : 
                                     (expandedOrderDetail.payment_method || order.payment_method) === 'bank' ? 'Chuyển khoản' : 'COD'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600 mb-1">Ngày tạo</p>
                                  <p className="font-semibold text-gray-900">{new Date(expandedOrderDetail.created_at || order.created_at).toLocaleDateString('vi-VN')}</p>
                                </div>
                              </div>
                            </div>

                            {/* Timeline - Quy trình xử lý đơn hàng */}
                            <div className="mt-8 pt-6 border-t border-blue-200">
                              <h4 className="font-bold text-gray-900 mb-4">Quy trình xử lý đơn hàng</h4>
                              <OrderTimeline order={expandedOrderDetail} />
                            </div>

                            {/* Return Request Details */}
                            {['return_requested', 'return_approved', 'return_rejected', 'return_received'].includes(expandedOrderDetail.status) && (
                              <div className="mt-8 pt-6 border-t border-orange-200 bg-orange-50 p-4 rounded">
                                <h4 className="font-bold text-gray-900 mb-4">Thông tin yêu cầu hoàn hàng</h4>
                                
                                {expandedOrderDetail.return_requested_at && (
                                  <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-1">Ngày yêu cầu</p>
                                    <p className="font-semibold text-gray-900">{new Date(expandedOrderDetail.return_requested_at).toLocaleString('vi-VN')}</p>
                                  </div>
                                )}

                                {expandedOrderDetail.return_reason && (
                                  <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-1">Lý do hoàn hàng</p>
                                    <p className="text-gray-900 bg-white p-2 rounded border border-gray-300">{expandedOrderDetail.return_reason}</p>
                                  </div>
                                )}

                                {expandedOrderDetail.return_evidence && (
                                  <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-2">Ảnh minh chứng</p>
                                    <div className="flex flex-wrap gap-2">
                                      {(Array.isArray(expandedOrderDetail.return_evidence) ? expandedOrderDetail.return_evidence : JSON.parse(expandedOrderDetail.return_evidence || '[]')).map((imageUrl, idx) => (
                                        <a key={idx} href={`http://localhost:5000${imageUrl}`} target="_blank" rel="noopener noreferrer" className="inline-block">
                                          <img src={`http://localhost:5000${imageUrl}`} alt={`Evidence ${idx + 1}`} className="h-24 w-24 object-cover rounded border border-gray-300 hover:opacity-80" />
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {expandedOrderDetail.status === 'return_rejected' && expandedOrderDetail.return_rejection_reason && (
                                  <div className="mb-4 bg-red-50 p-3 rounded border border-red-200">
                                    <p className="text-sm text-gray-600 mb-1">Lý do từ chối</p>
                                    <p className="text-red-900 font-semibold">{expandedOrderDetail.return_rejection_reason}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                      </>
                    );
                  })}
                </tbody>
              </table>
              {loadingUnsettled && (
                <div className="text-center py-8 text-gray-500">Đang tải dữ liệu...</div>
              )}
              {!loadingUnsettled && filteredOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">Không có đơn hàng</div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 p-6 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-md border border-gray-300 bg-white font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-md font-semibold transition ${
                        currentPage === page
                          ? 'bg-gray-900 text-white border border-gray-900'
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-md border border-gray-300 bg-white font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                  >
                    Sau
                  </button>
                </div>
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
    </AdminLayout>
  );
};

export default Orders;
