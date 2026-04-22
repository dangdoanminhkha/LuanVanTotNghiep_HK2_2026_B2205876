import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import PasswordInput from '../components/PasswordInput';

const Register = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Khác');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    if (!termsAccepted) {
      setError('Bạn phải đồng ý điều khoản');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    const payload = { email, password, fullName, phone, gender, termsAccepted };
    const result = await register(payload);
    
    if (result.success) {
      navigate('/check-email', { state: { email } });
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleGoogleRegister = async (credentialResponse) => {
    try {
      setError('');
      setLoading(true);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google-login`,
        { token: credentialResponse.credential }
      );

      if (response.data.success) {
        // Store JWT token
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/');
        window.location.reload(); // Reload to update auth context
      } else {
        setError(response.data.error || 'Google registration failed');
      }
    } catch (err) {
      console.error('Google registration error:', err);
      setError(err.response?.data?.error || 'Google registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-6">Đăng ký tài khoản</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Google Register Button */}
      <div className="mb-6">
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleRegister}
              onError={() => setError('Đăng ký Google thất bại')}
              text="signup_with"
              width="280"
            />
          </div>
        </GoogleOAuthProvider>
      </div>

      {/* Divider */}
      <div className="flex items-center mb-6">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-3 text-gray-500 text-sm">hoặc</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Họ và tên</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Số điện thoại</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Giới tính</label>
          <div className="flex gap-4">
            {['Nam', 'Nữ', 'Khác'].map(g => (
              <label key={g} className="flex items-center">
                <input
                  type="radio"
                  value={g}
                  checked={gender === g}
                  onChange={(e) => setGender(e.target.value)}
                  className="mr-2"
                />
                <span>{g}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <PasswordInput 
            label="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <div className="mb-6">
          <PasswordInput 
            label="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
        <div className="mb-4">
          <label className="inline-flex items-start">
            <input type="checkbox" className="form-checkbox mt-1" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
            <span className="ml-2 text-gray-700 text-sm">
              Bằng việc đăng ký, bạn đồng ý với{' '}
              <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Điều khoản sử dụng</Link>
              {' '}và{' '}
              <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Chính sách bảo mật</Link>
              .
            </span>
          </label>
        </div>

      </form>
      
        <p className="text-center mt-4 text-gray-600">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-blue-600 hover:underline">
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
};

export default Register;
