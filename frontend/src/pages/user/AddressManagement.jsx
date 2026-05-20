import { useState, useEffect } from 'react';
import api from '../../services/api';
import AddressForm from '../../components/AddressForm';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';

const AddressManagement = () => {
  const { modal, closeModal, showError, showSuccess } = useModal();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/addresses');
      setAddresses(response.data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      showError('Lỗi', 'Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSave = async (formData) => {
    try {
      setSubmitting(true);
      await api.post('/addresses', formData);
      showSuccess('Thành công', 'Thêm địa chỉ mới thành công');
      setShowForm(false);
      fetchAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      showError('Lỗi', error.response?.data?.error || 'Không thể lưu địa chỉ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/addresses/${id}/default`);
      showSuccess('Thành công', 'Đã đặt làm địa chỉ mặc định');
      fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      showError('Lỗi', 'Không thể đặt địa chỉ mặc định');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải danh sách địa chỉ...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Sổ địa chỉ</h1>
          <p className="text-gray-600 text-sm">Quản lý danh sách địa chỉ nhận hàng của bạn</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            + Thêm địa chỉ mới
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Thêm địa chỉ mới</h2>
          <AddressForm
            initialData={null}
            onSubmit={handleSave}
            onCancel={() => {
              setShowForm(false);
            }}
            loading={submitting}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-500 mb-4">Bạn chưa lưu địa chỉ nào</p>
            </div>
          ) : (
            addresses.map(addr => (
              <div key={addr.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900">{addr.full_name}</h3>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-600">{addr.phone}</span>
                      {Boolean(addr.is_default) && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{addr.address_detail}</p>
                    <p className="text-gray-600 text-sm">{`${addr.ward_name}, ${addr.district_name}, ${addr.province_name}`}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                    {!addr.is_default && (
                      <button onClick={() => handleSetDefault(addr.id)} className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition">
                        Thiết lập mặc định
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
export default AddressManagement;