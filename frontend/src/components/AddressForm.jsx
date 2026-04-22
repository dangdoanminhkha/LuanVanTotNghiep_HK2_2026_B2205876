import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';
import { useModal } from '../hooks/useModal';

const PROVINCES_API = 'http://localhost:5000/api/provinces';

const AddressForm = ({ onSubmit, onCancel, initialData = null, loading = false }) => {
  const { modal, closeModal, showError } = useModal();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    province_code: '',
    province_name: '',
    district_code: '',
    district_name: '',
    ward_code: '',
    ward_name: '',
    address_detail: '',
    is_default: false
  });

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Load initial data
  useEffect(() => {
    if (initialData) {
      // Only set fields we care about, exclude id, user_id, timestamps
      setFormData({
        full_name: initialData.full_name || '',
        phone: initialData.phone || '',
        province_code: initialData.province_code || '',
        province_name: initialData.province_name || '',
        district_code: initialData.district_code || '',
        district_name: initialData.district_name || '',
        ward_code: initialData.ward_code || '',
        ward_name: initialData.ward_name || '',
        address_detail: initialData.address_detail || '',
        is_default: Boolean(initialData.is_default)
      });
    }
  }, [initialData]);

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axios.get(`${PROVINCES_API}`);
        setProvinces(response.data.results || []);
      } catch (error) {
        console.error('Error fetching provinces:', error);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (!formData.province_code) {
      setDistricts([]);
      return;
    }

    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const response = await axios.get(`${PROVINCES_API}/${formData.province_code}/districts`);
        setDistricts(response.data.results || []);
      } catch (error) {
        console.error('Error fetching districts:', error);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [formData.province_code]);

  // Fetch wards when district changes
  useEffect(() => {
    if (!formData.district_code) {
      setWards([]);
      return;
    }

    const fetchWards = async () => {
      setLoadingWards(true);
      try {
        const response = await axios.get(`${PROVINCES_API}/${formData.province_code}/districts/${formData.district_code}/wards`);
        setWards(response.data.results || []);
      } catch (error) {
        console.error('Error fetching wards:', error);
      } finally {
        setLoadingWards(false);
      }
    };
    fetchWards();
  }, [formData.district_code]);

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    const province = provinces.find(p => p.code.toString() === code);
    setFormData(prev => ({
      ...prev,
      province_code: code,
      province_name: province?.name || '',
      district_code: '',
      district_name: '',
      ward_code: '',
      ward_name: ''
    }));
  };

  const handleDistrictChange = (e) => {
    const code = e.target.value;
    const district = districts.find(d => d.code.toString() === code);
    setFormData(prev => ({
      ...prev,
      district_code: code,
      district_name: district?.name || '',
      ward_code: '',
      ward_name: ''
    }));
  };

  const handleWardChange = (e) => {
    const code = e.target.value;
    const ward = wards.find(w => w.code.toString() === code);
    setFormData(prev => ({
      ...prev,
      ward_code: code,
      ward_name: ward?.name || ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone || !formData.province_code || 
        !formData.district_code || !formData.ward_code || !formData.address_detail) {
      showError('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    // Clean up all string fields before submitting
    const cleanedData = {
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim(),
      province_code: String(formData.province_code || ''),
      province_name: formData.province_name?.trim() || '',
      district_code: String(formData.district_code || ''),
      district_name: formData.district_name?.trim() || '',
      ward_code: String(formData.ward_code || ''),
      ward_name: formData.ward_name?.trim() || '',
      address_detail: formData.address_detail.trim(),
      is_default: Boolean(formData.is_default)
    };
    
    onSubmit(cleanedData);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tên người nhận */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Họ và tên người nhận <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Ví dụ: Nguyễn Văn A"
            required
            maxLength={100}
          />
        </div>

        {/* Số điện thoại */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số điện thoại <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="0xxx xxx xxx"
            required
            maxLength={20}
          />
        </div>

        {/* Tỉnh/Thành phố */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tỉnh / Thành phố <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.province_code}
            onChange={handleProvinceChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            required
            disabled={loadingProvinces}
          >
            <option value="">-- Chọn Tỉnh/Thành --</option>
            {provinces.map(p => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Quận/Huyện */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quận / Huyện <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.district_code}
            onChange={handleDistrictChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            required
            disabled={!formData.province_code || loadingDistricts}
          >
            <option value="">-- Chọn Quận/Huyện --</option>
            {districts.map(d => (
              <option key={d.code} value={d.code}>{d.name}</option>
            ))}
          </select>
          {loadingDistricts && <p className="text-xs text-gray-500 mt-1">Đang tải...</p>}
        </div>

        {/* Phường/Xã */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phường / Xã <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.ward_code}
            onChange={handleWardChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            required
            disabled={!formData.district_code || loadingWards}
          >
            <option value="">-- Chọn Phường/Xã --</option>
            {wards.map(w => (
              <option key={w.code} value={w.code}>{w.name}</option>
            ))}
          </select>
          {loadingWards && <p className="text-xs text-gray-500 mt-1">Đang tải...</p>}
        </div>

        {/* Địa chỉ cụ thể */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Địa chỉ cụ thể <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.address_detail}
            onChange={(e) => setFormData(prev => ({ ...prev, address_detail: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Số nhà, tên đường, khóm/ấp..."
            rows={2}
            required
          />
        </div>

        {/* Đặt làm mặc định */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_default"
            checked={formData.is_default}
            onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="is_default" className="text-sm text-gray-700">
            Đặt làm địa chỉ mặc định
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Hủy
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Đang lưu...' : 'Lưu địa chỉ'}
          </button>
        </div>
      </form>

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
    </>
  );
};

export default AddressForm;
