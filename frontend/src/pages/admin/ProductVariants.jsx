import { useState, useEffect } from 'react';
import axios from 'axios';
import { AiOutlineEdit, AiOutlineDelete, AiOutlinePlus, AiOutlineDatabase, AiOutlineInfo } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../../components/FileUpload';
import Modal from '../../components/Modal';
import { normalizeImageUrl } from '../../utils/imageUrl';
import { useModal } from '../../hooks/useModal';

const AVAILABLE_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const FALLBACK_SVG_150 = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150"><rect fill="%23E5E7EB" width="150" height="150"/><text x="50%" y="50%" font-family="Arial" font-size="10" fill="%239CA3AF" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>')}`;

const ProductVariants = ({ products, variants, fetchData, filterGender, filterCategory }) => {
  const { modal, closeModal, showError, showSuccess } = useModal();
  const navigate = useNavigate();
  
  // Helper: Prevent flickering by using hash navigation
  const navigateNoFlicker = (path) => {
    window.location.href = `#${path}`;
    setTimeout(() => navigate(path), 0);
  };

  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const [editingKey, setEditingKey] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [lockedSizes, setLockedSizes] = useState([]);
  const [activeColors, setActiveColors] = useState({}); // { product_id: color }
  const [colors, setColors] = useState([]); // [{id, color, hex_code}]
  const [sizes, setSizes] = useState([]); // [{id, size, foot_length_cm}]
  const [searchColor, setSearchColor] = useState(''); // tìm kiếm màu
  // removed batching list: save each color immediately
  const [formData, setFormData] = useState({
    product_id: '',
    color: '',
    sku: '',
    images: []
  });

  // Fetch colors on mount
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const token = localStorage.getItem('token');
        const colorsRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/colors`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setColors(colorsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch colors:', err);
      }
    };
    fetchColors();
  }, []);

  // helper: clear only color-specific fields but keep selected product
  const clearForNewColor = () => {
    setFormData({
      ...formData,
      color: '',
      sku: '',
      images: [],
      ...AVAILABLE_SIZES.reduce((acc, s) => ({ ...acc, [`qty_${s}`]: 0, [`add_qty_${s}`]: 0 }), {})
    });
    setSearchColor('');
    setSelectedSizes([]);
    setLockedSizes([]);
  };

  const handleAddColor = async () => {
    // Exit edit mode so the color field becomes a text input, then clear color-specific fields
    setEditingKey(null);
    setShowForm(true);
    clearForNewColor();
  };

  const handleVariantSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.product_id || !formData.color) {
      showError('Lỗi', 'Vui lòng chọn sản phẩm và nhập màu');
      return;
    }

    // Lookup color_id từ selected color name
    const colorData = colors.find(c => c.color === formData.color);
    if (!colorData) {
      showError('Lỗi', `Màu "${formData.color}" không tồn tại`);
      return;
    }

    const token = localStorage.getItem('token');
    const productId = parseInt(formData.product_id);
    const imagesData = Array.isArray(formData.images) ? formData.images.filter(img => img) : [];

    try {
      if (editingKey) {
        // update existing color group
        const [origPid, origColor] = editingKey.split('-');
        const currentGroupVariants = variants.filter(v => v.product_id === parseInt(origPid) && v.color === origColor);

        // update existing variant quantities
        for (const variant of currentGroupVariants) {
          const baseQty = Number(formData[`qty_${variant.size}`]) || Number(variant.quantity);
          const addQty = Number(formData[`add_qty_${variant.size}`]) || 0;
          
          await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products/${variant.id}`, {
            product_id: productId,
            color_id: colorData.id,
            size: variant.size,
            quantity: baseQty + addQty,
            sku: variant.sku,
            images: imagesData
          }, { headers: { Authorization: `Bearer ${token}` } });
        }

        // add new sizes if any
        const existingSizes = currentGroupVariants.map(v => v.size);
        const newSizes = selectedSizes.filter(s => !existingSizes.includes(s));
        for (const size of newSizes) {
          await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products`, {
            product_id: productId,
            color: formData.color,
            size,
            quantity: parseInt(formData[`qty_${size}`]) || 0,
            sku: formData.sku ? `${formData.sku}-${size}` : `${formData.color}-${size}`,
            images: imagesData
          }, { headers: { Authorization: `Bearer ${token}` } });
        }

        fetchData();
        showSuccess('Thành công', 'Cập nhật màu thành công');
        // keep the form open for further edits
      } else {
        // add new color: check duplicates case-insensitive
        const exists = variants.some(v => v.product_id === productId && (v.color || '').toLowerCase() === (formData.color || '').toLowerCase());
        if (exists) {
          showError('Lỗi', `Màu "${formData.color}" đã tồn tại cho sản phẩm này.`);
          return;
        }

        for (const size of selectedSizes) {
          await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products`, {
            product_id: productId,
            color: formData.color,
            size,
            quantity: parseInt(formData[`qty_${size}`]) || 0,
            sku: formData.sku ? `${formData.sku}-${size}` : `${formData.color}-${size}`,
            images: imagesData
          }, { headers: { Authorization: `Bearer ${token}` } });
        }

        // After successful create, set editingKey so user stays in edit mode for that color
        setEditingKey(`${productId}-${formData.color}`);
        setLockedSizes(selectedSizes);
        fetchData();
        showSuccess('Thành công', 'Đã lưu màu thành công. Bạn có thể tiếp tục chỉnh sửa hoặc nhấn "Thêm màu" để thêm màu khác.');
      }
    } catch (err) {
      console.error(err);
      showError('Lỗi', err.response?.data?.details || err.message);
    }
  };

  const handleEdit = (group) => {
    const sizes = group.variants.map(v => v.size);
    const quantityMap = {};
    group.variants.forEach(v => {
      quantityMap[`qty_${v.size}`] = parseInt(v.quantity) || 0;
      quantityMap[`add_qty_${v.size}`] = 0;
    });

    setFormData({
      product_id: group.product_id,
      color: group.color,
      sku: group.variants[0]?.sku || '',
      images: group.variants[0]?.images || [],
      ...quantityMap
    });
    setSelectedSizes(sizes);
    setLockedSizes(sizes);
    setEditingKey(group.key);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRow = async (id) => {
    if (!window.confirm('Xóa phiên bản này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch {
      showError('Lỗi', 'Không thể xóa. Vui lòng thử lại.');
    }
  };

  const resetForm = () => {
    setFormData({ product_id: '', color: '', sku: '', images: [] });
    setSearchColor('');
    setSelectedSizes([]);
    setLockedSizes([]);
    setEditingKey(null);
    setShowForm(false);
  };

  const handleSwitchColor = async (selectedColor) => {
    if (!selectedColor || selectedColor === formData.color) return;
    if (!editingKey) return;

    // Save current edits for the current color before switching
    await handleVariantSubmit();

    // Load dữ liệu của màu mới từ variants
    const productGroups = variants.filter(v => v.product_id === parseInt(formData.product_id));
    const colorGroup = productGroups.filter(v => v.color === selectedColor);
    
    if (colorGroup.length > 0) {
      const sizes = colorGroup.map(v => v.size);
      const quantityMap = {};
      colorGroup.forEach(v => {
        quantityMap[`qty_${v.size}`] = parseInt(v.quantity) || 0;
        quantityMap[`add_qty_${v.size}`] = 0;
      });
      
      setFormData({
        ...formData,
        color: selectedColor,
        sku: colorGroup[0]?.sku || '',
        images: colorGroup[0]?.images || [],
        ...quantityMap
      });
      setSelectedSizes(sizes);
      setLockedSizes(sizes);
      setEditingKey(`${formData.product_id}-${selectedColor}`);
    }
  };

  const groupedProducts = (() => {
    // Show ALL variants without filter
    const filtered = variants;

    const grouped = {};
    filtered.forEach(v => {
      if (!grouped[v.product_id]) {
        grouped[v.product_id] = {
          product_id: v.product_id,
          colorGroups: {}
        };
      }
      
      if (!grouped[v.product_id].colorGroups[v.color]) {
        grouped[v.product_id].colorGroups[v.color] = {
          color: v.color,
          variants: [],
          key: `${v.product_id}-${v.color}`,
          images: [],
          image: null
        };
      }
      grouped[v.product_id].colorGroups[v.color].variants.push(v);
      // If this variant group has images, store the array and the first image for quick access
      if ((!grouped[v.product_id].colorGroups[v.color].images || grouped[v.product_id].colorGroups[v.color].images.length === 0) && v.images?.length > 0) {
        grouped[v.product_id].colorGroups[v.color].images = v.images; // Lưu toàn bộ mảng ảnh
        grouped[v.product_id].colorGroups[v.color].image = v.images[0]; // Ảnh hiển thị (ảnh 1)
      }
    });

    return Object.values(grouped).map(pg => {
      const cgs = Object.values(pg.colorGroups);
      return {
        ...pg,
        colorGroups: cgs,
        totalQty: cgs.reduce((sum, cg) => sum + cg.variants.reduce((s, v) => s + Number(v.quantity || 0), 0), 0),
        totalSold: cgs.reduce((sum, cg) => sum + cg.variants.reduce((s, v) => s + Number(v.sold || 0), 0), 0),
      };
    }).sort((a,b) => b.product_id - a.product_id);
  })();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Sửa <di> thành <div> ở đây */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">
               Kho hàng ({groupedProducts.length})
            </h2>
            <p className="text-sm text-gray-500">Quản lý biến thể sản phẩm</p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 flex items-center gap-2 text-sm">
              <AiOutlinePlus size={16} /> Thêm
            </button>
          )}
        </div>



        {showForm && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {editingKey ? 'Cập nhật biến thể' : 'Thêm biến thể mới'}
              </h3>
              {!editingKey && (
                <p className="text-sm text-gray-600">
                  Nhập thông tin một màu, rồi nhấn "<strong>Thêm màu</strong>" để tiếp tục thêm màu khác. Khi hoàn tất, nhấn "<strong>Lưu tất cả</strong>" để lưu vào cơ sở dữ liệu.
                </p>
              )}
            </div>
            <form onSubmit={handleVariantSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Sản phẩm</label>
                  <select 
                    required 
                    value={formData.product_id} 
                    onChange={(e) => {
                      setFormData({...formData, product_id: e.target.value, color: '', sku: '', images: [], ...AVAILABLE_SIZES.reduce((acc, s) => ({ ...acc, [`qty_${s}`]: 0 }), {})});
                      setSelectedSizes([]);
                      setLockedSizes([]);
                    }}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm font-medium"
                  >
                    <option value="">-- Chọn --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Phối màu</label>
                  {editingKey ? (
                    <select 
                      value={formData.color} 
                      onChange={(e) => handleSwitchColor(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm font-medium"
                    >
                      {(() => {
                        const productColors = [...new Set(variants.filter(v => v.product_id === parseInt(formData.product_id)).map(v => v.color))];
                        return productColors.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ));
                      })()}
                    </select>
                  ) : (
                    <div className="space-y-1.5">
                      <input 
                        type="text" 
                        placeholder="Tìm kiếm màu..." 
                        value={searchColor} 
                        onChange={(e) => setSearchColor(e.target.value)} 
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm font-medium focus:border-gray-400" 
                      />
                      <div className="relative">
                        <select 
                          value={formData.color} 
                          onChange={(e) => setFormData({...formData, color: e.target.value})}
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm font-medium"
                        >
                          <option value="">-- Chọn màu --</option>
                          {colors
                            .filter(c => c.color.toLowerCase().includes(searchColor.toLowerCase()))
                            .map(c => (
                              <option key={c.id} value={c.color}>
                                ⬤ {c.color} ({c.hex_code})
                              </option>
                            ))
                          }
                        </select>
                      </div>
                      {formData.color && (
                        <div className="flex items-center gap-2 pt-1">
                          <div 
                            className="w-6 h-6 rounded border border-gray-300" 
                            style={{ backgroundColor: colors.find(c => c.color === formData.color)?.hex_code || '#ccc' }}
                          />
                          <span className="text-xs text-gray-600">{formData.color}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {editingKey && <p className="text-xs text-gray-400">Chọn màu khác để chuyển đổi và chỉnh sửa</p>}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Hình ảnh chi tiết màu này</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[0,1,2].map(i => (
                    <div key={i} className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Ảnh {i+1} (tùy chọn)</label>
                        <input type="text" placeholder={`Link hình ảnh ${i+1} hoặc upload bên dưới`} value={formData.images?.[i] || ''} onChange={(e) => {
                          const newImgs = [...(formData.images || [])];
                          newImgs[i] = e.target.value;
                          setFormData({...formData, images: newImgs});
                        }} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium focus:border-gray-400 text-sm" />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Hoặc upload</label>
                        <FileUpload 
                          onUploadSuccess={(url) => {
                            const newImgs = [...(formData.images || [])];
                            newImgs[i] = url;
                            setFormData({...formData, images: newImgs});
                          }}
                          currentImage={formData.images?.[i]}
                          folder="products"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-6 border-t border-gray-200">
              <button type="submit" className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 flex items-center justify-center gap-2">
                <AiOutlineDatabase size={14}/> Lưu
              </button>

              <button type="button" onClick={handleAddColor} className="px-4 py-2 bg-white border border-gray-600 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center justify-center gap-2">
                <AiOutlinePlus size={14}/> Thêm màu
              </button>

              <button type="button" onClick={resetForm} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50">Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {groupedProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(pg => {
          const product = products.find(p => p.id === pg.product_id);
          const activeColor = activeColors[pg.product_id] || pg.colorGroups[0]?.color;
          const currentGroup = pg.colorGroups.find(cg => cg.color === activeColor) || pg.colorGroups[0];
          const groupInStock = currentGroup.variants.reduce((s, v) => s + (Number(v.quantity || 0) - Number(v.sold || 0)), 0);
          const totalInStock = pg.totalQty - pg.totalSold;

          return (
            <div key={pg.product_id} className="flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition">
              <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                {
                  (() => {
                    return (
                      <div onClick={() => navigateNoFlicker(`/admin/variant/${currentGroup.variants[0]?.id}`)} className="block w-full h-full cursor-pointer">
                        <img src={normalizeImageUrl(currentGroup.image || product?.image || '')} className="w-full h-full object-contain" alt={activeColor} onError={(e) => e.target.src = FALLBACK_SVG_150} />
                      </div>
                    );
                  })()
                }
                
                {/* Actions */}
                <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                  <button onClick={() => {
                    window.scrollTo(0, 0);
                    handleEdit({
                      key: currentGroup.key,
                      product_id: pg.product_id,
                      color: currentGroup.color,
                      variants: currentGroup.variants
                    });
                  }} className="flex-1 bg-white text-gray-900 py-1.5 rounded text-xs font-semibold hover:bg-gray-800 hover:text-white transition">Sửa</button>
                  <button onClick={() => { if(window.confirm(`Xóa ${currentGroup.color}?`)) currentGroup.variants.forEach(v => handleDeleteRow(v.id)) }} className="p-1.5 bg-white text-red-600 rounded hover:bg-red-50"><AiOutlineDelete size={14}/></button>
                </div>
              </div>
              
              <div className="p-3 space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-600">{product?.brand}</span>
                    <span className="text-xs font-medium text-gray-500">Tổng: {totalInStock}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    <a href={`/admin/products/${product.id}?color=${encodeURIComponent(activeColor)}`} className="hover:underline">{product?.name || '---'}</a>
                  </h4>
                </div> {/* BẠN BỊ THIẾU THẺ NÀY Ở ĐÂY */}

                {/* Color Selector */}
                <div className="flex flex-wrap gap-1">
                  {pg.colorGroups.map(cg => (
                    <button
                      key={cg.color}
                      onClick={() => setActiveColors({ ...activeColors, [pg.product_id]: cg.color })}
                      className={`px-2 py-0.5 rounded text-xs font-semibold border ${activeColor === cg.color ? 'bg-gray-800 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {cg.color}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 border-t border-gray-100 pt-3">
                <label className="text-xs font-semibold text-gray-600 block mb-2">Số lượng theo size:</label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mb-3">
                  {currentGroup.variants.sort((a,b) => a.size-b.size).map(v => {
                    const remaining = v.quantity - v.sold;
                    return (
                      <div key={v.id} onClick={() => navigateNoFlicker(`/admin/variant/${v.id}`)} className="text-center hover:opacity-80 transition cursor-pointer" title="Xem chi tiết">
                        <div className={`w-full rounded flex items-center justify-center text-xs font-semibold py-1 mb-1 ${remaining <= 0 ? 'bg-gray-100 border border-gray-200 text-gray-400' : 'bg-gray-800 border border-gray-800 text-white'}`}>
                          {v.size}
                        </div>
                        <p className={`text-xs font-semibold ${remaining <= 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {remaining <= 0 ? '0' : remaining}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="text-right">
                  <p className={`text-xs font-semibold ${groupInStock <= 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {groupInStock <= 0 ? 'Hết' : `${groupInStock} còn`}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Bottom */}
      {groupedProducts.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-center gap-2 mt-8 p-6 border-t border-gray-200">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-md border border-gray-300 bg-white font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
          >
            Trước
          </button>
          {Array.from({ length: Math.ceil(groupedProducts.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-2 rounded-md font-semibold transition ${
                currentPage === page
                  ? 'bg-gray-900 text-white border border-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(Math.min(Math.ceil(groupedProducts.length / ITEMS_PER_PAGE), currentPage + 1))}
            disabled={currentPage >= Math.ceil(groupedProducts.length / ITEMS_PER_PAGE)}
            className="px-4 py-2 rounded-md border border-gray-300 bg-white font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
          >
            Sau
          </button>
        </div>
      )}

      <Modal 
        isOpen={modal.isOpen} 
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
        onConfirm={modal.onConfirm || closeModal}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        showCancel={modal.showCancel}
      />
    </div>
    </div>
  );
};

export default ProductVariants;