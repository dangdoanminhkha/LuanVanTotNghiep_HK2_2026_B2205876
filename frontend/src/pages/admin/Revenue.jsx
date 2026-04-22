import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { DownloadCloud, Filter, TrendingUp, CalendarDays, BarChart2 } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout'; // Mở lại import AdminLayout
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';

// Helper format tiền tệ VNĐ
const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(num) + ' đ';
};

const Revenue = () => {
  const { modal, closeModal, showError } = useModal();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ daily: [], category: [] });
  const [importExpense, setImportExpense] = useState(0);
  const [expenses, setExpenses] = useState(0);

  // --- STATE BỘ LỌC THÔNG MINH ---
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'year' | 'custom'
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // --- GỌI API DỰA LIỆU THẬT ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // Lấy token từ localStorage
      const token = localStorage.getItem('token');
      
      const params = { 
        mode: viewMode, 
        month: filterMonth, 
        year: filterYear 
      };

      // Add custom dates if in custom mode
      if (viewMode === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }
      
      const res = await axios.get('http://localhost:5000/api/admin/revenue', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params
      });

      if (res.data && res.data.success && res.data.data) {
        setData(res.data.data);
      } else {
        setData({ daily: [], category: [] });
      }
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu doanh thu:', err.response?.data || err.message);
      setData({ daily: [], category: [] });
    } finally {
      setLoading(false);
    }
  };

  // --- GỌI API TIỀN CHI ---
  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const params = { 
        mode: viewMode, 
        month: filterMonth, 
        year: filterYear 
      };

      // Add custom dates if in custom mode
      if (viewMode === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }
      
      const res = await axios.get('http://localhost:5000/api/admin/expenses', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params
      });

      if (res.data && res.data.success && res.data.data) {
        setExpenses(Number(res.data.data.totalExpenses) || 0);
      } else {
        setExpenses(0);
      }
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu chi tiêu:', err.response?.data || err.message);
      setExpenses(0);
    }
  };

  // Tự động gọi lại API khi thay đổi bộ lọc
  useEffect(() => {
    fetchData();
    fetchExpenses();
  }, [viewMode, filterMonth, filterYear, customStartDate, customEndDate]);

  // --- XỬ LÝ DỮ LIỆU HIỂN THỊ (CHART & TABLE) ---
  const chartAndTableData = useMemo(() => {
    if (!data || !data.daily) return [];
    
    if (viewMode === 'year') {
      // TẠO ĐỦ 12 THÁNG NGAY CẢ KHI KHÔNG CÓ DOANH THU
      const dataByMonth = {};
      
      // Tạo map từ dữ liệu API để tra cứu nhanh
      data.daily.forEach(d => {
        dataByMonth[d.rawMonth] = {
          ...d,
          name: `Tháng ${d.rawMonth}`,
          displayDate: `Tháng ${d.rawMonth} / ${filterYear}`,
          total: Number(d.total),
          ai: Number(d.ai),
          orders: Number(d.orders)
        };
      });
      
      // Tạo array đủ 12 tháng
      const fullYearData = [];
      for (let month = 1; month <= 12; month++) {
        if (dataByMonth[month]) {
          fullYearData.push(dataByMonth[month]);
        } else {
          // Tháng không có doanh thu
          fullYearData.push({
            rawMonth: month,
            name: `Tháng ${month}`,
            displayDate: `Tháng ${month} / ${filterYear}`,
            day: `${filterYear}-${month.toString().padStart(2, '0')}-01`,
            total: 0,
            ai: 0,
            orders: 0
          });
        }
      }
      return fullYearData;
    }

    if (viewMode === 'custom') {
      // Custom date range - just return data as-is, already formatted by backend
      return data.daily.map(d => ({
        ...d,
        displayDate: new Date(d.day).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' }),
        total: Number(d.total),
        ai: Number(d.ai),
        orders: Number(d.orders)
      }));
    }

    // viewMode === 'month' - TẠO ĐỦ 30/31 NGÀY NGAY CẢ KHI KHÔNG CÓ DOANH THU
    const daysInMonth = new Date(filterYear, filterMonth, 0).getDate();
    const dataByDay = {};
    
    // Tạo map từ dữ liệu API để tra cứu nhanh
    data.daily.forEach(d => {
      const dayNum = new Date(d.day).getDate();
      dataByDay[dayNum] = d;
    });
    
    // Tạo array đủ 30/31 ngày
    const fullMonthData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(filterYear, filterMonth - 1, day).toISOString().split('T')[0];
      const existingData = dataByDay[day];
      
      if (existingData) {
        fullMonthData.push({
          ...existingData,
          displayDate: new Date(existingData.day).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          total: Number(existingData.total),
          ai: Number(existingData.ai),
          orders: Number(existingData.orders)
        });
      } else {
        // Ngày không có doanh thu
        fullMonthData.push({
          day: dateStr,
          displayDate: day.toString().padStart(2, '0'),
          total: 0,
          ai: 0,
          orders: 0
        });
      }
    }
    
    return fullMonthData;
  }, [data, viewMode, filterYear, filterMonth, customStartDate, customEndDate]);

  // Dữ liệu cho biểu đồ tròn (Category)
  const pieData = useMemo(() => {
    if (!data || !data.category) return [];
    return data.category.map(c => ({
      name: c.category,
      value: Number(c.revenue)
    }));
  }, [data]);

  // --- TÍNH TOÁN SUMMARY (KPIs) ---
  const summary = useMemo(() => {
    if (!chartAndTableData || chartAndTableData.length === 0) return { totalRevenue: 0, totalOrders: 0, aov: 0, aiRevenue: 0 };
    const totalRev = chartAndTableData.reduce((sum, item) => sum + item.total, 0);
    const totalOrd = chartAndTableData.reduce((sum, item) => sum + item.orders, 0);
    return {
      totalRevenue: totalRev,
      totalOrders: totalOrd,
      aov: totalOrd > 0 ? Math.round(totalRev / totalOrd) : 0,
      aiRevenue: chartAndTableData.reduce((sum, item) => sum + item.ai, 0)
    };
  }, [chartAndTableData]);

  // Bảng màu chuẩn
  const colors = { total: '#2563EB', ai: '#8B5CF6', palette: ['#60A5FA', '#A78BFA', '#34D399', '#FBBF24', '#F87171', '#38BDF8'] };

  // --- HÀM XUẤT BÁNG CÁO ---
  const exportReport = () => {
    if (!chartAndTableData || chartAndTableData.length === 0) {
      showError('Lỗi', 'Không có dữ liệu để xuất');
      return;
    }

    // Tạo CSV headers
    const headers = viewMode === 'month' 
      ? ['Ngày', 'Số đơn hàng', 'Doanh thu tổng (đ)', 'Doanh thu AI (đ)', 'Tỷ trọng AI (%)']
      : viewMode === 'year'
      ? ['Tháng', 'Số đơn hàng', 'Doanh thu tổng (đ)', 'Doanh thu AI (đ)', 'Tỷ trọng AI (%)']
      : ['Ngày', 'Số đơn hàng', 'Doanh thu tổng (đ)', 'Doanh thu AI (đ)', 'Tỷ trọng AI (%)'];

    // Tạo CSV rows
    const rows = chartAndTableData.map(row => {
      const aiPercentage = row.total > 0 ? ((row.ai / row.total) * 100).toFixed(1) : '0';
      return [
        row.displayDate,
        row.orders,
        Math.round(row.total),
        Math.round(row.ai),
        aiPercentage
      ];
    });

    // Tạo summary rows
    const summaryRows = [
      [],
      ['TỔNG CỘNG', summary.totalOrders, Math.round(summary.totalRevenue), Math.round(summary.aiRevenue), ((summary.aiRevenue / summary.totalRevenue) * 100).toFixed(1)]
    ];

    // Kết hợp tất cả rows
    const allRows = [headers, ...rows, ...summaryRows];
    const csvContent = allRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    // Tạo Blob và download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    let filename;
    if (viewMode === 'month') {
      filename = `Doanh thu_Tháng${filterMonth}_${filterYear}.csv`;
    } else if (viewMode === 'year') {
      filename = `Doanh thu_${filterYear}.csv`;
    } else {
      filename = `Doanh thu_${customStartDate}_${customEndDate}.csv`;
    }
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
        
        {/* HEADER & SMART FILTERS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Báo cáo Doanh thu</h1>
            <p className="text-sm text-gray-500 mt-1">Dữ liệu thực tế từ hệ thống</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Toggle View Mode */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'month' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                onClick={() => setViewMode('month')}
              >
                <CalendarDays size={16}/> Theo Tháng
              </button>
              <button 
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'year' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                onClick={() => setViewMode('year')}
              >
                <BarChart2 size={16}/> Theo Năm
              </button>
              <button 
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'custom' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                onClick={() => setViewMode('custom')}
              >
                <Filter size={16}/> Tuỳ chỉnh
              </button>
            </div>

            {/* Dropdowns */}
            <div className="flex gap-2 flex-wrap items-center">
              {viewMode === 'month' && (
                <select 
                  className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block px-3 py-2 outline-none"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={i+1}>Tháng {i+1}</option>
                  ))}
                </select>
              )}
              {viewMode !== 'custom' && (
                <select 
                  className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block px-3 py-2 outline-none"
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value))}
                >
                  <option value={2026}>Năm 2026</option>
                  <option value={2025}>Năm 2025</option>
                  <option value={2024}>Năm 2024</option>
                </select>
              )}
              {viewMode === 'custom' && (
                <>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-2 outline-none"
                  />
                  <span className="text-gray-600 font-medium">đến</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-2 outline-none"
                  />
                  {(customStartDate || customEndDate) && (
                    <button
                      onClick={() => {
                        setCustomStartDate('');
                        setCustomEndDate('');
                      }}
                      className="px-3 py-2 bg-red-100 text-red-600 text-sm font-medium rounded-lg hover:bg-red-200 transition"
                    >
                      Xoá
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Nút Xuất Báo cáo */}
            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-all shadow-sm"
            >
              <DownloadCloud size={16} /> Xuất báo cáo
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-1">Tổng doanh thu</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalRevenue)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-1">Doanh thu AI (ALS & Hình ảnh)</div>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(summary.aiRevenue)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-1">Tổng tiền nhập hàng</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(expenses)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-1">Tổng số đơn hàng</div>
            <div className="text-2xl font-bold text-gray-900">{summary.totalOrders} <span className="text-sm font-normal text-gray-400">đơn</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-1">Giá trị trung bình đơn (AOV)</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.aov)}</div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="flex justify-center my-8 text-indigo-600">Đang tải dữ liệu...</div>
        )}

        {/* CHARTS GRID: Doanh thu (Trái) - Danh mục (Phải) */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Biểu đồ chính */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800">
                  {viewMode === 'month' ? `Biểu đồ Doanh thu (Tháng ${filterMonth}/${filterYear})` : `Biểu đồ Doanh thu (Năm ${filterYear})`}
                </h2>
              </div>
              <div className="h-80">
                {chartAndTableData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {viewMode === 'month' ? (
                      <AreaChart data={chartAndTableData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={colors.total} stopOpacity={0.3}/><stop offset="95%" stopColor={colors.total} stopOpacity={0}/></linearGradient>
                          <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={colors.ai} stopOpacity={0.3}/><stop offset="95%" stopColor={colors.ai} stopOpacity={0}/></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="displayDate" tick={{fontSize:12, fill:'#6B7280'}} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(v)=> (v>=1000000? (v/1000000)+'M': v)} tick={{fontSize:12, fill:'#6B7280'}} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v)=>formatCurrency(v)} cursor={{stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '5 5'}} />
                        <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}}/>
                        <Area name="Tổng doanh thu" type="monotone" dataKey="total" stroke={colors.total} strokeWidth={3} fill="url(#colorTotal)" activeDot={{r: 6, strokeWidth: 0}} />
                        <Area name="Doanh thu AI" type="monotone" dataKey="ai" stroke={colors.ai} strokeWidth={3} fill="url(#colorAi)" activeDot={{r: 6, strokeWidth: 0}} />
                      </AreaChart>
                    ) : (
                      <BarChart data={chartAndTableData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" tick={{fontSize:12, fill:'#6B7280'}} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(v)=> (v>=1000000? (v/1000000)+'M': v)} tick={{fontSize:12, fill:'#6B7280'}} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v)=>formatCurrency(v)} cursor={{fill: '#F3F4F6'}} />
                        <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}}/>
                        <Bar name="Tổng doanh thu" dataKey="total" fill={colors.total} radius={[4, 4, 0, 0]} />
                        <Bar name="Doanh thu AI" dataKey="ai" fill={colors.ai} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">Không có dữ liệu</div>
                )}
              </div>
            </div>

            {/* Biểu đồ Cơ cấu danh mục */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-6">Cơ cấu theo danh mục</h2>
              <div className="h-80">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={pieData} 
                        dataKey="value" 
                        nameKey="name" 
                        innerRadius={60} 
                        outerRadius={100} 
                        paddingAngle={5}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors.palette[index % colors.palette.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v)=>formatCurrency(v)} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">Không có dữ liệu</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TABLE CHI TIẾT */}
        {!loading && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-base font-semibold text-gray-800">Sổ cái doanh thu chi tiết</h2>
              <span className="text-xs text-gray-500 font-medium bg-white border border-gray-200 px-3 py-1 rounded-md shadow-sm">
                {chartAndTableData.length} {viewMode === 'month' ? 'ngày' : 'tháng'}
              </span>
            </div>

            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">{viewMode === 'month' ? 'Ngày' : 'Tháng'}</th>
                    <th className="py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Số đơn</th>
                    <th className="py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Doanh thu tổng</th>
                    <th className="py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right text-purple-600">Doanh thu AI</th>
                    <th className="py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Tỷ trọng AI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {chartAndTableData.map(row => {
                    const aiPercentage = row.total > 0 ? ((row.ai / row.total) * 100).toFixed(1) : 0;
                    return (
                      <tr key={row.day || row.name} className="hover:bg-indigo-50/40 transition-colors group">
                        <td className="py-3 px-6 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {row.displayDate}
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-600 text-center">
                          <span className="bg-gray-100 text-gray-700 py-1 px-3 rounded-full text-xs font-semibold group-hover:bg-indigo-100 group-hover:text-indigo-700 border border-gray-200 group-hover:border-indigo-200">
                            {row.orders} đơn
                          </span>
                        </td>
                        <td className="py-3 px-6 text-sm font-semibold text-gray-800 text-right">{formatCurrency(row.total)}</td>
                        <td className="py-3 px-6 text-sm font-bold text-purple-600 text-right bg-purple-50/30">{formatCurrency(row.ai)}</td>
                        <td className="py-3 px-6 text-sm text-right w-48">
                          <div className="flex items-center justify-end gap-3">
                            <span className="text-xs font-bold text-gray-600 w-10 text-right">{aiPercentage}%</span>
                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                              <div className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full" style={{ width: `${aiPercentage}%` }}></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {chartAndTableData.length === 0 && (
                     <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center">
                          <Filter size={32} className="text-gray-300 mb-2" />
                          <p>Chưa có doanh thu nào trong thời gian này</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <Modal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onClose={closeModal}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        showCancel={modal.showCancel}
      />
    </AdminLayout>
  );
};

export default Revenue;