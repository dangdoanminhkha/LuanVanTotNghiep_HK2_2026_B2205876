import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { normalizeImageUrl } from '../utils/imageUrl';

const MAX_REVIEW_IMAGES = 6;

const Reviews = () => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const [reviewableItems, setReviewableItems] = useState([]);
    const [myReviews, setMyReviews] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [reviewForm, setReviewForm] = useState({
        rating: 5,
        comment: ''
    });
    const [reviewFiles, setReviewFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);

    useEffect(() => {
        fetchReviewableItems();
        fetchMyReviews();

        return () => {
            previewUrls.forEach((url) => URL.revokeObjectURL(url));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    const resetReviewModal = () => {
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        setShowReviewModal(false);
        setSelectedItem(null);
        setReviewForm({ rating: 5, comment: '' });
        setReviewFiles([]);
        setPreviewUrls([]);
    };

    const fetchReviewableItems = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE}/api/reviews/reviewable`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReviewableItems(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching reviewable items:', error);
            console.error('Error details:', error.response?.data);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyReviews = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE}/api/reviews/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyReviews(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching my reviews:', error);
            console.error('Error details:', error.response?.data);
        }
    };

    const uploadReviewImages = async (token) => {
        if (!reviewFiles.length) {
            return [];
        }

        const formData = new FormData();
        reviewFiles.forEach((file) => {
            formData.append('images', file);
        });

        const response = await axios.post(`${API_BASE}/api/reviews/upload-images`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        return Array.isArray(response.data?.urls) ? response.data.urls : [];
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!selectedItem || submitting) {
            return;
        }

        if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
            toast.error('Vui lòng chọn số sao từ 1 đến 5');
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const uploadedImageUrls = await uploadReviewImages(token);

            await axios.post(`${API_BASE}/api/reviews`, {
                order_item_id: selectedItem.order_item_id,
                product_id: selectedItem.product_id,
                rating: reviewForm.rating,
                comment: reviewForm.comment.trim(),
                images: uploadedImageUrls
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Đánh giá đã được gửi thành công');
            resetReviewModal();
            fetchReviewableItems();
            fetchMyReviews();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Có lỗi xảy ra khi gửi đánh giá');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkipReview = async (orderItemId) => {
        setReviewableItems((prev) => prev.filter((item) => item.order_item_id !== orderItemId));
        toast.info('Đã bỏ qua đánh giá sản phẩm này');
    };

    const handleSelectReviewImages = (event) => {
        const selectedFiles = Array.from(event.target.files || []).filter((file) =>
            file.type.startsWith('image/')
        );

        if (!selectedFiles.length) {
            return;
        }

        const availableSlots = MAX_REVIEW_IMAGES - reviewFiles.length;
        const filesToAdd = selectedFiles.slice(0, availableSlots);

        if (!filesToAdd.length) {
            toast.info(`Bạn chỉ có thể tải tối đa ${MAX_REVIEW_IMAGES} ảnh`);
            return;
        }

        const nextPreviewUrls = filesToAdd.map((file) => URL.createObjectURL(file));
        setReviewFiles((prev) => [...prev, ...filesToAdd]);
        setPreviewUrls((prev) => [...prev, ...nextPreviewUrls]);

        if (selectedFiles.length > filesToAdd.length) {
            toast.info(`Chỉ nhận tối đa ${MAX_REVIEW_IMAGES} ảnh cho mỗi đánh giá`);
        }

        event.target.value = '';
    };

    const removeSelectedImage = (indexToRemove) => {
        const preview = previewUrls[indexToRemove];
        if (preview) {
            URL.revokeObjectURL(preview);
        }

        setReviewFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
        setPreviewUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const renderStarRating = (rating, setRating) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl ${
                            star <= rating ? 'text-yellow-400' : 'text-gray-300'
                        } hover:text-yellow-400 transition-colors`}
                    >
                        ★
                    </button>
                ))}
            </div>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const safeReviewableItems = Array.isArray(reviewableItems) ? reviewableItems : [];
    const safeMyReviews = Array.isArray(myReviews) ? myReviews : [];
    const pendingItems = safeReviewableItems.filter((item) => !item.existing_review_id);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Đánh giá sản phẩm</h1>

            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 font-medium text-sm ${
                        activeTab === 'pending'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Chờ đánh giá ({pendingItems.length})
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`px-4 py-2 font-medium text-sm ${
                        activeTab === 'completed'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Đã đánh giá ({safeMyReviews.length})
                </button>
            </div>

            {activeTab === 'pending' && (
                <div>
                    {pendingItems.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">📝</div>
                            <p className="text-gray-500">Không có sản phẩm nào cần đánh giá</p>
                            <p className="text-sm text-gray-400 mt-2">
                                Các sản phẩm từ đơn hàng đã giao và đã thanh toán sẽ xuất hiện ở đây
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingItems.map((item) => (
                                <div key={item.order_item_id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <Link to={`/products/${item.product_id}`}>
                                            <img
                                                src={normalizeImageUrl(item.image) || '/placeholder-shoe.jpg'}
                                                alt={item.name}
                                                className="w-20 h-20 object-cover rounded hover:shadow-lg transition-shadow cursor-pointer"
                                            />
                                        </Link>
                                        <div className="flex-1">
                                            <Link
                                                to={`/products/${item.product_id}`}
                                                className="font-medium text-lg hover:text-blue-600 transition-colors"
                                            >
                                                <h3>{item.name}</h3>
                                            </Link>
                                            <p className="text-gray-500">{item.brand}</p>
                                            {(item.color || item.size) && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Phân loại hàng: {item.color || 'N/A'}{item.size ? `, ${item.size}` : ''}
                                                </p>
                                            )}
                                            <p className="text-sm text-gray-400">
                                                Đã giao: {formatDate(item.delivered_at)}
                                            </p>
                                            <p className="text-xs text-blue-600">Mã đơn hàng: #{item.order_id}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setShowReviewModal(true);
                                                }}
                                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                                            >
                                                Đánh giá
                                            </button>
                                            <button
                                                onClick={() => handleSkipReview(item.order_item_id)}
                                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                                            >
                                                Không đánh giá
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'completed' && (
                <div>
                    {safeMyReviews.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">⭐</div>
                            <p className="text-gray-500">Bạn chưa có đánh giá nào</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {safeMyReviews.map((review) => {
                                const reviewImages = parseReviewImages(review.images);

                                return (
                                    <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-4">
                                            <Link to={`/products/${review.product_id}`}>
                                                <img
                                                    src={normalizeImageUrl(review.product_image) || '/placeholder-shoe.jpg'}
                                                    alt={review.product_name}
                                                    className="w-20 h-20 object-cover rounded hover:shadow-lg transition-shadow cursor-pointer"
                                                />
                                            </Link>
                                            <div className="flex-1">
                                                <Link
                                                    to={`/products/${review.product_id}`}
                                                    className="font-medium text-lg mb-2 hover:text-blue-600 transition-colors"
                                                >
                                                    <h3>{review.product_name}</h3>
                                                </Link>

                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-yellow-400 text-lg">
                                                        {'★'.repeat(Math.floor(Number(review.rating || 0)))}
                                                    </span>
                                                    <span className="text-gray-600">{review.rating}/5</span>
                                                </div>

                                                {(review.color || review.size) && (
                                                    <p className="text-sm text-gray-500 mb-2">
                                                        Phân loại hàng: {review.color || 'N/A'}{review.size ? `, ${review.size}` : ''}
                                                    </p>
                                                )}

                                                {review.comment && (
                                                    <div className="mb-3">
                                                        <p className="text-gray-700">{review.comment}</p>
                                                    </div>
                                                )}

                                                {reviewImages.length > 0 && (
                                                    <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                                                        {reviewImages.map((imageUrl, index) => (
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

                                                {review.admin_reply && (
                                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-4">
                                                        <p className="text-sm font-medium text-blue-800 mb-1">Phản hồi từ shop:</p>
                                                        <p className="text-blue-700">{review.admin_reply}</p>
                                                        <p className="text-xs text-blue-600 mt-1">
                                                            {formatDate(review.reply_created_at)}
                                                        </p>
                                                    </div>
                                                )}

                                                <p className="text-sm text-gray-400 mt-4">
                                                    Đánh giá vào: {formatDate(review.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {showReviewModal && selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Đánh giá sản phẩm</h2>
                            <button
                                onClick={resetReviewModal}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <img
                                src={normalizeImageUrl(selectedItem.image) || '/placeholder-shoe.jpg'}
                                alt={selectedItem.name}
                                className="w-16 h-16 object-cover rounded"
                            />
                            <div>
                                <h3 className="font-medium">{selectedItem.name}</h3>
                                <p className="text-gray-500">{selectedItem.brand}</p>
                                {(selectedItem.color || selectedItem.size) && (
                                    <p className="text-sm text-gray-500">
                                        Phân loại hàng: {selectedItem.color || 'N/A'}{selectedItem.size ? `, ${selectedItem.size}` : ''}
                                    </p>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleReviewSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Đánh giá sao</label>
                                {renderStarRating(
                                    reviewForm.rating,
                                    (rating) => setReviewForm({ ...reviewForm, rating })
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nhận xét (tuỳ chọn)
                                </label>
                                <textarea
                                    value={reviewForm.comment}
                                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                                    className="w-full p-3 border border-gray-300 rounded-lg resize-none h-32"
                                    rows={4}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ảnh đánh giá (tuỳ chọn, tối đa {MAX_REVIEW_IMAGES} ảnh)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleSelectReviewImages}
                                    className="block w-full text-sm text-gray-600 file:mr-4 file:rounded file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                                />

                                {previewUrls.length > 0 && (
                                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                                        {previewUrls.map((previewUrl, index) => (
                                            <div key={previewUrl} className="relative">
                                                <img
                                                    src={previewUrl}
                                                    alt={`selected-preview-${index}`}
                                                    className="h-20 w-20 rounded border object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeSelectedImage(index)}
                                                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs leading-5"
                                                    aria-label="Xóa ảnh"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:bg-blue-300"
                                >
                                    {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetReviewModal}
                                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                                >
                                    Hủy bỏ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reviews;
