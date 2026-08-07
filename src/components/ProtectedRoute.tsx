import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import AppLoader from '@/shared/components/AppLoader';

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
}

export const ProtectedRoute = ({ children, requireOnboarding = false }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AppLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If onboarding is required, check if user has completed it
  if (requireOnboarding) {
    // Check if user has completed onboarding before
    const hasCompletedOnboarding = localStorage.getItem('onboarding-completed') || 
      (authService.getCurrentUserFromStorage()?.onboardingCompleted ? 'true' : null);
    if (!hasCompletedOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
};