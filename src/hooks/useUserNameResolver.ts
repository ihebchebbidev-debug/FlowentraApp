import { useState, useEffect, useCallback } from 'react';
import { getAuthHeaders } from '@/utils/apiHeaders';

import { API_URL } from '@/config/api';

interface UserNameCache {
  [userId: string]: string;
}

// Global cache to avoid re-fetching the same user names
const globalUserNameCache: UserNameCache = {};

/**
 * Hook to resolve user IDs to display names
 * - For ID = 1 (or similar admin IDs): queries MainAdminUsers table via /api/Auth/user/{id}
 * - For ID >= 2 (regular users): queries Users table via /api/Users/{id}
 */
export function useUserNameResolver() {
  const [cache, setCache] = useState<UserNameCache>({ ...globalUserNameCache });
  const [isLoading, setIsLoading] = useState(false);

  const extractName = (data: any): string | null => {
    const user = data?.data || data;
    const firstName = user?.firstName || user?.FirstName || '';
    const lastName = user?.lastName || user?.LastName || '';
    const name = `${firstName} ${lastName}`.trim();
    if (name) return name;
    if (typeof user?.name === 'string' && user.name.trim()) return user.name.trim();
    if (typeof user?.email === 'string' && user.email.trim()) return user.email.trim();
    return null;
  };

  const isNumericId = (value: string | null | undefined): boolean => {
    if (!value) return false;
    return /^\d+$/.test(value.trim());
  };

  const resolveUserName = useCallback(async (userId: string | null | undefined): Promise<string> => {
    if (!userId) return '-';
    
    const userIdStr = String(userId).trim();
    
    // If not a numeric ID, return as-is (might already be a name)
    if (!isNumericId(userIdStr)) {
      return userIdStr;
    }

    // Check cache first
    if (globalUserNameCache[userIdStr]) {
      return globalUserNameCache[userIdStr];
    }

    // Try to fetch from MainAdminUsers first (for admin users)
    try {
      const adminRes = await fetch(`${API_URL}/api/Auth/user/${userIdStr}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (adminRes.ok) {
        const data = await adminRes.json();
        const name = extractName(data);
        if (name) {
          globalUserNameCache[userIdStr] = name;
          setCache(prev => ({ ...prev, [userIdStr]: name }));
          return name;
        }
      }
    } catch {
      // Ignore and try next endpoint
    }

    // Try regular Users table
    try {
      const userRes = await fetch(`${API_URL}/api/Users/${userIdStr}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (userRes.ok) {
        const data = await userRes.json();
        const name = extractName(data);
        if (name) {
          globalUserNameCache[userIdStr] = name;
          setCache(prev => ({ ...prev, [userIdStr]: name }));
          return name;
        }
      }
    } catch {
      // Ignore
    }

    // Fallback to showing the ID
    return `User #${userIdStr}`;
  }, []);

  const resolveMultipleUserNames = useCallback(async (userIds: (string | null | undefined)[]): Promise<void> => {
    setIsLoading(true);
    const uniqueIds = [...new Set(userIds.filter(id => id && isNumericId(String(id))))];
    
    await Promise.all(
      uniqueIds.map(id => resolveUserName(id))
    );
    
    setIsLoading(false);
  }, [resolveUserName]);

  const getUserName = useCallback((userId: string | null | undefined): string => {
    if (!userId) return '-';
    const userIdStr = String(userId).trim();
    
    // If not numeric, return as-is
    if (!isNumericId(userIdStr)) {
      return userIdStr;
    }
    
    // Return from cache or placeholder
    return cache[userIdStr] || `User #${userIdStr}`;
  }, [cache]);

  return {
    resolveUserName,
    resolveMultipleUserNames,
    getUserName,
    cache,
    isLoading,
  };
}

export default useUserNameResolver;
