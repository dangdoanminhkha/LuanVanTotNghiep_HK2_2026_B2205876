import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ShipmentManagement = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(() => localStorage.getItem('shipmentTab') || 'all');

  useEffect(() => {
    localStorage.setItem('shipmentTab', filter);
  }, [filter]);

  const fetchShipments = async () => {
    try {
      const token = localStorage.getItem('token');
      // Lấy đơn hàng để tạo danh sách giao hàng
      const ordersRes = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Chỉ lấy các đơn đã xác nhận trở lên (không lấy pending)
      const confirmedOrders = (ordersRes.data || []).filter(o => 
        ['confirmed', 'shipping', 'delivered'].includes(o.status)
      );
      setShipments(confirmedOrders);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchShipments();
  }, [isAdmin, navigate]);

  const updateShipmentStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchShipments();
    } catch (error) {
      console.error('Error updating shipment:', error);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      confirmed: { text: 'Chờ lấy hàng', color: 'bg-blue-100 text-blue-800', icon: '📦' },
      shipping: { text: 'Đang giao', color: 'bg-purple-100 text-purple-800', icon: '🚚' },
      delivered: { text: 'Đã giao', color: 'bg-green-100 text-green-800', icon: '✅' }
    };
    return configs[status] || { text: status, color: 'bg-gray-100 text-gray-800', icon: '?' };
  };

  const filteredShipments = filter === 'all' 
    ? shipments 
    : shipments.filter(s => s.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="text-center">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quản lý giao hàng</h1>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Tất cả ({shipments.length})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'confirmed' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            📦 Chờ lấy hàng ({shipments.filter(s => s.status === 'confirmed').length})
          </button>
          <button
            onClick={() => setFilter('shipping')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'shipping' ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            🚚 Đang giao ({shipments.filter(s => s.status === 'shipping').length})
          </button>
          <button
            onClick={() => setFilter('delivered')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'delivered' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            ✅ Đã giao ({shipments.filter(s => s.status === 'delivered').length})
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID đơn hàng</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Khách hàng</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Liên hệ</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Địa chỉ giao</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((shipment) => {
                const statusConfig = getStatusConfig(shipment.status);
                return (
                  <tr key={shipment.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">#{shipment.id}</td>
                    <td className="px-6 py-3 text-sm">
                      <p className="font-medium text-gray-900">{shipment.recipient_name || shipment.email || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{shipment.phone || ''}</p>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <p className="text-gray-700">📞 {shipment.phone || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700 max-w-xs">
                      <p className="truncate" title={shipment.shipping_address}>
                        {shipment.shipping_address || 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                        {statusConfig.icon} {statusConfig.text}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <select
                        value={shipment.status || 'confirmed'}
                        onChange={(e) => updateShipmentStatus(shipment.id, e.target.value)}
                        className="px-3 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="confirmed">📦 Chờ lấy hàng</option>
                        <option value="shipping">🚚 Đang giao</option>
                        <option value="delivered">✅ Đã giao</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredShipments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-2">📦</p>
              <p>Không có đơn hàng cần giao</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipmentManagement;
