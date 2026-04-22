import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AiFillLike, AiOutlineLike } from 'react-icons/ai';
import { toast } from 'react-toastify';
import StarRating from './StarRating';
import { normalizeImageUrl } from '../utils/imageUrl';

const ReviewList = ({ productId, onStatsUpdate }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [likeLoadingIds, setLikeLoadingIds] = useState(new Set());

  const formatCount = (value) => {
    const count = Number(value || 0);
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace('.', ',')}k`;
    }
    return count.toString();
  };

  const parseReviewImages = (images) => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const getFilterParams = () => {
    if (activeFilter === 'images') {
      return { has_images: true };
    }
    if (activeFilter !== 'all') {
      return { rating: activeFilter };
    }
    return {};
  };

  const fetchReviews = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        params: getFilterParams(),
      };

      if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
      }

      const response = await axios.get(`http://localhost:5000/api/reviews/product/${productId}`, config);
      setReviews(response.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId, activeFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/reviews/product/${productId}/stats`);
      const statsData = response.data;
      setStats(statsData);
      
      // Callback để ProductDetail có thể cập nhật rating
      if (onStatsUpdate) {
        onStatsUpdate(statsData);
      }
    } catch (error) {
      console.error('Error fetching review stats:', error);
      const fallback = {
        total_reviews: 0,
        average_rating: 0,
        positive_reviews: 0,
        five_star: 0,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0,
        with_images: 0,
      };
      setStats(fallback);
      if (onStatsUpdate) {
        onStatsUpdate(fallback);
      }
    }
  }, [productId, onStatsUpdate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setLoading(true);
    fetchReviews();
  }, [fetchReviews]);

  const toggleLikeReview = async (reviewId, currentLiked) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.info('Vui lòng đăng nhập để thích đánh giá');
      return;
    }

    if (likeLoadingIds.has(reviewId)) {
      return;
    }

    setLikeLoadingIds((prev) => new Set(prev).add(reviewId));

    try {
      const endpoint = `http://localhost:5000/api/reviews/${reviewId}/like`;
      const headers = { Authorization: `Bearer ${token}` };
      let response;

      if (currentLiked) {
        response = await axios.delete(endpoint, { headers });
      } else {
        response = await axios.post(endpoint, {}, { headers });
      }

      const { like_count, user_liked } = response.data || {};
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                like_count: Number(like_count || 0),
                user_liked: Boolean(user_liked),
              }
            : review
        )
      );
    } catch (error) {
      console.error('Error toggling review like:', error);
    } finally {
      setLikeLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-gray-200 rounded-lg"></div>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Thống kê tổng quan */}
      {stats && stats.total_reviews > 0 && (
        <div className="bg-orange-50 p-6 rounded-lg border border-orange-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-[170px]">
              <div className="text-4xl font-semibold text-orange-600">
                {parseFloat(stats.average_rating || 0).toFixed(1)}
                <span className="text-3xl"> trên 5</span>
              </div>
              <div className="mt-2">
                <StarRating value={parseFloat(stats.average_rating || 0)} readonly size="text-2xl" />
              </div>
            </div>

            <div className="flex-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-5 py-2 border rounded-sm text-lg transition-colors ${
                  activeFilter === 'all'
                    ? 'border-orange-500 text-orange-600 bg-white'
                    : 'border-gray-300 text-gray-800 bg-white hover:border-orange-300'
                }`}
              >
                Tất Cả
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('5')}
                className={`px-5 py-2 border rounded-sm text-lg transition-colors ${
                  activeFilter === '5'
                    ? 'border-orange-500 text-orange-600 bg-white'
                    : 'border-gray-300 text-gray-800 bg-white hover:border-orange-300'
                }`}
              >
                5 Sao ({formatCount(stats.five_star)})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('4')}
                className={`px-5 py-2 border rounded-sm text-lg transition-colors ${
                  activeFilter === '4'
                    ? 'border-orange-500 text-orange-600 bg-white'
                    : 'border-gray-300 text-gray-800 bg-white hover:border-orange-300'
                }`}
              >
                4 Sao ({formatCount(stats.four_star)})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('3')}
                className={`px-5 py-2 border rounded-sm text-lg transition-colors ${
                  activeFilter === '3'
                    ? 'border-orange-500 text-orange-600 bg-white'
                    : 'border-gray-300 text-gray-800 bg-white hover:border-orange-300'
                }`}
              >
                3 Sao ({formatCount(stats.three_star)})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('2')}
                className={`px-5 py-2 border rounded-sm text-lg transition-colors ${
                  activeFilter === '2'
                    ? 'border-orange-500 text-orange-600 bg-white'
                    : 'border-gray-300 text-gray-800 bg-white hover:border-orange-300'
                }`}
              >
                2 Sao ({formatCount(stats.two_star)})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('1')}
                className={`px-5 py-2 border rounded-sm text-lg transition-colors ${
                  activeFilter === '1'
                    ? 'border-orange-500 text-orange-600 bg-white'
                    : 'border-gray-300 text-gray-800 bg-white hover:border-orange-300'
                }`}
              >
                1 Sao ({formatCount(stats.one_star)})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('images')}
                className={`px-5 py-2 border rounded-sm text-lg transition-colors ${
                  activeFilter === 'images'
                    ? 'border-orange-500 text-orange-600 bg-white'
                    : 'border-gray-300 text-gray-800 bg-white hover:border-orange-300'
                }`}
              >
                Có Hình Ảnh / Video ({formatCount(stats.with_images)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danh sách reviews */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Đánh giá của khách hàng ({reviews.length})
        </h3>
        
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">💬</div>
            <p>Chưa có đánh giá nào cho sản phẩm này</p>
            <p className="text-sm">Hãy là người đầu tiên chia sẻ trải nghiệm!</p>
          </div>
        ) : (
          reviews.map((review) => {
            const images = parseReviewImages(review.images);
            const isLikeLoading = likeLoadingIds.has(review.id);
            
            return (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                {/* Header với user và overall rating */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {review.masked_email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{review.masked_email}</p>
                      <div className="flex items-center gap-2">
                        <StarRating value={parseFloat(review.overall_rating)} readonly size="text-sm" />
                        <span className="text-sm text-gray-500">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      {(review.color || review.size) && (
                        <p className="text-sm text-gray-500 mt-1">
                          Phân loại hàng: {review.color || 'N/A'}{review.size ? `, ${review.size}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nhận xét */}
                {review.general_comment && (
                  <div className="mt-3">
                    <p className="text-gray-700">{review.general_comment}</p>
                  </div>
                )}

                {/* Ảnh review */}
                {images.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                    {images.map((imageUrl, index) => (
                      <a
                        key={`${review.id}-${index}`}
                        href={normalizeImageUrl(imageUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="block"
                      >
                        <img
                          src={normalizeImageUrl(imageUrl)}
                          alt={`review-${review.id}-${index}`}
                          className="h-20 w-20 rounded border object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}

                {/* Like review */}
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <button
                    type="button"
                    onClick={() => toggleLikeReview(review.id, Boolean(review.user_liked))}
                    disabled={isLikeLoading}
                    className={`inline-flex items-center gap-1 transition-colors ${
                      review.user_liked ? 'text-blue-600' : 'hover:text-blue-600'
                    } ${isLikeLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {review.user_liked ? <AiFillLike /> : <AiOutlineLike />}
                    <span>{review.user_liked ? 'Đã thích' : 'Hữu ích'}</span>
                  </button>
                  <span>{Number(review.like_count || 0)}</span>
                </div>

                {/* Admin reply */}
                {review.admin_reply && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">A</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800 mb-1">Phản hồi từ cửa hàng</p>
                        <p className="text-sm text-blue-700">{review.admin_reply}</p>
                        <p className="text-xs text-blue-600 mt-1">
                          {formatDate(review.reply_created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReviewList;