import usersData from '@/data/mock/users.json';

export interface LoginRequest {
  email: string;
  password: string;
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
  preferences?: string;
  onboardingCompleted?: boolean;
  createdAt: string;
  lastLoginAt?: string;
  role?: string;
  password?: string; // For mock purposes only
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
  preferences?: string;
  onboardingCompleted?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

class MockAuthService {
  private users: UserData[] = usersData as UserData[];

  private generateToken(): string {
    return `mock_token_${Date.now()}_${Math.random().toString(36)}`;
  }

  private generateExpirationTime(): string {
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hours from now
    return expires.toISOString();
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Accept ANY email/password combination - always successful login
    let user = this.users.find(u => u.email === data.email);
    
    if (!user) {
      // Create a new user on the fly if email doesn't exist
      user = {
        id: Math.max(...this.users.map(u => u.id)) + 1,
        email: data.email,
        firstName: 'Demo',
        lastName: 'User',
        country: 'US',
        industry: 'technology',
        onboardingCompleted: false,
        createdAt: new Date().toISOString(),
        role: 'user',
        password: data.password
      };
      this.users.push(user);
    }

    // Update last login
    user.lastLoginAt = new Date().toISOString();

    const authResponse: AuthResponse = {
      success: true,
      message: 'Login successful',
      accessToken: this.generateToken(),
      refreshToken: this.generateToken(),
      expiresAt: this.generateExpirationTime(),
      user: { ...user }
    };

    this.saveUserSession(authResponse);
    return authResponse;
  }

  async userLogin(data: LoginRequest): Promise<AuthResponse> {
    // Same as regular login for simplicity
    return this.login(data);
  }

  async signup(data: SignupRequest): Promise<AuthResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Accept ANY signup data - always successful
    // Check if user already exists, if so, just log them in
    let existingUser = this.users.find(u => u.email === data.email);
    if (existingUser) {
      // Just login the existing user
      existingUser.lastLoginAt = new Date().toISOString();
      
      const authResponse: AuthResponse = {
        success: true,
        message: 'Welcome back! Account already exists.',
        accessToken: this.generateToken(),
        refreshToken: this.generateToken(),
        expiresAt: this.generateExpirationTime(),
        user: existingUser
      };

      this.saveUserSession(authResponse);
      return authResponse;
    }

    // Create new user
    const newUser: UserData = {
      id: Math.max(...this.users.map(u => u.id)) + 1,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      country: data.country,
      industry: data.industry,
      companyName: data.companyName,
      companyWebsite: data.companyWebsite,
      preferences: data.preferences,
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
      role: 'user'
    };

    // Add to users array (in real app would save to DB)
    this.users.push(newUser);

    const authResponse: AuthResponse = {
      success: true,
      message: 'Account created successfully',
      accessToken: this.generateToken(),
      refreshToken: this.generateToken(),
      expiresAt: this.generateExpirationTime(),
      user: newUser
    };

    this.saveUserSession(authResponse);
    return authResponse;
  }

  async oAuthLogin(email: string): Promise<AuthResponse> {
    // Simulate OAuth login
    await new Promise(resolve => setTimeout(resolve, 600));

    let user = this.users.find(u => u.email === email);
    
    if (!user) {
      // Create new user from OAuth
      user = {
        id: Math.max(...this.users.map(u => u.id)) + 1,
        email: email,
        firstName: 'OAuth',
        lastName: 'User',
        country: 'US',
        industry: 'technology',
        onboardingCompleted: false,
        createdAt: new Date().toISOString(),
        role: 'user'
      };
      this.users.push(user);
    }

    user.lastLoginAt = new Date().toISOString();

    const authResponse: AuthResponse = {
      success: true,
      message: 'OAuth login successful',
      accessToken: this.generateToken(),
      refreshToken: this.generateToken(),
      expiresAt: this.generateExpirationTime(),
      user: user
    };

    this.saveUserSession(authResponse);
    return authResponse;
  }

  async refreshToken(): Promise<AuthResponse | null> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const userData = this.getCurrentUserFromStorage();
    if (!userData) return null;

    const authResponse: AuthResponse = {
      success: true,
      message: 'Token refreshed',
      accessToken: this.generateToken(),
      refreshToken: this.generateToken(),
      expiresAt: this.generateExpirationTime(),
      user: userData
    };

    this.saveUserSession(authResponse);
    return authResponse;
  }

  async getCurrentUser(): Promise<UserData | null> {
    const token = this.getAccessToken();
    if (!token) return null;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return this.getCurrentUserFromStorage();
  }

  async updateUser(data: UpdateUserRequest): Promise<AuthResponse> {
    const token = this.getAccessToken();
    const userData = this.getCurrentUserFromStorage();
    
    if (!token || !userData) {
      return { success: false, message: 'No access token or user data available' };
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update user data
    const updatedUser = { ...userData, ...data };
    this.saveUserToStorage(updatedUser);

    // Update in users array
    const userIndex = this.users.findIndex(u => u.id === userData.id);
    if (userIndex !== -1) {
      this.users[userIndex] = updatedUser;
    }

    return {
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    };
  }

  async logout(): Promise<boolean> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    this.clearUserSession();
    return true;
  }

  async checkAuthStatus(): Promise<boolean> {
    const token = this.getAccessToken();
    if (!token) return false;

    // Simulate API check
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.isAuthenticated();
  }

  async changePassword(data: ChangePasswordRequest): Promise<AuthResponse> {
    const token = this.getAccessToken();
    const userData = this.getCurrentUserFromStorage();
    
    if (!token || !userData) {
      return { success: false, message: 'No access token available' };
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Find user and check current password
    const user = this.users.find(u => u.id === userData.id);
    if (!user || user.password !== data.currentPassword) {
      return { success: false, message: 'Current password is incorrect' };
    }

    if (data.newPassword !== data.confirmPassword) {
      return { success: false, message: 'New passwords do not match' };
    }

    // Update password
    user.password = data.newPassword;

    return {
      success: true,
      message: 'Password changed successfully'
    };
  }

  async markOnboardingCompleted(): Promise<AuthResponse> {
    return this.updateUser({ onboardingCompleted: true });
  }

  // Local storage management (same as original)
  private saveUserSession(authResponse: AuthResponse): void {
    if (authResponse.accessToken) {
      localStorage.setItem('access_token', authResponse.accessToken);
    }
    if (authResponse.refreshToken) {
      localStorage.setItem('refresh_token', authResponse.refreshToken);
    }
    if (authResponse.expiresAt) {
      localStorage.setItem('token_expires_at', authResponse.expiresAt);
    }
    if (authResponse.user) {
      this.saveUserToStorage(authResponse.user);
      if (authResponse.user.onboardingCompleted) {
        localStorage.setItem('onboarding-completed', 'true');
      } else {
        localStorage.removeItem('onboarding-completed');
      }
    }
  }

  private saveUserToStorage(user: UserData): void {
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  private clearUserSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
    localStorage.removeItem('user_data');
    localStorage.removeItem('onboarding-completed');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  getCurrentUserFromStorage(): UserData | null {
    const userData = localStorage.getItem('user_data');
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
    const expiresAt = localStorage.getItem('token_expires_at');
    
    if (!token || !expiresAt) return false;
    
    try {
      const expirationDate = new Date(expiresAt);
      return expirationDate > new Date();
    } catch (error) {
      return false;
    }
  }

  isTokenExpiringSoon(): boolean {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return true;

    try {
      const expirationDate = new Date(expiresAt);
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
      return expirationDate <= fiveMinutesFromNow;
    } catch (error) {
      return true;
    }
  }
}

export const authService = new MockAuthService();
// Keep the same export name so existing imports work
export { MockAuthService as AuthService };
