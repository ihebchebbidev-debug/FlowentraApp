import { logger } from '@/hooks/useLogger';
import { getCurrentTenant, TENANT_HEADER } from '@/utils/tenant';
import { API_URL } from '@/config/api';
import { dedupFetch } from '@/utils/requestDedup';
import { clearHydrationPreferencesMemory } from '@/services/offline/offlineHydrationPreferences';

type AdminPrefs = {
  theme?: string;
  language?: string;
  primaryColor?: string;
};

function safeJsonParse<T = any>(value: unknown): T | null {
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Backend responses vary between environments and may use PascalCase or camelCase.
 * This extracts (theme/language/primaryColor) from any known field.
 */
function extractAdminPreferences(payload: any): AdminPrefs | undefined {
  // Check both camelCase and PascalCase variants
  const candidates: unknown[] = [
    payload?.adminPreferences,
    payload?.AdminPreferences,
    payload?.adminPreferencesJson,
    payload?.AdminPreferencesJson,
    payload?.preferences,
    payload?.Preferences,
    payload?.preferencesJson,
    payload?.PreferencesJson,
    payload?.admin?.preferences,
    payload?.admin?.Preferences,
    payload?.admin?.preferencesJson,
    payload?.admin?.PreferencesJson,
    payload?.mainAdmin?.preferences,
    payload?.mainAdmin?.Preferences,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    // Already an object - check both camelCase and PascalCase property names
    if (typeof candidate === 'object') {
      const theme = (candidate as any).theme ?? (candidate as any).Theme;
      const language = (candidate as any).language ?? (candidate as any).Language;
      const primaryColor = (candidate as any).primaryColor ?? (candidate as any).PrimaryColor;
      if (theme || language || primaryColor) return { theme, language, primaryColor };
      continue;
    }

    // JSON string
    const parsed = safeJsonParse<any>(candidate);
    if (parsed) {
      const theme = parsed.theme ?? parsed.Theme;
      const language = parsed.language ?? parsed.Language;
      const primaryColor = parsed.primaryColor ?? parsed.PrimaryColor;
      if (theme || language || primaryColor) return { theme, language, primaryColor };
    }
  }

  return undefined;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  country: string;
  industry: string;
  companyName?: string;
  companyWebsite?: string;
  preferences?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  user?: UserData;
}

export interface UserData {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  country: string;
  industry: string;
  companyName?: string;
  companyWebsite?: string;
  companyLogoUrl?: string;
  profilePictureUrl?: string;
  preferences?: string;
  onboardingCompleted?: boolean;
  createdAt: string;
  lastLoginAt?: string;
  // Staff user fields
  role?: string;
  userType?: 'Admin' | 'RegularUser';
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  country?: string;
  industry?: string;
  companyName?: string;
  companyWebsite?: string;
  companyLogoUrl?: string;
  profilePictureUrl?: string;
  preferences?: string;
  onboardingCompleted?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Password Reset Interfaces
export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otpCode: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  resetToken?: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

class AuthService {
  private baseUrl = `${API_URL}/api/Auth`;
  private useLocalStorage = true; // Default to persistent storage

  /** Build headers with optional auth token + X-Tenant */
  private buildHeaders(includeAuth = false): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const tenant = getCurrentTenant();
    if (tenant) headers[TENANT_HEADER] = tenant;
    if (includeAuth) {
      const token = this.getAccessToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Check if an admin user already exists (determines if signup is allowed)
  // Also returns admin preferences for theming the login page
  async checkAdminExists(): Promise<{ 
    adminExists: boolean; 
    signupAllowed: boolean; 
    message: string;
    adminPreferences?: {
      theme?: string;
      language?: string;
      primaryColor?: string;
    };
    companyLogoUrl?: string;
  }> {
    try {
      const response = await dedupFetch(`${this.baseUrl}/admin-exists`, {
        method: 'GET',
        headers: this.buildHeaders(),
      });

      if (response.ok) {
        const data = await response.json();

        // Normalize admin preferences regardless of backend field naming
        const extracted = extractAdminPreferences(data);
        if (extracted) {
          data.adminPreferences = extracted;
        }
        
        return data;
      }
      
      // Default to allowing signup if endpoint fails
      return { adminExists: false, signupAllowed: true, message: 'Unable to check admin status' };
    } catch (error) {
      console.error('Check admin exists error:', error);
      // Default to allowing signup if network error
      return { adminExists: false, signupAllowed: true, message: 'Network error checking admin status' };
    }
  }


  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Set storage mode based on rememberMe flag
      this.useLocalStorage = data.rememberMe !== false; // Default to true
      this.saveStoragePreference(this.useLocalStorage);
      
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        this.saveUserSession(result, this.useLocalStorage, 'admin');
        // Mark as MainAdmin user
        logger.success(
          `Admin login successful: ${data.email}`,
          'Auth',
          'other',
          { entityType: 'User', entityId: result.user?.id?.toString(), details: `Email: ${data.email}` }
        );
      } else {
        // Log failed login attempt
        logger.warning(
          `Login failed for ${data.email}: ${result.message}`,
          'Auth',
          'other',
          { details: result.message }
        );
      }

      // Return the actual backend response (success or failure)
      return result;
    } catch (error) {
      console.error('Login error:', error);
      logger.error(
        `Login error for ${data.email}: Network error`,
        'Auth',
        'other',
        { details: (error as Error).message }
      );
      return {
        success: false,
        message: 'Network error occurred during login',
      };
    }
  }

  async userLogin(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Set storage mode based on rememberMe flag
      this.useLocalStorage = data.rememberMe !== false; // Default to true
      this.saveStoragePreference(this.useLocalStorage);
      
      const response = await fetch(`${this.baseUrl}/user-login`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        this.saveUserSession(result, this.useLocalStorage, 'user');
        // Log successful user login
        logger.success(
          `User login successful: ${data.email}`,
          'Auth',
          'other',
          { entityType: 'User', entityId: result.user?.id?.toString(), details: `Email: ${data.email}` }
        );
      } else {
        // Log failed user login attempt
        logger.warning(
          `User login failed for ${data.email}: ${result.message}`,
          'Auth',
          'other',
          { details: result.message }
        );
      }

      // Return the actual backend response (success or failure)
      return result;
    } catch (error) {
      console.error('User login error:', error);
      logger.error(
        `User login error for ${data.email}: Network error`,
        'Auth',
        'other',
        { details: (error as Error).message }
      );
      return {
        success: false,
        message: 'Network error occurred during user login',
      };
    }
  }

  async signup(data: SignupRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/signup`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        this.saveUserSession(result);
        // Log successful signup
        logger.success(
          `New admin account created: ${data.email}`,
          'Auth',
          'create',
          { entityType: 'User', entityId: result.user?.id?.toString(), details: `Company: ${data.companyName || 'N/A'}` }
        );
      } else {
        // Log failed signup
        logger.warning(
          `Signup failed for ${data.email}: ${result.message}`,
          'Auth',
          'create',
          { details: result.message }
        );
      }

      return result;
    } catch (error) {
      console.error('Signup error:', error);
      logger.error(
        `Signup error for ${data.email}: Network error`,
        'Auth',
        'create',
        { details: (error as Error).message }
      );
      return {
        success: false,
        message: 'Network error occurred during signup',
      };
    }
  }

  async oAuthLogin(email: string, oauthData?: { firstName?: string; lastName?: string; provider?: string; profilePictureUrl?: string }): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth-login`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({ email, ...oauthData }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        this.saveUserSession(result);
        // Log successful OAuth login
        logger.success(
          `OAuth login successful: ${email}`,
          'Auth',
          'other',
          { entityType: 'User', entityId: result.user?.id?.toString(), details: 'OAuth provider login' }
        );
      } else {
        logger.warning(
          `OAuth login failed for ${email}: ${result.message}`,
          'Auth',
          'other',
          { details: result.message }
        );
      }

      return result;
    } catch (error) {
      console.error('OAuth login error:', error);
      logger.error(
        `OAuth login error for ${email}: Network error`,
        'Auth',
        'other',
        { details: (error as Error).message }
      );
      return {
        success: false,
        message: 'Network error occurred during OAuth login',
      };
    }
  }

  async refreshToken(): Promise<AuthResponse | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({ refreshToken }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        this.saveUserSession(result);
        return result;
      } else {
        this.clearUserSession();
        return null;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearUserSession();
      return null;
    }
  }

  async getCurrentUser(): Promise<UserData | null> {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        method: 'GET',
        headers: this.buildHeaders(true),
      });

      if (response.ok) {
        return await response.json();
      } else if (response.status === 401) {
        // Token expired, try to refresh
        const refreshResult = await this.refreshToken();
        if (refreshResult?.success) {
          // Retry with new token
          return this.getCurrentUser();
        }
      }
      
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async updateUser(data: UpdateUserRequest): Promise<AuthResponse> {
    const token = this.getAccessToken();
    const userData = this.getCurrentUserFromStorage();
    
    if (!token || !userData) {
      return { success: false, message: 'No access token or user data available' };
    }

    try {
      const url = `${this.baseUrl}/user/${userData.id}`;
      const body = JSON.stringify(data);
      console.log('[AuthService.updateUser] PUT', url, 'body:', body);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.buildHeaders(true),
        body,
      });

      const result = await response.json();
      console.log('[AuthService.updateUser] Response status:', response.status, 'result:', JSON.stringify(result));
      
      if (response.ok && result.success) {
        // Update stored user data
        const currentUser = this.getCurrentUserFromStorage();
        if (currentUser && result.user) {
          this.saveUserToStorage({ ...currentUser, ...result.user });
        }
      } else {
        console.warn('[AuthService.updateUser] Update failed:', result.message);
      }

      return result;
    } catch (error) {
      console.error('Update user error:', error);
      return {
        success: false,
        message: 'Network error occurred during user update',
      };
    }
  }

  async logout(): Promise<boolean> {
    const token = this.getAccessToken();
    const userData = this.getCurrentUserFromStorage();
    
    try {
      if (token) {
        await fetch(`${this.baseUrl}/logout`, {
          method: 'POST',
          headers: this.buildHeaders(true),
        });
      }
      
      // Log successful logout
      logger.info(
        `User logged out: ${userData?.email || 'Unknown'}`,
        'Auth',
        'other',
        { entityType: 'User', entityId: userData?.id?.toString() }
      );
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearUserSession();
    }
    
    return true;
  }

  async checkAuthStatus(): Promise<boolean> {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'GET',
        headers: this.buildHeaders(true),
      });

      return response.ok;
    } catch (error) {
      console.error('Auth status check error:', error);
      return false;
    }
  }

  // Storage preference management
  private saveStoragePreference(useLocal: boolean): void {
    // Always use localStorage to save the preference itself
    localStorage.setItem('auth_storage_type', useLocal ? 'local' : 'session');
  }

  private getStoragePreference(): boolean {
    const stored = localStorage.getItem('auth_storage_type');
    return stored !== 'session'; // Default to localStorage
  }

  private getStorage(): Storage {
    return this.useLocalStorage ? localStorage : sessionStorage;
  }

  // Local storage management
  private saveUserSession(authResponse: AuthResponse, persistent: boolean = true, loginType: 'admin' | 'user' = 'user'): void {
    this.useLocalStorage = persistent;
    const storage = this.getStorage();
    
    // Save login type to differentiate MainAdminUser vs regular User
    // IMPORTANT: Some backends may authenticate a staff "Users" table account
    // via the admin login endpoint. In that case, the response will include a
    // staff role (e.g. "Administrator"). Those users must NOT be treated as
    // MainAdmin (no bypass) even if loginType was passed as 'admin'.
    let effectiveLoginType: 'admin' | 'user' = loginType;
    const userRole = (authResponse.user as any)?.role;
    if (effectiveLoginType === 'admin' && userRole) {
      effectiveLoginType = 'user';
    }
    storage.setItem('login_type', effectiveLoginType);
    
    if (authResponse.accessToken) {
      storage.setItem('access_token', authResponse.accessToken);
    }
    if (authResponse.refreshToken) {
      storage.setItem('refresh_token', authResponse.refreshToken);
    }
    // Session expiry is disabled on the client — always pin a far-future
    // expiration regardless of `rememberMe` or what the server returned, so
    // both regular users and admins stay signed in until they explicitly
    // log out. The actual server token can still be refreshed transparently
    // via the 401 handler in apiClient.
    {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 10);
      storage.setItem('token_expires_at', farFuture.toISOString());
    }
    
    // Do not guess a tenant override from the email/domain.
    // Base/original system scope must remain tenantless unless the user
    // explicitly switches to a company.
    
    if (authResponse.user) {
      this.saveUserToStorage(authResponse.user);
      // Update onboarding completion status based on server data
      if (authResponse.user.onboardingCompleted) {
        storage.setItem('onboarding-completed', 'true');
      } else {
        storage.removeItem('onboarding-completed');
      }
      
      // Also save preferences from PreferencesJson if available
      if (authResponse.user.preferences) {
        try {
          const prefs = typeof authResponse.user.preferences === 'string'
            ? JSON.parse(authResponse.user.preferences)
            : authResponse.user.preferences;
          storage.setItem('user-preferences', JSON.stringify(prefs));
        } catch (error) {
          console.error('Error parsing user preferences:', error);
        }
      }
    }
  }

  saveUserToStoragePublic(user: UserData): void {
    this.saveUserToStorage(user);
  }

  private saveUserToStorage(user: UserData): void {
    const storage = this.getStorage();
    storage.setItem('user_data', JSON.stringify(user));
    // Logo is managed by TenantMapContext (active-company-aware fallback logic).
    // Do NOT write company-logo here — it would override the selected company's
    // logo on every token refresh with the MainAdminUser's personal logo.
  }

  private clearUserSession(): void {
    const keys = [
      'access_token', 'refresh_token', 'token_expires_at', 'user_data',
      'onboarding-completed', 'auth_storage_type', 'login_type',
      // HR module — sensitive payroll/bonus data must not persist between sessions
      'hr_payroll_draft_runs_v1', 'hr_bonuses_v1', 'hr_cnss_rates_v1',
      'hr_departments_v1', 'hr_public_holidays_v1',
      // Workflow definitions
      'lovable-workflows',
    ];
    keys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    // Clear tenant-scoped HR keys and dynamic employee document keys from both storages
    const matchesHrPattern = (key: string) =>
      /^t:[^:]+:hr_/.test(key) || key.includes('hr_docs_') || key.includes(':hr_docs_');

    const lsRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && matchesHrPattern(key)) lsRemove.push(key);
    }
    lsRemove.forEach(key => localStorage.removeItem(key));

    const ssRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && matchesHrPattern(key)) ssRemove.push(key);
    }
    ssRemove.forEach(key => sessionStorage.removeItem(key));

    // Flush in-memory hydration preferences cache so next user starts clean
    clearHydrationPreferencesMemory();
  }

  getAccessToken(): string | null {
    // Check localStorage first (persistent), then sessionStorage
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
  }

  getCurrentUserFromStorage(): UserData | null {
    const userData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data from storage:', error);
        return null;
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    // Client-side session never expires — presence of an access token is
    // sufficient. The server still controls real authorization on each call.
    return !!token;
  }

  isTokenExpiringSoon(): boolean {
    // Disabled — the auto-refresh interval relies on this; returning false
    // prevents the periodic refresh loop from forcing a logout.
    return false;
  }

  async changePassword(data: ChangePasswordRequest): Promise<AuthResponse> {
    const token = this.getAccessToken();
    
    if (!token) {
      return { success: false, message: 'No access token available' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/change-password`, {
        method: 'POST',
        headers: this.buildHeaders(true),
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Network error occurred during password change',
      };
    }
  }

  async markOnboardingCompleted(): Promise<AuthResponse> {
    return this.updateUser({ onboardingCompleted: true });
  }

  // Password Reset Methods

  /**
   * Initiates password reset by sending OTP to email
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/forgot-password`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: 'Network error occurred during password reset request',
      };
    }
  }

  /**
   * Check if email exists in the system
   */
  async checkEmailExists(email: string): Promise<{ exists: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/check-email-exists`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Check email exists error:', error);
      return { exists: false, message: 'Network error occurred' };
    }
  }

  /**
   * Verifies OTP code and returns reset token
   */
  async verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/verify-otp`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Verify OTP error:', error);
      return {
        success: false,
        message: 'Network error occurred during OTP verification',
      };
    }
  }

  /**
   * Resets password with valid reset token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/reset-password`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'Network error occurred during password reset',
      };
    }
  }
}

export const authService = new AuthService();