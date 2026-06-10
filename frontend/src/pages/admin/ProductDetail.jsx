import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import { AiOutlineClose, AiOutlineArrowLeft } from 'react-icons/ai';
import { normalizeImageUrl } from '../../utils/imageUrl';

// SVG fallback images for different sizes
const FALLBACK_SVG_400 = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect fill="%23E5E7EB" width="400" height="400"/><text x="50%" y="50%" font-family="Arial" font-size="16" fill="%239CA3AF" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>')}`;
const FALLBACK_SVG_200 = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="%23E5E7EB" width="200" height="200"/><text x="50%" y="50%" font-family="Arial" font-size="12" fill="%239CA3AF" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>')}`;
const FALLBACK_SVG_150 = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150"><rect fill="%23E5E7EB" width="150" height="150"/><text x="50%" y="50%" font-family="Arial" font-size="10" fill="%239CA3AF" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>')}`;
const FALLBACK_SVG_800 = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><rect fill="%23E5E7EB" width="800" height="800"/><text x="50%" y="50%" font-family="Arial" font-size="32" fill="%239CA3AF" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>')}`;

const ProductDetail = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const color = searchParams.get('color');



  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [productsRes, variantsRes, brandsRes, categoriesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products/all`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/brands`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      ]);

      setProducts(productsRes.data || []);
      setVariants(variantsRes.data || []);
      setBrands(brandsRes.data || []);
      setCategories(categoriesRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    (async () => {
      await fetchData();
    })();
  }, [isAdmin, navigate]);

  const getProductBySlug = () => {
    return products.find(p => {
      const productSlug = p.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9-]/g, '');
      return productSlug === slug;
    });
  };

  const product = getProductBySlug();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-500 font-medium flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Đang tải chi tiết sản phẩm...
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center w-full max-w-lg mx-auto">
            <p className="text-gray-500 text-lg mb-4">Không tìm thấy sản phẩm</p>
            <button
              onClick={() => navigate('/admin/products')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
            >
              <AiOutlineArrowLeft size={16} />
              Quay lại danh sách
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Lấy variants của sản phẩm này
  const productVariants = variants.filter(v => v.product_id === product.id);

  const variantCount = productVariants.length;

  // Nếu có color param, filter thêm
  const filteredVariants = color 
    ? productVariants.filter(v => v.color === color)
    : productVariants;

  // Nhóm theo color nếu không có filter
  const variantsByColor = {};
  productVariants.forEach(v => {
    if (!variantsByColor[v.color]) {
      variantsByColor[v.color] = [];
    }
    variantsByColor[v.color].push(v);
  });

  const displayColor = color || (productVariants.length > 0 ? productVariants[0].color : 'N/A');
  const images = (filteredVariants.length > 0 && filteredVariants[0].images) ? filteredVariants[0].images : [];

  // Helper functions to get names from IDs
  const getBrandName = (brandId) => {
    const brand = brands.find(b => b.id === brandId);
    return brand ? brand.name : `Brand #${brandId}`;
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : `Category #${categoryId}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatRating = (rating) => {
    if (!rating) return '—';
    return `${Number(rating).toFixed(1)}/5`;
  };

  const formatPrice = (price) => {
    if (!price) return '—';
    return Number(price).toLocaleString('vi-VN') + ' đ';
  };

  const formatDescription = (desc) => {
    if (!desc) return '—';
    return desc.length > 200 ? desc.substring(0, 200) + '...' : desc;
  };

  const getGenderBadge = (gender) => {
    const genderMap = {
      nam: { label: 'Nam', color: 'bg-blue-100 text-blue-800' },
      nữ: { label: 'Nữ', color: 'bg-pink-100 text-pink-800' },
      unisex: { label: 'Unisex', color: 'bg-gray-100 text-gray-800' }
    };
    const g = genderMap[gender?.toLowerCase()] || genderMap['unisex'];
    return g;
  };

  const parseArrayField = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [field];
      } catch {
        return field.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images Section */}
          <div className="lg:col-span-1 space-y-3">
            {/* Main Image */}
            <div className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition" onClick={() => setSelectedImage(images[0])}>
              <div className="bg-gray-200 h-96 flex items-center justify-center">
                {images[0] ? (
                  <img
                    src={normalizeImageUrl(images[0])}
                    alt={displayColor}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.src = FALLBACK_SVG_400;
                    }}
                  />
                ) : (
                  <p className="text-gray-400">Không có ảnh</p>
                )}
              </div>
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-2 gap-3">
                {images.slice(1).map((img, idx) => (
                  <div key={idx} className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition" onClick={() => setSelectedImage(img)}>
                    <div className="bg-gray-200 h-32 flex items-center justify-center">
                      <img
                        src={normalizeImageUrl(img)}
                        alt={`Thumbnail ${idx + 2}`}
                        className="w-full h-full object-contain hover:scale-105 transition"
                        onError={(e) => {
                          e.target.src = FALLBACK_SVG_200;
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-8 space-y-6">
              {/* Header with Back button */}
              <div className="flex items-start justify-between mb-6">
                <button
                  onClick={() => navigate('/admin/products')}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition mb-4"
                  title="Quay lại trang Sản phẩm"
                >
                  <AiOutlineArrowLeft size={20} />
                  Quay lại
                </button>
              </div>
              <div className="border-b pb-6">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getGenderBadge(product.gender).color}`}>
                    {getGenderBadge(product.gender).label}
                  </span>
                  <span className="text-sm text-gray-600">Màu sắc: {Object.keys(variantsByColor).length}</span>
                  {product.average_rating && (
                    <span className="text-sm text-yellow-600 font-semibold">Rating: {formatRating(product.average_rating)}</span>
                  )}
                </div>
              </div>

              {/* Price & Key Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-transparent p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-bold uppercase mb-1">GIA</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-transparent p-4 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-600 font-bold uppercase mb-1">Thương Hiệu</p>
                  <p className="text-lg font-semibold text-gray-900">{getBrandName(product.brand_id) || product.brand || '—'}</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-transparent p-4 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 font-bold uppercase mb-1">Danh Mục</p>
                  <p className="text-lg font-semibold text-gray-900">{getCategoryName(product.category_id) || product.category || '—'}</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-transparent p-4 rounded-lg border border-orange-200">
                  <p className="text-xs text-orange-600 font-bold uppercase mb-1">Đã Bán</p>
                  <p className="text-2xl font-bold text-orange-600">{product.sold || 0}</p>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 font-bold mb-2">Mô Tả</p>
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                </div>
              )}

              {/* Specifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Đặc tính giày</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'material', label: 'Chất liệu', color: 'from-amber-50 border-amber-200 text-amber-600' },
                    { key: 'style', label: 'Kiểu dáng', color: 'from-indigo-50 border-indigo-200 text-indigo-600' },
                    { key: 'sole', label: 'Đế', color: 'from-teal-50 border-teal-200 text-teal-600' },
                    { key: 'technology', label: 'Công nghệ', color: 'from-violet-50 border-violet-200 text-violet-600' },
                    { key: 'lace_type', label: 'Kiểu dây', color: 'from-rose-50 border-rose-200 text-rose-600' },
                    { key: 'heel_type', label: 'Kiểu gót', color: 'from-lime-50 border-lime-200 text-lime-600' }
                  ].map(spec => (
                    product[spec.key] && (
                      <div key={spec.key} className={`bg-gradient-to-br ${spec.color} p-3 rounded-lg border`}>
                        <p className={`text-xs font-bold ${spec.color} uppercase mb-1`}>{spec.label}</p>
                        <p className="text-sm font-semibold text-gray-900">{product[spec.key]}</p>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Tags */}
              {product.tags && parseArrayField(product.tags).length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-600 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {parseArrayField(product.tags).map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Variants Summary */}
              {/* Các màu sắc */}
            <div>
              <p className="text-sm font-bold text-gray-600 mb-3">Các màu sắc ({Object.keys(variantsByColor).length})</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(variantsByColor).length === 0 ? (
                  <span className="text-sm text-gray-500">Không có biến thể</span>
                ) : (
                  Object.entries(variantsByColor).map(([c, variants]) => {
                    const firstVariantId = variants[0]?.id;
                    return (
                      <button
                        key={c}
                        onClick={() => firstVariantId && navigate(`/admin/variant/${firstVariantId}`)}
                        className="px-3 py-2 rounded-lg bg-white border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition text-sm font-semibold text-gray-700"
                      >
                        {c} ({variants.length})
                      </button>
                    );
                  })
                )}
              </div>
            </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t text-sm">
                <div>
                  <p className="text-gray-600 font-semibold mb-1">Ngày tạo</p>
                  <p className="text-gray-800">{formatDate(product.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-semibold mb-1">Cập nhật lần cuối</p>
                  <p className="text-gray-800">{formatDate(product.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lightbox Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <img
                src={normalizeImageUrl(selectedImage)}
                alt="Phóng to"
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.target.src = FALLBACK_SVG_800;
                }}
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-white text-black rounded-full p-2 hover:bg-gray-200 transition shadow-lg"
              >
                <AiOutlineClose size={24} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ProductDetail;
