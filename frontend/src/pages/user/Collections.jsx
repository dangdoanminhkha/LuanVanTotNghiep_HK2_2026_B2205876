import { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Products from './Products';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

const Collections = () => {
  const { collection } = useParams();
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);

  // Fetch brands and categories for dynamic menu
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandsRes, categoriesRes] = await Promise.all([
          axios.get(`${API_URL}/brands`),
          axios.get(`${API_URL}/categories`)
        ]);
        setBrands(brandsRes.data || []);
        setCategories(categoriesRes.data || []);
        
        // If current route is a category slug, find its info
        if (collection && collection !== 'all' && collection !== 'nam' && collection !== 'nu' && 
            collection !== 'moi' && collection !== 'ban-chay' && collection !== 'sale' && 
            collection !== 'brand') {
          const cat = (categoriesRes.data || []).find(c => c.slug === collection);
          if (cat) {
            setCurrentCategory(cat);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, [collection]);

  const presetFilters = useMemo(() => {
    // Return empty for '/collections' or '/collections/all'
    if (!collection || collection === 'all') {
      return {};
    }

    // Gender filters
    if (collection === 'nam') {
      return { gender: 'Nam' };
    }
    if (collection === 'nu') {
      return { gender: 'Nữ' };
    }

    // Special collections
    if (collection === 'moi') {
      return { sort: 'newest' };
    }
    if (collection === 'ban-chay') {
      return { sort: 'bestselling' };
    }
    if (collection === 'sale') {
      return { onSale: 'true' };
    }
    if (collection === 'brand') {
      // Show all products for brand listing page
      return {};
    }

    // Check if it's a category slug - match directly from categories
    if (currentCategory) {
      // If the category is strictly for one gender, we don't need to add gender filter
      // But adding it doesn't hurt if we want to be explicit
      return { category: collection };
    }

    // NEW: Handle compound slugs like 'sandal-nam' or 'sandal-nu'
    if (collection.endsWith('-nam')) {
      const baseSlug = collection.replace('-nam', '');
      const cat = categories.find(c => c.slug === baseSlug);
      if (cat) {
        return { category: baseSlug, gender: 'Nam' };
      }
    }
    if (collection.endsWith('-nu')) {
      const baseSlug = collection.replace('-nu', '');
      const cat = categories.find(c => c.slug === baseSlug);
      if (cat) {
        return { category: baseSlug, gender: 'Nữ' };
      }
    }

    // Check if it's a brand slug - match by brand name (case-insensitive)
    const matchedBrand = brands.find(b => 
      (b.slug && b.slug === collection) || 
      (b.name && b.name.toLowerCase().replace(/\s+/g, '-').replace(/['']/g, '') === collection)
    );
    if (matchedBrand) {
      return { brand: matchedBrand.name };
    }

    // If none match, try to use collection as brand name directly for backward compatibility
    return { brand: collection };
  }, [collection, currentCategory, brands]);


  const getTitle = () => {
    if (!collection || collection === 'all') {
      return 'Tất cả sản phẩm';
    }

    const titles = {
      'nam': 'Sản phẩm Nam',
      'nu': 'Sản phẩm Nữ',
      'moi': 'Sản phẩm mới nhất',
      'ban-chay': 'Sản phẩm bán chạy',
      'sale': 'Sản phẩm đang giảm giá',
      'brand': 'Thương hiệu'
    };

    // If in hardcoded titles, use it
    if (titles[collection]) {
      return titles[collection];
    }

    // If it's a category, use category name
    if (currentCategory && !collection.endsWith('-nam') && !collection.endsWith('-nu')) {
      return `Sản phẩm ${currentCategory.name}`;
    }

    if (collection.endsWith('-nam')) {
      const baseSlug = collection.replace('-nam', '');
      const cat = categories.find(c => c.slug === baseSlug);
      if (cat) return `${cat.name} Nam`;
    }
    if (collection.endsWith('-nu')) {
      const baseSlug = collection.replace('-nu', '');
      const cat = categories.find(c => c.slug === baseSlug);
      if (cat) return `${cat.name} Nữ`;
    }

    // If it's a brand, use brand name
    const matchedBrand = brands.find(b => 
      (b.slug && b.slug === collection) || 
      b.name.toLowerCase().replace(/\s+/g, '-').replace(/['']/g, '') === collection
    );
    if (matchedBrand) {
      return `Sản phẩm ${matchedBrand.name}`;
    }

    // Fallback: humanize the collection name
    return `Sản phẩm ${collection.replace(/-/g, ' ')}`;
  };

  // Special page for /collections/brand - show all brands
  if (collection === 'brand') {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Thương hiệu</h1>
        
        {/* Brand Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {brands.map(brand => (
            <Link 
              key={brand.brand_id}
              to={`/collections/${brand.slug || brand.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 text-center group"
            >
              {brand.logo_url ? (
                <img 
                  src={brand.logo_url} 
                  alt={brand.name} 
                  className="h-16 w-auto mx-auto mb-4 object-contain group-hover:scale-110 transition-transform"
                />
              ) : (
                <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold group-hover:scale-110 transition-transform">
                  {brand.name?.charAt(0) || 'B'}
                </div>
              )}
              <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {brand.name}
              </h3>
              {brand.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{brand.description}</p>
              )}
            </Link>
          ))}
        </div>
        
        {/* Show all products below brand cards */}
        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tất cả sản phẩm</h2>
          <Products presetFilters={{}} hideTitle />
        </div>
      </div>
    );
  }

  return <Products title={getTitle()} presetFilters={presetFilters} />;
};

export default Collections;