import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../../services/api';
import { createProductSlug, getProductDisplayImage } from '../../utils/productUtils';
import { AiOutlineArrowRight } from 'react-icons/ai';

const GenderHome = ({ gender }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all products for this gender
        const response = await productsAPI.getBaseAll({ gender });
        setProducts(response.data || []);
        
        // Dynamic categories from data
        const uniqueCats = [...new Set((response.data || []).map(p => p.category))];
        setCategories(uniqueCats.length > 0 ? uniqueCats : (gender === 'Nam' ? ['Hunter', 'Sandal', 'The Thao'] : ['Cao Got', 'Sandal', 'Bup Be']));
      } catch (error) {
        console.error('Error fetching gender products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [gender]);

  const carouselData = [
    { title: `BỘ SƯU TẬP GIÀY ${gender.toUpperCase()} 2026`, subtitle: 'Nâng tầm phong cách, tự tin vững bước.', icon: '👟' },
    { title: 'PHONG CÁCH MỚI MỖI NGÀY', subtitle: 'Khám phá những thiết kế độc bản.', icon: '🌟' }
  ];

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0, minimumFractionDigits: 0 }) + 'đ';
  };

  const renderSection = (categoryName) => {
    const filtered = products.filter(p => p.category === categoryName).slice(0, 4);
    if (filtered.length === 0) return null;

    return (
      <div className="py-16 border-b border-gray-100 last:border-0" key={categoryName}>
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="text-indigo-600 font-black tracking-[0.3em] uppercase text-xs mb-3 block">Category</span>
            <h2 className="text-4xl font-black text-gray-900">{categoryName} {gender}</h2>
          </div>
          <Link 
            to={`/products?gender=${gender}&category=${categoryName}`}
            className="group flex items-center gap-3 font-bold text-gray-900 hover:text-indigo-600 transition-all font-sans"
          >
            Xem bộ sưu tập <AiOutlineArrowRight className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filtered.map(product => (
            <Link
              key={product.id}
              to={`/products/${createProductSlug(product)}`}
              className="group bg-white rounded-[32px] border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
            >
              <div className="aspect-[4/5] bg-gray-50 relative overflow-hidden p-6 flex items-center justify-center">
                {getProductDisplayImage(product) ? (
                  <img src={getProductDisplayImage(product)} alt={product.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl bg-gray-100 text-gray-200">👟</div>
                )}
                {product.discount_percentage > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
                    -{product.discount_percentage}%
                  </div>
                )}
              </div>
              <div className="p-6">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">{product.brand}</p>
                <h3 className="font-bold text-gray-900 text-lg mb-4 line-clamp-1 group-hover:text-indigo-600 transition-colors">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-gray-900">{formatPrice(product.price)}</span>
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    +
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="relative h-[450px] bg-indigo-900 overflow-hidden flex items-center">
        <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-400 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 relative flex justify-between items-center">
          <div className="max-w-2xl text-white">
            <h1 className="text-7xl font-black mb-6 animate-slide-up">
              {carouselData[carouselIndex].title}
            </h1>
            <p className="text-xl text-indigo-100 mb-8 font-medium italic">
              {carouselData[carouselIndex].subtitle}
            </p>
            <div className="flex gap-4">
                <button 
                    onClick={() => setCarouselIndex((carouselIndex + 1) % carouselData.length)}
                    className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black shadow-2xl hover:bg-gray-100 transition-all hover:-translate-y-1"
                >
                    Khám phá ngay
                </button>
            </div>
          </div>
          <div className="hidden lg:block text-[18rem] filter drop-shadow-2xl animate-float">
            {carouselData[carouselIndex].icon}
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 py-8">
        {categories.map(cat => renderSection(cat))}
      </div>
    </div>
  );
};

export default GenderHome;
