import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeImageUrl } from '../utils/imageUrl';
import FavoriteButton from '../components/FavoriteButton';
import { favoritesAPI } from '../services/api';

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await favoritesAPI.list();

      setFavorites(res.data.favorites || []);
      setError('');
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Không thể tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (productId) => {
    setFavorites(prev => prev.filter(fav => fav.id !== productId));
  };

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString('vi-VN') + 'đ';
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='container mx-auto px-4 max-w-6xl'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Sản Phẩm Yêu Thích</h1>
          <p className='text-gray-600'>
            {favorites.length} sản phẩm đã lưu
          </p>
        </div>

        {error && (
          <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700'>
            {error}
          </div>
        )}

        {loading ? (
          <div className='flex justify-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
          </div>
        ) : favorites.length === 0 ? (
          <div className='text-center py-12 bg-white rounded-lg'>
            <p className='text-gray-600 mb-4'>Bạn chưa có sản phẩm yêu thích nào</p>
            <button
              onClick={() => navigate('/collections/all')}
              className='px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition'
            >
              Khám Phá Sản Phẩm
            </button>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
            {favorites.map(product => (
              <div
                key={product.id}
                onClick={() => navigate(`/products/${product.id}`)}
                className='bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer group'
              >
                {/* Image */}
                <div className='relative overflow-hidden rounded-t-lg bg-gray-100 h-48'>
                  <img
                    src={normalizeImageUrl(product.image || '')}
                    alt={product.name}
                    className='w-full h-full object-contain group-hover:scale-110 transition duration-300'
                    onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23E5E7EB" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="14" fill="%239CA3AF" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E'}
                  />

                  {/* Favorite Button */}
                  <div className='absolute top-3 right-3 bg-white rounded-full p-2 shadow'>
                    <FavoriteButton
                      productId={product.id}
                      size={20}
                      onRemove={handleRemoveFavorite}
                    />
                  </div>
                </div>

                {/* Product Info */}
                <div className='p-4'>
                  <h3 className='font-semibold text-gray-900 line-clamp-2 mb-2'>
                    {product.name}
                  </h3>

                  {/* Price */}
                  <div className='flex items-center gap-2 mt-3'>
                    <span className='text-lg font-bold text-indigo-600'>
                      {formatPrice(product.price)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
