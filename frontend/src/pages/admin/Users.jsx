import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Link, useLocation } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';

const Users = () => {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Time filter states
  const now = new Date();
  const [timeFilterMode, setTimeFilterMode] = useState('all'); // 'all' | 'month' | 'year' | 'custom'
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Sync range from Dashboard if provided
  useEffect(() => {
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
  }, [location.state]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter === 'active') params.is_verified = 1;
      if (statusFilter === 'inactive') params.is_verified = 0;
      const res = await api.get('/users', { params });
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter]);

  // Reset pagination when search or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, timeFilterMode, selectedMonth, selectedYear, customStartDate, customEndDate]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const toggleActive = async (userId, current) => {
    try {
      await api.patch(`/users/${userId}`, { is_verified: current ? 0 : 1 });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: current ? 0 : 1 } : u));
    } catch (err) {
      console.error('Failed to toggle active', err);
    }
  };

  // Pagination logic
  const filteredUsers = users.filter(u => {
    // Date filter
    let matchDate = true;
    if (timeFilterMode !== 'all') {
      const userDate = new Date(u.created_at || u.createdAt);
      
      if (timeFilterMode === 'month') {
        matchDate = userDate.getMonth() + 1 === selectedMonth && userDate.getFullYear() === selectedYear;
      } else if (timeFilterMode === 'year') {
        matchDate = userDate.getFullYear() === selectedYear;
      } else if (timeFilterMode === 'custom' && customStartDate && customEndDate) {
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        matchDate = userDate >= startDate && userDate <= endDate;
      }
    }
    return matchDate;
  });

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Người dùng</h1>
        <div className="text-sm text-gray-500">Trang quản lý danh sách người dùng</div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc email" className="px-3 py-2 border rounded w-64" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded">
          <option value="all">Tất cả</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Tìm kiếm</button>
        <button type="button" onClick={() => { setSearch(''); setStatusFilter('all'); fetchUsers(); }} className="px-4 py-2 bg-gray-200 rounded">Đặt lại</button>
      </form>

      {/* Time Filter */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-lg border border-gray-200 mb-4">
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
          </button>
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
            <span className="text-gray-600 font-semibold">đến</span>
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

      <div className="bg-white shadow rounded">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Ngày tạo</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Đang tải...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Không có người dùng</td></tr>
            ) : paginatedUsers.map(u => (
              <tr key={u.id} className="border-t hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3"><Link to={`/admin/users/${u.id}`} className="text-blue-600 hover:underline">{u.full_name || u.username || (u.email ? u.email.split('@')[0] : '—')}</Link></td>
                <td className="px-4 py-3"><Link to={`/admin/users/${u.id}`} className="text-gray-700 hover:text-blue-600">{u.email}</Link></td>
                <td className="px-4 py-3"><Link to={`/admin/users/${u.id}`} className="text-gray-700 hover:text-blue-600">{new Date(u.created_at || u.createdAt || u.created).toLocaleString()}</Link></td>
                <td className="px-4 py-3"><Link to={`/admin/users/${u.id}`} className="text-gray-700 hover:text-blue-600">{u.is_verified ? <span className="text-green-600 font-semibold">Active</span> : <span className="text-red-600 font-semibold">Inactive</span>}</Link></td>
                <td className="px-4 py-3 space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => toggleActive(u.id, u.is_verified)} className={`px-3 py-1 rounded ${u.is_verified ? 'bg-yellow-500 text-white' : 'bg-green-600 text-white'}`}>{u.is_verified ? 'Deactivate' : 'Activate'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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
      </div>
    </AdminLayout>
  );
};

export default Users;
