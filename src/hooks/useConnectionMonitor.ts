import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface ConnectionStatus {
  isOnline: boolean;
  isBackendHealthy: boolean;
  lastCheckTime: number;
  message: string;
}

const HEALTH_CHECK_INTERVAL = 30 * 1000; // 30 seconds
const HEALTH_CHECK_TIMEOUT = 10 * 1000; // 10 second timeout

/**
 * Monitors connection to backend and user's internet connection.
 * Provides early warning if deployment issues occur.
 */
export function useConnectionMonitor() {
  const { t } = useTranslation();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    isBackendHealthy: true,
    lastCheckTime: Date.now(),
    message: '',
  });
  const [showConnectionBanner, setShowConnectionBanner] = useState(false);

  const checkBackendHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

      // Use a lightweight endpoint for health checks
      const response = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      const isHealthy = response.ok;
      setConnectionStatus((prev) => ({
        ...prev,
        isBackendHealthy: isHealthy,
        lastCheckTime: Date.now(),
        message: isHealthy ? '' : t('connection.backendDown') || 'Backend unavailable',
      }));

      return isHealthy;
    } catch (error) {
      setConnectionStatus((prev) => ({
        ...prev,
        isBackendHealthy: false,
        lastCheckTime: Date.now(),
        message: t('connection.checkFailed') || 'Failed to reach backend',
      }));

      return false;
    }
  }, [t]);

  useEffect(() => {
    // Check health immediately
    checkBackendHealth();

    // Set up periodic health checks
    const healthCheckInterval = setInterval(checkBackendHealth, HEALTH_CHECK_INTERVAL);

    // Listen for online/offline events
    const handleOnline = () => {
      setConnectionStatus((prev) => ({
        ...prev,
        isOnline: true,
        message: '',
      }));
      setShowConnectionBanner(false);
      // Recheck backend when coming back online
      checkBackendHealth();
    };

    const handleOffline = () => {
      setConnectionStatus((prev) => ({
        ...prev,
        isOnline: false,
        message: t('connection.offline') || 'No internet connection',
      }));
      setShowConnectionBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show banner if connection becomes unhealthy
    const monitorConnection = setInterval(() => {
      setConnectionStatus((prev) => {
        if (!prev.isBackendHealthy && !showConnectionBanner) {
          setShowConnectionBanner(true);
        }
        return prev;
      });
    }, 5000);

    return () => {
      clearInterval(healthCheckInterval);
      clearInterval(monitorConnection);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkBackendHealth, t, showConnectionBanner]);

  return {
    ...connectionStatus,
    showConnectionBanner,
    dismissConnectionBanner: () => setShowConnectionBanner(false),
    retryConnection: checkBackendHealth,
  };
}
