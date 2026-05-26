import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, UserData } from '@/services/authService';
import { setCompanyLogo } from '@/hooks/useCompanyLogo';

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

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isMainAdmin: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  userLogin: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
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
    try {
      const {
        getCurrentTenant,
        setTenantOverrideWithoutReload,
        VIEW_ALL_SENTINEL,
      } = await import('@/utils/tenant');

      const current = getCurrentTenant();

      // If we already have a slug, validate it against the real tenant list.
      // A stale override (e.g. 'default' left from a previous session) can point
      // to an empty/non-existent tenant and cause "no data" symptoms even though
      // X-Tenant is being sent. We auto-correct here.
      if (current && current !== VIEW_ALL_SENTINEL) {
        if (isMain) {
          try {
            const { tenantsApi } = await import('@/services/api/tenantsApi');
            const tenants = await tenantsApi.list();
            const matched = tenants.find(
              (t) => t.slug?.toLowerCase() === current.toLowerCase() && t.isActive,
            );
            if (matched) return; // override is valid

            // Stale override → switch to the real default tenant (or first active)
            const fallback =
              tenants.find((t) => t.isDefault && t.isActive) ||
              tenants.find((t) => t.isActive) ||
              tenants[0];
            if (fallback) {
              console.info(
                `[Auth] Stale tenant override "${current}" → switching to "${fallback.slug}"`,
              );
              setTenantOverrideWithoutReload(fallback.slug);
              return;
            }
            // No tenants returned → fall through to view-all
            setTenantOverrideWithoutReload(VIEW_ALL_SENTINEL);
            return;
          } catch (innerErr) {
            console.warn(
              '[Auth] tenantsApi.list failed while validating override, keeping current',
              innerErr,
            );
            return; // keep whatever the user had
          }
        }
        // Non-admin: trust the slug (subdomain or env-driven)
        return;
      }

      // No tenant resolved yet.
      //
      // We deliberately DO NOT auto-pin VIEW_ALL_SENTINEL for main admins
      // anymore — leaving the tenant unset routes them through the mandatory
      // /select-company picker (RequireCompany guard) so every record they
      // create is tagged to a concrete company. They can still opt into
      // "View all companies" from the picker for audit work.
      if (isMain) {
        return;
      }

      // Regular (non-admin) user on a tenantless host (e.g. Lovable preview):
      // try to fetch the public tenant list and pin them to the default
      // company so their data loads on first login. They can switch later
      // via the TenantSwitcher (admins only) or by visiting their subdomain.
      // We DO NOT use VIEW_ALL_SENTINEL here — the backend rejects it for
      // non-MainAdmin users (403), which manifests as "no data loads".
      try {
        const { tenantsApi } = await import('@/services/api/tenantsApi');
        const tenants = await tenantsApi.list();
        const defaultTenant =
          tenants.find((t) => t.isDefault && t.isActive) ||
          tenants.find((t) => t.isActive) ||
          tenants[0];
        if (defaultTenant) {
          setTenantOverrideWithoutReload(defaultTenant.slug);
          return;
        }
      } catch {
        // tenantsApi may be admin-only; fall through to slug 'default'
      }
      // Last-resort: send slug 'default' so middleware resolves TenantId=0
      // (the legacy default bucket) instead of view-all.
      setTenantOverrideWithoutReload('default');
    } catch (e) {
      console.warn('Failed to auto-resolve default tenant', e);
    }
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
            // Sync company logo from stored user data
            setCompanyLogo(storedUser.companyLogoUrl || null);
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

  const login = async (email: string, password: string, rememberMe: boolean = true): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authService.login({ email, password, rememberMe });
      if (response.success && response.user) {
        const isMain = checkIsMainAdmin();
        // Resolve tenant override BEFORE flipping auth flags so the first
        // authenticated request from children carries the correct X-Tenant.
        await resolveDefaultTenant(isMain);
        setUser(response.user);
        setIsAuthenticated(true);
        setIsMainAdmin(isMain);
        // Sync company logo from user data
        setCompanyLogo(response.user.companyLogoUrl || null);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Login error in context:', error);
      return { success: false, message: 'Network error occurred during login' };
    }
  };

  const userLogin = async (email: string, password: string, rememberMe: boolean = true): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authService.userLogin({ email, password, rememberMe });
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        setIsMainAdmin(false); // User login = Regular user with role-based permissions
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
        setCompanyLogo(response.user.companyLogoUrl || null);
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
        setUser(response.user);
        setIsAuthenticated(true);
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
        // Sync company logo
        setCompanyLogo(merged.companyLogoUrl || null);
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