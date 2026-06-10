import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI, behaviorAPI } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { createProductSlug, getProductDisplayImage } from '../../utils/productUtils';
import { normalizeImageUrl } from '../../utils/imageUrl';
import ProductCard from '../../components/ProductCard';

const FALLBACK_SVG_PRODUCT = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="%23E5E7EB" width="200" height="200"/><text x="50%" y="50%" font-family="Arial" font-size="12" fill="%239CA3AF" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>')}`;

const Home = () => {
  const { user } = useAuth();
  const [bestsellersIndex, setbestsellerIndex] = useState(0);
  const [newProductsIndex, setNewProductsIndex] = useState(0);
  const [menShoeIndex, setMenShoeIndex] = useState(0);
  const [womenShoeIndex, setWomenShoeIndex] = useState(0);
  const [saleIndex, setSaleIndex] = useState(0);
  const [viewedIndex, setViewedIndex] = useState(0);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [recoSource, setRecoSource] = useState('');
  const [recoIndex, setRecoIndex] = useState(0);
  const [viewedProducts, setViewedProducts] = useState([]);
  const [topSellerIds, setTopSellerIds] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productsAPI.getBaseAll();
        setProducts(response.data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch ML recommendations once on mount
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Gợi ý cho cả khách và người dùng đăng nhập
        const res = await behaviorAPI.getRecommendations(null, 12);
        const data = res.data;
        console.log('[Recommendations]', {
          source: data.source,
          count: data.recommendations?.length || 0
        });
        setRecommendations(data.recommendations || []);
        setRecoSource(data.source || 'hybrid_ml');
      } catch (err) {
        console.error('[Recommendations Error]', err);
      }
    };
    
    fetchRecommendations();
  }, []);

  // Fetch trending products (top 10 sellers)
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await behaviorAPI.getTrending(10);
        setTopSellerIds(res.data?.map(p => p.id) || []);
      } catch {
        // Silently fail - not critical
      }
    };
    
    fetchTrending();
  }, []);

  // Fetch recently viewed products
  useEffect(() => {
    const fetchViewed = async () => {
      try {
        const res = await behaviorAPI.getViewed(null, 12);
        setViewedProducts(res.data || []);
      } catch {
        // Không hiển thị nếu lỗi
      }
    };
    fetchViewed();
  }, []);

  // Filter products for different sections
  // Helper function to filter by gender
  const filterByUserGender = (productsToFilter) => {
    const userGender = user?.gender;
    // If user gender is 'Khác' or not set, show all products
    if (!userGender || userGender === 'Khác') {
      return productsToFilter;
    }
    // Filter products that match user gender
    return productsToFilter.filter(p => p.gender === userGender || p.gender === 'Unisex');
  };

  // Apply gender filter to bestsellers and new products, but keep men/women sections as is
  // Sort bestsellers by total_sold descending
  const bestsellerProducts = filterByUserGender(
    [...products].sort((a, b) => (b.total_sold || 0) - (a.total_sold || 0)).slice(0, 8)
  );
  // Sort new products by created_at descending (newest first)
  const newProducts = filterByUserGender(
    [...products].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8)
  );
  const menShoes = products.filter(p => p.gender === 'Nam');
  const womenShoes = products.filter(p => p.gender === 'Nữ');
  // Sort sale products by discount_percentage descending (highest discount first)
  const saleProducts = products
    .filter(p => p.discount_percentage > 0)
    .sort((a, b) => (b.discount_percentage || 0) - (a.discount_percentage || 0));

  // Get IDs of top 5 newest products
  const topNewProductIds = new Set(
    [...products]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(p => p.id)
  );

  // Use trending IDs from API if available, otherwise use total_sold as fallback
  const topBestsellingProductIds = new Set(
    topSellerIds.length > 0 ? topSellerIds : 
    [...products]
      .sort((a, b) => (b.total_sold || 0) - (a.total_sold || 0))
      .slice(0, 10)
      .map(p => p.id)
  );

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0, minimumFractionDigits: 0 }) + 'đ';
  };

  const renderProductCarousel = (products, currentIndex, setIndex, title, description, seeAllLink) => {
    const itemsPerView = 4;
    const displayProducts = products.slice(currentIndex, currentIndex + itemsPerView);

    if (products.length === 0 && !loading) return null;

    return (
      <div className="bg-white py-14 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">{title}</h2>
              {description && <p className="text-sm text-gray-500 mt-1.5">{description}</p>}
            </div>
            <Link to={seeAllLink} className="text-indigo-600 hover:text-white hover:bg-indigo-600 font-bold text-xs tracking-wide bg-indigo-50 px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-1.5 shadow-sm">
              Xem tất cả <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
          </div>

          <div className="relative group">
            <div className="flex items-center gap-4">
              {/* Left Arrow */}
              <button
                onClick={() => setIndex(Math.max(0, currentIndex - 1))}
                className="absolute left-0 z-10 -ml-4 bg-white shadow-xl hover:bg-indigo-600 hover:text-white text-gray-600 w-11 h-11 rounded-full border border-gray-100 flex items-center justify-center disabled:opacity-0 transition-all duration-300"
                disabled={currentIndex === 0}
              >
                <span className="text-xl font-bold">‹</span>
              </button>

              {/* Products Grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {displayProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                    isNew={topNewProductIds.has(product.id)}
                    isBestselling={topBestsellingProductIds.has(product.id)}
                  />
                ))}
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => setIndex(Math.min(products.length - itemsPerView, currentIndex + 1))}
                className="absolute right-0 z-10 -mr-4 bg-white shadow-xl hover:bg-indigo-600 hover:text-white text-gray-600 w-11 h-11 rounded-full border border-gray-100 flex items-center justify-center disabled:opacity-0 transition-all duration-300"
                disabled={currentIndex >= products.length - itemsPerView || products.length <= itemsPerView}
              >
                <span className="text-xl font-bold">›</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-[1440px] mx-auto pb-20">
        {/* Hero Banner */}
        <section className="px-4 pt-6 md:pt-8 mb-8">
          <div className="relative overflow-hidden rounded-3xl shadow-xl border border-gray-100/50">
            <img
              src="https://cdn.hstatic.net/files/1000230642/collection/1920x750__eb8ced6470d944799dfcd0d9a79dc9bd_master.png"
              alt="Go For Love 2026 - Đôi giày nổi bật"
              className="w-full h-[250px] sm:h-[350px] md:h-[480px] object-cover hover:scale-[1.01] transition-transform duration-700 ease-out"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="p-6 sm:p-12 md:p-16 text-white max-w-2xl">
                <span className="inline-block bg-indigo-600 text-white text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3 shadow-md">
                  BST MỚI NHẤT 2026
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold leading-tight tracking-tight drop-shadow-sm">
                  Go For Love 2026
                </h1>
                <p className="mt-3 text-sm sm:text-base md:text-xl text-gray-200/90 leading-relaxed max-w-xl">
                  Khám phá bộ sưu tập đột phá mang phong cách thời thượng, năng động và đầy đam mê. Thiết kế tối ưu nâng niu từng chuyển động.
                </p>
                <div className="mt-6 sm:mt-8">
                  <Link
                    to="/collections/all"
                    className="inline-flex items-center gap-2 bg-white text-gray-900 hover:bg-indigo-600 hover:text-white font-bold text-sm sm:text-base px-6 sm:px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-indigo-500/20 transform hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Mua Ngay <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── "Dành riêng cho bạn" – ML Recommendations (Show when has recommendations, regardless of cold start) ── */}
        {recommendations.length > 0 && (
          <div className="bg-white py-14 border-b border-gray-100">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Dành riêng cho bạn</h2>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md uppercase">AI SUGGESTED</span>
                  </div>
                  <p className="text-sm text-gray-500">Mô hình trí tuệ nhân tạo gợi ý dựa trên sở thích riêng và lịch sử tương tác của bạn</p>
                </div>
              </div>

              <div className="relative group">
                <div className="flex items-center gap-4">
                  {/* Left Arrow */}
                  <button
                    onClick={() => setRecoIndex(Math.max(0, recoIndex - 1))}
                    className="absolute left-0 z-10 -ml-4 bg-white shadow-xl hover:bg-indigo-600 hover:text-white text-gray-600 w-11 h-11 rounded-full border border-gray-100 flex items-center justify-center disabled:opacity-0 transition-all duration-300"
                    disabled={recoIndex === 0}
                  >
                    <span className="text-xl font-bold">‹</span>
                  </button>

                  {/* Products Grid */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {recommendations.slice(recoIndex, recoIndex + 4).map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product}
                        isNew={topNewProductIds.has(product.id)}
                        isBestselling={topBestsellingProductIds.has(product.id)}
                      />
                    ))}
                  </div>

                  {/* Right Arrow */}
                  <button
                    onClick={() => setRecoIndex(Math.min(recommendations.length - 4, recoIndex + 1))}
                    className="absolute right-0 z-10 -mr-4 bg-white shadow-xl hover:bg-indigo-600 hover:text-white text-gray-600 w-11 h-11 rounded-full border border-gray-100 flex items-center justify-center disabled:opacity-0 transition-all duration-300"
                    disabled={recoIndex >= recommendations.length - 4 || recommendations.length <= 4}
                  >
                    <span className="text-xl font-bold">›</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recently Viewed Products (Show when has viewed products) */}
        {viewedProducts.length > 0 && renderProductCarousel(
          viewedProducts, 
          viewedIndex, 
          setViewedIndex, 
          'Sản phẩm bạn đã xem 👁️', 
          'Lịch sử duyệt giày cá nhân giúp bạn dễ dàng tìm lại đôi giày yêu thích', 
          '/collections'
        )}

        {/* Bestsellers */}
        {renderProductCarousel(
          bestsellerProducts, 
          bestsellersIndex, 
          setbestsellerIndex, 
          'Xu hướng bán chạy nhất 🔥', 
          'Những đôi sneaker được đông đảo cộng đồng săn đón và đặt mua nhiều nhất', 
          '/collections/ban-chay'
        )}

        {/* New Products */}
        {renderProductCarousel(
          newProducts, 
          newProductsIndex, 
          setNewProductsIndex, 
          'Sản phẩm mới cập bến ✨', 
          'Đón đầu phong cách mới nhất với các sản phẩm vừa có mặt tại ShoeStore', 
          '/collections/moi'
        )}

        {/* Men Shoes */}
        {renderProductCarousel(
          menShoes, 
          menShoeIndex, 
          setMenShoeIndex, 
          'Thời trang Nam năng động 👟', 
          'Các mẫu giày thiết kế khỏe khoắn, nam tính và êm ái cho mọi hoạt động', 
          '/collections/nam'
        )}

        {/* Women Shoes */}
        {renderProductCarousel(
          womenShoes, 
          womenShoeIndex, 
          setWomenShoeIndex, 
          'Thời trang Nữ cuốn hút 💅', 
          'Thiết kế trang nhã, màu sắc nổi bật giúp bạn khẳng định phong cách riêng', 
          '/collections/nu'
        )}

        {/* Sale */}
        {renderProductCarousel(
          saleProducts, 
          saleIndex, 
          setSaleIndex, 
          'Ưu đãi đặc biệt giá hời 🏷️', 
          'Cơ hội sở hữu giày hiệu chính hãng với các chương trình giảm giá sâu', 
          '/collections/sale'
        )}
      </div>
    </div>
  );
};

export default Home;
