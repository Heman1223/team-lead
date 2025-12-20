import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-primary-200"></div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role-based access control
    if (requiredRole) {
        if (requiredRole === 'admin' && user?.role !== 'admin') {
            // Non-admin trying to access admin routes
            return <Navigate to="/dashboard" replace />;
        }
        
        if (requiredRole === 'non-admin' && user?.role === 'admin') {
            // Admin trying to access regular dashboard
            return <Navigate to="/admin/dashboard" replace />;
        }
        
        if (requiredRole === 'team_lead' && user?.role !== 'team_lead' && user?.role !== 'admin') {
            // Non-team-lead trying to access team lead routes
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
