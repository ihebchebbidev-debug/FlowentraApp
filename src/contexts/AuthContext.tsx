import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuthClaims } from '@/utils/authClaims';
import { authService, UserData } from '@/services/authService';

interface SignupUserData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  country?: string;
  industry?: string;
  companyName?: string;
  companyWebsite?: string;
  preferences?: Record<string, unknown> | string;
}

interface TwoFactorChallengePayload {
  challengeToken: string;
  maskedEmail?: string;
  userType: 'admin' | 'user';
  rememberMe: boolean;
}

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isMainAdmin: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string; requires2FA?: boolean; challenge?: TwoFactorChallengePayload }>;
  userLogin: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string; requires2FA?: boolean; challenge?: TwoFactorChallengePayload }>;
  oAuthLogin: (email: string, oauthData?: { firstName?: string; lastName?: string; provider?: string; profilePictureUrl?: string }) => Promise<{ success: boolean; message?: string; user?: UserData }>;
  signup: (email: string, password: string, userData: SignupUserData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<UserData>) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMainAdmin, setIsMainAdmin] = useState(false);

  // Helper to check if current user is MainAdmin
  // IMPORTANT: MainAdminUser ALWAYS has id=1 (from MainAdminUsers table)
  // Users from Users table have id >= 2 and use role-based permissions
  const checkIsMainAdmin = (): boolean => {
    // JWT claims are authoritative (UserType / login_type).
    const claims = getAuthClaims();
    if (claims.isMainAdmin) return true;
    if (claims.isRegularUser) return false;

    const storedUser = authService.getCurrentUserFromStorage();
    if (!storedUser) return false;
    
    // DEFINITIVE CHECK: MainAdminUser always has id=1
    if (storedUser.id === 1) return true;
    if (storedUser.id >= 2) return false;
    
    // Fallback: check login_type
    const loginType = localStorage.getItem('login_type') || sessionStorage.getItem('login_type');
    return loginType === 'admin';
  };

  const resolveDefaultTenant = async (isMain: boolean) => {
    const { bootstrapActiveCompany } = await import('@/utils/bootstrapCompany');
    await bootstrapActiveCompany(isMain);
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      try {
        // Check if user is authenticated
        if (authService.isAuthenticated()) {
          // Try to get user from storage first
          const storedUser = authService.getCurrentUserFromStorage();
          if (storedUser) {
            setUser(storedUser);
            setIsAuthenticated(true);
            setIsMainAdmin(checkIsMainAdmin());
          }

          // Verify with server and refresh if needed
          if (authService.isTokenExpiringSoon()) {
            const refreshResult = await authService.refreshToken();
            if (refreshResult?.user) {
              // Merge server data with stored data to preserve fields the server may not return
              const merged = { ...storedUser, ...refreshResult.user };
              authService.saveUserToStoragePublic(merged);
              const isMain = checkIsMainAdmin();
              // Resolve/validate tenant FIRST so the first authenticated request
              // children fire already carries the correct X-Tenant header.
              await resolveDefaultTenant(isMain);
              setUser(merged);
              setIsAuthenticated(true);
              setIsMainAdmin(isMain);
            } else {
              // Refresh failed, clear auth state
              setUser(null);
              setIsAuthenticated(false);
              setIsMainAdmin(false);
            }
          } else {
            // Token is still valid, verify with server
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
              // Merge server data with stored data to preserve fields like companyWebsite, profilePictureUrl
              const merged = { ...storedUser, ...currentUser };
              authService.saveUserToStoragePublic(merged);
              const isMain = checkIsMainAdmin();
              await resolveDefaultTenant(isMain);
              setUser(merged);
              setIsAuthenticated(true);
              setIsMainAdmin(isMain);
            } else {
              // Server verification failed
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        } else {
              setUser(null);
              setIsAuthenticated(false);
              setIsMainAdmin(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setIsAuthenticated(false);
        setIsMainAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Listen for session expired events from API client
  useEffect(() => {
    const handleSessionExpired = () => {
      console.log('Session expired event received, logging out...');
      setUser(null);
      setIsAuthenticated(false);
      setIsMainAdmin(false);
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  // Sync offline hydration module preferences from API (per user / tenant)
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    import("@/services/offline/offlineHydrationPreferences")
      .then((m) => m.syncHydrationPreferencesFromServer())
      .catch(() => {
        /* keep local cache */
      })
      .finally(() => {
        if (!cancelled) {
          window.dispatchEvent(new CustomEvent("offline:hydration-prefs-updated"));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Auto refresh token before expiry
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      if (authService.isTokenExpiringSoon()) {
        try {
          const refreshResult = await authService.refreshToken();
          if (refreshResult?.user) {
            setUser(refreshResult.user);
          } else {
            // Refresh failed, logout
            await logout();
          }
        } catch (error) {
          console.error('Token refresh error:', error);
          await logout();
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      const response = await authService.login({ email, password, rememberMe });
      if (response.requires2FA && response.challengeToken) {
        return {
          success: false,
          requires2FA: true,
          challenge: {
            challengeToken: response.challengeToken,
            maskedEmail: response.maskedEmail,
            userType: response.challengeUserType || 'admin',
            rememberMe,
          },
        };
      }
      if (response.success && response.user) {
        const isMain = checkIsMainAdmin();
        await resolveDefaultTenant(isMain);
        setUser(response.user);
        setIsAuthenticated(true);
        setIsMainAdmin(isMain);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Login error in context:', error);
      return { success: false, message: 'Network error occurred during login' };
    }
  };

  const userLogin = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      const response = await authService.userLogin({ email, password, rememberMe });
      if (response.requires2FA && response.challengeToken) {
        return {
          success: false,
          requires2FA: true,
          challenge: {
            challengeToken: response.challengeToken,
            maskedEmail: response.maskedEmail,
            userType: response.challengeUserType || 'user',
            rememberMe,
          },
        };
      }
      if (response.success && response.user) {
        await resolveDefaultTenant(false);
        setUser(response.user);
        setIsAuthenticated(true);
        setIsMainAdmin(false);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('User login error in context:', error);
      return { success: false, message: 'Network error occurred during user login' };
    }
  };


  const oAuthLogin = async (email: string, oauthData?: { firstName?: string; lastName?: string; provider?: string; profilePictureUrl?: string }): Promise<{ success: boolean; message?: string; user?: UserData }> => {
    try {
      const response = await authService.oAuthLogin(email, oauthData);
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        const isMain = checkIsMainAdmin();
        setIsMainAdmin(isMain);
        await resolveDefaultTenant(isMain);
        return { success: true, user: response.user };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('OAuth login error in context:', error);
      return { success: false, message: 'Network error occurred during OAuth login' };
    }
  };

  const signup = async (email: string, password: string, userData: SignupUserData): Promise<{ success: boolean; message?: string }> => {
    try {
      const signupData = {
        email,
        password,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phoneNumber: userData.phoneNumber,
        country: userData.country || '',
        industry: userData.industry || '',
        companyName: userData.companyName,
        companyWebsite: userData.companyWebsite,
        preferences: userData.preferences ? JSON.stringify(userData.preferences) : undefined
      };

      const response = await authService.signup(signupData);
      if (response.success && response.user) {
        authService.saveUserToStoragePublic(response.user);
        const isMain = checkIsMainAdmin();
        setUser(response.user);
        setIsAuthenticated(true);
        setIsMainAdmin(isMain);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Signup error in context:', error);
      return { success: false, message: 'Network error occurred during signup' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsMainAdmin(false);
      import("@/services/offline/offlineHydrationPreferences").then((m) => m.clearHydrationPreferencesMemory());
      import("@/modules/reporting/store/useReportFiltersStore").then((m) => m.clearAllReportFilters()).catch(() => {});
    }
  };

  const updateUser = async (userData: Partial<UserData>): Promise<boolean> => {
    try {
      const response = await authService.updateUser(userData);
      if (response.success && response.user) {
        setUser(response.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update user error in context:', error);
      return false;
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (!isAuthenticated) return;

    try {
      const storedUser = authService.getCurrentUserFromStorage();
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        // Merge server data with stored data to preserve fields the server may not return
        const merged = { ...storedUser, ...currentUser };
        authService.saveUserToStoragePublic(merged);
        setUser(merged);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isMainAdmin,
    login,
    userLogin,
    oAuthLogin,
    signup,
    logout,
    updateUser,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};