import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import StarRating from '../../components/StarRating';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

const AdminReviews = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { modal, closeModal, showError, showSuccess } = useModal();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(() => {
    return localStorage.getItem('adminReviewsTab') || 'all';
  }); // 'all', 'no_reply', 'replied'
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [replyText, setReplyText] = useState({});
  const [submitting, setSubmitting] = useState(new Set());
  const isFirstLoadRef = useRef(true);

  // Time filter states
  const now = new Date();
  const [timeFilterMode, setTimeFilterMode] = useState('all'); // 'all' | 'month' | 'year' | 'custom'
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    localStorage.setItem('adminReviewsTab', filter);
  }, [filter]);

  // Sync filter and range from Dashboard if provided
  useEffect(() => {
    if (location.state?.initialFilter) {
      setFilter(location.state.initialFilter);
    }
    if (location.state?.initialRange) {
      const range = location.state.initialRange;
      if (range === 'thisMonth') {
        setTimeFilterMode('month');
        setSelectedMonth(now.getMonth() + 1);
        setSelectedYear(now.getFullYear());
      } else if (range === 'thisYear') {
        setTimeFilterMode('year');
        setSelectedYear(now.getFullYear());
      } else if (range === 'custom') {
        setTimeFilterMode('custom');
        if (location.state.startDate) setCustomStartDate(location.state.startDate);
        if (location.state.endDate) setCustomEndDate(location.state.endDate);
      } else {
        setTimeFilterMode('all');
      }
    }
  }, [location.state?.initialFilter, location.state?.initialRange, location.state?.startDate, location.state?.endDate]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchReviews();
  }, [isAdmin, navigate]);

  const fetchReviews = async () => {
    try {
      if (!isFirstLoadRef.current) {
        setLoading(true);
      }
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/reviews/admin/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(response.data || []);
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId) => {
    const reply = replyText[reviewId]?.trim();
    if (!reply) {
      showError('Lỗi', 'Vui lòng nhập nội dung phản hồi');
      return;
    }

    setSubmitting(prev => new Set([...prev, reviewId]));
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/reviews/${reviewId}/reply`, {
        reply_text: reply
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Reset reply text and reload reviews
      setReplyText(prev => ({ ...prev, [reviewId]: '' }));
      fetchReviews();
      showSuccess('Thành công', 'Phản hồi thành công!');
    } catch (error) {
      console.error('Error replying to review:', error);
      showError('Lỗi', error.response?.data?.error || 'Có lỗi xảy ra khi phản hồi');
    } finally {
      setSubmitting(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  };

  const handleReplyTextChange = (reviewId, text) => {
    setReplyText(prev => ({ ...prev, [reviewId]: text }));
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

  const filteredReviews = reviews.filter(review => {
    // Filter by reply status
    if (filter === 'no_reply') {
      if (review.admin_reply) return false;
    }
    if (filter === 'replied') {
      if (!review.admin_reply) return false;
    }

    // Filter by date
    let matchDate = true;
    if (timeFilterMode !== 'all') {
      const reviewDate = new Date(review.created_at || review.createdAt);
      
      if (timeFilterMode === 'month') {
        matchDate = reviewDate.getMonth() + 1 === selectedMonth && reviewDate.getFullYear() === selectedYear;
      } else if (timeFilterMode === 'year') {
        matchDate = reviewDate.getFullYear() === selectedYear;
      } else if (timeFilterMode === 'custom' && customStartDate && customEndDate) {
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        matchDate = reviewDate >= startDate && reviewDate <= endDate;
      }
    }

    return matchDate;
  });

  const stats = {
    total: reviews.length,
    no_reply: reviews.filter(r => !r.admin_reply).length,
    replied: reviews.filter(r => r.admin_reply).length
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedReviews = filteredReviews.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, timeFilterMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quản lý đánh giá</h1>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-6 py-4 text-center font-medium transition ${
                filter === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Tất cả ({stats.total})
            </button>
            <button
              onClick={() => setFilter('no_reply')}
              className={`flex-1 px-6 py-4 text-center font-medium transition ${
                filter === 'no_reply'
                  ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Chờ phản hồi ({stats.no_reply})
            </button>
            <button
              onClick={() => setFilter('replied')}
              className={`flex-1 px-6 py-4 text-center font-medium transition ${
                filter === 'replied'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Đã phản hồi ({stats.replied})
            </button>
          </div>
        </div>

        {/* Time Filter */}
        <div className="flex flex-col gap-4 bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => setTimeFilterMode('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${timeFilterMode === 'all' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setTimeFilterMode('month')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${timeFilterMode === 'month' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Theo Tháng
            </button>
            <button
              onClick={() => setTimeFilterMode('year')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${timeFilterMode === 'year' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Theo Năm
            </button>
            <button
              onClick={() => setTimeFilterMode('custom')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${timeFilterMode === 'custom' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Tuỳ chỉnh khoảng ngày
            </button>
          </div>

          {timeFilterMode === 'month' && (
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
                      Năm {year}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {timeFilterMode === 'year' && (
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

          {timeFilterMode === 'custom' && (
            <div className="flex gap-2 flex-wrap items-center">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none"
                placeholder="Ngay bat dau"
              />
              <span className="text-gray-600 font-semibold">den</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none"
                placeholder="Ngay ket thuc"
              />
              {(customStartDate || customEndDate) && (
                <button
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                    setTimeFilterMode('all');
                  }}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-200 transition"
                >
                  Xoa bo suc
                </button>
              )}
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {filteredReviews.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Không có đánh giá nào {filter === 'no_reply' ? 'cần phản hồi' : filter === 'replied' ? 'đã phản hồi' : ''}
              </h3>
              <p className="text-gray-500">
                Các đánh giá từ khách hàng sẽ xuất hiện ở đây
              </p>
            </div>
          ) : (
            paginatedReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                {/* Review Header */}
                <div className="flex items-start gap-4 mb-4">
                  <img 
                    src={review.product_image || '/placeholder.png'} 
                    alt={review.product_name}
                    className="w-16 h-16 object-contain rounded border"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{review.product_name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <StarRating value={parseFloat(review.overall_rating)} readonly size="text-sm" />
                      <span className="text-sm text-gray-500">
                        {review.user_email} • {formatDate(review.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Details */}
                <div className="mb-4">
                  {review.general_comment && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm font-medium text-gray-600">Bình luận tổng quát:</span>
                      <p className="text-gray-700 mt-1">{review.general_comment}</p>
                    </div>
                  )}
                </div>

                {/* Admin Reply Section */}
                {review.admin_reply ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">A</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800 mb-1">Phản hồi từ cửa hàng</p>
                        <p className="text-blue-700">{review.admin_reply}</p>
                        <p className="text-xs text-blue-600 mt-1">
                          {formatDate(review.reply_created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-800 mb-3">Phản hồi đánh giá</h4>
                    <div className="flex gap-3">
                      <textarea
                        placeholder="Nhập phản hồi của bạn cho khách hàng..."
                        value={replyText[review.id] || ''}
                        onChange={(e) => handleReplyTextChange(review.id, e.target.value)}
                        className="flex-1 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                      <button
                        onClick={() => handleReply(review.id)}
                        disabled={submitting.has(review.id) || !replyText[review.id]?.trim()}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition"
                      >
                        {submitting.has(review.id) ? 'Đang gửi...' : 'Gửi phản hồi'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
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
    </AdminLayout>
  );
};

export default AdminReviews;