import { createContext, useState } from 'react';
import { authAPI } from '../services/api';
import { clearSessionId } from '../utils/sessionId';

const AuthContext = createContext(null);
export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      return JSON.parse(savedUser);
    }
    return null;
  });
  const [loading] = useState(false);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      // Clear guest session after successful authentication
      clearSessionId();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Đăng nhập thất bại' };
    }
  };

  const register = async (data) => {
    try {
      await authAPI.register(data);
      // Clear guest session after successful registration
      clearSessionId();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Đăng ký thất bại' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isShipper: user?.role === 'shipper',
    isCustomer: user?.role === 'customer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
