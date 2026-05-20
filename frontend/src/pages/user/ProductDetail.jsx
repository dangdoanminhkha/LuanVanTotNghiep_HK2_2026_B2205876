import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { productsAPI, behaviorAPI } from '../../services/api';
import { extractIdFromSlug, parseImages, createProductSlug } from '../../utils/productUtils';
import { normalizeImageUrl } from '../../utils/imageUrl';
import { useCart } from '../../context/CartContext';
import { AiOutlineCheckCircle, AiOutlineClose } from 'react-icons/ai';
import { BsCart3 } from 'react-icons/bs';
import ReviewList from '../../components/ReviewList';
import StarRating from '../../components/StarRating';
import FavoriteButton from '../../components/FavoriteButton';

// SVG fallbacks for different image sizes
const FALLBACK_SVG_500 = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect fill="%23E5E7EB" width="500" height="500"/><text x="50%" y="50%" font-family="Arial" font-size="20" fill="%239CA3AF" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>')}`;
const FALLBACK_SVG_140 = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140"><rect fill="%23E5E7EB" width="140" height="140"/><text x="50%" y="50%" font-family="Arial" font-size="12" fill="%239CA3AF" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>')}`;
const FALLBACK_SVG_ZOOM = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect fill="%23E5E7EB" width="800" height="600"/><text x="50%" y="50%" font-family="Arial" font-size="32" fill="%239CA3AF" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>')}`;

// Translate common specification keys to Vietnamese labels
const translateSpecKey = (key) => {
  if (!key) return '';
  const raw = String(key).trim();
  // Chuẩn hóa: đổi sang chữ thường, thay '_' hoặc '-' thành khoảng trắng, xóa ':' ở cuối
  const normalized = raw.toLowerCase().replace(/[_-]+/g, ' ').replace(/:\s*$/, '').trim();
  
  const m = {
    // --- Các trường gốc của bạn ---
    'material': 'Chất liệu',
    'chất liệu': 'Chất liệu',
    'style': 'Kiểu dáng',
    'kiểu dáng': 'Kiểu dáng',
    'purpose': 'Mục đích',
    'mục đích': 'Mục đích',
    'outsole': 'Đế giày',
    'đế giày': 'Đế giày',
    'color': 'Màu sắc',
    'màu': 'Màu sắc',
    'weight': 'Trọng lượng',
    'dimensions': 'Kích thước',
    'kích thước': 'Kích thước',
    'brand': 'Thương hiệu',
    'thương hiệu': 'Thương hiệu',
    'warranty': 'Bảo hành',
    'bảo hành': 'Bảo hành',
    'origin': 'Xuất xứ',
    'xuất xứ': 'Xuất xứ',
    'size': 'Kích cỡ',
    'size guide': 'Hướng dẫn chọn size',
    
    // --- Bổ sung thêm các trường đặc thù của dữ liệu giày dép ---
    'department': 'Đối tượng',
    'đối tượng': 'Đối tượng',
    'gender': 'Giới tính',
    'giới tính': 'Giới tính',
    'closure': 'Kiểu buộc/cài',
    'closure type': 'Kiểu buộc/cài',
    'sole': 'Chất liệu đế',
    'sole material': 'Chất liệu đế',
    'outer material': 'Chất liệu vỏ',
    'inner material': 'Chất liệu lót',
    'lining': 'Lớp lót',
    'lining description': 'Lớp lót',
    'occasion': 'Dịp sử dụng',
    'features': 'Tính năng',
    'tính năng': 'Tính năng',
    'model': 'Mẫu sản phẩm',
    'model number': 'Mã mẫu sản phẩm',
    'type': 'Loại sản phẩm',
    'season': 'Mùa',
    'mùa': 'Mùa',
    'heel height': 'Chiều cao gót',
    'heel type': 'Kiểu gót',
    'toe style': 'Kiểu mũi giày',
    'shaft height': 'Chiều cao cổ giày',
    'fabric type': 'Loại vải',
    'water resistance level': 'Độ chống nước',
    'care instructions': 'Hướng dẫn bảo quản'
  };

  return m[normalized] || m[raw.toLowerCase()] || raw;
};

const ProductDetail = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const id = extractIdFromSlug(slug) || slug; // Extract ID from slug or use as fallback
  const selectedColorParam = searchParams.get('mau') || null;
  
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [currentVariant, setCurrentVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const [zoomedImage, setZoomedImage] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [reviewStats, setReviewStats] = useState(null);

  // ML Recommendation states
  const [similarProducts, setSimilarProducts] = useState([]);
  const [frequentlyBought, setFrequentlyBought] = useState([]);
  const [viewedProducts, setViewedProducts] = useState([]);
  const [topSellerIds, setTopSellerIds] = useState([]);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const [prodRes, varRes] = await Promise.all([
          productsAPI.getBaseById(id),
          productsAPI.getVariantsByProductId(id)
        ]);
        
        setProduct(prodRes.data);
        setVariants(varRes.data);
        // Don't set mainImage here, let the color useEffect handle it

        if (varRes.data.length > 0) {
          // Set color based on URL parameter or default to first variant
          const targetColor = selectedColorParam || varRes.data[0].color;
          const targetVariant = varRes.data.find(v => v.color === targetColor) || varRes.data[0];
          
          setSelectedColor(targetVariant.color);
          setSelectedSize(targetVariant.size);
          setCurrentVariant(targetVariant);
          
          // Set images from variant only, don't fallback to product image
          const variantImages = parseImages(targetVariant.images);
          if (variantImages.length > 0) {
            setMainImage(variantImages[0]);
          } else {
            setMainImage(''); // Clear image if variant has no images
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải chi tiết sản phẩm:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, [id, selectedColorParam]);

  // Log product view event for ML recommendations (works for both guests and authenticated users)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (product && product.id) {
      // Log behavior for both guests (via session_id) and authenticated users (via token)
      behaviorAPI.log({
        action: 'view',
        product_id: product.id
      }).catch(() => {}); // Silently ignore logging errors for better UX

      // Fetch từng nhóm độc lập: 1 endpoint lỗi không làm mất toàn bộ section.
      Promise.allSettled([
        behaviorAPI.getSimilar(product.id, 8),
        behaviorAPI.getFrequentlyBought(product.id, 6),
        behaviorAPI.getViewed(product.id, 8),
        behaviorAPI.getTrending(10),
      ]).then(([simRes, freqRes, viewedRes, trendRes]) => {
        setSimilarProducts(simRes.status === 'fulfilled' ? (simRes.value?.data || []) : []);
        setFrequentlyBought(freqRes.status === 'fulfilled' ? (freqRes.value?.data || []) : []);
        setViewedProducts(viewedRes.status === 'fulfilled' ? (viewedRes.value?.data || []) : []);
        const trendingProducts = trendRes.status === 'fulfilled' ? (trendRes.value?.data || []) : [];
        setTopSellerIds(trendingProducts.map(p => p.id));
      });
    }
  }, [product]);

  // Handle color parameter changes from URL
  useEffect(() => {
    if (variants.length > 0) {
      let targetColor = null;
      
      if (selectedColorParam) {
        // Decode the URL parameter and find exact match
        const decodedColor = decodeURIComponent(selectedColorParam);
        const foundVariant = variants.find(v => v.color === decodedColor);
        if (foundVariant) {
          targetColor = decodedColor;
        }
      }
      
      // Fallback to first variant if no match found
      if (!targetColor) {
        targetColor = variants[0].color;
      }
      
      const targetVariant = variants.find(v => v.color === targetColor);
      
      if (targetVariant && targetVariant.color !== selectedColor) {
        setSelectedColor(targetVariant.color);
        setSelectedSize(targetVariant.size);
        setCurrentVariant(targetVariant);
        
        // Set images from variant
        const variantImages = parseImages(targetVariant.images);
        if (variantImages.length > 0) {
          setMainImage(variantImages[0]);
        } else {
          // Clear main image if variant has no images
          setMainImage('');
        }
      }
    }
  }, [variants, selectedColorParam, product, selectedColor]);

  // Handle color switching with URL update
  const handleColorChange = (newColor) => {
    const newVariant = variants.find(v => v.color === newColor);
    if (newVariant) {
      // Update URL with color parameter (use exact color value)
      const newParams = new URLSearchParams(searchParams);
      newParams.set('mau', encodeURIComponent(newColor));
      setSearchParams(newParams);
      
      // Update state immediately
      setSelectedColor(newColor);
      setSelectedSize(newVariant.size);
      setCurrentVariant(newVariant);
      
      // Update images immediately
      const variantImages = parseImages(newVariant.images);
      if (variantImages.length > 0) {
        setMainImage(variantImages[0]);
      } else {
        // Clear main image if variant has no images
        setMainImage('');
      }
    }
  };

  // Handle size change within same color
  const handleSizeChange = (newSize) => {
    const newVariant = variants.find(v => v.color === selectedColor && v.size === newSize);
    if (newVariant) {
      setSelectedSize(newSize);
      setCurrentVariant(newVariant);
    }
  };

  // Get images for current variant
  const getCurrentImages = () => {
    if (currentVariant && currentVariant.images) {
      const variantImages = parseImages(currentVariant.images);
      if (variantImages.length > 0) {
        return variantImages;
      }
    }
    // Return empty array if no variant images, don't fallback to product image
    return [];
  };

  const currentImages = !loading && product ? getCurrentImages() : [];

  if (loading) return (
    <div className="flex justify-center items-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );
  
  if (!product) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold text-gray-800">Không tìm thấy sản phẩm</h2>
      <Link to="/products" className="text-indigo-600 hover:underline mt-4 inline-block">Quay lại cửa hàng</Link>
    </div>
  );

  // Group variants by color
  const colors = [...new Set(variants.map(v => v.color))];
  const variantsForColor = variants.filter(v => v.color === selectedColor);
  const sizesForColor = variantsForColor.map(v => v.size);

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0, minimumFractionDigits: 0 }) + 'đ';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 lg:items-start">
        
      {/* Image Gallery */}
        <div className="flex flex-col">
          
          {/* Main Image (Ảnh Lớn) - Cấp chiều cao 500px, dùng object-contain để giữ tỉ lệ gốc */}
          <div className="w-full h-[500px] bg-white rounded-2xl flex items-center justify-center overflow-hidden group relative mb-4 border border-gray-100">
            {mainImage ? (
              <img 
                src={normalizeImageUrl(mainImage)} 
                alt={product.name} 
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 cursor-zoom-in" 
                onClick={() => setZoomedImage(mainImage)}
                onError={(e) => e.target.src = FALLBACK_SVG_500}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50 rounded-xl">
                <span className="text-4xl">📷</span>
              </div>
            )}
          </div>

          {/* Thumbnail Images (Ảnh Nhỏ) - Cấp chiều cao 140px, dùng object-contain */}
          <div className="grid grid-cols-2 gap-4">
            {currentImages.slice(1, 3).map((image, index) => (
              <div 
                key={index}
                className="h-[140px] bg-white rounded-xl flex items-center justify-center overflow-hidden cursor-zoom-in hover:opacity-80 transition-opacity border border-gray-100"
                onClick={() => setZoomedImage(image)}
              >
                <img 
                  src={normalizeImageUrl(image)} 
                  alt={`${product.name} view ${index + 2}`} 
                  className="w-full h-full object-contain"
                  onError={(e) => e.target.src = FALLBACK_SVG_140}
                />
              </div>
            ))}
            
            {/* Show empty slots */}
            {currentImages.length === 1 && (
              <>
                <div className="h-[140px] bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 border border-gray-100"><span className="text-2xl">📷</span></div>
                <div className="h-[140px] bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 border border-gray-100"><span className="text-2xl">📷</span></div>
              </>
            )}
            {currentImages.length === 2 && (
              <div className="h-[140px] bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 border border-gray-100"><span className="text-2xl">📷</span></div>
            )}
            {currentImages.length === 0 && (
              <>
                <div className="h-[140px] bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 border border-gray-100"><span className="text-2xl">📷</span></div>
                <div className="h-[140px] bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 border border-gray-100"><span className="text-2xl">📷</span></div>
              </>
            )}
          </div>
        </div>
        {/* Product Info */}
        <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">{product.brand}</p>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-4">{product.name}</h1>
            </div>
            <div className="flex gap-2">
              <FavoriteButton productId={product.id} size={24} />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <h2 className="sr-only">Product information</h2>
            <p className="text-4xl font-black text-gray-900">{formatPrice(product.price)}</p>
            <div className="flex items-center gap-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    className={`text-lg ${
                      star <= Math.round(Number(reviewStats?.average_rating) || 5)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm text-gray-500 font-bold">({(Number(reviewStats?.average_rating) || 5).toFixed(1)}/5)</span>
            </div>
          </div>

          <div className="mt-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${currentVariant?.stock > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              <div className={`w-2 h-2 rounded-full ${currentVariant?.stock > 0 ? 'bg-green-600' : 'bg-red-600'}`}></div>
              {currentVariant?.stock > 0 ? `Còn ${currentVariant.stock} sản phẩm` : 'Hết hàng'}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Màu sắc: <span className="text-gray-500">{selectedColor}</span></h3>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all font-medium ${
                    selectedColor === color 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                      : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Kích thước</h3>
              <button className="text-[11px] font-bold text-indigo-600 hover:underline">Hướng dẫn chọn size</button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {sizesForColor.map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeChange(size)}
                  className={`py-3 text-sm font-black rounded-xl border transition-all ${
                    selectedSize === size
                      ? 'bg-gray-900 text-white border-gray-900 shadow-xl'
                      : 'bg-white text-gray-900 border-gray-100 hover:border-gray-900'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <div className="flex items-center border-2 border-gray-100 rounded-2xl px-4 py-2">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-2xl font-bold p-2">-</button>
              <span className="w-12 text-center font-black text-xl">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="text-2xl font-bold p-2">+</button>
            </div>
            <button
              onClick={() => {
                if (currentVariant && currentVariant.stock > 0 && selectedSize) {
                  // Log add to cart action for ML recommendations
                  behaviorAPI.log({
                    action: 'add_to_cart',
                    product_id: product.id
                  }).catch(err => console.error('Error logging add_to_cart:', err));

                  const variantImages = parseImages(currentVariant.images);
                  addToCart({
                    product_id: product.id,
                    variant_id: currentVariant.id,
                    name: product.name,
                    color: selectedColor,
                    size: selectedSize,
                    price: product.price,
                    salePrice: product.discount > 0 ? Math.round(product.price * (1 - product.discount / 100)) : null,
                    image: variantImages[0] || product.image || '',
                    slug: slug,
                    quantity: quantity
                  });
                  setAddedToCart(true);
                  setTimeout(() => setAddedToCart(false), 3000);
                }
              }}
              className={`flex-1 ${addedToCart ? 'bg-green-600' : 'bg-indigo-600'} text-white px-8 py-5 rounded-[20px] font-black text-lg shadow-xl ${addedToCart ? 'shadow-green-200' : 'shadow-indigo-200'} hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest disabled:bg-gray-400 disabled:shadow-none`}
              disabled={!currentVariant || currentVariant.stock <= 0 || !selectedSize}
            >
              {addedToCart ? (
                <>
                  <AiOutlineCheckCircle size={24} />
                  Đã thêm vào giỏ
                </>
              ) : currentVariant?.stock > 0 ? (
                'Thêm vào giỏ hàng'
              ) : (
                'Hết hàng'
              )}
            </button>
          </div>

          {/* Policy Banners */}
          <div className="mt-12 grid grid-cols-2 gap-4 border-t border-gray-100 pt-8">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">🛡️</div>
              <div>
                <h4 className="text-xs font-black uppercase">Bảo hành</h4>
                <p className="text-[11px] text-gray-500 font-bold">03 tháng tận tâm</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-green-600 group-hover:text-white transition-colors">🚚</div>
              <div>
                <h4 className="text-xs font-black uppercase">Vận chuyển</h4>
                <p className="text-[11px] text-gray-500 font-bold">Miễn phí cho mọi đơn hàng</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Specs */}
      <div className="mt-20 border-t border-gray-100 pt-20">
        <div className="max-w-3xl">
          <h3 className="text-3xl font-black text-gray-900 mb-8 uppercase tracking-tighter">Mô tả sản phẩm</h3>
          <div className="text-gray-700 space-y-6">
            <div className="bg-gradient-to-br from-indigo-50 to-transparent border-l-4 border-indigo-600 rounded-br-2xl p-6">
              <p className="text-lg leading-relaxed font-medium">
                {product.description || 'Sản phẩm mới với thiết kế hiện đại, mang lại cảm giác thoải mái tối ưu cho người sử dụng.'}
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                <h3 className="text-3xl font-black text-gray-900 mb-8 uppercase tracking-tighter">Thông số kỹ thuật</h3>
                <div className="grid grid-cols-2 gap-y-4 text-sm gap-x-6">
                  {(() => {
                    const specRaw = product?.specification;
                    if (!specRaw) return (<div className="text-sm text-gray-500 col-span-2">Chưa có thông số kỹ thuật.</div>);

                    let rows = [];
                    try {
                      if (typeof specRaw === 'object') {
                        if (Array.isArray(specRaw)) {
                          rows = specRaw.map(item => {
                            if (typeof item === 'string') {
                              if (item.includes(':')) {
                                const [k, v] = item.split(':').map(s => s.trim());
                                return { k, v };
                              }
                              return { k: item, v: '' };
                            } else if (item && (item.name || item.key)) {
                              return { k: item.name || item.key, v: item.value ?? '' };
                            } else {
                              const entries = Object.entries(item || {});
                              if (entries.length > 0) return { k: entries[0][0], v: entries[0][1] };
                              return { k: JSON.stringify(item), v: '' };
                            }
                          });
                        } else {
                          rows = Object.entries(specRaw).map(([k, v]) => ({ k, v }));
                        }
                      } else if (typeof specRaw === 'string') {
                        const txt = specRaw.trim();
                        if ((txt.startsWith('{') || txt.startsWith('['))) {
                          const parsed = JSON.parse(txt);
                          if (Array.isArray(parsed)) {
                            rows = parsed.map(item => {
                              if (typeof item === 'string') return { k: item, v: '' };
                              if (item && (item.name || item.key)) return { k: item.name || item.key, v: item.value ?? '' };
                              if (typeof item === 'object') return Object.entries(item).map(([k, v]) => ({ k, v }))[0];
                              return { k: String(item), v: '' };
                            }).flat();
                          } else if (typeof parsed === 'object') {
                            rows = Object.entries(parsed).map(([k, v]) => ({ k, v }));
                          }
                        } else {
                          const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                          rows = lines.map(line => {
                            if (line.includes(':')) {
                              const [k, v] = line.split(':').map(s => s.trim());
                              return { k, v };
                            } else if (line.includes('|')) {
                              const [k, v] = line.split('|').map(s => s.trim());
                              return { k, v };
                            } else if (line.includes(';')) {
                              const [k, v] = line.split(';').map(s => s.trim());
                              return { k, v };
                            }
                            return { k: line, v: '' };
                          });
                        }
                      }
                    } catch (err) {
                      console.warn('Failed to parse product.specification:', err);
                      rows = [{ k: 'Thông số (raw)', v: String(specRaw) }];
                    }

                    if (!rows || rows.length === 0) return (<div className="text-sm text-gray-500 col-span-2">Không tìm thấy dữ liệu thông số.</div>);

                    return rows.map((r, i) => (
                      <div key={i} className="flex justify-between border-b border-gray-200 pb-3">
                        <span className="font-bold text-gray-600">{translateSpecKey(r.k)}</span>
                        <span className="font-semibold text-gray-900">{r.v}</span>
                      </div>
                    ));
                  })()}
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews */}
      <div className="mt-20 border-t border-gray-100 pt-20">
        <div className="flex items-center gap-4 mb-8">
          <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
            Đánh giá từ khách hàng
          </h3>
          {reviewStats && reviewStats.total_reviews > 0 && (
            <div className="flex items-center gap-2">
              <StarRating value={Math.round(Number(reviewStats?.average_rating) || 0)} readonly size="text-lg" />
              <span className="text-lg font-bold text-gray-700">
                {parseFloat(reviewStats?.average_rating || 0).toFixed(1)}
              </span>
              <span className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-600 font-medium">
                {reviewStats.total_reviews} đánh giá
              </span>
            </div>
          )}
        </div>
        
        <ReviewList 
          productId={product.id} 
          onStatsUpdate={(stats) => setReviewStats(stats)}
        />
      </div>

      {/* ── ML Carousel 1: Sản phẩm tương tự (CBF) ─────────────────── */}
      {similarProducts.length > 0 && (
        <MLProductCarousel
          title="Sản phẩm tương tự"
          subtitle="Dựa trên đặc trưng sản phẩm bạn đang xem"
          products={similarProducts}
          formatPrice={formatPrice}
          addToCart={addToCart}
          isAiSuggested={true}
          variants={variants}
          type="similar"
          topSellerIds={topSellerIds}
        />
      )}

      {/* ── ML Carousel 2: Frequently Bought Together (Item-based CF) ── */}
      {frequentlyBought.length > 0 && (
        <MLProductCarousel
          title="Khách hàng xem sản phẩm này cũng mua"
          subtitle="Dựa trên hành vi mua sắm của khách hàng khác"
          products={frequentlyBought}
          formatPrice={formatPrice}
          addToCart={addToCart}
          isAiSuggested={true}
          variants={variants}
          type="frequently"
          topSellerIds={topSellerIds}
        />
      )}

      {/* ── Recently Viewed: Sản phẩm bạn đã xem ───────────────────── */}
      {viewedProducts.length > 0 && (
        <MLProductCarousel
          title="Sản phẩm bạn đã xem"
          subtitle="Danh sách sản phẩm bạn vừa xem gần đây"
          products={viewedProducts}
          formatPrice={formatPrice}
          variants={variants}
          type="viewed"
          topSellerIds={topSellerIds}
        />
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
          {/* Overlay behind the image to catch background clicks without blocking wheel/scroll on the image */}
          <div
            className="absolute inset-0 z-0"
            onClick={() => setZoomedImage(null)}
          />
          <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 z-20 bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <AiOutlineClose className="text-xl" />
            </button>
            <img
              src={normalizeImageUrl(zoomedImage)}
              alt={product.name}
              className="max-w-full max-h-screen object-contain"
              onError={(e) => e.target.src = FALLBACK_SVG_ZOOM}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ── Inline component – ML Product Carousel ──────────────────────────────────
const MLProductCarousel = ({ title, subtitle, products, formatPrice, addToCart, isAiSuggested = false, variants, type = 'similar', topSellerIds = [] }) => {
  const [startIdx, setStartIdx] = useState(0);
  const itemsPerView = 4;

  // Helper: Kiểm tra sản phẩm có phải "new" không (< 7 ngày)
  const isNewProduct = (createdAt) => {
    if (!createdAt) return false;
    const productDate = new Date(createdAt);
    const now = new Date();
    const daysAgo = (now - productDate) / (1000 * 60 * 60 * 24);
    return daysAgo < 7;
  };

  // Helper: Kiểm tra sản phẩm có phải "bestselling" không (có trong top 10 sellers)
  const isBestselling = (productId) => {
    return topSellerIds.includes(productId);
  };

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    if (!addToCart || !variants) return;
    
    const productVariants = variants.filter(v => v.product_id === product.id);
    if (productVariants.length === 0) return;
    
    const firstVariant = productVariants[0];
    const variantImages = parseImages(firstVariant.images);
    
    addToCart({
      product_id: product.id,
      variant_id: firstVariant.id,
      name: product.name,
      color: firstVariant.color,
      size: firstVariant.size,
      price: product.price,
      salePrice: product.discount > 0 ? Math.round(product.price * (1 - product.discount / 100)) : null,
      image: variantImages[0] || product.image || '',
      slug: createProductSlug(product),
      quantity: 1,
      isAiSuggested: isAiSuggested
    });
  };

  return (
    <div className="mt-20 border-t border-gray-100 pt-16">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>

      <div className="relative group">
        <button
          onClick={() => setStartIdx(Math.max(0, startIdx - 1))}
          disabled={startIdx === 0}
          className="absolute left-0 z-10 -ml-6 top-1/2 -translate-y-1/2 bg-white shadow-md hover:shadow-lg w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-0 transition-all"
        >
          <span className="text-lg font-bold text-gray-600">‹</span>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.slice(startIdx, startIdx + itemsPerView).map((p, idx) => (
            <Link
              key={p.id}
              to={`/products/${createProductSlug(p)}`}
              className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-lg transition flex flex-col group/card relative"
            >
              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-2 z-10">
                {isNewProduct(p.created_at) && (
                  <div className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    Mới
                  </div>
                )}
                {isBestselling(p.id) && (
                  <div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    Bán chạy
                  </div>
                )}
              </div>

              {/* Discount Badge */}
              {p.discount > 0 && (
                <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">
                  -{p.discount}%
                </div>
              )}

              {/* Image */}
              <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-100">
                {p.image ? (
                  <img
                    src={normalizeImageUrl(p.image)}
                    alt={p.name}
                    className="w-full h-full object-contain group-hover/card:scale-105 transition-transform duration-300"
                    onError={(e) => e.target.src = FALLBACK_SVG_140}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">👟</div>
                )}
              </div>

              {/* Brand and Actions */}
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-gray-600 uppercase">{p.brand}</span>
                <div className="flex gap-1">
                  {addToCart && (
                    <button
                      onClick={(e) => handleAddToCart(p, e)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Thêm vào giỏ hàng"
                    >
                      <BsCart3 size={16} />
                    </button>
                  )}
                  <div className="p-1.5">
                    <FavoriteButton productId={p.id} size={16} />
                  </div>
                </div>
              </div>

              {/* Product Name */}
              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 text-sm group-hover/card:text-indigo-600">
                {p.name}
              </h3>

              {/* Rating Stars */}
              <div className="flex items-center gap-1 mb-2">
                <span className="text-yellow-400">★</span>
                <span className="text-xs font-semibold text-gray-700">
                  {Number(p.average_rating ?? 0).toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  ({p.total_ratings || 0})
                </span>
              </div>

              {/* Sold Info */}
              <p className="text-xs text-gray-500 mb-3">
                {p.sold ? `${p.sold} đã bán` : 'Chưa có đánh giá'}
              </p>

              {/* Price */}
              <div className="mt-auto pt-3 border-t border-gray-100">
                <p className="font-bold text-gray-900 text-sm">
                  {formatPrice(p.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <button
          onClick={() => setStartIdx(Math.min(products.length - itemsPerView, startIdx + 1))}
          disabled={startIdx >= products.length - itemsPerView}
          className="absolute right-0 z-10 -mr-6 top-1/2 -translate-y-1/2 bg-white shadow-md hover:shadow-lg w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-0 transition-all"
        >
          <span className="text-lg font-bold text-gray-600">›</span>
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
