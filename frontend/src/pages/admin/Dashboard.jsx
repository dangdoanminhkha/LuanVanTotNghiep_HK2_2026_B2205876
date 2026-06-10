import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Dashboard uses live data from /api/admin/dashboard; removed unused mock constants

// ============================================
// Sub-Component: Overview Cards 
// ============================================
const OverviewCard = ({ title, value, subtext, growth, gradient, onClick }) => {
  const isPositive = growth >= 0;
  const growthColor = isPositive ? 'text-green-600' : 'text-red-600';
  const growthArrow = isPositive ? '↑' : '↓';
  
  return (
    <div 
      onClick={onClick}
      className={`rounded-xl shadow-sm p-6 border border-gray-100 transition-all hover:shadow-md cursor-pointer hover:border-indigo-300 ${gradient}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {growth !== undefined && (
            <p className={`text-sm font-semibold mt-1 ${growthColor}`}>
              {growthArrow} {Math.abs(growth)}% so với kỳ trước
            </p>
          )}
          {subtext && !growth && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
      </div>
    </div>
  );
};

// ============================================
// Sub-Component: Low Stock Table
// ============================================
const LowStockTable = ({ data, navigate }) => (
  <div className="rounded-xl shadow-sm p-6 bg-white border border-gray-100">
    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
      <span className="text-xl">⚠️</span> Sắp hết hàng (dưới 5 cái)
    </h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Tên sản phẩm</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Màu sắc</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Size</th>
            <th className="px-4 py-3 text-right font-semibold text-red-600">Tồn kho</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item) => (
              <tr 
                key={item.id} 
                className="border-b border-gray-100 hover:bg-orange-50 cursor-pointer transition"
                onClick={() => navigate('/admin/inventory', { 
                  state: { 
                    statusFilter: item.status,
                    search: item.product_name 
                  } 
                })}
              >
                <td className="px-4 py-3 font-medium text-gray-900 hover:text-orange-600">{item.product_name}</td>
                <td className="px-4 py-3 text-gray-600">{item.color || 'N/A'}</td>
                <td className="px-4 py-3 text-gray-600">{item.size || 'N/A'}</td>
                <td className="px-4 py-3 text-right font-bold text-red-600">{item.quantity}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="px-4 py-8 text-center text-gray-500">Không có sản phẩm sắp hết hàng</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// ============================================
// Sub-Component: Frequently Bought Together
// ============================================
const FrequentlyBoughtList = ({ data }) => (
  <div className="rounded-xl shadow-sm p-6 bg-white border border-gray-100">
    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
      <span className="text-xl">🔗</span> Thường mua cùng nhau
    </h3>
    <div className="space-y-3">
      {data.length > 0 ? (
        data.map((pair, idx) => (
          <div
            key={idx}
            className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-sm transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900 text-sm">{pair.product1_name}</span>
              <span className="text-gray-400">⇄</span>
              <span className="font-semibold text-gray-900 text-sm">{pair.product2_name}</span>
            </div>
            <p className="text-xs text-gray-600 text-center">
              Mua cùng nhau <span className="font-bold text-indigo-600">{pair.count} lần</span>
            </p>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500 text-sm py-4">Không có dữ liệu</p>
      )}
    </div>
  </div>
);

// ============================================
// Helper: Generate slug from product name
// ============================================
const generateSlug = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9-]/g, '');
};

// ============================================
// Sub-Component: Top Products
// ============================================
const TopProductsList = ({ data, navigate }) => {
  const handleProductClick = (product) => {
    const slug = generateSlug(product.name);
    navigate(`/admin/products/${slug}`);
  };

  return (
  <div className="rounded-xl shadow-sm p-6 bg-white border border-gray-100">
    <h3 className="text-lg font-bold text-gray-900 mb-4">⭐ Top 5 Sản phẩm bán chạy</h3>
    <div className="space-y-3">
      {data && data.length > 0 ? (
        data.map((product, idx) => {
          return (
            <div 
              key={product.id} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition" 
              onClick={() => handleProductClick(product)}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="text-sm font-bold text-gray-600 w-6">{idx + 1}</div>
                <div>
                  <p className="font-medium text-gray-900 hover:text-indigo-600">{product.name}</p>
                  <p className="text-xs text-gray-500">-</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{product.totalSold || 0}</p>
                <p className="text-xs text-gray-500">cái bán</p>
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-center text-gray-500 text-sm py-4">Không có dữ liệu</p>
      )}
    </div>
  </div>
  );
};

// ============================================
// Sub-Component: New Users
// ============================================
const NewUsersList = ({ data }) => (
  <div className="rounded-xl shadow-sm p-6 bg-white border border-gray-100">
    <h3 className="text-lg font-bold text-gray-900 mb-4">👤 Top 5 Tài khoản mới nhất</h3>
    <div className="space-y-2">
      {data && data.length > 0 ? (
        data.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 text-sm">{user.email}</p>
              <p className="text-xs text-gray-500">{new Date(user.created_at).toLocaleDateString('vi-VN')}</p>
            </div>
            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">Mới</span>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500 text-sm py-4">Không có dữ liệu</p>
      )}
    </div>
  </div>
);

// ============================================
// Hàm Helper: Format dữ liệu biểu đồ
// ============================================
const formatChartData = (data) => {
  if (!data || data.length === 0) return [];
  
  return data
    .map(item => ({
      ...item,
      // Format ngày từ ISO string (2026-03-08T17:00:00.000Z) → 08/03
      displayDate: item.date 
        ? new Date(item.date).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' })
        : item.date
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sắp xếp từ cũ → mới
};

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState('all');
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    overview: {
      pendingOrders: 0,
      totalRevenue: 0,
      revenueGrowthPercent: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalUsers: 0,
      variantCount: 0,
      reviewsPending: 0
    },
    charts: {
      revenueChart: [],
      customerPie: []
    },
    inventory: {
      lowStock: []
    },
    ai: {
      frequentlyBought: [],
      topProducts: []
    },
    users: {
      newUsers: []
    }
  });

  const fetchDashboardData = async (selectedRange = 'thisMonth', startDate = '', endDate = '', monthParam = null, yearParam = null) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      let url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/dashboard?range=${selectedRange}`;
      
      // Add custom date parameters if in custom mode
      if (selectedRange === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      
      // Add month/year parameters for month/year modes
      // Use passed parameters if available, otherwise use state values
      if (selectedRange === 'thisMonth') {
        const month = monthParam !== null ? monthParam : selectedMonth;
        const year = yearParam !== null ? yearParam : selectedYear;
        url += `&month=${month}&year=${year}`;
      } else if (selectedRange === 'thisYear') {
        const year = yearParam !== null ? yearParam : selectedYear;
        url += `&year=${year}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const serverData = response.data.data || {};

        // Transform customerPie from server { order_type, count } -> { name, value, color }
        const serverCustomerPie = (serverData.charts && serverData.charts.customerPie) || [];
        const mappedCustomerPie = serverCustomerPie.map((p) => {
          const isGuest = (p.order_type || '').toLowerCase() === 'guest';
          return {
            name: isGuest ? 'Khách vãng lai' : 'Khách đã đăng ký',
            value: Number(p.count || 0),
            color: isGuest ? '#3b82f6' : '#10b981'
          };
        });

        const formattedData = {
          ...serverData,
          charts: {
            ...serverData.charts,
            revenueChart: formatChartData((serverData.charts && serverData.charts.revenueChart) || []),
            customerPie: mappedCustomerPie
          },
          ai: {
            ...serverData.ai,
            topProducts: (serverData.ai && serverData.ai.topProducts || []).map(p => ({
              ...p,
              totalSold: p.totalSold || p.total_sold || 0
            }))
          }
        };

        setStats(formattedData);
        setRange(selectedRange);
        // Update state if new values passed in
        if (monthParam !== null) setSelectedMonth(monthParam);
        if (yearParam !== null) setSelectedYear(yearParam);
        console.log('✓ Dashboard data loaded:', formattedData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    const loadData = async () => {
      await fetchDashboardData('all');
    };
    loadData();
  }, [isAdmin, navigate]);

  const handleRangeChange = (newRange) => {
    if (newRange === 'custom') {
      // For custom, show the date input fields - don't fetch yet
      setRange('custom');
      return;
    }
    setRange(newRange);
    fetchDashboardData(newRange);
  };

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      fetchDashboardData('custom', customStartDate, customEndDate);
    }
  };

  return (
    <AdminLayout>
      <div>
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        )}

        {!loading && (
          <>
        {/* ============================================ */}
        {/* Khu vực 1: Header & Range Filter */}
        {/* ============================================ */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">📊 Tổng quan & Thống kê</h1>
              <p className="text-gray-600 text-sm mt-1">Phân tích toàn bộ dữ liệu kinh doanh trong khoảng thời gian</p>
            </div>
          </div>

          {/* Time Filter Buttons */}
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => handleRangeChange('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${range === 'all' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => handleRangeChange('thisMonth')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${range === 'thisMonth' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Theo Tháng
            </button>
            <button
              onClick={() => handleRangeChange('thisYear')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${range === 'thisYear' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Theo Năm
            </button>
            <button
              onClick={() => handleRangeChange('custom')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${range === 'custom' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Tuỳ chỉnh khoảng ngày
            </button>
          </div>

          {range === 'thisMonth' && (
            <div className="flex gap-2 flex-wrap items-center">
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const newMonth = parseInt(e.target.value);
                  setSelectedMonth(newMonth);
                  fetchDashboardData('thisMonth', '', '', newMonth, selectedYear);
                }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm outline-none cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Thang {i + 1}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => {
                  const newYear = parseInt(e.target.value);
                  setSelectedYear(newYear);
                  fetchDashboardData('thisMonth', '', '', selectedMonth, newYear);
                }}
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

          {range === 'thisYear' && (
            <div className="flex gap-2 flex-wrap items-center">
              <select
                value={selectedYear}
                onChange={(e) => {
                  const newYear = parseInt(e.target.value);
                  setSelectedYear(newYear);
                  fetchDashboardData('thisYear', '', '', null, newYear);
                }}
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

          {range === 'custom' && (
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
              <button
                onClick={handleCustomDateChange}
                disabled={!customStartDate || !customEndDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                Áp dụng
              </button>
              {(customStartDate || customEndDate) && (
                <button
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                    setRange('thisMonth');
                    fetchDashboardData('thisMonth');
                  }}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-200 transition"
                >
                  Xoá bộ lọc
                </button>
              )}
            </div>
          )}
        </div>

        {/* ============================================ */}
        {/* Khu vực 2: Overview Cards (4 cột) */}
        {/* ============================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <OverviewCard
            title="Tổng doanh thu"
            value={`${Number(stats.overview.totalRevenue).toLocaleString('vi-VN')}đ`}
            growth={stats.overview.revenueGrowthPercent}
            gradient="bg-white"
            onClick={() => navigate('/admin/revenue')}
          />
          <OverviewCard
            title="Tổng đơn hàng"
            value={stats.overview.totalOrders}
            subtext="Đơn thành công"
            gradient="bg-white"
            onClick={() => navigate('/admin/orders', { 
              state: { 
                initialFilter: 'delivered', 
                initialRange: range,
                initialMonth: selectedMonth,
                initialYear: selectedYear
              } 
            })}
          />
          <OverviewCard
            title="Số lượng biến thể"
            value={stats.overview.variantCount}
            subtext="Các màu khác nhau"
            gradient="bg-white"
            onClick={() => navigate('/admin/products', { 
              state: { 
                initialTab: 'variants',
                initialRange: range,
                initialMonth: selectedMonth,
                initialYear: selectedYear,
                startDate: customStartDate, 
                endDate: customEndDate 
              } 
            })}
          />
          <OverviewCard
            title="Đánh giá cần phản hồi"
            value={stats.overview.reviewsPending}
            subtext="Chờ xử lý"
            gradient="bg-white"
            onClick={() => navigate('/admin/reviews', { 
              state: { 
                initialFilter: 'no_reply',
                initialRange: range,
                initialMonth: selectedMonth,
                initialYear: selectedYear,
                startDate: customStartDate, 
                endDate: customEndDate 
              } 
            })}
          />
        </div>

        {/* Hàng thứ 2: Thêm các thẻ khác */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <OverviewCard
            title="Đơn chờ xử lý"
            value={stats.overview.pendingOrders}
            subtext="Chờ xác nhận hoặc giao"
            gradient="bg-white"
            onClick={() => navigate('/admin/orders', { 
              state: { 
                initialFilter: 'pending', 
                initialRange: range,
                initialMonth: selectedMonth,
                initialYear: selectedYear
              } 
            })}
          />
          <OverviewCard
            title="Tổng số sản phẩm"
            value={stats.overview.totalProducts}
            subtext="Trong kho"
            gradient="bg-white"
            onClick={() => navigate('/admin/products', { 
              state: { 
                initialRange: range,
                initialMonth: selectedMonth,
                initialYear: selectedYear,
                startDate: customStartDate, 
                endDate: customEndDate 
              } 
            })}
          />
          <OverviewCard
            title="Tổng tài khoản"
            value={stats.overview.totalUsers}
            subtext="Khách hàng đã đăng ký"
            gradient="bg-white"
            onClick={() => navigate('/admin/users', { 
              state: { 
                initialRange: range,
                initialMonth: selectedMonth,
                initialYear: selectedYear,
                startDate: customStartDate, 
                endDate: customEndDate 
              } 
            })}
          />
          <OverviewCard
            title="Quản lý Vouchers"
            value="🎟️"
            subtext="Tạo & cấu hình mã giảm giá"
            gradient="bg-white"
            onClick={() => navigate('/admin/vouchers', { 
              state: { 
                initialRange: range,
                initialMonth: selectedMonth,
                initialYear: selectedYear
              } 
            })}
          />
        </div>

        {/* ============================================ */}
        {/* Khu vực 3: Biểu đồ Doanh thu */}
        {/* ============================================ */}
        <div className="rounded-xl shadow-sm p-6 bg-white border border-gray-100 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Doanh thu theo thời gian</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={formatChartData(stats.charts.revenueChart)}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="displayDate"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} tick={{ fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                formatter={(value) => `${Number(value).toLocaleString('vi-VN')}đ`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="total_revenue"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Doanh thu tổng"
                isAnimationActive={true}
              />
              <Area
                type="monotone"
                dataKey="ai_revenue"
                stroke="#a855f7"
                fillOpacity={1}
                fill="url(#colorAI)"
                name="Doanh thu AI"
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Khu vực 4: Quản lý Kho & AI (2 cột) */}
        {/* ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <LowStockTable data={stats.inventory.lowStock} navigate={navigate} />
          <FrequentlyBoughtList data={stats.ai.frequentlyBought} />
        </div>

        {/* Khu vực 5: Top Products & New Users (2 cột) */}
        {/* ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopProductsList data={stats.ai.topProducts} navigate={navigate} />
          <NewUsersList data={stats.users.newUsers} />
        </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
