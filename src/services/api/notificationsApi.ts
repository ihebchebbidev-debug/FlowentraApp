// Notifications API - Backend Integration
import { apiFetch } from './apiClient';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import i18n from '@/lib/i18n';
import { translateNotificationTitle, translateNotificationDescription } from '@/utils/notificationTranslations';

export interface Notification {
  id: number;
  userId: number;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'message';
  category: 'sale' | 'offer' | 'service_order' | 'task' | 'system';
  link?: string;
  relatedEntityId?: number;
  relatedEntityType?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface DynamicNotification {
  id: string;
  backendId?: number;
  title: string;
  description: string;
  originalTitle: string;      // Keep original for re-translation
  originalDescription: string; // Keep original for re-translation
  time: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'message';
  category: 'sale' | 'offer' | 'service_order' | 'task' | 'system';
  link?: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
}

// Get current locale for date-fns
const getDateLocale = () => {
  const lang = i18n.language || 'en';
  return lang.startsWith('fr') ? fr : enUS;
};

// Format time ago string with locale support
const formatTimeAgo = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: getDateLocale() });
  } catch {
    return '';
  }
};

// Parse date safely
const parseDate = (dateString: string | undefined): Date => {
  if (!dateString) return new Date();
  try {
    return parseISO(dateString);
  } catch {
    return new Date();
  }
};

// Map backend notification to frontend format (store originals for re-translation)
const mapToFrontend = (n: Notification): DynamicNotification => ({
  id: `notification-${n.id}`,
  backendId: n.id,
  title: translateNotificationTitle(n.title),
  description: translateNotificationDescription(n.description),
  originalTitle: n.title,
  originalDescription: n.description,
  time: formatTimeAgo(n.createdAt),
  timestamp: parseDate(n.createdAt),
  read: n.isRead,
  type: n.type as DynamicNotification['type'],
  category: n.category as DynamicNotification['category'],
  link: n.link,
});

// Fetch all notifications from backend
export const fetchAllNotifications = async (): Promise<DynamicNotification[]> => {
  try {
    const response = await apiFetch<NotificationsResponse>('/api/Notifications?limit=100');
    
    if (!response.data?.notifications) {
      return [];
    }
    
    return response.data.notifications.map(mapToFrontend);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

// Get unread count
export const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await apiFetch<{ unreadCount: number }>('/api/Notifications/unread-count');
    return response.data?.unreadCount ?? 0;
  } catch {
    return 0;
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (id: number): Promise<boolean> => {
  try {
    const response = await apiFetch(`/api/Notifications/${id}/read`, {
      method: 'PATCH',
    });
    return response.status === 200;
  } catch {
    return false;
  }
};

// Mark multiple notifications as read
export const markMultipleAsRead = async (ids: number[]): Promise<boolean> => {
  try {
    const response = await apiFetch('/api/Notifications/read', {
      method: 'PATCH',
      body: JSON.stringify({ notificationIds: ids }),
    });
    return response.status === 200;
  } catch {
    return false;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  try {
    const response = await apiFetch('/api/Notifications/read-all', {
      method: 'PATCH',
    });
    return response.status === 200;
  } catch {
    return false;
  }
};

// Delete a notification
export const deleteNotification = async (id: number): Promise<boolean> => {
  try {
    const response = await apiFetch(`/api/Notifications/${id}`, {
      method: 'DELETE',
    });
    return response.status === 204 || response.status === 200;
  } catch {
    return false;
  }
};

// Create a notification (admin use)
export const createNotification = async (data: {
  userId: number;
  title: string;
  description: string;
  type?: string;
  category?: string;
  link?: string;
  relatedEntityId?: number;
  relatedEntityType?: string;
}): Promise<Notification | null> => {
  try {
    const response = await apiFetch<Notification>('/api/Notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  } catch {
    return null;
  }
};

export const notificationsApi = {
  fetchAll: fetchAllNotifications,
  getUnreadCount,
  markAsRead: markNotificationAsRead,
  markMultipleAsRead,
  markAllAsRead: markAllNotificationsAsRead,
  delete: deleteNotification,
  create: createNotification,
};
