import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hard-block guard for main-admin accounts whose email is not yet verified.
 * Regular staff users get a banner instead (see EmailVerificationBanner) and
 * are NOT redirected here.
 */
export function RequireEmailVerified({ children }: { children: ReactNode }) {
  const { user, isMainAdmin, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading || !isAuthenticated || !user) return <>{children}</>;
  if (!isMainAdmin) return <>{children}</>;
  // Only hard-block when the server explicitly says the email is not verified.
  // Undefined (older cached user) is treated as verified until refresh.
  if (user.emailVerified !== false) return <>{children}</>;
  if (location.pathname.startsWith('/verify-email')) return <>{children}</>;

  return <Navigate to="/verify-email" replace state={{ from: location.pathname }} />;
}

export default RequireEmailVerified;
