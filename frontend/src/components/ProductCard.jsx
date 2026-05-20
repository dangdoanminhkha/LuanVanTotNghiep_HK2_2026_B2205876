import { Link } from 'react-router-dom';
import { useState } from 'react';
import { createProductSlug, parseImages, getProductDisplayImage } from '../utils/productUtils';
import { normalizeImageUrl } from '../utils/imageUrl';
import { behaviorAPI, productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { BsCart3 } from 'react-icons/bs';
import FavoriteButton from './FavoriteButton';

const FALLBACK_SVG_140 = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140"><rect fill="%23E5E7EB" width="140" height="140"/></svg>')}`;

const ProductCard = ({ product, onClick = null, isNew = false, isBestselling = false }) => {
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);

  const handleProductClick = () => {
    behaviorAPI.log({
      action: 'view',
      product_id: product.id
    }).catch(err => console.error('Error logging view:', err));
    
    if (onClick) {
      onClick();
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (addingToCart || !addToCart) return;

    try {
      setAddingToCart(true);
      
      const variantsRes = await productsAPI.getVariantsByProductId(product.id);
      const variants = variantsRes.data || [];

      if (variants.length === 0) {
        alert('Sản phẩm này không có phiên bản khả dụng');
        return;
      }

      const firstVariant = variants[0];
      const variantImages = parseImages(firstVariant.images);

      addToCart({
        product_id: product.id,
        variant_id: firstVariant.id,
        name: product.name,
        color: firstVariant.color,
        size: firstVariant.size,
        price: product.price,
        salePrice: (product.discount_percentage || product.discount || 0) > 0 
          ? Math.round(product.price * (1 - (product.discount_percentage || product.discount) / 100)) 
          : null,
        image: variantImages[0] || product.image || '',
        slug: createProductSlug(product),
        quantity: 1
      });

      behaviorAPI.log({
        action: 'add_to_cart',
        product_id: product.id
      }).catch(() => {});
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      alert('Lỗi khi thêm vào giỏ hàng');
    } finally {
      setAddingToCart(false);
    }
  };

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0, minimumFractionDigits: 0 }) + 'đ';
  };

  const productImage = normalizeImageUrl(getProductDisplayImage(product)) || FALLBACK_SVG_140;

  return (
    <Link
      to={`/products/${createProductSlug(product)}`}
      onClick={handleProductClick}
      className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-lg transition flex flex-col group/card relative"
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 flex gap-2 z-10">
        {isNew && (
          <div className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            Mới
          </div>
        )}
        {isBestselling && (
          <div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            Bán chạy
          </div>
        )}
      </div>

      {/* Discount Badge */}
      {(product.discount_percentage || product.discount || 0) > 0 && (
        <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">
          -{product.discount_percentage || product.discount}%
        </div>
      )}

      {/* Image */}
      <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-100">
        <img
          src={productImage}
          alt={product.name}
          className="w-full h-full object-contain group-hover/card:scale-105 transition-transform duration-300"
          onError={(e) => e.target.src = FALLBACK_SVG_140}
        />
      </div>

      {/* Brand and Actions */}
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold text-gray-600 uppercase">{product.brand}</span>
        <div className="flex gap-1">
          <button
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
            title="Thêm vào giỏ hàng"
          >
            <BsCart3 size={16} />
          </button>
          <div className="p-1.5">
            <FavoriteButton productId={product.id} size={16} />
          </div>
        </div>
      </div>

      {/* Product Name */}
      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 text-sm group-hover/card:text-indigo-600">
        {product.name}
      </h3>

      {/* Rating Stars */}
      <div className="flex items-center gap-1 mb-2">
        <span className="text-yellow-400">★</span>
        <span className="text-xs font-semibold text-gray-700">
          {Number(product.average_rating ?? 0).toFixed(1)}
        </span>
        <span className="text-xs text-gray-500">
          ({product.total_ratings || 0})
        </span>
      </div>

      {/* Sold Info */}
      <p className="text-xs text-gray-500 mb-3">
        {product.sold || product.total_sold ? `${product.sold || product.total_sold} đã bán` : '0 đã bán'}
      </p>

      {/* Price */}
      <div className="mt-auto pt-3 border-t border-gray-100">
        <p className="font-bold text-gray-900 text-sm">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
};

export default ProductCard;
