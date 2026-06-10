import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';
import { normalizeImageUrl } from '../../utils/imageUrl';
import { AiOutlineArrowLeft, AiOutlineEdit, AiOutlineDelete } from 'react-icons/ai';

const VariantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { modal, closeModal, showError, showSuccess } = useModal();
  
  // Helper: Prevent flickering by using hash navigation

  const [variant, setVariant] = useState(null);
  const [product, setProduct] = useState(null);
  const [colorVariants, setColorVariants] = useState([]);
  const [productVariants, setProductVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const FALLBACK_SVG = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect fill="%23E5E7EB" width="300" height="300"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="%239CA3AF" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>')}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const variantRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products/variant/${id}`);
        setVariant(variantRes.data);
        setFormData(variantRes.data);

        // Fetch product base info
        if (variantRes.data.product_id) {
          const prodRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products/base/${variantRes.data.product_id}`);
          setProduct(prodRes.data);

          // Fetch all variants for this product to filter by color
          try {
            const allVariantsRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products`);
            const allData = allVariantsRes.data || [];
            // Filter variants by product_id
            const pVariants = allData.filter(v => v.product_id === variantRes.data.product_id);
            setProductVariants(pVariants);
            
            // Filter variants by product_id and color for current color table
            const filteredVariants = pVariants
              .filter(v => v.color === variantRes.data.color)
              .sort((a, b) => parseInt(a.size) - parseInt(b.size));
            setColorVariants(filteredVariants);
          } catch (err) {
            console.error('Failed to fetch color variants:', err);
          }
        }
      } catch (err) {
        console.error('Failed to fetch variant:', err);
        showError('Lỗi', 'Không thể tải thông tin biến thể');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products/variant/${id}`,
        {
          product_id: formData.product_id,
          color: formData.color,
          size: formData.size,
          sku: formData.sku,
          images: formData.images
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVariant(formData);
      setEditing(false);
      showSuccess('Thành công', 'Cập nhật biến thể thành công');
    } catch (err) {
      console.error('Failed to save:', err);
      showError('Lỗi', err.response?.data?.details || 'Cập nhật thất bại');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Xóa biến thể ${variant.color} - Size ${variant.size}? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products/variant/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess('Thành công', 'Đã xóa biến thể');
      setTimeout(() => navigateNoFlicker('/admin/products?tab=variants'), 1500);
    } catch (err) {
      console.error('Failed to delete:', err);
      showError('Lỗi', 'Không thể xóa. Vui lòng thử lại');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-500 font-medium flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Đang tải dữ liệu...
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!variant) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="text-gray-500 text-lg">Không tìm thấy biến thể</div>
          <button
            onClick={() => navigate('/admin/products?tab=variants')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
          >
            <AiOutlineArrowLeft size={16} />
            Quay lại danh sách
          </button>
        </div>
      </AdminLayout>
    );
  }

  // Generate slug from product name (matching ProductDetail logic)
  const generateProductSlug = () => {
    if (!product?.name) return '';
    return product.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9-]/g, '');
  };

  const imported = parseInt(variant.quantity) || 0;
  const sold = parseInt(variant.sold) || 0;
  const stock = imported - sold;
  const stockStatus = stock <= 0 ? 'Hết' : stock <= 5 ? 'Sắp hết' : 'Còn hàng';
  const stockColor = stock <= 0 ? 'text-red-600' : stock <= 5 ? 'text-orange-600' : 'text-green-600';

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Images */}
          <div className="lg:col-span-1 space-y-3">
            {/* Main Image */}
            <div className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition">
              <div className="bg-gray-200 h-96 flex items-center justify-center">
                <img
                  src={normalizeImageUrl(variant.images?.[0] || product?.image || '')}
                  alt={variant.color}
                  className="w-full h-full object-contain"
                  onError={(e) => (e.target.src = FALLBACK_SVG)}
                />
              </div>
            </div>

            {/* Thumbnail Images */}
            {variant.images?.length > 1 && (
              <div className="grid grid-cols-2 gap-3">
                {variant.images.slice(1).map((img, idx) => (
                  <div key={idx} className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition">
                    <div className="bg-gray-200 h-32 flex items-center justify-center">
                      <img
                        src={normalizeImageUrl(img)}
                        alt={`Thumbnail ${idx + 2}`}
                        className="w-full h-full object-contain hover:scale-105 transition"
                        onError={(e) => (e.target.src = FALLBACK_SVG)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-8 space-y-6">
              {/* Header with Back and Product Links */}
              <div className="flex items-start justify-between mb-2">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  title="Quay lại trang trước đó"
                >
                  <AiOutlineArrowLeft size={20} />
                  Quay lại
                </button>
                {product && (
              <button
                onClick={() => navigate(`/admin/products/${generateProductSlug()}`)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-sm whitespace-nowrap"
                title="Xem sản phẩm gốc"
              >
                Sản phẩm gốc
              </button>
             )}
              </div>

              {/* Title Section */}
              <div className="border-b pb-6">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {product?.name || 'Chi tiết biến thể'}
                </h1>
                <div className="flex items-center gap-3 mb-4">
                  <p className="text-sm text-gray-600">
                    {variant.color} - Size {variant.size}
                  </p>
                </div>

                {/* Color Variant Buttons */}
                {/* Các màu khác trong VariantDetail.jsx */}
              {productVariants && productVariants.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center pt-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase mr-2">Các màu khác:</span>
                  {[...new Map(productVariants.map(v => [v.color, v])).values()].map((colorVar) => (
                    <button
                      key={colorVar.color}
                      onClick={() => {
                        const firstSizeVariant = productVariants.find(v => v.color === colorVar.color);
                        if (firstSizeVariant) {
                          navigate(`/admin/variant/${firstSizeVariant.id}`);
                        }
                      }}
                      className={`px-4 py-1.5 rounded-lg font-semibold text-sm transition ${
                        colorVar.color === variant.color
                          ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {colorVar.color}
                    </button>
                  ))}
                </div>
              )}
              </div>

              {/* Info Cards - Inventory Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-gray-50 to-transparent p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 font-bold uppercase mb-1">Nhập</p>
                  <p className="text-2xl font-bold text-gray-900">{imported}</p>
                  <p className="text-xs text-gray-500 mt-1">Tổng đã nhập</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-transparent p-4 rounded-lg border border-red-200">
                  <p className="text-xs text-red-600 font-bold uppercase mb-1">Bán</p>
                  <p className="text-2xl font-bold text-red-600">{sold}</p>
                  <p className="text-xs text-gray-500 mt-1">Tổng đã bán</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-transparent p-4 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 font-bold uppercase mb-1">Tồn Kho</p>
                  <p className={`text-2xl font-bold ${stockColor}`}>{stock}</p>
                  <p className="text-xs text-gray-500 mt-1">Còn trong kho</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-transparent p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-bold uppercase mb-1">Trạng Thái</p>
                  <p className={`text-lg font-semibold ${stockColor}`}>{stockStatus}</p>
                  <p className="text-xs text-gray-500 mt-1">Tình trạng</p>
                </div>
              </div>

              {/* All Sizes Table for Current Color */}
              {colorVariants.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">
                      Tất cả kích thước - Màu {variant?.color}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Hiển thị dữ liệu của tất cả các size cho màu này</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Kích thước</th>
                        <th className="px-6 py-3 text-center font-semibold text-gray-700">Tổng đã nhập</th>
                        <th className="px-6 py-3 text-center font-semibold text-gray-700">Tổng đã bán</th>
                        <th className="px-6 py-3 text-center font-semibold text-gray-700">Còn trong kho</th>
                        <th className="px-6 py-3 text-center font-semibold text-gray-700">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {colorVariants.map((v, idx) => {
                        const vImported = parseInt(v.quantity) || 0;
                        const vSold = parseInt(v.sold) || 0;
                        const vStock = vImported - vSold;
                        const vStatus = vStock <= 0 ? 'Hết' : vStock <= 5 ? 'Sắp hết' : 'Còn hàng';
                        const vStatusColor = vStock <= 0 ? 'text-red-600' : vStock <= 5 ? 'text-orange-600' : 'text-green-600';
                        const vStatusBg = vStock <= 0 ? 'bg-red-50' : vStock <= 5 ? 'bg-orange-50' : 'bg-green-50';

                        return (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <span className="font-semibold text-gray-900">Size {v.size}</span>
                            </td>
                            <td className="px-6 py-4 text-center text-gray-600 font-medium">{vImported}</td>
                            <td className="px-6 py-4 text-center text-gray-600 font-medium">{vSold}</td>
                            <td className="px-6 py-4 text-center font-bold">{vStock}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${vStatusBg} ${vStatusColor}`}>
                                {vStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Details Section */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-300">
                  <h2 className="text-lg font-semibold text-gray-900">Thông tin chi tiết</h2>
                  {!editing && (
                    <button
                      onClick={() => {
                        window.scrollTo(0, 0);
                        setEditing(true);
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <AiOutlineEdit size={14} /> Chỉnh sửa
                    </button>
                  )}
                </div>

              {editing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Sản phẩm
                      </label>
                      <input
                        type="text"
                        value={product?.name || ''}
                        disabled
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded text-sm text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Thương hiệu
                      </label>
                      <input
                        type="text"
                        value={product?.brand || ''}
                        disabled
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded text-sm text-gray-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Màu sắc
                      </label>
                      <input
                        type="text"
                        value={formData.color || ''}
                        disabled
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded text-sm text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Kích thước
                      </label>
                      <input
                        type="text"
                        value={formData.size || ''}
                        disabled
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded text-sm text-gray-500"
                      />
                    </div>
                  </div>



                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={formData.sku || ''}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                    >
                      Lưu thay đổi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setFormData(variant);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 flex items-center gap-2"
                    >
                      <AiOutlineDelete size={14} /> Xóa
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Màu sắc</p>
                    <p className="text-base font-semibold text-gray-900">{variant.color}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Kích thước</p>
                    <p className="text-base font-semibold text-gray-900">{variant.size}</p>
                  </div>
                  <div className="pt-3 border-t border-gray-300">
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-2">SKU</p>
                    <p className="font-mono text-sm bg-white rounded px-3 py-2 border border-gray-300">
                      {variant.sku || '—'}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-gray-300">
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Ngày tạo</p>
                    <p className="text-sm text-gray-700">
                      {variant.created_at
                        ? new Date(variant.created_at).toLocaleString('vi-VN')
                        : '—'}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-gray-300">
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Cập nhật lần cuối</p>
                    <p className="text-sm text-gray-700">
                      {variant.updated_at
                        ? new Date(variant.updated_at).toLocaleString('vi-VN')
                        : '—'}
                    </p>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
        onConfirm={modal.onConfirm || closeModal}
      />
    </AdminLayout>
  );
};

export default VariantDetail;
