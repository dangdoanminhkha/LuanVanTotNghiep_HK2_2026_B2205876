import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import ReviewForm from '../components/ReviewForm';
import StarRating from '../components/StarRating';
import axios from 'axios';
import { normalizeImageUrl } from '../utils/imageUrl';

const MyReviews = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reviewable'); // 'reviewable' | 'reviewed'
  const [reviewableItems, setReviewableItems] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [reviewableRes, reviewsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/reviews/reviewable', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/reviews/my', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setReviewableItems(reviewableRes.data || []);
      setMyReviews(reviewsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    setSelectedItem(null);
    fetchData(); // Reload data
  };

  const parseReviewImages = (images) => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }
    return [];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const notReviewedItems = reviewableItems.filter(item => !item.existing_review_id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Đánh giá của tôi</h1>
        <p className="text-gray-600">Quản lý các đánh giá sản phẩm của bạn</p>
      </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('reviewable')}
              className={`flex-1 px-6 py-4 text-center font-medium transition ${
                activeTab === 'reviewable'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Chờ đánh giá ({notReviewedItems.length})
            </button>
            <button
              onClick={() => setActiveTab('reviewed')}
              className={`flex-1 px-6 py-4 text-center font-medium transition ${
                activeTab === 'reviewed'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Đã đánh giá ({myReviews.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'reviewable' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Sản phẩm chờ đánh giá</h2>
            
            {notReviewedItems.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Không có sản phẩm nào cần đánh giá
                </h3>
                <p className="text-gray-500">
                  Các sản phẩm bạn đã mua và nhận hàng sẽ xuất hiện ở đây
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {notReviewedItems.map((item) => (
                  <div key={item.order_item_id} className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="flex items-center gap-4">
                      <img 
                        src={normalizeImageUrl(item.image) || '/placeholder.png'} 
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded border"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.brand}</p>
                        <p className="text-sm text-gray-400">
                          Đã giao: {formatDate(item.delivered_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowReviewForm(true);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition"
                      >
                        Đánh giá
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviewed' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Đánh giá đã gửi</h2>
            
            {myReviews.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">⭐</div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Bạn chưa có đánh giá nào
                </h3>
                <p className="text-gray-500">
                  Hãy đánh giá sản phẩm để chia sẻ trải nghiệm với cộng đồng!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myReviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="flex items-start gap-4">
                      <img 
                        src={normalizeImageUrl(review.product_image) || '/placeholder.png'} 
                        alt={review.product_name}
                        className="w-16 h-16 object-cover rounded border"
                      />
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-medium text-gray-800">{review.product_name}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <StarRating value={parseFloat(review.rating || 0)} readonly size="text-sm" />
                            <span className="text-sm text-gray-500">
                              {formatDate(review.created_at)}
                            </span>
                          </div>
                        </div>

                        {(review.color || review.size) && (
                          <p className="text-sm text-gray-500">
                            Phân loại hàng: {review.color || 'N/A'}{review.size ? `, ${review.size}` : ''}
                          </p>
                        )}

                        {review.comment && (
                          <div className="text-gray-700 bg-gray-50 p-3 rounded">
                            <span className="text-sm font-medium text-gray-600">Nhận xét: </span>
                            {review.comment}
                          </div>
                        )}

                        {parseReviewImages(review.images).length > 0 && (
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                            {parseReviewImages(review.images).map((imageUrl, index) => (
                              <a
                                key={`${review.id}-${index}`}
                                href={normalizeImageUrl(imageUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="block"
                              >
                                <img
                                  src={normalizeImageUrl(imageUrl)}
                                  alt={`my-review-${review.id}-${index}`}
                                  className="h-20 w-20 rounded border object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Admin reply */}
                        {review.admin_reply && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                            <div className="flex items-start gap-2">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">A</span>
                              </div>
                              <div>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Review Form Modal */}
        {showReviewForm && selectedItem && (
          <ReviewForm
            orderItem={selectedItem}
            onSuccess={handleReviewSuccess}
            onCancel={() => {
              setShowReviewForm(false);
              setSelectedItem(null);
            }}
          />
        )}
      </div>
    );
};

export default MyReviews;