import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const PrivateRoute = ({ children, requireAdmin = false, requireShipper = false }) => {
  const { isAuthenticated, isAdmin, isShipper, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Đang tải...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" />;
  }

  if (requireShipper && !isShipper) {
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute;
