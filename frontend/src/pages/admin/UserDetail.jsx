import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useParams, Link } from 'react-router-dom';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

const UserDetail = () => {
  const { id } = useParams();
  const { modal, closeModal, showError, showSuccess } = useModal();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('user');

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${id}`);
      setUser(res.data);
      setRole(res.data.role || 'user');
    } catch (err) {
      console.error('Failed to fetch user', err);
    } finally { setLoading(false); }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get(`/users/${id}/orders`);
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    }
  };

  useEffect(() => {
    // fetch functions are local; call them when id changes
    fetchUser();
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveRole = async () => {
    try {
      await api.patch(`/users/${id}`, { role });
      showSuccess('Thành công', 'Cập nhật role thành công');
    } catch (err) {
      console.error('Failed to update role', err);
      showError('Lỗi', 'Cập nhật thất bại');
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (!user) return <div>Người dùng không tồn tại</div>;

  return (
    <div className="px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Chi tiết người dùng</h1>
        <Link to="/admin/users" className="text-sm text-blue-600">← Quay về danh sách</Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Thông tin cá nhân</h2>
          <p><strong>Tên: </strong>{user.full_name || user.username || (user.email ? user.email.split('@')[0] : '')}</p>
          <p><strong>Email: </strong>{user.email}</p>
          <p><strong>Ngày tạo: </strong>{new Date(user.created_at || user.createdAt || user.created).toLocaleString()}</p>
          <p><strong>Trạng thái: </strong>{user.is_verified ? 'Active' : 'Inactive'}</p>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Cấp quyền</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border px-2 py-1 rounded">
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="shipper">Shipper</option>
            </select>
            <button onClick={saveRole} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded">Lưu</button>
          </div>
        </div>

        <div className="col-span-2 bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-4">Đơn hàng đã mua</h2>
          {orders.length === 0 ? (
            <div className="text-gray-500">Chưa có đơn hàng</div>
          ) : (
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2">Mã đơn</th>
                  <th className="px-4 py-2">Ngày</th>
                  <th className="px-4 py-2">Tổng tiền</th>
                  <th className="px-4 py-2">Trạng thái</th>
                  <th className="px-4 py-2">Sản phẩm</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-t">
                    <td className="px-4 py-2">{o.id}</td>
                    <td className="px-4 py-2">{new Date(o.created_at || o.createdAt || o.date).toLocaleString()}</td>
                    <td className="px-4 py-2">{(o.total || o.amount).toLocaleString('vi-VN')}đ</td>
                    <td className="px-4 py-2">{o.status}</td>
                    <td className="px-4 py-2">
                      {Array.isArray(o.items) && o.items.length > 0 ? (
                        o.items.map(it => it.name).join(', ')
                      ) : (
                        <span className="text-gray-500">Không có sản phẩm</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
  );
};

export default UserDetail;
