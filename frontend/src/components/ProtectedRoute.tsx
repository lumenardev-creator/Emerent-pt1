import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: 'admin' | 'kiosk_user';
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-soft">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Not authenticated, redirect to appropriate login based on requireRole
    if (requireRole === 'kiosk_user') {
      return <Navigate to="/kiosk-login" replace />;
    }
    return <Navigate to="/admin-login" replace />;
  }

  if (requireRole && userRole !== requireRole) {
    // Wrong role, redirect to their portal
    if (userRole === 'kiosk_user') {
      return <Navigate to="/kiosk" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
