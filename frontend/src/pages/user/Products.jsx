import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productsAPI, brandsAPI, categoriesAPI } from '../../services/api';
import { AiOutlineSearch, AiOutlineFilter, AiOutlineClose } from 'react-icons/ai';
import ProductCard from '../../components/ProductCard';

const normalizeValue = (value) => String(value || '').trim().toLowerCase();

const toGenderLabel = (value) => {
  const normalized = normalizeValue(value);
  if (normalized === 'nam' || normalized === 'male') return 'Nam';
  if (normalized === 'nu' || normalized === 'nữ' || normalized === 'female') return 'Nữ';
  if (normalized === 'unisex') return 'Unisex';
  return value || '';
};

const toGenderKey = (value) => {
  const normalized = normalizeValue(value);
  if (normalized === 'nam' || normalized === 'male') return 'nam';
  if (normalized === 'nu' || normalized === 'nữ' || normalized === 'female') return 'nu';
  if (normalized === 'unisex') return 'unisex';
  return '';
};

const Products = ({ title = "Cửa hàng", presetFilters = {}, hideTitle = false }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || presetFilters.brand || '');
  const [selectedGender, setSelectedGender] = useState(searchParams.get('gender') || presetFilters.gender || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || presetFilters.category || '');
  const [selectedColor, setSelectedColor] = useState(searchParams.get('color') || '');
  const [selectedSize, setSelectedSize] = useState(searchParams.get('size') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');

  const brandOptions = useMemo(() => brands.map((brand) => ({
    label: brand.name,
    value: brand.slug || brand.name.toLowerCase().replace(/\s+/g, '-').replace(/['']/g, '')
  })), [brands]);

  const categoryOptions = useMemo(() => {
    const genderKey = toGenderKey(selectedGender);
    return categories
      .filter((category) => {
        if (!genderKey) return false;
        const applicable = normalizeValue(category.gender_applicable || 'unisex');
        return applicable === 'unisex' || applicable === genderKey;
      })
      .map((category) => ({
        label: category.name,
        value: category.slug
      }));
  }, [categories, selectedGender]);

  const selectedBrandLabel = useMemo(() => {
    const matchedBrand = brands.find((brand) => {
      const brandSlug = brand.slug || brand.name.toLowerCase().replace(/\s+/g, '-').replace(/['']/g, '');
      return normalizeValue(brandSlug) === normalizeValue(selectedBrand) || normalizeValue(brand.name) === normalizeValue(selectedBrand);
    });
    return matchedBrand?.name || selectedBrand;
  }, [brands, selectedBrand]);

  const selectedCategoryLabel = useMemo(() => {
    const matchedCategory = categories.find((category) => normalizeValue(category.slug) === normalizeValue(selectedCategory));
    return matchedCategory?.name || selectedCategory;
  }, [categories, selectedCategory]);

  useEffect(() => {
    // Sync local state with URL params first, then fall back to preset filters
    setSearch(searchParams.get('search') || '');
    setSelectedBrand(searchParams.get('brand') || presetFilters.brand || '');
    setSelectedGender(searchParams.get('gender') || presetFilters.gender || '');
    setSelectedCategory(searchParams.get('category') || presetFilters.category || '');
    setSelectedColor(searchParams.get('color') || '');
    setSelectedSize(searchParams.get('size') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setSortBy(searchParams.get('sort') || presetFilters.sort || 'newest');
  }, [searchParams, presetFilters]);

  useEffect(() => {
    const fetchFilterMeta = async () => {
      try {
        const [brandsRes, categoriesRes] = await Promise.all([
          brandsAPI.getAll(),
          categoriesAPI.getAll()
        ]);
        setBrands(brandsRes.data || []);
        setCategories(categoriesRes.data || []);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu bộ lọc:', error);
      }
    };

    fetchFilterMeta();
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search,
        brand: selectedBrand,
        gender: selectedGender,
        category: selectedCategory,
        color: selectedColor,
        size: selectedSize,
        minPrice,
        maxPrice,
        sort: sortBy
      };
      
      const response = await productsAPI.getBaseAll(params);
      setProducts(response.data);
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  }, [search, selectedBrand, selectedGender, selectedCategory, selectedColor, selectedSize, minPrice, maxPrice, sortBy, presetFilters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setSearch('');
    setSelectedBrand('');
    setSelectedGender('');
    setSelectedCategory('');
    setSelectedColor('');
    setSelectedSize('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  const colors = ['Đen', 'Trắng', 'Xanh', 'Đỏ', 'Xám', 'Kem', 'Hồng', 'Vàng'];
  const sizes = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

  // Get IDs of top 5 newest products
  const topNewProductIds = new Set(
    [...products]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(p => p.id)
  );

  // Get IDs of top 10 bestselling products
  const topBestsellingProductIds = new Set(
    [...products]
      .sort((a, b) => (b.total_sold || 0) - (a.total_sold || 0))
      .slice(0, 10)
      .map(p => p.id)
  );

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0, minimumFractionDigits: 0 }) + 'đ';
  };

  const FilterDropdown = ({ label, value, displayValue, options, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const normalizedOptions = options.map((opt) => (typeof opt === 'string' ? { label: opt, value: opt } : opt));

    return (
      <div className="relative group">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-semibold ${
            value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          {label}
          {displayValue && <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{displayValue}</span>}
          <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-20 py-2.5 animate-fade-in">
              <div className="max-h-60 overflow-y-auto px-2 space-y-0.5">
                {normalizedOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onSelect(opt.value === value ? '' : opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      value === opt.value ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-8">
      {/* Header & Search */}
      {!hideTitle && (
      <div className="mb-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2 flex items-center gap-3">
              {title}
              <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">{products.length}</span>
            </h1>
            <p className="text-gray-500 font-medium text-sm">Khám phá phong cách của riêng bạn qua từng sải bước</p>
          </div>
        </div>
      </div>
      )}

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 mb-10 p-3 bg-white rounded-2xl border border-gray-100 premium-shadow">
        <FilterDropdown 
          label="Thương hiệu" 
          value={selectedBrand}
          displayValue={selectedBrandLabel}
          options={brandOptions}
          onSelect={(v) => updateParams({ brand: v })} 
        />
        <FilterDropdown 
          label="Giới tính" 
          value={selectedGender}
          displayValue={toGenderLabel(selectedGender)}
          options={['Nam', 'Nữ', 'Unisex']}
          onSelect={(v) => updateParams({ gender: v, category: '' })} 
        />
        {selectedGender && categoryOptions.length > 0 && (
          <FilterDropdown 
            label="Loại giày" 
            value={selectedCategory}
            displayValue={selectedCategoryLabel}
            options={categoryOptions}
            onSelect={(v) => updateParams({ category: v })} 
          />
        )}
        <FilterDropdown 
          label="Màu sắc" 
          value={selectedColor} 
          displayValue={selectedColor}
          options={colors} 
          onSelect={(v) => updateParams({ color: v })} 
        />
        <FilterDropdown 
          label="Kích thước" 
          value={selectedSize} 
          displayValue={selectedSize}
          options={sizes} 
          onSelect={(v) => updateParams({ size: v })} 
        />

        {/* Price Dropdown */}
        <div className="relative group">
          <button
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-semibold ${
              minPrice || maxPrice ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            Giá
            {(minPrice || maxPrice) && <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">Tùy chọn</span>}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 z-20 p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
             <div className="space-y-4">
               <div>
                 <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">Từ giá</label>
                 <input
                    type="text"
                    placeholder="đ"
                    value={minPrice}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      updateParams({ minPrice: val });
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
               </div>
               <div>
                 <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">Đến giá</label>
                 <input
                    type="text"
                    placeholder="đ"
                    value={maxPrice}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      updateParams({ maxPrice: val });
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
               </div>
             </div>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-gray-200 mx-2 hidden lg:block"></div>

        <div className="flex-1"></div>

        {/* Sort */}
        <div className="flex-initial relative group">
          <select
            value={sortBy}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer font-semibold text-sm text-gray-700 hover:border-gray-300 transition-all appearance-none pr-10"
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá: Thấp - Cao</option>
            <option value="price_desc">Giá: Cao - Thấp</option>
            <option value="name_asc">Tên: A - Z</option>
            <option value="name_desc">Tên: Z - A</option>
            <option value="bestselling">Bán chạy nhất</option>
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Clear Filters */}
        {(selectedBrand || selectedGender || selectedCategory || selectedColor || selectedSize || minPrice || maxPrice || search) && (
          <button 
            onClick={clearAllFilters}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
          >
            <AiOutlineClose /> Xóa lọc
          </button>
        )}
      </div>

      <div className="flex gap-12">
        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (

            <div className="flex flex-col items-center justify-center py-48">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-100 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="mt-6 text-gray-400 font-bold italic animate-pulse">Đang nạp năng lượng cho các đôi giày...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-[40px] p-24 text-center border border-gray-100 shadow-sm flex flex-col items-center">
              <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center text-6xl mb-8 animate-bounce">👟</div>
              <h3 className="text-3xl font-black text-gray-900 mb-4">Ái chà! Không thấy gì cả</h3>
              <p className="text-gray-500 max-w-sm mb-10 leading-relaxed font-medium">Hệ thống của chúng tôi không tìm thấy đôi giày nào khớp với bộ lọc của bạn hiện tại.</p>
              <button 
                onClick={clearAllFilters}
                className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
              >
                Xóa tất cả và thử lại
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {products.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  isNew={topNewProductIds.has(product.id)}
                  isBestselling={topBestsellingProductIds.has(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
