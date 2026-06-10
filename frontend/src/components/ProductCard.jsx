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
  const discountVal = product.discount_percentage || product.discount || 0;
  const hasDiscount = discountVal > 0;
  const salePrice = hasDiscount ? Math.round(product.price * (1 - discountVal / 100)) : product.price;

  return (
    <Link
      to={`/products/${createProductSlug(product)}`}
      onClick={handleProductClick}
      className="bg-white rounded-2xl p-4 border border-gray-100 premium-shadow premium-card-hover flex flex-col group/card relative overflow-hidden transition-all duration-300"
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
        {isNew && (
          <span className="bg-emerald-500 text-white text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md shadow-sm">
            MỚI
          </span>
        )}
        {isBestselling && (
          <span className="bg-indigo-600 text-white text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md shadow-sm">
            HOT
          </span>
        )}
      </div>

      {/* Discount Badge */}
      {hasDiscount && (
        <div className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm z-10">
          -{discountVal}%
        </div>
      )}

      {/* Image Container with zoom effect */}
      <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-gray-50/80 flex items-center justify-center relative">
        <img
          src={productImage}
          alt={product.name}
          className="w-full h-full object-contain p-2 group-hover/card:scale-110 transition-transform duration-500 ease-out"
          onError={(e) => e.target.src = FALLBACK_SVG_140}
        />
      </div>

      {/* Brand & Action Buttons */}
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-md">{product.brand}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
            title="Thêm vào giỏ hàng"
          >
            <BsCart3 size={15} />
          </button>
          <div className="p-1">
            <FavoriteButton productId={product.id} size={15} />
          </div>
        </div>
      </div>

      {/* Product Name */}
      <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2 text-sm group-hover/card:text-indigo-600 transition-colors duration-200 min-h-[40px] leading-snug">
        {product.name}
      </h3>

      {/* Rating & Sold Info */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-1 text-amber-500">
          <span className="text-sm">★</span>
          <span className="font-bold text-gray-700">
            {Number(product.average_rating ?? 0).toFixed(1)}
          </span>
          <span className="text-gray-400">
            ({product.total_ratings || 0})
          </span>
        </div>
        <span className="text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-md">
          {product.sold || product.total_sold ? `${product.sold || product.total_sold} đã bán` : '0 đã bán'}
        </span>
      </div>

      {/* Price */}
      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
        <div>
          {hasDiscount ? (
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 line-through leading-none mb-1">
                {formatPrice(product.price)}
              </span>
              <span className="font-extrabold text-rose-600 text-base leading-none">
                {formatPrice(salePrice)}
              </span>
            </div>
          ) : (
            <span className="font-extrabold text-gray-900 text-base leading-none">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
