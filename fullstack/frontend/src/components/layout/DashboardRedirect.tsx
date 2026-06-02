import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ADMIN_ROLES = ['admin', 'super_admin'];

const DashboardRedirect = () => {
  const { user } = useAuth();
  const isAdmin = user?.role && ADMIN_ROLES.includes(user.role);
  return <Navigate to={isAdmin ? '/admin/dashboard' : '/user/dashboard'} replace />;
};

export default DashboardRedirect;
