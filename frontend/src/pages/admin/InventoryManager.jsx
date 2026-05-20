import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import { AlertCircle, Plus, X, Download, Filter, ChevronDown, ChevronRight, Package, Search, History, BarChart3, Layers, Trash2, Eye, EyeOff } from 'lucide-react';
import { normalizeImageUrl } from '../../utils/imageUrl';

const InventoryManager = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState(() => localStorage.getItem('inventoryTab') || 'current');
  const [colorVariants, setColorVariants] = useState([]); // grouped by (product, color)
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const [expandedColorId, setExpandedColorId] = useState(null); // expanded color variant
  const [modal, setModal] = useState({ isOpen: false, message: '', type: 'success' });
  const [historyTimeFilter, setHistoryTimeFilter] = useState('all');
  const now = new Date();
  const [historyTimeFilterMode, setHistoryTimeFilterMode] = useState(location.state?.initialRange === 'thisMonth' ? 'month' : location.state?.initialRange === 'thisYear' ? 'year' : 'all'); // 'all' | 'month' | 'year' | 'custom'
  const [historySelectedMonth, setHistorySelectedMonth] = useState(location.state?.initialMonth || now.getMonth() + 1);
  const [historySelectedYear, setHistorySelectedYear] = useState(location.state?.initialYear || now.getFullYear());
  const [historyCustomStartDate, setHistoryCustomStartDate] = useState('');
  const [historyCustomEndDate, setHistoryCustomEndDate] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all'); // 'all', 'in', 'out'
  const [expandedVoucher, setExpandedVoucher] = useState(null); // Track which import voucher is expanded
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importItems, setImportItems] = useState([]);
  const [tempImport, setTempImport] = useState({
    product_id: null,
    product_name: null,
    color: null,
    price: '',
    sizes: {}
  });
  const [stockHistory, setStockHistory] = useState([]);

  useEffect(() => {
    localStorage.setItem('inventoryTab', tab);
  }, [tab]);

  const fetchStockHistory = async () => {
    try {
      const res = await api.get('/inventory/logs');
      const logsData = res.data?.data || [];

      // Transform backend data format to frontend format
      const transformedHistory = logsData.map(log => ({
        id: log.id,
        date: new Date(log.created_at),
        refCode: log.reference_code,
        productName: log.product_name,
        variant: `Size ${log.size} - ${log.color_name || 'N/A'}`,
        type: ['IMPORT', 'INITIAL_SYNC'].includes(log.action_type) ? 'in' : ['ORDER', 'RETURN'].includes(log.action_type) ? 'out' : 'adjust',
        quantity: Math.abs(log.quantity_changed),
        quantity_changed: log.quantity_changed,
        performer: log.action_type === 'IMPORT' ? 'Admin' : 
                   ['ORDER', 'RETURN'].includes(log.action_type) ? (log.action_type === 'ORDER' ? 'Khách hàng' : 'Hoàn hàng khách') : 'Hệ thống',
        label: log.label,
        notes: log.note,
        action_type: log.action_type,
        import_price: log.import_price,
        variant_id: log.variant_id
      }));

      setStockHistory(transformedHistory);
    } catch (err) {
      console.error('❌ Lỗi khi tải lịch sử kho:', err);
      showModal('Lỗi khi tải lịch sử kho', 'error');
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      const allData = res.data || [];

      // Group by (product_id, color) to create color variants
      const grouped = {};
      allData.forEach(v => {
        const key = `${v.product_id}_${v.color || 'unknown'}`;
        if (!grouped[key]) {
          grouped[key] = {
            id: key,
            product_id: v.product_id,
            product_name: v.product_name,
            color: v.color || 'Không có màu',
            hex_code: v.hex_code || null,
            images: v.images,
            sizes: []
          };
        }
        grouped[key].sizes.push(v);
      });

      let colors = Object.values(grouped);

      // Apply search filter
      if (search.trim()) {
        const searchLower = search.toLowerCase();
        colors = colors.filter(cv =>
          (cv.product_name && cv.product_name.toLowerCase().includes(searchLower)) ||
          (cv.color && cv.color.toLowerCase().includes(searchLower))
        );
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        colors = colors.filter(cv => {
          const status = getColorVariantStatus(cv);
          if (statusFilter === 'low') return status === 'low';
          if (statusFilter === 'out') return status === 'out';
          if (statusFilter === 'ok') return status === 'ok';
          return true;
        });
      }

      setColorVariants(colors);
    } catch (err) {
      console.error('Failed to fetch inventory', err);
      showModal('Lỗi khi tải dữ liệu tồn kho', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getColorVariantStatus = (colorVariant) => {
    // Check status of each size variant based on stock (available quantity)
    // Status values: 'ok' (tất cả > 5), 'low' (có ít nhất 1 size <= 5 nhưng > 0), 'out' (có ít nhất 1 size = 0)
    let hasOutOfStock = false;
    let hasLowStock = false;

    colorVariant.sizes.forEach(size => {
      const qty = parseInt(size.stock) || 0;
      if (qty === 0) hasOutOfStock = true;
      else if (qty <= 5) hasLowStock = true;
    });

    if (hasOutOfStock) return 'out';
    if (hasLowStock) return 'low';
    return 'ok';
  };

  const getSizeStatus = (quantity) => {
    // Status for individual size: 'out' (=0), 'low' (>0 && <=5), 'ok' (>5)
    const qty = parseInt(quantity) || 0;
    if (qty === 0) return 'out';
    if (qty <= 5) return 'low';
    return 'ok';
  };

  const getStatusLabel = (status) => {
    if (status === 'out') return 'Hết';
    if (status === 'low') return 'Gần hết';
    return 'Còn hàng';
  };

  const calculateTotalStock = (colorVariant) => {
    return colorVariant.sizes.reduce((sum, size) => sum + (parseInt(size.stock) || 0), 0);
  };

  const calculateTotalSold = (colorVariant) => {
    return colorVariant.sizes.reduce((sum, size) => sum + (parseInt(size.sold) || 0), 0);
  };

  useEffect(() => {
    // Sync with Dashboard range if provided
    if (location.state?.initialRange === 'thisMonth') {
      setHistoryTimeFilterMode('month');
      if (location.state?.initialMonth) setHistorySelectedMonth(location.state.initialMonth);
      if (location.state?.initialYear) setHistorySelectedYear(location.state.initialYear);
    } else if (location.state?.initialRange === 'thisYear') {
      setHistoryTimeFilterMode('year');
      if (location.state?.initialYear) setHistorySelectedYear(location.state.initialYear);
    }
    
    // Set initial filters from Dashboard
    if (location.state?.statusFilter) {
      setStatusFilter(location.state.statusFilter);
    }
    if (location.state?.search) {
      setSearch(location.state.search);
    }
    
    fetchStockHistory();
  }, []);

  // Fetch inventory and reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    fetchInventory();
  }, [search, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchInventory();
  };

  const showModal = (message, type = 'success') => {
    setModal({ isOpen: true, message, type });
    setTimeout(() => setModal({ isOpen: false, message: '', type: 'success' }), 3000);
  };

  const handleExportHistoryItemsToCSV = (refCode, items, voucherTitle) => {
    if (!items || items.length === 0) {
      showModal('Không có dữ liệu để xuất', 'error');
      return;
    }

    const firstItem = items[0];
    const totalQty = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const totalAmount = items.reduce((sum, i) => sum + ((i.quantity || 0) * (i.import_price ? parseFloat(i.import_price) : 0)), 0);

    // Build CSV content with headers
    const csvRows = [];
    
    // Title
    csvRows.push([voucherTitle]);
    csvRows.push([]);
    
    // Header info
    csvRows.push(['Mã phiếu:', refCode]);
    csvRows.push(['Ngày tạo:', new Date(firstItem.date).toLocaleString('vi-VN')]);
    csvRows.push(['Người thực hiện:', firstItem.performer || 'N/A']);
    csvRows.push([]);
    
    // Column headers for items
    csvRows.push(['STT', 'Tên sản phẩm', 'Phân loại (Size/Màu)', 'Đơn giá (VNĐ)', 'Số lượng', 'Thành tiền (VNĐ)']);
    
    // Item rows
    items.forEach((item, idx) => {
      const price = item.import_price ? parseFloat(item.import_price) : 0;
      const amount = (item.quantity || 0) * price;
      csvRows.push([
        idx + 1,
        item.productName,
        item.variant,
        price ? Math.round(price).toString() : 'N/A',
        item.quantity || 0,
        price ? Math.round(amount).toString() : '0'
      ]);
    });
    
    // Summary
    csvRows.push([]);
    csvRows.push(['TỔNG CỘNG', '', '', '', totalQty, Math.round(totalAmount).toString()]);
    
    // Convert to CSV format with proper escaping
    const csvContent = csvRows
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    // Create and trigger download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Phiếu_${refCode}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    showModal('Xuất phiếu thành công', 'success');
  };

  const handleAddImportItem = () => {
    if (!tempImport.product_id || !tempImport.color || !tempImport.price) {
      showModal('Vui lòng chọn sản phẩm, màu sắc và nhập giá', 'error');
      return;
    }

    // Find sizes with quantity > 0
    const itemsToAdd = Object.entries(tempImport.sizes)
      .filter(([_, qty]) => parseInt(qty, 10) > 0)
      .map(([size, qty]) => ({
        id: Date.now() + Math.random(),
        product_id: tempImport.product_id,
        product_name: tempImport.product_name,
        color: tempImport.color,
        size: size,
        quantity: parseInt(qty, 10),
        price: parseInt(tempImport.price, 10)
      }));

    if (itemsToAdd.length === 0) {
      showModal('Vui lòng nhập ít nhất 1 kích cỡ có số lượng > 0', 'error');
      return;
    }

    setImportItems([...importItems, ...itemsToAdd]);

    // Reset temp form
    setTempImport({
      product_id: null,
      product_name: null,
      color: null,
      price: '',
      sizes: {}
    });
  };

  const handleRemoveImportItem = (id) => {
    setImportItems(importItems.filter(item => item.id !== id));
  };

  const handleImportSubmit = () => {
    if (importItems.length === 0) {
      showModal('Vui lòng thêm ít nhất 1 sản phẩm', 'error');
      return;
    }

    setLoading(true);
    
    // Chuẩn bị payload để gửi tới backend
    const refCode = `PN-${String(Date.now()).slice(-5)}`;
    
    try {
      // Convert importItems format thành format backend mong đợi
      // Frontend: {product_id, product_name, color, size, quantity, price}
      // Backend:  {variant_id, qty, price}
      
      const convertedItems = importItems.map((item, idx) => {
        // Tìm variant_id từ colorVariants (product -> color -> size)
        const colorVariant = colorVariants.find(
          cv => cv.product_id === item.product_id && cv.color === item.color
        );
        
        if (!colorVariant) {
          throw new Error(`Không tìm thấy sản phẩm "${item.product_name}" màu "${item.color}"`);
        }

        const sizeData = colorVariant.sizes.find(s => s.size === item.size);
        if (!sizeData) {
          throw new Error(`Không tìm thấy size ${item.size} cho sản phẩm "${item.product_name}" màu "${item.color}"`);
        }

        return {
          variant_id: sizeData.id,
          qty: item.quantity,
          price: item.price
        };
      });

      const payload = {
        reference_code: refCode,
        items: convertedItems
      };

      console.log('📤 Gửi payload tới backend:', payload);

      // Gọi API backend
      api.post('/inventory/import', payload)
        .then((res) => {
          console.log('✅ Nhập kho thành công:', res.data);

          // Tạo các history entry mở rộng từng item
          const expandedHistory = importItems.map(item => ({
            id: Math.floor(Math.random() * 1000000),
            date: new Date(),
            refCode: refCode,
            productName: item.product_name,
            variant: `Size ${item.size} - ${item.color}`,
            type: 'in',
            quantity: item.quantity,
            finalStock: item.quantity,
            performer: 'Admin',
            notes: `Nhập từ phiếu ${refCode}`
          }));

          setStockHistory([...expandedHistory, ...stockHistory]);

          showModal(`✅ Nhập kho thành công! Mã phiếu: ${refCode}`, 'success');
          setImportModalOpen(false);
          setImportItems([]);
          setTempImport({
            product_id: null,
            product_name: null,
            color: null,
            price: '',
            sizes: {}
          });
          
          // Reload inventory
          fetchInventory();
        })
        .catch((err) => {
          console.error('❌ Lỗi API:', err);
          const errorMsg = err.response?.data?.message || err.message || 'Lỗi không xác định';
          showModal(`❌ ${errorMsg}`, 'error');
        })
        .finally(() => {
          setLoading(false);
        });

    } catch (error) {
      console.error('❌ Lỗi convert dữ liệu:', error.message);
      showModal(`❌ ${error.message}`, 'error');
      setLoading(false);
    }
  };

  const getStockBadge = (quantity) => {
    if (quantity <= 0) {
      return (
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">Hết hàng</span>
        </div>
      );
    }
    if (quantity < 5) {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle size={16} />
          <span className="font-semibold">{quantity}</span>
        </div>
      );
    }
    return <span className="font-semibold text-gray-900">{quantity}</span>;
  };

  const getFilteredHistory = () => {
    let filtered = [...stockHistory];
    
    // Filter by time
    if (historyTimeFilterMode !== 'all') {
      const now = new Date();
      filtered = filtered.filter(h => {
        const historyDate = new Date(h.date);

        if (historyTimeFilterMode === 'month') {
          return historyDate.getMonth() + 1 === historySelectedMonth && historyDate.getFullYear() === historySelectedYear;
        } else if (historyTimeFilterMode === 'year') {
          return historyDate.getFullYear() === historySelectedYear;
        } else if (historyTimeFilterMode === 'custom' && historyCustomStartDate && historyCustomEndDate) {
          const startDate = new Date(historyCustomStartDate);
          const endDate = new Date(historyCustomEndDate);
          endDate.setHours(23, 59, 59, 999);
          return historyDate >= startDate && historyDate <= endDate;
        }
        return true;
      });
    }
    
    // Filter by type
    if (historyTypeFilter !== 'all') {
      filtered = filtered.filter(h => h.type === historyTypeFilter);
    }
    
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getStatusBadge = (variant) => {
    const available = (variant.quantity || 0) - (variant.sold || 0);
    if (available <= 0) {
      return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Hết hàng</span>;
    }
    if (available < 5) {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Sắp hết</span>;
    }
    return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Còn hàng</span>;
  };

  // Pagination logic
  const totalPages = Math.ceil(colorVariants.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedColorVariants = colorVariants.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const lowStockCount = colorVariants.filter(cv => getColorVariantStatus(cv) === 'low').length;

  const outOfStockCount = colorVariants.filter(cv => getColorVariantStatus(cv) === 'out').length;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quản lý kho hàng</h1>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('current')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              tab === 'current'
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Tồn kho hiện tại
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              tab === 'history'
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Lịch sử nhập/xuất
          </button>
        </div>

        {/* TAB 1: Current Stock */}
        {tab === 'current' && (
          <>
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                  <Package size={24} />
                </div>
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Tổng số mẫu mã</div>
                  <div className="text-2xl font-bold text-gray-900 leading-none mt-1">{colorVariants.length}</div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-lg text-green-600">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Đang kinh doanh</div>
                  <div className="text-2xl font-bold text-green-600 leading-none mt-1">{colorVariants.filter(cv => getColorVariantStatus(cv) === 'ok').length}</div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex items-center gap-4">
                <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Sắp hết hàng</div>
                  <div className="text-2xl font-bold text-yellow-600 leading-none mt-1">{lowStockCount}</div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex items-center gap-4">
                <div className="p-3 bg-red-50 rounded-lg text-red-600">
                  <Layers size={24} />
                </div>
                <div>
                  <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Hết hàng</div>
                  <div className="text-2xl font-bold text-red-600 leading-none mt-1">{outOfStockCount}</div>
                </div>
              </div>
            </div>

            {/* Alert for Low Stock */}
            {lowStockCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 flex items-start gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-bold text-yellow-800">Thông báo vận hành</h3>
                  <p className="text-sm text-yellow-700 mt-0.5">Có <strong>{lowStockCount}</strong> mẫu sản phẩm sắp hết hàng. Hãy cân nhắc nhập thêm để duy trì doanh số.</p>
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8">
              <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Tìm kiếm sản phẩm</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Tìm kiếm sản phẩm"
                          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:border-gray-400 outline-none text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Lọc trạng thái</label>
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:border-gray-400 outline-none appearance-none text-sm"
                        >
                          <option value="all">Tất cả sản phẩm</option>
                          <option value="ok">Đủ tồn kho</option>
                          <option value="low">Đang sắp hết</option>
                          <option value="out">Đã hết hàng</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={fetchInventory}
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition font-semibold text-sm"
                    >
                      Áp dụng lọc
                    </button>
                    <button
                      onClick={() => {
                        setSearch('');
                        setStatusFilter('all');
                        fetchInventory();
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold text-sm"
                    >
                      Đặt lại
                    </button>
                  </div>
                </div>

                <div className="flex shrink-0">
                  <button
                    onClick={() => setImportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition font-semibold text-sm"
                  >
                    <Plus size={20} />
                    Tạo phiếu nhập hàng
                  </button>
                </div>
              </div>
            </div>

            {/* Inventory Cards - Color Variants */}
            <div className="grid grid-cols-1 gap-6">
              {loading ? (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-20 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mb-4"></div>
                  <p className="text-gray-500 font-medium">Đang đồng bộ dữ liệu kho...</p>
                </div>
              ) : colorVariants.length === 0 ? (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-20 text-center">
                  <Package className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500 font-medium">Không tìm thấy sản phẩm nào trong kho</p>
                </div>
              ) : (
                paginatedColorVariants.map(colorVariant => {
                  const isExpanded = expandedColorId === colorVariant.id;
                  const status = getColorVariantStatus(colorVariant);
                  const statusColor = status === 'out' ? 'red' : status === 'low' ? 'yellow' : 'green';
                  const totalStock = calculateTotalStock(colorVariant);
                  const totalSold = calculateTotalSold(colorVariant);

                  return (
                    <div 
                      key={colorVariant.id}
                      className={`transition-all duration-200 ${isExpanded ? 'ring-1 ring-blue-300 rounded-lg' : ''}`}
                    >
                      {/* Color Variant Card Header */}
                      <div 
                        onClick={() => setExpandedColorId(isExpanded ? null : colorVariant.id)}
                        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-5 cursor-pointer hover:border-blue-300 transition-all ${isExpanded ? 'rounded-b-none border-b-0' : ''}`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-6">
                            {/* Product Thumbnail */}
                            <div className="relative w-20 h-20 bg-gray-50 rounded-lg border border-gray-200 p-1 overflow-hidden flex-shrink-0">
                              {colorVariant.images && colorVariant.images[0] ? (
                                <img 
                                  src={normalizeImageUrl(colorVariant.images[0]) || colorVariant.images[0]} 
                                  alt={colorVariant.product_name} 
                                  className="w-full h-full object-contain mix-blend-multiply"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Package className="w-full h-full p-4 text-gray-300" />
                              )}
                              <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white bg-${statusColor}-500 shadow-sm`}></div>
                            </div>

                            {/* Main Info */}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-2xl font-semibold text-gray-900">{colorVariant.product_name}</h3>
                                <div className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
                                  SKU: PRD-{colorVariant.product_id}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm">
                                <span className="flex items-center gap-1.5 font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                  {colorVariant.hex_code && (
                                    <div className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: colorVariant.hex_code }}></div>
                                  )}
                                  {colorVariant.color}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-600 font-medium">{colorVariant.sizes.length} SKU quy cách (Size)</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Stats Summary */}
                          <div className="flex items-center gap-8 md:gap-12 pr-4">
                            <div className="text-center hidden sm:block">
                              <p className="text-xs font-medium text-gray-500 mb-1">Tổng tồn</p>
                              <p className="text-3xl font-semibold text-gray-900">{totalStock}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-medium text-gray-500 mb-1">Đã bán</p>
                              <p className="text-3xl font-semibold text-gray-900">{calculateTotalSold(colorVariant)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-medium text-gray-500 mb-1">Trạng thái</p>
                              <div className={`mt-1 font-semibold text-xs px-3 py-1 rounded-lg ${
                                status === 'out' ? 'bg-red-50 text-red-600' :
                                status === 'low' ? 'bg-yellow-50 text-yellow-600' :
                                'bg-green-50 text-green-600'
                              }`}>
                                {status === 'out' ? 'Có biến thể hết hàng' : status === 'low' ? 'Có biến thể gần hết' : 'Còn hàng'}
                              </div>
                            </div>
                            <div className="text-gray-400 ml-2">
                              {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Sizes Table */}
                      {isExpanded && (
                        <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg shadow-sm overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700">Size</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700">Tổng nhập</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700">Tồn kho</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700">Đã bán</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700">Giá nhập</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700">Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody>
                              {colorVariant.sizes && colorVariant.sizes.length > 0 ? (
                                colorVariant.sizes.map((sizeVariant, idx) => {
                                  const sizeStatus = getSizeStatus(sizeVariant.stock);
                                  const statusBg = sizeStatus === 'out' ? 'bg-red-50 text-red-600' : sizeStatus === 'low' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600';
                                  return (
                                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                      <td className="px-6 py-3 font-medium text-gray-900">{sizeVariant.size}</td>
                                      <td className="px-6 py-3 text-gray-600 font-medium">{parseInt(sizeVariant.quantity) || 0}</td>
                                      <td className="px-6 py-3 text-gray-600 font-medium">{parseInt(sizeVariant.stock) || 0}</td>
                                      <td className="px-6 py-3 text-gray-600">{parseInt(sizeVariant.sold) || 0}</td>
                                      <td className="px-6 py-3 text-gray-600 font-medium">{sizeVariant.import_price ? `${parseFloat(sizeVariant.import_price).toLocaleString('vi-VN')}đ` : 'N/A'}</td>
                                      <td className="px-6 py-3">
                                        <span className={`inline-block font-semibold text-xs px-2 py-1 rounded ${statusBg}`}>
                                          {getStatusLabel(sizeStatus)}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan="6" className="px-6 py-4 text-center text-gray-400">Không có dữ liệu size</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 py-6">
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
          </>
        )}

        {/* TAB 2: Stock History */}
        {tab === 'history' && (
          <div className="animate-in fade-in duration-500">
            {/* History Toolbar */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8 flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                <div className="flex gap-2 flex-wrap items-center justify-between">
                  <div className="flex gap-2 flex-wrap items-center">
                    <button
                      onClick={() => setHistoryTimeFilterMode('all')}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${historyTimeFilterMode === 'all' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setHistoryTimeFilterMode('month')}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${historyTimeFilterMode === 'month' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Tháng này
                    </button>
                    <button
                      onClick={() => setHistoryTimeFilterMode('year')}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${historyTimeFilterMode === 'year' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Năm nay
                    </button>
                    <button
                      onClick={() => setHistoryTimeFilterMode('custom')}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${historyTimeFilterMode === 'custom' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Tùy chỉnh
                    </button>
                  </div>

                  <div className="flex gap-2 flex-wrap items-center">
                    <label className="font-semibold text-gray-700">Loại giao dịch:</label>
                    <select
                      value={historyTypeFilter}
                      onChange={(e) => setHistoryTypeFilter(e.target.value)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none cursor-pointer"
                    >
                      <option value="all">Tất cả giao dịch</option>
                      <option value="in">Nhập kho (+)</option>
                      <option value="out">Xuất kho (-)</option>
                    </select>
                  </div>
                </div>

                {historyTimeFilterMode === 'month' && (
                  <div className="flex gap-2 flex-wrap items-center">
                    <select
                      value={historySelectedMonth}
                      onChange={(e) => setHistorySelectedMonth(parseInt(e.target.value))}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none cursor-pointer"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Tháng {i + 1}
                        </option>
                      ))}
                    </select>
                    <select
                      value={historySelectedYear}
                      onChange={(e) => setHistorySelectedYear(parseInt(e.target.value))}
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

                {historyTimeFilterMode === 'year' && (
                  <div className="flex gap-2 flex-wrap items-center">
                    <select
                      value={historySelectedYear}
                      onChange={(e) => setHistorySelectedYear(parseInt(e.target.value))}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none cursor-pointer"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year}>
                            Nam {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {historyTimeFilterMode === 'custom' && (
                  <div className="flex gap-2 flex-wrap items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <input
                      type="date"
                      value={historyCustomStartDate}
                      onChange={(e) => setHistoryCustomStartDate(e.target.value)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none"
                    />
                    <span className="text-gray-600 font-semibold">đến</span>
                    <input
                      type="date"
                      value={historyCustomEndDate}
                      onChange={(e) => setHistoryCustomEndDate(e.target.value)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap items-center">

                {/* Clear Button */}
                <button
                  onClick={() => {
                    setHistoryTimeFilterMode('all');
                    setHistoryTypeFilter('all');
                    setHistoryCustomStartDate('');
                    setHistoryCustomEndDate('');
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-bold"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {getFilteredHistory().length === 0 ? (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-20 text-center">
                  <History className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500 font-medium">Không có dữ liệu lịch sử phù hợp</p>
                </div>
              ) : (
                Object.entries(
                  // Group by refCode
                  getFilteredHistory().reduce((acc, h) => {
                    if (!acc[h.refCode]) {
                      acc[h.refCode] = [];
                    }
                    acc[h.refCode].push(h);
                    return acc;
                  }, {})
                ).map(([refCode, items]) => {
                  const isExpanded = expandedVoucher === refCode;
                  const firstItem = items[0];
                  const isOrderType = firstItem.action_type === 'ORDER';
                  const isReturnType = firstItem.action_type === 'RETURN';
                  const isImportType = ['IMPORT', 'INITIAL_SYNC'].includes(firstItem.action_type);
                  const totalQty = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
                  
                  let bgColor, textColor, voucherTitle, badgeColor, badgeText;
                  if (isOrderType) {
                    bgColor = 'bg-red-50';
                    textColor = 'text-red-600';
                    voucherTitle = `Đơn Hàng #${refCode}`;
                    badgeColor = 'bg-red-100 text-red-700';
                    badgeText = 'Xuất (Bán)';
                  } else if (isReturnType) {
                    bgColor = 'bg-yellow-50';
                    textColor = 'text-yellow-600';
                    voucherTitle = `Phiếu Hoàn Hàng #${refCode}`;
                    badgeColor = 'bg-yellow-100 text-yellow-700';
                    badgeText = 'Hoàn Hàng';
                  } else if (isImportType) {
                    bgColor = 'bg-green-50';
                    textColor = 'text-green-600';
                    voucherTitle = `Phiếu Nhập #${refCode}`;
                    badgeColor = 'bg-green-100 text-green-700';
                    badgeText = 'Nhập';
                  } else {
                    bgColor = 'bg-gray-50';
                    textColor = 'text-gray-600';
                    voucherTitle = `Phiếu Điều Chỉnh #${refCode}`;
                    badgeColor = 'bg-gray-100 text-gray-700';
                    badgeText = 'Điều chỉnh';
                  }

                  return (
                    <div key={refCode} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
                      {/* Card Header - Click to Expand */}
                      <button
                        onClick={() => setExpandedVoucher(isExpanded ? null : refCode)}
                        className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1 text-left">
                          <div className={`p-3 ${bgColor} rounded-lg flex-shrink-0`}>
                            <Package className={textColor} size={24} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-bold text-gray-900 text-base">{voucherTitle}</h3>
                              <span className={`px-2 py-1 ${badgeColor} rounded-full text-xs font-bold`}>
                                {badgeText}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(firstItem.date).toLocaleString('vi-VN')} • <span className="font-semibold">{totalQty} cặp</span> • {items.length} sản phẩm
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <EyeOff size={20} className="text-blue-600 cursor-pointer" />
                          ) : (
                            <Eye size={20} className="text-gray-400 cursor-pointer hover:text-blue-600" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50/30 px-6 py-5">
                          <h4 className="font-bold text-gray-900 text-sm mb-4">
                            {isOrderType ? 'Chi Tiết Sản Phẩm Đã Bán' : isReturnType ? 'Chi Tiết Sản Phẩm Hoàn Hàng' : 'Chi Tiết Sản Phẩm Nhập'}
                          </h4>
                          <div className="space-y-3">
                            {items.map((item, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <p className="font-bold text-gray-900 text-sm">{item.productName}</p>
                                    <p className="text-xs text-gray-500 mt-1">Phân loại: {item.variant}</p>
                                  </div>
                                  <div className="text-right ml-4">
                                    <div className="font-bold text-gray-900 text-sm">{item.quantity}</div>
                                    <div className="text-xs text-gray-500">cặp</div>
                                  </div>
                                </div>
                                {(isImportType || isReturnType) && item.import_price && (
                                  <div className="pt-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-600">Giá nhập: <span className="font-semibold text-gray-900">{parseFloat(item.import_price).toLocaleString('vi-VN')}đ</span></p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Footer Section */}
                          <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Mã tham chiếu</p>
                                <p className="font-bold text-gray-900 text-sm font-mono">{refCode}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Thực hiện bởi</p>
                                <p className="font-bold text-gray-900 text-sm">{firstItem.performer}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500 mb-1">Tổng số lượng</p>
                                <p className="font-black text-gray-900 text-lg">{totalQty}</p>
                              </div>
                            </div>
                          </div>

                          {/* Export Buttons - Hide for ORDER type */}
                          {!isOrderType && (
                            <div className="mt-6 flex gap-3">
                              <button 
                                onClick={() => handleExportHistoryItemsToCSV(refCode, items, voucherTitle)}
                                className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-bold text-sm flex items-center justify-center gap-2"
                              >
                                <Download size={16} />
                                Tải Excel
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Import Modal */}
        {importModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-8 animate-in zoom-in-95 duration-200 my-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Plus size={24} />
                  </div>
                  <h2 className="text-xl font-black text-gray-900">Tạo Phiếu Nhập Hàng</h2>
                </div>
                <button onClick={() => {
                  setImportModalOpen(false);
                  setImportItems([]);
                  setTempImport({
                    product_id: null,
                    product_name: null,
                    color: null,
                    price: '',
                    sizes: {}
                  });
                }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Form Section: Add Item */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-4">
                
                {/* Product Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Sản Phẩm</label>
                  <select
                    value={tempImport.product_id || ''}
                    onChange={(e) => {
                      const productId = parseInt(e.target.value, 10);
                      const product = colorVariants.find(cv => cv.product_id === productId);
                      if (product) {
                        setTempImport({
                          product_id: productId,
                          product_name: product.product_name,
                          color: null,
                          price: tempImport.price,
                          sizes: {}
                        });
                      }
                    }}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:border-gray-400 outline-none appearance-none text-sm font-medium"
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {Array.from(new Set(colorVariants.map(cv => cv.product_id))).map(productId => {
                      const product = colorVariants.find(cv => cv.product_id === productId);
                      return <option key={productId} value={productId}>{product.product_name}</option>;
                    })}
                  </select>
                </div>

                {/* Color Selection */}
                {tempImport.product_id && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Màu Sắc</label>
                    <select
                      value={tempImport.color || ''}
                      onChange={(e) => {
                        const selectedColor = e.target.value;
                        const colorVariant = colorVariants.find(cv => cv.product_id === tempImport.product_id && cv.color === selectedColor);
                        
                        // Initialize sizes object with all sizes as empty
                        const sizesObj = {};
                        if (colorVariant) {
                          colorVariant.sizes.forEach(size => {
                            sizesObj[size.size] = '';
                          });
                        }

                        setTempImport({
                          ...tempImport,
                          color: selectedColor,
                          sizes: sizesObj
                        });
                      }}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:border-gray-400 outline-none appearance-none text-sm font-medium"
                    >
                      <option value="">-- Chọn màu --</option>
                      {Array.from(new Set(
                        colorVariants
                          .filter(cv => cv.product_id === tempImport.product_id)
                          .map(cv => cv.color)
                      )).map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Size Quantity Table */}
                {tempImport.color && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Kích Cỡ & Số Lượng</label>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="grid grid-cols-4 gap-0 bg-gray-100 border-b border-gray-200">
                        <div className="px-4 py-3 text-xs font-bold text-gray-600 uppercase">Size</div>
                        <div className="px-4 py-3 text-xs font-bold text-gray-600 uppercase">Số Lượng</div>
                        <div className="px-4 py-3 text-xs font-bold text-gray-600 uppercase">Sẵn Có</div>
                        <div className="px-4 py-3 text-xs font-bold text-gray-600 uppercase">Thành Tiền</div>
                      </div>
                      <div className="divide-y divide-gray-200 max-h-48 overflow-y-auto">
                        {colorVariants
                          .find(cv => cv.product_id === tempImport.product_id && cv.color === tempImport.color)
                          ?.sizes.map((size) => {
                            const qty = parseInt(tempImport.sizes[size.size] || 0, 10);
                            const price = parseInt(tempImport.price || 0, 10);
                            const total = qty * price;

                            return (
                              <div key={size.id} className="grid grid-cols-4 gap-0 items-center bg-white hover:bg-blue-50/30 transition-colors">
                                <div className="px-4 py-3 text-sm font-bold text-gray-900">{size.size}</div>
                                <div className="px-4 py-3">
                                  <input
                                    type="number"
                                    min="0"
                                    value={tempImport.sizes[size.size] || ''}
                                    onChange={(e) => {
                                      setTempImport({
                                        ...tempImport,
                                        sizes: {
                                          ...tempImport.sizes,
                                          [size.size]: e.target.value
                                        }
                                      });
                                    }}
                                    placeholder="0"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                                  />
                                </div>
                                <div className="px-4 py-3 text-sm text-gray-600">{size.stock || 0}</div>
                                <div className="px-4 py-3 text-sm font-bold text-green-600">{total.toLocaleString('vi-VN')}đ</div>
                              </div>
                            );
                          }) || (
                          <div className="px-4 py-8 col-span-4 text-center text-gray-400 text-sm">
                            Không có size nào
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Price Input - Global */}
                {tempImport.color && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Giá Nhập (VNĐ) - Áp Dụng Cho Tất Cả Size</label>
                    <input
                      type="number"
                      min="0"
                      value={tempImport.price}
                      onChange={(e) => setTempImport({ ...tempImport, price: e.target.value })}
                      placeholder="Nhập giá nhập"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:border-gray-400 outline-none text-sm font-bold"
                    />
                  </div>
                )}

                {/* Add Button */}
                {tempImport.color && tempImport.price && Object.values(tempImport.sizes).some(v => parseInt(v, 10) > 0) && (
                  <button
                    onClick={handleAddImportItem}
                    className="w-full py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all font-bold text-sm mt-4"
                  >
                    + Thêm Sản Phẩm
                  </button>
                )}
              </div>

              {/* Items List */}
              {importItems.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 text-sm mb-3">Danh Sách Hàng Nhập ({importItems.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {importItems.map((item) => (
                      <div key={item.id} className="bg-white rounded-lg p-4 border border-gray-200 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{item.product_name}</p>
                          <p className="text-xs text-gray-500">Size {item.size} - {item.color} | Qty: {item.quantity} | Giá: {item.price.toLocaleString('vi-VN')}đ/cặp</p>
                        </div>
                        <button
                          onClick={() => handleRemoveImportItem(item.id)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setImportModalOpen(false);
                    setImportItems([]);
                    setTempImport({
                      product_id: null,
                      product_name: null,
                      color: null,
                      price: '',
                      sizes: {}
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-semibold text-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleImportSubmit}
                  disabled={importItems.length === 0}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-sm"
                >
                  Lưu Phiếu Nhập
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Notification */}
        {modal.isOpen && (
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow text-white font-semibold text-sm flex items-center gap-3 z-[100] ${
            modal.type === 'success' ? 'bg-gray-900' : 'bg-red-600'
          }`}>
            {modal.type === 'success' ? <div className="w-2 h-2 rounded-full bg-green-400 animate-ping" /> : <AlertCircle size={18} />}
            {modal.message}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default InventoryManager;
