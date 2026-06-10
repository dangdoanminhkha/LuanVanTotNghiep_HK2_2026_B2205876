import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { AiOutlinePlus, AiOutlineDelete, AiOutlineEdit, AiOutlineClose } from 'react-icons/ai';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';
import AdminLayout from '../../components/AdminLayout';

const VoucherManager = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const location = useLocation();
  const now = new Date();
  const { modal, closeModal, showError, showSuccess } = useModal();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'discount', 'free_shipping'
  const [timeFilterMode, setTimeFilterMode] = useState(location.state?.initialRange === 'thisMonth' ? 'month' : location.state?.initialRange === 'thisYear' ? 'year' : 'all'); // 'all' | 'month' | 'year' | 'custom'
  const [selectedMonth, setSelectedMonth] = useState(location.state?.initialMonth || now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(location.state?.initialYear || now.getFullYear());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    voucher_type: 'discount',
    discount_amount: '',
    min_order_value: '',
    max_usage_per_user: '',
    total_usage_limit: '',
    duration_days: '',
    description: ''
  });

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/vouchers/admin/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVouchers(res.data.vouchers || []);
    } catch (err) {
      showError('Lỗi', 'Không thể tải danh sách vouchers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  // Sync with Dashboard range if provided
  useEffect(() => {
    if (location.state?.initialRange === 'thisMonth') {
      setTimeFilterMode('month');
      if (location.state?.initialMonth) setSelectedMonth(location.state.initialMonth);
      if (location.state?.initialYear) setSelectedYear(location.state.initialYear);
    } else if (location.state?.initialRange === 'thisYear') {
      setTimeFilterMode('year');
      if (location.state?.initialYear) setSelectedYear(location.state.initialYear);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.voucher_type || !formData.duration_days) {
      showError('Lỗi', 'Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }

    if (formData.voucher_type === 'discount' && !formData.discount_amount) {
      showError('Lỗi', 'Nếu loại voucher là "Giảm giá", phải nhập mức giảm');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Prepare submission data with default values
      const submitData = {
        ...formData,
        discount_amount: formData.discount_amount ? parseInt(formData.discount_amount) : 0,
        min_order_value: formData.min_order_value ? parseInt(formData.min_order_value) : 0,
        max_usage_per_user: formData.max_usage_per_user ? parseInt(formData.max_usage_per_user) : 1,
        total_usage_limit: formData.total_usage_limit ? parseInt(formData.total_usage_limit) : null,
        duration_days: formData.duration_days ? parseInt(formData.duration_days) : 30
      };
      
      if (editingId) {
        // Update existing voucher
        await axios.put(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/vouchers/admin/${editingId}/update`,
          submitData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showSuccess('Thành công', 'Cập nhật voucher thành công');
      } else {
        // Create new voucher
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/vouchers/admin/create`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSuccess('Thành công', 'Tạo voucher mới thành công');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        code: '',
        voucher_type: 'discount',
        discount_amount: '',
        min_order_value: '',
        max_usage_per_user: '',
        total_usage_limit: '',
        duration_days: '',
        description: ''
      });
      fetchVouchers();
    } catch (err) {
      showError('Lỗi', err.response?.data?.message || 'Không thể lưu voucher');
    }
  };

  const handleEditVoucher = (voucher) => {
    setEditingId(voucher.id);
    setFormData({
      code: voucher.code,
      voucher_type: voucher.voucher_type,
      discount_amount: voucher.discount_amount ? String(voucher.discount_amount) : '',
      min_order_value: voucher.min_order_value ? String(voucher.min_order_value) : '',
      max_usage_per_user: voucher.max_usage_per_user ? String(voucher.max_usage_per_user) : '',
      total_usage_limit: voucher.total_usage_limit ? String(voucher.total_usage_limit) : '',
      duration_days: voucher.duration_days ? String(voucher.duration_days) : '',
      description: voucher.description || ''
    });
    setShowForm(true);
  };

  // Filter vouchers based on type and date
  const getFilteredVouchers = () => {
    let filtered = [...vouchers];

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(v => v.voucher_type === typeFilter);
    }

    // Filter by time
    if (timeFilterMode !== 'all') {
      const now = new Date();
      filtered = filtered.filter(voucher => {
        const voucherDate = new Date(voucher.created_at || voucher.createdAt);

        if (timeFilterMode === 'month') {
          return voucherDate.getMonth() + 1 === selectedMonth && voucherDate.getFullYear() === selectedYear;
        } else if (timeFilterMode === 'year') {
          return voucherDate.getFullYear() === selectedYear;
        } else if (timeFilterMode === 'custom' && customStartDate && customEndDate) {
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
          return voucherDate >= startDate && voucherDate <= endDate;
        }
        return true;
      });
    }

    return filtered;
  };

  const filteredVouchers = getFilteredVouchers();

  // Pagination logic
  const totalPages = Math.ceil(filteredVouchers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedVouchers = filteredVouchers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      code: '',
      voucher_type: 'discount',
      discount_amount: '',
      min_order_value: '',
      max_usage_per_user: '',
      total_usage_limit: '',
      duration_days: '',
      description: ''
    });
  };

  const handleDeactivate = async (voucherId) => {
    if (!window.confirm('Bạn chắc chắn muốn vô hiệu hóa voucher này?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/vouchers/admin/${voucherId}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess('Thành công', 'Vô hiệu hóa voucher thành công');
      fetchVouchers();
    } catch (err) {
      showError('Lỗi', 'Không thể vô hiệu hóa voucher');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Quản lý Vouchers</h2>
            <p className="text-gray-600 text-sm mt-1">Tạo và quản lý mã giảm giá</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
            >
              <AiOutlinePlus size={18} /> Tạo voucher
            </button>
          )}
        </div>

        {/* Form Tạo/Chỉnh sửa Voucher */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {editingId ? 'Chỉnh Sửa Voucher' : 'Tạo Voucher Mới'}
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <AiOutlineClose size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mã Voucher <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Loại Voucher <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.voucher_type}
                    onChange={(e) => setFormData({ ...formData, voucher_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                  >
                    <option value="discount">Giảm giá</option>
                    <option value="free_shipping">Miễn phí vận chuyển</option>
                  </select>
                </div>

                {formData.voucher_type === 'discount' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mức Giảm (VND) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder=""
                      value={formData.discount_amount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, discount_amount: val });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giá Trị Đơn Tối Thiểu (VND)
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={formData.min_order_value}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, min_order_value: val });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tối Đa Lần Dùng/User
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={formData.max_usage_per_user}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, max_usage_per_user: val });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tổng Lượt Dùng (Để trống = Unlimited)
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={formData.total_usage_limit}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, total_usage_limit: val });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Thời Hạn (Ngày) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={formData.duration_days}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, duration_days: val });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mô Tả
                </label>
                <textarea
                  placeholder="Ví dụ: Giảm 50k cho đơn hàng từ 500k"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  {editingId ? 'Cập Nhật Voucher' : 'Tạo Voucher'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Section */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex gap-2 flex-wrap items-center">
            <label className="font-semibold text-gray-700">Loại Voucher:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none cursor-pointer"
            >
              <option value="all">Tất cả loại</option>
              <option value="discount">Giảm giá</option>
              <option value="free_shipping">Miễn phí vận chuyển</option>
            </select>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => setTimeFilterMode('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${timeFilterMode === 'all' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Tất cả thời gian
            </button>
            <button
              onClick={() => setTimeFilterMode('month')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${timeFilterMode === 'month' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Tháng này
            </button>
            <button
              onClick={() => setTimeFilterMode('year')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${timeFilterMode === 'year' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Năm nay
            </button>
            <button
              onClick={() => setTimeFilterMode('custom')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${timeFilterMode === 'custom' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Tùy chỉnh khoảng ngày
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
            <div className="flex gap-2 flex-wrap items-center bg-white p-3 rounded-lg border border-gray-300">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none"
                placeholder="Ngày bắt đầu"
              />
              <span className="text-gray-600 font-semibold">đến</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none"
                placeholder="Ngày kết thúc"
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
                  Xóa bộ lọc
                </button>
              )}
            </div>
          )}
        </div>

        {/* Danh Sách Vouchers */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Mã</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Loại</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Mức Giảm</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Dùng / Giới Hạn</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Số Lần/User</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Trạng Thái</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Thời Hạn</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVouchers.map((v) => (
                  <tr key={v.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 font-semibold text-gray-900">{v.code}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        v.voucher_type === 'discount' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {v.voucher_type === 'discount' ? 'Giảm giá' : 'Miễn phí vận chuyển'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {v.discount_amount 
                        ? `${v.discount_amount.toLocaleString('vi-VN')} VND`
                        : '—'
                      }
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {v.current_usage} / {v.remaining_usage === 'Unlimited' ? '∞' : v.remaining_usage}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                        {v.max_usage_per_user ?? 1}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        v.status === 'Hết hạn' ? 'bg-gray-100 text-gray-700' :
                        v.status === 'Vô hiệu hóa' ? 'bg-red-100 text-red-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(v.valid_until).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-3 text-center flex gap-2 justify-center">
                      <button
                        onClick={() => handleEditVoucher(v)}
                        className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
                        title="Chỉnh sửa"
                      >
                        <AiOutlineEdit size={16} /> Sửa
                      </button>
                      <button
                        onClick={() => handleDeactivate(v.id)}
                        className="text-red-600 hover:text-red-700 font-semibold inline-flex items-center gap-1"
                        title="Vô hiệu hóa"
                      >
                        <AiOutlineDelete size={16} /> Vô hiệu
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 p-6 border-t border-gray-200">
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

            {vouchers.length === 0 && (
              <div className="text-center py-8 text-gray-600">
                Chưa có voucher nào. <br />
                <button
                  onClick={() => setShowForm(true)}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Tạo voucher đầu tiên
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
    </AdminLayout>
  );
};

export default VoucherManager;
