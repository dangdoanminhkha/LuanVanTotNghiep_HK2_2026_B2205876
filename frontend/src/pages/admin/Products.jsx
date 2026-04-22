import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { AiOutlineEdit, AiOutlineDelete, AiOutlinePlus, AiOutlineSearch, AiOutlineFilter, AiOutlineTag } from 'react-icons/ai';
import { useLocation, useNavigate } from 'react-router-dom';
import FileUpload from '../../components/FileUpload';
import AdminProductVariants from './ProductVariants';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';
import { normalizeImageUrl } from '../../utils/imageUrl';
import AdminLayout from '../../components/AdminLayout';

const FALLBACK_SVG_150 = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150"><rect fill="%23E5E7EB" width="150" height="150"/><text x="50%" y="50%" font-family="Arial" font-size="10" fill="%239CA3AF" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>')}`;

const AdminProducts = () => {
  const { modal, closeModal, showError, showSuccess, showWarning } = useModal();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Helper: Prevent flickering by using hash navigation
  const navigateNoFlicker = (path) => {
    window.location.href = `#${path}`;
    setTimeout(() => navigate(path), 0);
  };

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('productsTab') || 'products';
  });

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('productsTab', activeTab);
  }, [activeTab]);
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Time filter states
  const now = new Date();
  const [timeFilterMode, setTimeFilterMode] = useState('all'); // 'all' | 'month' | 'year' | 'custom'
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Sync tab and range from Dashboard if provided - only on first load with state
  const hasProcessedState = useRef(false);
  useEffect(() => {
    if (hasProcessedState.current) return; // Skip if already processed
    
    if (location.state?.initialTab || location.state?.initialRange) {
      hasProcessedState.current = true;
      
      if (location.state?.initialTab) {
        setActiveTab(location.state.initialTab);
      }
      if (location.state?.initialRange) {
        const range = location.state.initialRange;
        if (range === 'thisMonth') {
          setTimeFilterMode('month');
          if (location.state?.initialMonth) {
            setSelectedMonth(location.state.initialMonth);
          } else {
            setSelectedMonth(now.getMonth() + 1);
          }
          if (location.state?.initialYear) {
            setSelectedYear(location.state.initialYear);
          } else {
            setSelectedYear(now.getFullYear());
          }
        } else if (range === 'thisYear') {
          setTimeFilterMode('year');
          if (location.state?.initialYear) {
            setSelectedYear(location.state.initialYear);
          } else {
            setSelectedYear(now.getFullYear());
          }
        } else if (range === 'custom') {
          setTimeFilterMode('custom');
          if (location.state.startDate) setCustomStartDate(location.state.startDate);
          if (location.state.endDate) setCustomEndDate(location.state.endDate);
        } else {
          setTimeFilterMode('all');
        }
      }
    }
  }, []); // Empty dependency - run only once on mount

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '', brand_id: '', price: '', category_id: '', gender: '',
    description: '', image: '', tags: '',
    material: '', style: '', sole: '', technology: '', lace_type: '', heel_type: ''
  });

  const [brandFormData, setBrandFormData] = useState({
    name: '', slug: '', logo: '', is_active: true, sort_order: 0
  });
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);

  const [categoryFormData, setCategoryFormData] = useState({
    name: '', slug: '', gender_applicable: 'unisex', description: '', image: '', is_active: true, sort_order: 0
  });
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [colorFormData, setColorFormData] = useState({
    color: '', hex_code: '#000000'
  });
  const [showColorForm, setShowColorForm] = useState(false);
  const [editingColor, setEditingColor] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const [resP, resV, resB, resC, resCol] = await Promise.all([
        axios.get('http://localhost:5000/api/products/all'),
        axios.get('http://localhost:5000/api/products'),
        axios.get('http://localhost:5000/api/brands'),
        axios.get('http://localhost:5000/api/categories-new'),
        axios.get('http://localhost:5000/api/colors', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setProducts(resP.data);
      setVariants(resV.data);
      setBrands(resB.data);
      setCategories(resC.data);
      setColors(resCol.data);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = { ...formData, price: parseInt(formData.price) };
      if (editingProduct) {
        await axios.put(`http://localhost:5000/api/products/base/${editingProduct.id}`, data, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('http://localhost:5000/api/products/base', data, { headers: { Authorization: `Bearer ${token}` } });
      }
      resetForm();
      fetchData();
      showSuccess('Thành công', 'Lưu sản phẩm thành công');
    } catch (error) {
      showError('Lỗi', error.response?.data?.details || error.message);
    }
  };

  const handleProductDelete = async (id) => {
    if (!window.confirm('Xóa sản phẩm này sẽ xóa tất cả các biến thể liên quan. Tiếp tục?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/products/base/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch {
      showError('Lỗi', 'Lỗi khi xóa');
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', brand_id: '', price: '', category_id: '', gender: '', description: '', image: '', tags: '',
      material: '', style: '', sole: '', technology: '', lace_type: '', heel_type: ''
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleEditProduct = (p) => {
    // Parse specification JSON into 6 fields
    let spec = {
      material: '', style: '', sole: '', technology: '', lace_type: '', heel_type: ''
    };
    try {
      if (p.specification && typeof p.specification === 'string') {
        spec = JSON.parse(p.specification);
      } else if (p.specification && typeof p.specification === 'object') {
        spec = p.specification;
      }
    } catch (e) {
      // Failed to parse specification
    }
    
    setFormData({
      ...p,
      ...spec,
      specification: undefined,
      // Ensure we use brand_id and category_id if present
      brand_id: p.brand_id || p.brand,
      category_id: p.category_id || p.category
    });
    setEditingProduct(p);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredProducts = products.filter(p => {
    // Get brand name from relationship or fallback to brand field
    const brandName = typeof p.brand === 'object' ? (p.brand?.name || '') : (p.brand || '');
    const categoryName = typeof p.category === 'object' ? (p.category?.name || '') : (p.category || '');
    
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       brandName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGender = filterGender === 'all' || p.gender === filterGender;
    const matchCat = filterCategory === 'all' || categoryName === filterCategory;

    // Date filter
    let matchDate = true;
    if (timeFilterMode !== 'all') {
      const productDate = new Date(p.created_at || p.createdAt);
      
      if (timeFilterMode === 'month') {
        matchDate = productDate.getMonth() + 1 === selectedMonth && productDate.getFullYear() === selectedYear;
      } else if (timeFilterMode === 'year') {
        matchDate = productDate.getFullYear() === selectedYear;
      } else if (timeFilterMode === 'custom' && customStartDate && customEndDate) {
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        matchDate = productDate >= startDate && productDate <= endDate;
      }
    }

    return matchSearch && matchGender && matchCat && matchDate;
  });

  // Reset pagination when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterGender, timeFilterMode, selectedMonth, selectedYear, customStartDate, customEndDate]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Brand management functions
  const handleBrandSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingBrand) {
        await axios.put(`http://localhost:5000/api/brands/${editingBrand.id}`, brandFormData, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        showSuccess('Thành công', 'Cập nhật thương hiệu thành công');
      } else {
        await axios.post('http://localhost:5000/api/brands', brandFormData, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        showSuccess('Thành công', 'Thêm thương hiệu thành công');
      }
      resetBrandForm();
      fetchData();
    } catch (error) {
      showError('Lỗi', error.response?.data?.error || error.message);
    }
  };

  const handleBrandDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa thương hiệu này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/brands/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      showSuccess('Thành công', 'Xóa thương hiệu thành công');
      fetchData();
    } catch (error) {
      showError('Lỗi', error.response?.data?.error || 'Không thể xóa thương hiệu');
    }
  };

  const resetBrandForm = () => {
    setBrandFormData({ name: '', slug: '', logo: '', is_active: true, sort_order: 0 });
    setEditingBrand(null);
    setShowBrandForm(false);
  };

  const handleEditBrand = (brand) => {
    setBrandFormData(brand);
    setEditingBrand(brand);
    setShowBrandForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Category management functions
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingCategory) {
        await axios.put(`http://localhost:5000/api/categories-new/${editingCategory.id}`, categoryFormData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSuccess('Thành công', 'Cập nhật loại giày thành công');
      } else {
        await axios.post('http://localhost:5000/api/categories-new', categoryFormData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSuccess('Thành công', 'Thêm loại giày thành công');
      }
      resetCategoryForm();
      fetchData();
    } catch (error) {
      showError('Lỗi', error.response?.data?.error || error.message);
    }
  };

  const handleCategoryDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa loại giày này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/categories-new/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess('Thành công', 'Xóa loại giày thành công');
      fetchData();
    } catch (error) {
      showError('Lỗi', error.response?.data?.error || 'Không thể xóa loại giày');
    }
  };

  const resetCategoryForm = () => {
    setCategoryFormData({ name: '', slug: '', gender_applicable: 'unisex', description: '', image: '', is_active: true, sort_order: 0 });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const handleEditCategory = (category) => {
    setCategoryFormData(category);
    setEditingCategory(category);
    setShowCategoryForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-2xl tracking-tighter text-gray-400">LOADING DATABASE...</div>;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-8 pt-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Quản lý sản phẩm</h1>
        </header>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'products' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Sản phẩm
          </button>
          <button
            onClick={() => setActiveTab('variants')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'variants' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Kho hàng
          </button>
          <button
            onClick={() => setActiveTab('brands')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'brands' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Thương hiệu
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'categories' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Loại giày
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'colors' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            🎨 Màu sắc
          </button>
        </div>

        {activeTab === 'products' ? (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <AiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Tìm kiếm sản phẩm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium text-sm" />
              </div>
              <div className="flex gap-2 w-full lg:w-auto flex-wrap">
                <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-semibold text-sm outline-none cursor-pointer">
                  <option value="all">Tất cả</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Unisex">Unisex</option>
                </select>
                <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-700 transition">
                  <AiOutlinePlus size={16} /> Them
                </button>
              </div>
            </div>

            {/* Time Filter */}
            <div className="flex flex-col gap-4 bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex gap-2 flex-wrap items-center">
                <button
                  onClick={() => setTimeFilterMode('all')}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${timeFilterMode === 'all' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setTimeFilterMode('month')}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${timeFilterMode === 'month' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Theo Tháng
                </ button>
                <button
                  onClick={() => setTimeFilterMode('year')}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${timeFilterMode === 'year' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Theo Năm
                </button>
                <button
                  onClick={() => setTimeFilterMode('custom')}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${timeFilterMode === 'custom' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Tuỳ chỉnh khoảng ngày
                </button>
              </div>

              {timeFilterMode === 'month' && (
                <div className="flex gap-2 flex-wrap items-center">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Tháng {i + 1}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none cursor-pointer"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <option key={year} value={year}>
                          Năm {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {timeFilterMode === 'year' && (
                <div className="flex gap-2 flex-wrap items-center">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none cursor-pointer"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <option key={year} value={year}>
                          Năm {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {timeFilterMode === 'custom' && (
                <div className="flex gap-2 flex-wrap items-center">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none"
                    placeholder="Ngay bat dau"
                  />
                  <span className="text-gray-600 font-semibold">den</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none"
                    placeholder="Ngay ket thuc"
                  />
                  {(customStartDate || customEndDate) && (
                    <button
                      onClick={() => {
                        setCustomStartDate('');
                        setCustomEndDate('');
                        setTimeFilterMode('all');
                      }}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-200 transition"
                    >
                      Xoa bo suc
                    </button>
                  )}
                </div>
              )}
            </div>

            {showForm && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">{editingProduct ? 'Chỉnh sửa sản phẩm' : 'Tạo sản phẩm mới'}</h3>
                <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Tên sản phẩm</label>
                        <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium focus:border-gray-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Thương hiệu</label>
                            <select required value={formData.brand_id} onChange={(e) => setFormData({...formData, brand_id: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium focus:border-gray-400">
                                <option value="">-- Chọn --</option>
                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Giá (VNĐ)</label>
                            <input type="text" required value={formData.price} onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setFormData({...formData, price: val});
                            }} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium focus:border-gray-400" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Loại</label>
                            <select required value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium focus:border-gray-400">
                                <option value="">-- Chọn --</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Giới tính</label>
                            <select required value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium focus:border-gray-400">
                                <option value="">Chọn</option>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Unisex">Unisex</option>
                            </select>
                        </div>
                    </div>
                  </div>
                  <div className="lg:col-span-5 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Mô tả</label>
                        <textarea rows="3" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium focus:border-gray-400 resize-none"></textarea>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Thông số kỹ thuật</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Chất liệu</label>
                            <input type="text" value={formData.material || ''} onChange={(e) => setFormData({...formData, material: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:border-gray-400" placeholder="" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Kiểu dáng</label>
                            <input type="text" value={formData.style || ''} onChange={(e) => setFormData({...formData, style: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:border-gray-400" placeholder="" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Đế giày</label>
                            <input type="text" value={formData.sole || ''} onChange={(e) => setFormData({...formData, sole: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:border-gray-400" placeholder="" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Công nghệ</label>
                            <input type="text" value={formData.technology || ''} onChange={(e) => setFormData({...formData, technology: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:border-gray-400" placeholder="" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Kiểu khóa</label>
                            <input type="text" value={formData.lace_type || ''} onChange={(e) => setFormData({...formData, lace_type: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:border-gray-400" placeholder="" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Gót/Chiều cao</label>
                            <input type="text" value={formData.heel_type || ''} onChange={(e) => setFormData({...formData, heel_type: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:border-gray-400" placeholder="" />
                          </div>
                        </div>
                    </div>
                  </div>
                  <div className="lg:col-span-3 flex flex-col gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">URL Ảnh</label>
                        <input type="text" value={formData.image || ''} onChange={(e) => setFormData({...formData, image: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium focus:border-gray-400 text-sm" placeholder="http://example.com/image.jpg hoặc /uploads/image.jpg" />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Hoặc upload</label>
                        <FileUpload 
                          onUploadSuccess={(url) => setFormData({...formData, image: url})}
                          currentImage={formData.image}
                          folder="products"
                        />
                    </div>

                    <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center p-3">
                        {formData.image ? <img src={normalizeImageUrl(formData.image)} alt="Preview" className="max-h-[100px] rounded" onError={(e) => e.target.src = FALLBACK_SVG_150} /> : <p className="text-xs text-gray-400">Xem trước</p>}
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 text-sm">Lưu</button>
                        <button type="button" onClick={resetForm} className="px-4 py-2 bg-white text-gray-700 rounded-lg font-semibold border border-gray-200 hover:bg-gray-50 text-sm">Hủy</button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedProducts && paginatedProducts.length > 0 ? paginatedProducts.map(p => {
                const slug = (p.name || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/đ/g, 'd').replace(/[^a-z0-9-]/g, '');
                return (
                <div key={p.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-lg transition flex flex-col">
                  <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-100 cursor-pointer" onClick={() => navigateNoFlicker(`/admin/products/${slug}`)}>
                    <img src={normalizeImageUrl(p.image)} className="w-full h-full object-contain" alt={p.name} onError={(e) => e.target.src = FALLBACK_SVG_150} />
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-gray-600">{p.brand}</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleEditProduct(p)} className="p-1.5 text-gray-400 hover:text-gray-600"><AiOutlineEdit size={16}/></button>
                      <button onClick={() => handleProductDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600"><AiOutlineDelete size={16}/></button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 text-sm">
                    <span onClick={() => navigateNoFlicker(`/admin/products/${slug}`)} className="hover:underline text-gray-900 cursor-pointer">{p.name}</span>
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">{p.category}</p>
                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                    <p className="font-bold text-gray-900">{Number(p.price || 0).toLocaleString('vi-VN', {maximumFractionDigits: 0, minimumFractionDigits: 0})}đ</p>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">{p.gender}</span>
                  </div>
                </div>
                )
              }) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  Không có sản phẩm nào
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-md border border-gray-300 bg-white font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-md border border-gray-300 bg-white font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'variants' ? (
          <div>
            <AdminProductVariants
              products={products}
              variants={variants}
              fetchData={fetchData}
              filterGender={filterGender}
              filterCategory={filterCategory}
            />
          </div>
        ) : activeTab === 'brands' ? (
          // Brands Management Tab
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              <div className="flex gap-4 w-full lg:w-auto">
                <button 
                  onClick={() => setShowBrandForm(true)} 
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 text-sm flex items-center gap-2"
                >
                  <AiOutlinePlus size={16} /> Thêm
                </button>
              </div>
            </div>

            {showBrandForm && (
                <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg text-gray-900">
                    {editingBrand ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu'}
                  </h3>
                  <button onClick={resetBrandForm} className="text-gray-400 hover:text-gray-600">
                    <AiOutlineDelete size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleBrandSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tên thương hiệu</label>
                    <input 
                      type="text" 
                      required 
                      value={brandFormData.name} 
                      onChange={(e) => setBrandFormData({...brandFormData, name: e.target.value})} 
                      className="w-full px-4 py-2 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold transition-all" 
                      placeholder=""
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1\">Slug</label>
                    <input 
                      type="text" 
                      value={brandFormData.slug} 
                      onChange={(e) => setBrandFormData({...brandFormData, slug: e.target.value})} 
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium focus:border-gray-400" 
                      placeholder=""
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Logo URL</label>
                    <input 
                      type="url" 
                      value={brandFormData.logo} 
                      onChange={(e) => setBrandFormData({...brandFormData, logo: e.target.value})} 
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium focus:border-gray-400" 
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Hoặc upload</label>
                    <FileUpload 
                      onUploadSuccess={(url) => setBrandFormData({...brandFormData, logo: url})}
                      currentImage={brandFormData.logo}
                      folder="brands"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Thứ tự</label>
                    <input 
                      type="text" 
                      value={brandFormData.sort_order} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setBrandFormData({...brandFormData, sort_order: val ? parseInt(val) : 0});
                      }} 
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium focus:border-gray-400" 
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 col-span-full">
                    <input 
                      type="checkbox" 
                      id="is_active"
                      checked={brandFormData.is_active} 
                      onChange={(e) => setBrandFormData({...brandFormData, is_active: e.target.checked})} 
                      className="w-4 h-4 rounded"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Kích hoạt</label>
                  </div>
                  
                  <div className="col-span-full flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 text-sm">
                      {editingBrand ? 'Cập nhật' : 'Lưu'}
                    </button>
                    <button type="button" onClick={resetBrandForm} className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 font-semibold hover:bg-gray-50 text-sm">
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {brands && brands.length > 0 ? brands.map(brand => (
                <div key={brand.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-lg transition flex flex-col">
                  {brand.logo && (
                    <div className="rounded-lg overflow-hidden mb-3 bg-gray-100 h-32 flex items-center justify-center">
                      <img src={brand.logo} className="max-h-full max-w-full object-contain" alt={brand.name} />
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${brand.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {brand.is_active ? 'Hoạt động' : 'Ẩn'}
                    </span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => handleEditBrand(brand)} className="p-1.5 text-gray-400 hover:text-gray-600">
                        <AiOutlineEdit size={16}/>
                      </button>
                      <button type="button" onClick={() => handleBrandDelete(brand.id)} className="p-1.5 text-gray-400 hover:text-red-600">
                        <AiOutlineDelete size={16}/>
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1 text-sm">
                    {brand.name}
                  </h3>
                  
                  <p className="text-xs text-gray-500 mb-3">/{brand.slug}</p>
                  
                  <div className="mt-auto pt-3 border-t border-gray-100 text-xs text-gray-500">
                    Thứ tự: #{brand.sort_order || 0}
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  Không có thương hiệu nào
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'categories' ? (
          // Categories Management Tab
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              <div className="flex gap-4 w-full lg:w-auto">
                <button 
                  onClick={() => setShowCategoryForm(true)} 
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 text-sm flex items-center gap-2"
                >
                  <AiOutlinePlus size={16} /> Thêm
                </button>
              </div>
            </div>

            {showCategoryForm && (
                <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg text-gray-900">
                    {editingCategory ? 'Chỉnh sửa loại giày' : 'Thêm loại giày'}
                  </h3>
                  <button onClick={resetCategoryForm} className="text-gray-400 hover:text-gray-600">
                    <AiOutlineDelete size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleCategorySubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Tên</label>
                    <input 
                      type="text" 
                      required 
                      value={categoryFormData.name} 
                      onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})} 
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium focus:border-gray-400" 
                      placeholder=""
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Slug</label>
                    <input 
                      type="text" 
                      value={categoryFormData.slug} 
                      onChange={(e) => setCategoryFormData({...categoryFormData, slug: e.target.value})} 
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium focus:border-gray-400" 
                      placeholder=""
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Giới tính</label>
                    <select 
                      value={categoryFormData.gender_applicable}
                      onChange={(e) => setCategoryFormData({...categoryFormData, gender_applicable: e.target.value})}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium focus:border-gray-400"
                    >
                      <option value="unisex">Unisex</option>
                      <option value="nam">Nam</option>
                      <option value="nu">Chỉ Nữ</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Thứ tự</label>
                    <input 
                      type="text" 
                      value={categoryFormData.sort_order} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setCategoryFormData({...categoryFormData, sort_order: val ? parseInt(val) : 0});
                      }} 
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium focus:border-gray-400" 
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Hình ảnh URL</label>
                    <input 
                      type="url" 
                      value={categoryFormData.image || ''} 
                      onChange={(e) => setCategoryFormData({...categoryFormData, image: e.target.value})} 
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium focus:border-gray-400" 
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Hoặc upload</label>
                    <FileUpload 
                      onUploadSuccess={(url) => setCategoryFormData({...categoryFormData, image: url})}
                      currentImage={categoryFormData.image}
                      folder="categories"
                    />
                  </div>
                  
                  <div className="flex gap-2 lg:col-span-2">
                    <button type="submit" className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 text-sm">
                      {editingCategory ? 'Cập nhật' : 'Lưu'}
                    </button>
                    <button type="button" onClick={resetCategoryForm} className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 font-semibold hover:bg-gray-50 text-sm">
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories && categories.length > 0 ? categories.map(category => (
                <div key={category.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-lg transition flex flex-col">
                  
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      category.gender_applicable === 'unisex' ? 'bg-purple-100 text-purple-700' : 
                      category.gender_applicable === 'nam' ? 'bg-blue-100 text-blue-700' : 
                      'bg-pink-100 text-pink-700'
                    }`}>
                      {category.gender_applicable === 'unisex' ? 'Unisex' : category.gender_applicable === 'nam' ? 'Nam' : 'Nữ'}
                    </span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => handleEditCategory(category)} className="p-1.5 text-gray-400 hover:text-gray-600">
                        <AiOutlineEdit size={16}/>
                      </button>
                      <button type="button" onClick={() => handleCategoryDelete(category.id)} className="p-1.5 text-gray-400 hover:text-red-600">
                        <AiOutlineDelete size={16}/>
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1 text-sm">
                    {category.name}
                  </h3>
                  
                  <p className="text-xs text-gray-500 mb-3">/{category.slug}</p>
                  
                  <div className="mt-auto pt-3 border-t border-gray-100 text-xs text-gray-500">
                    Thứ tự: #{category.sort_order || 0}
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  Không có loại giày nào
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'colors' ? (
          // Colors Management Tab
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              <div className="flex gap-4 w-full lg:w-auto">
                <button 
                  onClick={() => { setEditingColor(null); setColorFormData({ color: '', hex_code: '#000000' }); setShowColorForm(true); }} 
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 text-sm flex items-center gap-2"
                >
                  <AiOutlinePlus size={16} /> Thêm màu
                </button>
              </div>
            </div>

            {showColorForm && (
              <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg text-gray-900">
                    {editingColor ? 'Chỉnh sửa màu sắc' : 'Thêm màu sắc'}
                  </h3>
                  <button onClick={() => setShowColorForm(false)} className="text-gray-400 hover:text-gray-600">
                    <AiOutlineDelete size={20} />
                  </button>
                </div>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const token = localStorage.getItem('token');
                    if (editingColor) {
                      await axios.put(`http://localhost:5000/api/colors/${editingColor.id}`, colorFormData, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                    } else {
                      await axios.post('http://localhost:5000/api/colors', colorFormData, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                    }
                    setShowColorForm(false);
                    setColorFormData({ color: '', hex_code: '#000000' });
                    setEditingColor(null);
                    fetchData();
                    showSuccess('Thành công', editingColor ? 'Cập nhật màu thành công' : 'Thêm màu thành công');
                  } catch (error) {
                    showError('Lỗi', error.response?.data?.error || error.message);
                  }
                }} className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 ml-1">Tên màu</label>
                      <input 
                        type="text" 
                        required 
                        value={colorFormData.color} 
                        onChange={(e) => setColorFormData({...colorFormData, color: e.target.value})} 
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium focus:border-gray-400" 
                        placeholder="VD: Xanh dương, Đỏ tươi..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 ml-1">Mã hex</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          required 
                          value={colorFormData.hex_code} 
                          onChange={(e) => setColorFormData({...colorFormData, hex_code: e.target.value})} 
                          className="w-20 h-10 px-2 py-2 bg-white border border-gray-200 rounded-lg outline-none cursor-pointer"
                        />
                        <input 
                          type="text" 
                          required 
                          value={colorFormData.hex_code} 
                          onChange={(e) => setColorFormData({...colorFormData, hex_code: e.target.value})} 
                          className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium focus:border-gray-400" 
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <button type="submit" className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 text-sm">
                      {editingColor ? 'Cập nhật' : 'Lưu'}
                    </button>
                    <button type="button" onClick={() => { setShowColorForm(false); setColorFormData({ color: '', hex_code: '#000000' }); setEditingColor(null); }} className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 font-semibold hover:bg-gray-50 text-sm">
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {colors && colors.length > 0 ? colors.map(color => (
                <div key={color.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-lg transition flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-12 h-12 rounded-lg border-2 border-gray-300" 
                      style={{ backgroundColor: color.hex_code }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{color.color}</h3>
                      <p className="text-xs text-gray-500">{color.hex_code}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                    <button 
                      type="button" 
                      onClick={() => { setEditingColor(color); setColorFormData({ color: color.color, hex_code: color.hex_code }); setShowColorForm(true); }} 
                      className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
                    >
                      Sửa
                    </button>
                    <button 
                      type="button" 
                      onClick={async () => {
                        if (!window.confirm(`Xóa màu "${color.color}"?`)) return;
                        try {
                          const token = localStorage.getItem('token');
                          await axios.delete(`http://localhost:5000/api/colors/${color.id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          fetchData();
                          showSuccess('Thành công', 'Xóa màu thành công');
                        } catch (error) {
                          showError('Lỗi', error.response?.data?.error || error.response?.data?.message || error.message);
                        }
                      }}
                      className="px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 font-semibold"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  Không có màu sắc nào
                </div>
              )}
            </div>
          </div>
        ) : null}

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
    </AdminLayout>
  );
};

export default AdminProducts;
