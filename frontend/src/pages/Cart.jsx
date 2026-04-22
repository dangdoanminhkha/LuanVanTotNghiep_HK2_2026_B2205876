import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/useAuth';
import { productsAPI, behaviorAPI } from '../services/api';
import { normalizeImageUrl } from '../utils/imageUrl';
import { AiOutlineDelete, AiOutlineMinus, AiOutlinePlus, AiOutlineShoppingCart, AiOutlineClose } from 'react-icons/ai';

const FALLBACK_SVG_CART = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23E5E7EB" width="100" height="100"/><text x="50%" y="50%" font-family="Arial" font-size="8" fill="%239CA3AF" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>')}`;

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, getCartTotal, getCartCount, addToCart, updateCartItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [outOfStockMap, setOutOfStockMap] = useState({});
  const [cartItemStocks, setCartItemStocks] = useState({}); // Cache stock info for each item
  
  // State for variant selection modal
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productVariants, setProductVariants] = useState([]);
  const [variantColors, setVariantColors] = useState([]);
  const [variantSizes, setVariantSizes] = useState([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loadingVariants, setLoadingVariants] = useState(false);
  
  // State for inline editing
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    const outOfStockItems = location.state?.outOfStockItems;
    if (!Array.isArray(outOfStockItems) || outOfStockItems.length === 0) {
      return;
    }

    const nextMap = {};
    outOfStockItems.forEach((item) => {
      if (item?.variant_id) {
        nextMap[`v_${item.variant_id}`] = item;
      }
      if (item?.product_id) {
        nextMap[`p_${item.product_id}`] = item;
      }
    });

    setOutOfStockMap(nextMap);
  }, [location.state]);

  // Fetch stock info for all cart items
  useEffect(() => {
    const fetchStockInfo = async () => {
      const stocks = {};
      for (const item of cartItems) {
        const key = `${item.product_id}_${item.color}_${item.size}`;
        if (!stocks[key]) {
          try {
            const response = await productsAPI.getVariantsByProductId(item.product_id);
            const variants = response.data || [];
            const matchingVariant = variants.find(v => 
              v.color === item.color && v.size === item.size
            );
            if (matchingVariant) {
              stocks[key] = {
                available: Math.max(0, matchingVariant.quantity - matchingVariant.sold),
                total: matchingVariant.quantity,
                sold: matchingVariant.sold
              };
            }
          } catch (error) {
            console.error(`Error fetching stock for product ${item.product_id}:`, error);
          }
        }
      }
      setCartItemStocks(stocks);
    };

    if (cartItems.length > 0) {
      fetchStockInfo();
    }
  }, [cartItems]);

  const getItemStock = (item) => {
    const key = `${item.product_id}_${item.color}_${item.size}`;
    return cartItemStocks[key];
  };

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0, minimumFractionDigits: 0 }) + 'đ';
  };

  // Fetch variants when opening modal
  const openVariantModal = async (item) => {
    setSelectedProduct(item);
    setLoadingVariants(true);
    setShowVariantModal(true);
    
    try {
      const response = await productsAPI.getVariantsByProductId(item.product_id);
      const variants = response.data || [];
      setProductVariants(variants);
      
      // Get unique colors and sizes
      const colors = [...new Set(variants.map(v => v.color))];
      const sizes = [...new Set(variants.map(v => v.size))];
      setVariantColors(colors);
      setVariantSizes(sizes);
      setSelectedColor(colors[0] || '');
      setSelectedSize('');
      setSelectedVariant(null);
    } catch (error) {
      console.error('Error fetching variants:', error);
    } finally {
      setLoadingVariants(false);
    }
  };

  // Update available sizes when color changes
  useEffect(() => {
    if (selectedColor && productVariants.length > 0) {
      const availableSizes = productVariants
        .filter(v => v.color === selectedColor && (v.quantity - v.sold) > 0)
        .map(v => v.size);
      setVariantSizes(availableSizes);
      if (availableSizes.length > 0 && !availableSizes.includes(selectedSize)) {
        setSelectedSize(availableSizes[0]);
      }
    }
  }, [selectedColor, productVariants]);

  // Find variant when color and size are selected
  useEffect(() => {
    if (selectedColor && selectedSize) {
      const variant = productVariants.find(v => v.color === selectedColor && v.size === selectedSize);
      setSelectedVariant(variant);
    }
  }, [selectedColor, selectedSize, productVariants]);

  // Add variant to cart
  const handleAddVariant = () => {
    if (!selectedVariant || !selectedProduct) return;
    
    // Log add to cart action for ML recommendations
    behaviorAPI.log({
      action: 'add_to_cart',
      product_id: selectedProduct.product_id
    }).catch(err => console.error('Error logging add_to_cart:', err));
    
    const variantImage = normalizeImageUrl(selectedVariant.images || '');
    
    addToCart({
      product_id: selectedProduct.product_id,
      variant_id: selectedVariant.id,
      name: selectedProduct.name,
      color: selectedColor,
      size: selectedSize,
      price: selectedProduct.price,
      salePrice: selectedProduct.salePrice,
      image: variantImage,
      slug: selectedProduct.slug,
      quantity: 1
    });
    
    setShowVariantModal(false);
    setSelectedProduct(null);
  };

  // Inline edit functions
  const handleEditVariant = async (index, item) => {
    setEditingIndex(index);
    await openVariantModal(item);
  };

  const handleUpdateCartVariant = () => {
    if (!selectedVariant || editingIndex === null) return;

    const variantImage = normalizeImageUrl(selectedVariant.images || '');
    
    updateCartItem(editingIndex, {
      variant_id: selectedVariant.id,
      color: selectedColor,
      size: selectedSize,
      image: variantImage
    });
    
    setShowVariantModal(false);
    setEditingIndex(null);
  };

  const handleCheckout = () => {
    // Only block checkout if there are fully out-of-stock items
    const hasFullyOutOfStockItems = cartItems.some((item) => {
      const info = getOutOfStockInfo(item);
      return info?.isFullyOutOfStock ?? false;
    });

    if (hasFullyOutOfStockItems) {
      return;
    }

    if (!isAuthenticated) {
      localStorage.setItem('redirectAfterLogin', '/checkout');
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  // Parse image from variant
  const getItemImage = (item) => {
    if (!item.image) return FALLBACK_SVG_CART;
    const imageUrl = normalizeImageUrl(item.image);
    return imageUrl || FALLBACK_SVG_CART;
  };

  const getOutOfStockInfo = (item) => {
    // First, check current stock from API (cartItemStocks takes priority)
    const itemStock = getItemStock(item);
    if (itemStock) {
      const { available } = itemStock;
      // If stock info exists, use it to determine if out of stock
      if (available === 0) {
        return {
          available: 0,
          isFullyOutOfStock: true,
          isPartiallyOutOfStock: false,
          message: 'Sản phẩm đã hết hàng'
        };
      } else if (available < item.quantity) {
        return {
          available,
          isFullyOutOfStock: false,
          isPartiallyOutOfStock: true,
          message: `Không đủ số lượng (còn ${available})`
        };
      }
      // If stock is sufficient, return null (no out of stock issue)
      return null;
    }

    // Fallback: Check from location state (from checkout)
    const variantInfo = item?.variant_id ? outOfStockMap[`v_${item.variant_id}`] : null;
    const productInfo = item?.product_id ? outOfStockMap[`p_${item.product_id}`] : null;
    const info = variantInfo || productInfo || null;
    
    // Enhance with isFullyOutOfStock/isPartiallyOutOfStock flags
    if (info) {
      const available = info.available || 0;
      info.isFullyOutOfStock = available === 0;
      info.isPartiallyOutOfStock = available > 0 && available < (item.quantity || 0);
    }
    
    return info;
  };

  // Only filter items that are fully out of stock (need to be removed)
  const fullyOutOfStockItems = cartItems.filter((item) => {
    const info = getOutOfStockInfo(item);
    return info && info.isFullyOutOfStock;
  });
  
  // All items with stock issues (partially or fully)
  const outOfStockCartItems = cartItems.filter((item) => Boolean(getOutOfStockInfo(item)));

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <AiOutlineShoppingCart className="text-gray-300 text-8xl mb-6" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Giỏ hàng trống</h2>
        <p className="text-gray-500 mb-6">Bạn chưa thêm sản phẩm nào vào giỏ hàng</p>
        <Link 
          to="/collections/all" 
          className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Giỏ hàng ({getCartCount()} sản phẩm)</h1>

      {fullyOutOfStockItems.length > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-700">
            Có {fullyOutOfStockItems.length} sản phẩm đã hết hàng.
          </p>
          <p className="text-sm text-red-600 mt-1">
            Vui lòng xóa các sản phẩm này để tiếp tục thanh toán.
          </p>
        </div>
      )}
      
      {outOfStockCartItems.length > fullyOutOfStockItems.length && (
        <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="font-semibold text-orange-700">
            Có {outOfStockCartItems.length - fullyOutOfStockItems.length} sản phẩm không đủ số lượng.
          </p>
          <p className="text-sm text-orange-600 mt-1">
            Bạn có thể giảm số lượng để mua được hoặc xóa chúng ra.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item, index) => {
            const outOfStockInfo = getOutOfStockInfo(item);
            const isFullyOutOfStock = outOfStockInfo?.isFullyOutOfStock ?? false;
            const isPartiallyOutOfStock = outOfStockInfo?.isPartiallyOutOfStock ?? false;
            const isOutOfStock = Boolean(outOfStockInfo);

            return (
            <div
              key={`${item.variant_id}-${item.size}-${index}`}
              className={`bg-white rounded-2xl p-6 shadow-sm border ${
                isFullyOutOfStock ? 'border-red-300 bg-red-50/40' : 
                isPartiallyOutOfStock ? 'border-orange-300 bg-orange-50/40' : 
                'border-gray-100'
              }`}
            >
              <div className="flex gap-6">
                {/* Product Image */}
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <img 
                    src={getItemImage(item)} 
                    alt={item.name} 
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.src = FALLBACK_SVG_CART; }}
                  />
                </div>
                
                {/* Product Info */}
                <div className="flex-1">
                  <Link to={`/products/${item.slug || item.product_id}`} className="font-bold text-gray-900 hover:text-indigo-600 transition">
                    {item.name}
                  </Link>
                  <div className="text-sm text-gray-500 mt-1">
                    <span>Màu: {item.color}</span>
                    <span className="mx-2">|</span>
                    <span>Size: {item.size}</span>
                  </div>

                  {(() => {
                    const itemStock = getItemStock(item);
                    if (itemStock) {
                      const { available } = itemStock;
                      return (
                        <div className={`text-xs mt-2 font-semibold ${
                          available <= 0 ? 'text-red-600' :
                          available <= 5 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {available <= 0 ? 'Hết hàng' : `Còn ${available} sản phẩm`}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {isFullyOutOfStock && (
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        Hết hàng
                      </span>
                    </div>
                  )}
                  {isPartiallyOutOfStock && (
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                        Không đủ số lượng
                      </span>
                      <p className="mt-1 text-xs text-orange-600">
                        Chỉ còn {Number(outOfStockInfo.available || 0)} sản phẩm. Hãy giảm số lượng hoặc xóa.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                          item.quantity <= 1
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                            : 'border-gray-300 hover:border-indigo-600 hover:text-indigo-600'
                        }`}
                        title="Giảm số lượng"
                      >
                        <AiOutlineMinus size={14} />
                      </button>
                      <span className="font-bold text-gray-900 w-8 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        disabled={isOutOfStock}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                          isOutOfStock 
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                            : 'border-gray-300 hover:border-indigo-600 hover:text-indigo-600'
                        }`}
                        title={isPartiallyOutOfStock ? 'Không thể tăng vì không đủ hàng' : 'Tăng số lượng'}
                      >
                        <AiOutlinePlus size={14} />
                      </button>
                    </div>
                    
                    {/* Price */}
                    <div className="text-right">
                      {item.salePrice && item.salePrice < item.price ? (
                        <>
                          <p className="text-sm text-gray-400 line-through">{formatPrice(item.price)}</p>
                          <p className="font-bold text-red-600">{formatPrice(item.salePrice * item.quantity)}</p>
                        </>
                      ) : (
                        <p className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                      )}
                    </div>
                    
                    {/* Remove Button */}
                    <button 
                      onClick={() => removeFromCart(index)}
                      className="text-gray-400 hover:text-red-600 transition p-2"
                    >
                      <AiOutlineDelete size={20} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                {isFullyOutOfStock ? (
                  <>
                    <button
                      onClick={() => handleEditVariant(index, item)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Đổi màu/size
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-sm text-red-600 hover:text-red-800 font-semibold"
                    >
                      Xóa
                    </button>
                  </>
                ) : isPartiallyOutOfStock ? (
                  <>
                    <button
                      onClick={() => handleEditVariant(index, item)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Đổi màu/size
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-sm text-orange-600 hover:text-orange-800 font-semibold"
                    >
                      Xóa
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditVariant(index, item)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Đổi màu/size
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => openVariantModal(item)}
                      className="text-sm text-green-600 hover:text-green-800 font-medium"
                    >
                      Thêm biến thể khác
                    </button>
                  </>
                )}
              </div>
            </div>
            );
          })}
          
          {/* Clear Cart Button */}
          <button 
            onClick={clearCart}
            className="text-gray-500 hover:text-red-600 text-sm font-medium transition"
          >
            Xóa toàn bộ giỏ hàng
          </button>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Tóm tắt đơn hàng</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tạm tính ({getCartCount()} sản phẩm)</span>
                <span className="font-medium">{formatPrice(getCartTotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phí vận chuyển</span>
                <span className="font-medium text-green-600">Miễn phí</span>
              </div>
              <hr className="my-4" />
              <div className="flex justify-between text-lg">
                <span className="font-bold">Tổng cộng</span>
                <span className="font-bold text-indigo-600">{formatPrice(getCartTotal())}</span>
              </div>
            </div>
            
            <button 
              onClick={handleCheckout}
              disabled={fullyOutOfStockItems.length > 0}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold mt-6 hover:bg-indigo-700 transition active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {fullyOutOfStockItems.length > 0
                ? 'Vui lòng xóa sản phẩm hết hàng'
                : isAuthenticated
                  ? 'Tiến hành đặt hàng'
                  : 'Đăng nhập để đặt hàng'}
            </button>
            
            {!isAuthenticated && (
              <p className="text-xs text-gray-500 text-center mt-3">
                Giỏ hàng của bạn sẽ được giữ nguyên sau khi đăng nhập
              </p>
            )}
            
            <Link 
              to="/collections/all" 
              className="block text-center text-indigo-600 font-medium mt-4 hover:underline"
            >
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>

      {/* Variant Selection Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => { setShowVariantModal(false); setEditingIndex(null); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <AiOutlineClose size={24} />
            </button>
            
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingIndex !== null ? 'Đổi biến thể' : 'Thêm biến thể'}
            </h3>
            
            {selectedProduct && (
              <p className="text-gray-600 mb-4">{selectedProduct.name}</p>
            )}
            
            {loadingVariants ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-2">Đang tải...</p>
              </div>
            ) : (
              <>
                {/* Color Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Màu sắc</label>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(productVariants.map(v => v.color))].map(color => {
                      const hasStock = productVariants.some(v => v.color === color && (v.quantity - v.sold) > 0);
                      return (
                        <button
                          key={color}
                          onClick={() => hasStock && setSelectedColor(color)}
                          disabled={!hasStock}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                            selectedColor === color 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                              : hasStock 
                                ? 'border-gray-200 hover:border-gray-400' 
                                : 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                          }`}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Size Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Kích thước</label>
                  <div className="flex flex-wrap gap-2">
                    {variantSizes.map(size => {
                      const variant = productVariants.find(v => v.color === selectedColor && v.size === size);
                      const stock = variant ? (variant.quantity - variant.sold) : 0;
                      return (
                        <button
                          key={size}
                          onClick={() => stock > 0 && setSelectedSize(size)}
                          disabled={stock <= 0}
                          className={`w-12 h-12 rounded-lg border text-sm font-bold transition ${
                            selectedSize === size 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                              : stock > 0
                                ? 'border-gray-200 hover:border-gray-400' 
                                : 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                  {selectedVariant && (
                    <p className="text-sm text-gray-500 mt-2">
                      Còn {selectedVariant.quantity - selectedVariant.sold} sản phẩm
                    </p>
                  )}
                </div>
                
                {/* Add Button */}
                <button
                  onClick={editingIndex !== null ? handleUpdateCartVariant : handleAddVariant}
                  disabled={!selectedVariant || (selectedVariant.quantity - selectedVariant.sold) <= 0}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {editingIndex !== null ? 'Cập nhật' : 'Thêm vào giỏ hàng'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
