import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedRedirect = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Redirect based on role
    if (user?.role === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
    } else if (user?.role === 'team_lead') {
        return <Navigate to="/dashboard" replace />;
    } else {
        return <Navigate to="/dashboard" replace />;
    }
};

export default RoleBasedRedirect;
