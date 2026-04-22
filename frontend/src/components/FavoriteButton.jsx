import { useState, useEffect } from 'react';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { favoritesAPI } from '../services/api';

const FavoriteButton = ({ productId, size = 24, className = '', onRemove }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if product is already favorited on mount
  useEffect(() => {
    if (productId) {
      checkFavoriteStatus();
    }
  }, [productId]);

  const checkFavoriteStatus = async () => {
    try {
      const res = await favoritesAPI.check([productId]);

      setIsFavorited(res.data.favorited[productId] || false);
    } catch (err) {
      console.error('Error checking favorite status:', err);
    }
  };

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setLoading(true);

      if (isFavorited) {
        // Remove from favorites
        await favoritesAPI.remove(productId);
        if (typeof onRemove === 'function') {
          onRemove(productId);
        }
      } else {
        // Add to favorites
        await favoritesAPI.add(productId);
      }

      setIsFavorited(!isFavorited);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={loading}
      className={`transition-colors duration-200 hover:scale-110 ${className}`}
      title={isFavorited ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
    >
      {isFavorited ? (
        <AiFillHeart size={size} className='text-red-500' />
      ) : (
        <AiOutlineHeart size={size} className='text-gray-400 hover:text-red-500' />
      )}
    </button>
  );
};

export default FavoriteButton;
