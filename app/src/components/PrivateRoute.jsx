import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute({ children, allowedRoles }) {
    const { currentUser, userRole, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--color-dark-bg)]">
                <div className="animate-pulse text-[var(--color-primary)] font-bold text-xl">
                    Carregando...
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // specific role check
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // If Admin tries to access Barber app -> Redirect to Admin
        if (userRole === 'admin') {
            return <Navigate to="/admin" replace />;
        }
        // If Barber tries to access Admin -> Redirect to App
        if (userRole === 'barber') {
            return <Navigate to="/app" replace />;
        }
        // Default fallback
        return <Navigate to="/" replace />;
    }

    return children;
}
