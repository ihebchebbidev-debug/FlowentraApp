// Hook to determine if current user is MainAdminUser or regular user (staff)
// IMPORTANT: MainAdminUser ALWAYS has id=1 (from MainAdminUsers table)
// Users from Users table have id >= 2 and use role-based permissions

export interface UserTypeInfo {
  isMainAdminUser: boolean;
  isRegularUser: boolean;
  userId: string | null;
  userType: string | null;
  adminUserId: string | null; // The MainAdminUser who created this regular user
}

import { getAuthClaims } from '@/utils/authClaims';

export function useUserType(): UserTypeInfo {
  try {
    // JWT claims are authoritative — the id===1 heuristic below is a legacy fallback.
    const claims = getAuthClaims();
    if (claims.isMainAdmin) {
      return {
        isMainAdminUser: true,
        isRegularUser: false,
        userId: claims.userId?.toString() ?? '1',
        userType: 'MainAdminUser',
        adminUserId: null,
      };
    }
    if (claims.isRegularUser) {
      let createdBy: string | null = null;
      try {
        const raw = localStorage.getItem('user_data');
        const parsed = raw ? JSON.parse(raw) : null;
        createdBy = parsed?.createdBy?.toString() ?? parsed?.mainAdminUserId?.toString() ?? null;
      } catch { /* ignore */ }
      return {
        isMainAdminUser: false,
        isRegularUser: true,
        userId: claims.userId?.toString() ?? null,
        userType: 'RegularUser',
        adminUserId: createdBy,
      };
    }

    const userData = localStorage.getItem('user_data');
    if (!userData) {
      return {
        isMainAdminUser: false,
        isRegularUser: false,
        userId: null,
        userType: null,
        adminUserId: null
      };
    }

    const user = JSON.parse(userData);
    const userId = user.id || user.userId;
    
    // DEFINITIVE CHECK: MainAdminUser always has id=1
    // Users table entries always have id >= 2
    if (userId === 1) {
      return {
        isMainAdminUser: true,
        isRegularUser: false,
        userId: '1',
        userType: 'MainAdminUser',
        adminUserId: null
      };
    }
    
    if (userId >= 2) {
      return {
        isMainAdminUser: false,
        isRegularUser: true,
        userId: userId?.toString() || null,
        userType: 'RegularUser',
        adminUserId: user.createdBy?.toString() || user.mainAdminUserId?.toString() || null
      };
    }
    
    // FALLBACK: Use other indicators if id is not available
    const loginType = localStorage.getItem('login_type') || sessionStorage.getItem('login_type');
    
    // If user has a role field, it's a staff user
    if (user.role) {
      return {
        isMainAdminUser: false,
        isRegularUser: true,
        userId: userId?.toString() || null,
        userType: 'RegularUser',
        adminUserId: user.createdBy?.toString() || user.mainAdminUserId?.toString() || null
      };
    }
    
    const isMainAdminUser = loginType === 'admin';

    return {
      isMainAdminUser,
      isRegularUser: !isMainAdminUser,
      userId: userId?.toString() || null,
      userType: isMainAdminUser ? 'MainAdminUser' : 'RegularUser',
      adminUserId: user.createdBy?.toString() || user.mainAdminUserId?.toString() || null
    };
  } catch (error) {
    console.error('Error parsing user data:', error);
    return {
      isMainAdminUser: false,
      isRegularUser: false,
      userId: null,
      userType: null,
      adminUserId: null
    };
  }
}

// Get the current user's role (stored during login for staff users)
export function getUserRole(): string | null {
  return localStorage.getItem('user_role');
}
