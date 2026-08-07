// Dynamic Notifications Hook - Backend Integration with Real-time Polling
// Note: User ID 1 = MainAdminUser, User ID 2+ = Regular Users from Users table
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  notificationsApi, 
  type DynamicNotification 
} from '@/services/api/notificationsApi';
import { toast } from 'sonner';
import { translateNotificationTitle, translateNotificationDescription } from '@/utils/notificationTranslations';

interface UseNotificationsReturn {
  notifications: DynamicNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refetch: () => Promise<void>;
  hasNewNotifications: boolean;
  clearNewNotificationsFlag: () => void;
}

// Real-time polling interval (15 seconds for responsive updates)
const POLLING_INTERVAL = 15000;

export function useNotifications(autoRefresh = true, refreshInterval = POLLING_INTERVAL): UseNotificationsReturn {
  const { t } = useTranslation('dashboard');
  const [notifications, setNotifications] = useState<DynamicNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  
  // Track previous notification IDs to detect new ones
  const previousNotificationIdsRef = useRef<Set<string>>(new Set());
  const isInitialFetchRef = useRef(true);
  const lastUnreadCountRef = useRef<number>(0);

  const fetchNotifications = useCallback(async (showToast = true) => {
    try {
      // Only show loading on initial fetch
      if (isInitialFetchRef.current) {
        setLoading(true);
      }
      setError(null);
      
      const data = await notificationsApi.fetchAll();
      
      // Detect new notifications (only after initial fetch)
      if (!isInitialFetchRef.current && showToast) {
        const currentIds = new Set(data.map(n => n.id));
        const newNotifications = data.filter(
          n => !previousNotificationIdsRef.current.has(n.id) && !n.read
        );
        
        // Show toast for new unread notifications
        if (newNotifications.length > 0) {
          setHasNewNotifications(true);
          
          // Show toast for the most recent new notification
          const latestNew = newNotifications[0];
          toast.info(latestNew.title, {
            description: latestNew.description,
            duration: 5000,
            action: latestNew.link ? {
              label: t('viewNotification'),
              onClick: () => {
                window.location.href = latestNew.link!;
              }
            } : undefined,
          });
          
          // If multiple new notifications, show count
          if (newNotifications.length > 1) {
            toast.info(t('newNotificationsCount', { count: newNotifications.length }), {
              duration: 3000,
            });
          }
        }
        
        // Check if unread count increased
        const currentUnreadCount = data.filter(n => !n.read).length;
        if (currentUnreadCount > lastUnreadCountRef.current) {
          setHasNewNotifications(true);
        }
        lastUnreadCountRef.current = currentUnreadCount;
      }
      
      // Update previous IDs for next comparison
      previousNotificationIdsRef.current = new Set(data.map(n => n.id));
      
      setNotifications(data);
      isInitialFetchRef.current = false;
      
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications(false); // Don't show toast on initial load
  }, [fetchNotifications]);

  // Real-time polling with visibility API optimization
  useEffect(() => {
    if (!autoRefresh) return;
    
    let intervalId: ReturnType<typeof setInterval> | null = null;
    
    const startPolling = () => {
      // Clear existing interval
      if (intervalId) {
        clearInterval(intervalId);
      }
      // Start new polling
      intervalId = setInterval(() => {
        fetchNotifications(true);
      }, refreshInterval);
    };
    
    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
    
    // Handle visibility change - pause polling when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Fetch immediately when tab becomes visible
        fetchNotifications(true);
        startPolling();
      }
    };
    
    // Start polling
    startPolling();
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoRefresh, refreshInterval, fetchNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    // Extract backend ID from the composite ID (e.g., "notification-123" -> 123)
    const notification = notifications.find(n => n.id === id);
    if (notification?.backendId) {
      await notificationsApi.markAsRead(notification.backendId);
    }
    
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    
    // Update last unread count
    lastUnreadCountRef.current = notifications.filter(n => !n.read && n.id !== id).length;
  }, [notifications]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    await notificationsApi.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setHasNewNotifications(false);
    lastUnreadCountRef.current = 0;
  }, []);

  // Clear the new notifications flag (e.g., when user opens notification panel)
  const clearNewNotificationsFlag = useCallback(() => {
    setHasNewNotifications(false);
  }, []);

  // Re-translate notifications when language changes
  const { i18n } = useTranslation();
  const translatedNotifications = useMemo(() => {
    return notifications.map(n => ({
      ...n,
      title: translateNotificationTitle(n.originalTitle || n.title),
      description: translateNotificationDescription(n.originalDescription || n.description),
    }));
  }, [notifications, i18n.language]);

  const unreadCount = translatedNotifications.filter(n => !n.read).length;

  return {
    notifications: translatedNotifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
    hasNewNotifications,
    clearNewNotificationsFlag,
  };
}

export type { DynamicNotification };
