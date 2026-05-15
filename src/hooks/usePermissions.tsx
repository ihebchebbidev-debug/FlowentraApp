import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { permissionsApi } from "@/services/api/permissionsApi";
import { 
  RolePermission, 
  PermissionModule, 
  PermissionAction,
  hasPermissionFromStrings,
  stringsToRolePermissions
} from "@/types/permissions";

interface UsePermissionsReturn {
  permissions: RolePermission[];
  permissionStrings: string[];
  isLoading: boolean;
  error: Error | null;
  isMainAdmin: boolean;
  hasPermission: (module: PermissionModule, action: PermissionAction) => boolean;
  hasAnyPermission: (module: PermissionModule, actions: PermissionAction[]) => boolean;
  hasAllPermissions: (module: PermissionModule, actions: PermissionAction[]) => boolean;
  canCreate: (module: PermissionModule) => boolean;
  canRead: (module: PermissionModule) => boolean;
  canUpdate: (module: PermissionModule) => boolean;
  canDelete: (module: PermissionModule) => boolean;
  canExport: (module: PermissionModule) => boolean;
  canImport: (module: PermissionModule) => boolean;
  canAssign: (module: PermissionModule) => boolean;
  canApprove: (module: PermissionModule) => boolean;
  refetch: () => void;
}

interface StoredUserData {
  id?: number;
  userId?: number;
  userType?: 'Admin' | 'RegularUser' | 'MainAdmin';
  isMainAdmin?: boolean;
  role?: string;
}

// Get user data from localStorage (set during login)
function getCurrentUserData(): StoredUserData | null {
  // Check user_data first (main storage key)
  const userDataStr = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
  if (userDataStr) {
    try {
      return JSON.parse(userDataStr);
    } catch {
      // Continue to fallback
    }
  }
  
  // Fallback to user key
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
}

// Check if user is MainAdminUser (bypasses all permissions)
// IMPORTANT: MainAdminUser ALWAYS has id=1 (from MainAdminUsers table)
// Users from Users table have id >= 2 and use role-based permissions
function checkIsMainAdmin(): boolean {
  const userData = getCurrentUserData();
  if (!userData) return false;
  
  const userId = userData.id || userData.userId;
  
  // DEFINITIVE CHECK: MainAdminUser always has id=1
  // Users table entries always have id >= 2
  if (userId === 1) return true;
  if (userId && userId >= 2) return false;
  
  // Fallback checks if id is not available
  const loginType = localStorage.getItem('login_type') || sessionStorage.getItem('login_type');
  
  // If user has a role field, it's a staff user from Users table
  if ((userData as any).role) return false;
  
  // Check login_type
  if (loginType === 'user') return false;
  if (loginType === 'admin') return true;
  
  // Check explicit flags
  if (userData.isMainAdmin === true) return true;
  if (userData.userType === 'MainAdmin') return true;
  
  return false;
}

function getCurrentUserId(): number | null {
  const userData = getCurrentUserData();
  if (userData) {
    return userData.id || userData.userId || null;
  }
  return null;
}

// Permission polling interval (30 seconds for responsive updates when permissions change)
const PERMISSION_POLLING_INTERVAL = 30 * 1000;

// Event name for cross-tab permission invalidation
const PERMISSION_INVALIDATION_EVENT = 'permissions-invalidated';

export function usePermissions(): UsePermissionsReturn {
  const userId = getCurrentUserId();
  // Re-evaluate when userId changes (e.g. after OAuth login sets user_data)
  const isMainAdmin = useMemo(() => checkIsMainAdmin(), [userId]);
  
  const { 
    data: permissionStrings = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['myPermissions', userId],
    queryFn: () => {
      // MainAdmin users bypass permission checks - no need to fetch
      if (isMainAdmin) return Promise.resolve([]);
      if (!userId) return Promise.resolve([]);
      return permissionsApi.getMyPermissions(userId);
    },
    staleTime: 30 * 1000, // 30 seconds - shorter to catch permission changes faster
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId && !isMainAdmin,
    refetchInterval: PERMISSION_POLLING_INTERVAL, // Poll every 30 seconds
    refetchIntervalInBackground: false, // Don't poll when tab is hidden
    refetchOnWindowFocus: true, // Refetch when tab becomes active
  });

  // Listen for permission invalidation events from other tabs or from admin actions
  useEffect(() => {
    if (isMainAdmin) return;

    const handlePermissionInvalidation = (event: StorageEvent) => {
      if (event.key === PERMISSION_INVALIDATION_EVENT) {
        console.log('[Permissions] Received invalidation event, refetching...');
        refetch();
      }
    };

    // Listen for cross-tab permission changes via localStorage
    window.addEventListener('storage', handlePermissionInvalidation);

    // Listen for custom permission update events (from same tab)
    const handleLocalInvalidation = () => {
      console.log('[Permissions] Local invalidation event, refetching...');
      refetch();
    };
    window.addEventListener(PERMISSION_INVALIDATION_EVENT, handleLocalInvalidation);

    return () => {
      window.removeEventListener('storage', handlePermissionInvalidation);
      window.removeEventListener(PERMISSION_INVALIDATION_EVENT, handleLocalInvalidation);
    };
  }, [isMainAdmin, refetch]);

  // Convert string permissions to RolePermission objects for compatibility
  const permissions = useMemo(
    () => stringsToRolePermissions(permissionStrings, userId || 0),
    [permissionStrings, userId]
  );

  // Check if user has a specific permission
  const hasPermission = useCallback(
    (module: PermissionModule, action: PermissionAction): boolean => {
      // MainAdmin bypasses all permission checks
      if (isMainAdmin) return true;
      
      // If no user ID, deny access (unless in development)
      if (!userId) {
        // In development, you might want to allow access
        // return process.env.NODE_ENV === 'development';
        return false;
      }
      
      // If permissions are still loading, deny for safety
      if (isLoading) return false;
      
      // If no permissions loaded for a regular user, deny access
      if (permissionStrings.length === 0) return false;
      
      return hasPermissionFromStrings(permissionStrings, module, action);
    },
    [permissionStrings, userId, isMainAdmin, isLoading]
  );

  // Check if user has any of the specified permissions for a module
  const hasAnyPermission = useCallback(
    (module: PermissionModule, actions: PermissionAction[]): boolean => {
      if (isMainAdmin) return true;
      if (!userId || isLoading) return false;
      if (permissionStrings.length === 0) return false;
      return actions.some(action => hasPermissionFromStrings(permissionStrings, module, action));
    },
    [permissionStrings, userId, isMainAdmin, isLoading]
  );

  // Check if user has all of the specified permissions for a module
  const hasAllPermissions = useCallback(
    (module: PermissionModule, actions: PermissionAction[]): boolean => {
      if (isMainAdmin) return true;
      if (!userId || isLoading) return false;
      if (permissionStrings.length === 0) return false;
      return actions.every(action => hasPermissionFromStrings(permissionStrings, module, action));
    },
    [permissionStrings, userId, isMainAdmin, isLoading]
  );

  // Convenience methods for common CRUD operations
  const canCreate = useCallback(
    (module: PermissionModule) => hasPermission(module, 'create'),
    [hasPermission]
  );

  const canRead = useCallback(
    (module: PermissionModule) => hasPermission(module, 'read'),
    [hasPermission]
  );

  const canUpdate = useCallback(
    (module: PermissionModule) => hasPermission(module, 'update'),
    [hasPermission]
  );

  const canDelete = useCallback(
    (module: PermissionModule) => hasPermission(module, 'delete'),
    [hasPermission]
  );

  const canExport = useCallback(
    (module: PermissionModule) => hasPermission(module, 'export'),
    [hasPermission]
  );

  const canImport = useCallback(
    (module: PermissionModule) => hasPermission(module, 'import'),
    [hasPermission]
  );

  const canAssign = useCallback(
    (module: PermissionModule) => hasPermission(module, 'assign'),
    [hasPermission]
  );

  const canApprove = useCallback(
    (module: PermissionModule) => hasPermission(module, 'approve'),
    [hasPermission]
  );

  return {
    permissions,
    permissionStrings,
    isLoading,
    error: error as Error | null,
    isMainAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canExport,
    canImport,
    canAssign,
    canApprove,
    refetch,
  };
}

// Component wrapper for conditional rendering based on permissions
interface PermissionGateProps {
  module: PermissionModule;
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ 
  module, 
  action, 
  children, 
  fallback = null 
}: PermissionGateProps): React.ReactNode {
  const { hasPermission, isLoading, isMainAdmin } = usePermissions();

  // MainAdmin always has access
  if (isMainAdmin) return children;
  
  if (isLoading) return null;
  
  if (hasPermission(module, action)) {
    return children;
  }

  return fallback;
}

// HOC for wrapping components with permission checks
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  module: PermissionModule,
  action: PermissionAction,
  FallbackComponent?: React.ComponentType
) {
  return function PermissionWrappedComponent(props: P): React.ReactNode {
    const { hasPermission, isLoading, isMainAdmin } = usePermissions();

    // MainAdmin always has access
    if (isMainAdmin) return <WrappedComponent {...props} />;
    
    if (isLoading) return null;
    
    if (!hasPermission(module, action)) {
      return FallbackComponent ? <FallbackComponent /> : null;
    }

    return <WrappedComponent {...props} />;
  };
}

export default usePermissions;
