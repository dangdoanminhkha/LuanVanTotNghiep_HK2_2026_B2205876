import { useState } from 'react';
import axios from 'axios';
import Modal from './Modal';
import StarRating from './StarRating';
import { useModal } from '../hooks/useModal';
import { normalizeImageUrl } from '../utils/imageUrl';

const MAX_REVIEW_IMAGES = 6;

const ReviewForm = ({ orderItem, onSuccess, onCancel }) => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const { modal, closeModal, showError, showSuccess } = useModal();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewFiles, setReviewFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSelectImages = (event) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'));

    if (!files.length) {
      return;
    }

    const available = MAX_REVIEW_IMAGES - reviewFiles.length;
    const filesToAdd = files.slice(0, available);

    if (!filesToAdd.length) {
      return;
    }

    const urls = filesToAdd.map((file) => URL.createObjectURL(file));
    setReviewFiles((prev) => [...prev, ...filesToAdd]);
    setPreviewUrls((prev) => [...prev, ...urls]);

    event.target.value = '';
  };

  const removeImage = (index) => {
    const url = previewUrls[index];
    if (url) {
      URL.revokeObjectURL(url);
    }

    setReviewFiles((prev) => prev.filter((_, idx) => idx !== index));
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== index));
  };

  const uploadImages = async (token) => {
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
        'Content-Type': 'multipart/form-data',
      },
    });

    return Array.isArray(response.data?.urls) ? response.data.urls : [];
  };

  const cleanUpPreviewUrls = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
  };

  const handleClose = () => {
    cleanUpPreviewUrls();
    onCancel();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!rating || rating < 1 || rating > 5) {
      showError('Lỗi', 'Vui lòng chọn số sao từ 1 đến 5');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const imageUrls = await uploadImages(token);

      await axios.post(`${API_BASE}/api/reviews`, {
        order_item_id: orderItem.order_item_id,
        product_id: orderItem.product_id,
        rating,
        comment: comment.trim(),
        images: imageUrls,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      cleanUpPreviewUrls();
      showSuccess('Thành công', 'Đánh giá thành công');
      onSuccess();
    } catch (error) {
      console.error('Error submitting review:', error);
      showError('Lỗi', error.response?.data?.error || 'Có lỗi xảy ra khi đánh giá');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-start gap-4 mb-6 pb-4 border-b">
            <img
              src={normalizeImageUrl(orderItem.image) || '/placeholder.png'}
              alt={orderItem.name}
              className="w-16 h-16 object-cover rounded border"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{orderItem.name}</h3>
              <p className="text-sm text-gray-500">{orderItem.brand}</p>
              {(orderItem.color || orderItem.size) && (
                <p className="text-sm text-gray-500">
                  Phân loại hàng: {orderItem.color || 'N/A'}{orderItem.size ? `, ${orderItem.size}` : ''}
                </p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <StarRating
              value={rating}
              onChange={setRating}
              showLabel={true}
              label="Đánh giá sao"
              size="text-2xl"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhận xét (tuỳ chọn)
            </label>
            <textarea
              placeholder="Chia sẻ trải nghiệm của bạn..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ảnh đánh giá (tuỳ chọn, tối đa {MAX_REVIEW_IMAGES} ảnh)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleSelectImages}
              className="block w-full text-sm text-gray-600 file:mr-4 file:rounded file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
            />

            {previewUrls.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {previewUrls.map((previewUrl, index) => (
                  <div key={previewUrl} className="relative">
                    <img
                      src={previewUrl}
                      alt={`preview-${index}`}
                      className="h-20 w-20 rounded border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
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

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition"
              disabled={loading}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 rounded-lg transition"
            >
              {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
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

export default ReviewForm;
