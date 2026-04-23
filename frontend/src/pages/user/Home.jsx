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

  const renderProductCarousel = (products, currentIndex, setIndex, title, seeAllLink) => {
    const itemsPerView = 4;
    const displayProducts = products.slice(currentIndex, currentIndex + itemsPerView);

    if (products.length === 0 && !loading) return null;

    return (
      <div className="bg-white py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">{title}</h2>
              <div className="h-1.5 w-20 bg-indigo-600"></div>
            </div>
            <Link to={seeAllLink} className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
              Xem tất cả <span>→</span>
            </Link>
          </div>

          <div className="relative group">
            <div className="flex items-center gap-4">
              {/* Left Arrow */}
              <button
                onClick={() => setIndex(Math.max(0, currentIndex - 1))}
                className="absolute left-0 z-10 -ml-4 bg-white shadow-xl hover:bg-gray-50 text-indigo-600 w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center disabled:opacity-0 transition-all duration-300"
                disabled={currentIndex === 0}
              >
                <span className="text-2xl font-bold">‹</span>
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
                className="absolute right-0 z-10 -mr-4 bg-white shadow-xl hover:bg-gray-50 text-indigo-600 w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center disabled:opacity-0 transition-all duration-300"
                disabled={currentIndex >= products.length - itemsPerView || products.length <= itemsPerView}
              >
                <span className="text-2xl font-bold">›</span>
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
        <section className="px-4 pt-6 md:pt-8">
          <div className="relative overflow-hidden rounded-2xl shadow-lg">
            <img
              src="https://cdn.hstatic.net/files/1000230642/collection/1920x750__eb8ced6470d944799dfcd0d9a79dc9bd_master.png"
              alt="Go For Love 2026 - Đôi giày nổi bật"
              className="w-full h-[230px] sm:h-[300px] md:h-[420px] object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
            <div className="absolute inset-0 flex items-end md:items-center">
              <div className="p-5 md:p-10 text-white max-w-2xl">
                <h1 className="mt-2 text-2xl md:text-5xl font-extrabold leading-tight">Go For Love 2026</h1>
                <p className="mt-2 md:mt-3 text-sm md:text-lg text-white/90">
                  Khám phá đôi giày nổi bật với phong cách trẻ trung, năng động.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── "Dành riêng cho bạu" – ML Recommendations (Show when has recommendations, regardless of cold start) ── */}
        {recommendations.length > 0 && (
          <div className="bg-white py-12 border-t">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Dành riêng cho bạn ✨</h2>
                  <div className="h-1.5 w-20 bg-indigo-600"></div>
                </div>
              </div>

              <div className="relative group">
                <div className="flex items-center gap-4">
                  {/* Left Arrow */}
                  <button
                    onClick={() => setRecoIndex(Math.max(0, recoIndex - 1))}
                    className="absolute left-0 z-10 -ml-4 bg-white shadow-xl hover:bg-gray-50 text-indigo-600 w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center disabled:opacity-0 transition-all duration-300"
                    disabled={recoIndex === 0}
                  >
                    <span className="text-2xl font-bold">‹</span>
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
                    className="absolute right-0 z-10 -mr-4 bg-white shadow-xl hover:bg-gray-50 text-indigo-600 w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center disabled:opacity-0 transition-all duration-300"
                    disabled={recoIndex >= recommendations.length - 4 || recommendations.length <= 4}
                  >
                    <span className="text-2xl font-bold">›</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recently Viewed Products (Show when has viewed products) */}
        {viewedProducts.length > 0 && renderProductCarousel(viewedProducts, viewedIndex, setViewedIndex, 'Sản phẩm bạn đã xem', '/collections')}

        {/* Bestsellers */}
        {renderProductCarousel(bestsellerProducts, bestsellersIndex, setbestsellerIndex, 'Sản phẩm bán chạy', '/collections/ban-chay')}

        {/* New Products */}
        {renderProductCarousel(newProducts, newProductsIndex, setNewProductsIndex, 'Sản phẩm mới', '/collections/moi')}

        {/* Men Shoes */}
        {renderProductCarousel(menShoes, menShoeIndex, setMenShoeIndex, 'Dành cho Nam', '/collections/nam')}

        {/* Women Shoes */}
        {renderProductCarousel(womenShoes, womenShoeIndex, setWomenShoeIndex, 'Dành cho Nữ', '/collections/nu')}

        {/* Sale */}
        {renderProductCarousel(saleProducts, saleIndex, setSaleIndex, 'Ưu đãi hấp dẫn', '/collections/sale')}
      </div>
    </div>
  );
};

export default Home;
