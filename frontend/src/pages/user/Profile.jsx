import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import axios from 'axios';

const Profile = () => {
  const { user, logout } = useAuth();
  const [userInfo, setUserInfo] = useState({
    email: '',
    phone: '',
    full_name: '',
    gender: 'Khác',
    google_id: null
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [fetchedProfile, setFetchedProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const profileData = response.data;
        setUserInfo({
          email: profileData.email || '',
          phone: profileData.phone || '',
          full_name: profileData.full_name || '',
          gender: profileData.gender || 'Khác',
          google_id: profileData.google_id
        });
        setFetchedProfile(true);
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to user from context
        if (user) {
          setUserInfo({
            email: user.email || '',
            phone: user.phone || '',
            full_name: user.full_name || '',
            gender: user.gender || 'Khác',
            google_id: user.google_id
          });
        }
        setFetchedProfile(true);
      }
    };
    
    if (!fetchedProfile) {
      fetchProfile();
    }
  }, [user, fetchedProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validate phone (bắt buộc)
    if (!userInfo.phone || userInfo.phone.trim() === '') {
      setMessage('Số điện thoại là bắt buộc');
      setLoading(false);
      return;
    }

    if (!/^[0-9]{10,11}$/.test(userInfo.phone)) {
      setMessage('Số điện thoại phải có 10-11 chữ số');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/profile`, {
        full_name: userInfo.full_name,
        phone: userInfo.phone,
        gender: userInfo.gender
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update localStorage with new user data
      if (response.data.user) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...currentUser, ...response.data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setMessage('Cập nhật thông tin thành công!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage(error.response?.data?.error || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    if (passwords.newPassword.length < 6) {
      setMessage('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/change-password`, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('Đổi mật khẩu thành công!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage(error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Thông tin cá nhân</h1>
        <p className="text-gray-600">Quản lý thông tin tài khoản và bảo mật của bạn</p>
      </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('thành công') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông tin tài khoản</h2>
          
          <form onSubmit={handleUpdateProfile}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={userInfo.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={userInfo.full_name}
                  onChange={(e) => setUserInfo({...userInfo, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập họ và tên của bạn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={userInfo.phone}
                  onChange={(e) => setUserInfo({...userInfo, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập số điện thoại (bắt buộc)"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Số điện thoại để shipper liên hệ giao hàng</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giới tính
                </label>
                <div className="flex gap-4">
                  {['Nam', 'Nữ', 'Khác'].map(g => (
                    <label key={g} className="flex items-center">
                      <input
                        type="radio"
                        value={g}
                        checked={userInfo.gender === g}
                        onChange={(e) => setUserInfo({...userInfo, gender: e.target.value})}
                        className="mr-2"
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
              </button>
            </div>
          </form>
        </div>

        {/* Password Section - Chỉ hiện với user không phải Google */}
        {!userInfo.google_id && (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Bảo mật</h2>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              {showPasswordForm ? 'Hủy' : 'Đổi mật khẩu'}
            </button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handleChangePassword}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={logout}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
        )}

        {/* Thông báo user Google */}
        {userInfo.google_id && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-blue-800">
                Tài khoản đăng nhập bằng Google không thể đổi mật khẩu
              </span>
            </div>
          </div>
        )}
      </div>
    );
};

export default Profile;