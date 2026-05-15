import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from "../components/AuthLayout";
import { LoginForm } from "../components/LoginForm";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

import { clearAdminPreferences } from '@/hooks/useAdminPreferences';
import { useTheme } from '@/hooks/useTheme';

const Index = () => {
  const { t } = useTranslation('auth');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, signup } = useAuth();

  console.log('[Login] Component rendered', { isAuthenticated, pathname: location.pathname });
  const { setTheme } = useTheme();

  // Helper to apply user's theme after login
  const applyUserTheme = () => {
    // Clear admin preferences applied during login page display
    clearAdminPreferences();
    
    // Apply user's stored theme preferences
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const prefs = user.preferences 
          ? (typeof user.preferences === 'string' ? JSON.parse(user.preferences) : user.preferences)
          : null;
        
        if (prefs?.theme) {
          setTheme(prefs.theme);
          localStorage.setItem('flowsolution-theme', prefs.theme);
        }
      } catch (error) {
        console.warn('Could not apply user theme:', error);
      }
    }
  };

  useEffect(() => {
    console.log('[Login] useEffect triggered', { isAuthenticated });
    if (isAuthenticated) {
      const userData = localStorage.getItem('user_data');
      console.log('[Login] User is authenticated, userData:', userData ? 'exists' : 'missing');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          const isStaffUser = user.userType === 'RegularUser' || 
                              (!user.companyName && !user.companyWebsite && user.industry);
          const hasCompletedOnboarding = user.onboardingCompleted === true || 
                                         isStaffUser || 
                                         localStorage.getItem('onboarding-completed');
          
          console.log('[Login] Navigation decision:', { isStaffUser, hasCompletedOnboarding, onboardingCompleted: user.onboardingCompleted, userType: user.userType });
          
          if (hasCompletedOnboarding) {
            const from = (location.state as any)?.from?.pathname || '/dashboard';
            console.log('[Login] Navigating to:', from);
            navigate(from, { replace: true });
          } else {
            console.log('[Login] Navigating to /onboarding');
            navigate('/onboarding', { replace: true });
          }
        } catch (error) {
          console.error('[Login] Error parsing user_data:', error);
          const from = (location.state as any)?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        }
      } else {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        console.log('[Login] No userData, navigating to:', from);
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, navigate, location]);

  const handleSignIn = async (email: string, password: string, rememberMe: boolean = true) => {
    setIsLoading(true);
    console.log('[Login] handleSignIn called', { email, rememberMe });
    
    try {
      const result = await login(email, password, rememberMe);
      
      if (result.success) {
        // Get fresh user data to check onboarding status and user type
        const userData = localStorage.getItem('user_data');
        
        if (userData) {
          try {
            const user = JSON.parse(userData);
            // Staff users (created by admin) have onboardingCompleted=true from backend
            // They also have empty companyName/companyWebsite and role in industry field
            const isStaffUser = user.userType === 'RegularUser' || 
                          (!user.companyName && !user.companyWebsite && user.industry);
            
            // Store user role for access control
            if (user.industry && isStaffUser) {
              localStorage.setItem('user_role', user.industry);
            }
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }
        
        // Apply user's theme preferences immediately after login
        applyUserTheme();
        
        toast({
          title: t('toast.welcomeBack'),
          description: t('toast.loginSuccess'),
        });
        
        // Login succeeded — useEffect will handle navigation
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Invalid email or password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string, userData: any) => {
    setIsLoading(true);
    
    // Default preferences for new users
    const defaultPreferences = JSON.stringify({
      theme: 'system',
      language: 'en',
      primaryColor: 'blue',
      layoutMode: 'sidebar',
      dataView: 'table',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      currency: 'USD'
    });

    try {
      // Try to signup the user directly
      const result = await signup(email, password, {
        firstName: 'User',
        lastName: 'Name', 
        country: 'US',
        industry: 'technology',
        phoneNumber: '',
        companyName: '',
        companyWebsite: '',
        preferences: defaultPreferences
      });
      
      if (result.success) {
        // Clear admin preferences for new users too
        clearAdminPreferences();
        
        // New users always need onboarding (onboardingCompleted will be false by default)
        toast({
          title: 'Success',
          description: 'Let\'s complete your profile!',
        });
        // Navigation will be handled by useEffect
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to create account. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <AuthLayout>
      <div className="space-y-6">
        <LoginForm 
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          isLoading={isLoading} 
        />
      </div>
      
    </AuthLayout>
  );
};

export default Index;
