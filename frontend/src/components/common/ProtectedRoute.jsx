import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isInitializing, user } = useSelector((state) => state.auth);
  const location = useLocation();

  // Wait for the page-load refresh attempt before deciding to redirect
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner size="lg" text="Restoring session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
