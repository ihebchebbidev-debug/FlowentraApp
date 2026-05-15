import { useEffect, useState, useCallback, useRef } from 'react';
import { useIdleDetection } from './useIdleDetection';
import { saveAppState } from '@/lib/appStatePreservation';

interface SmoothUpdateState {
  isUpdateAvailable: boolean;
  isReloading: boolean;
  reloadProgress: number; // 0-100
}

const VERSION_CHECK_INTERVAL = 20 * 1000; // Check every 20 seconds (more frequent for Vercel)
const AUTO_RELOAD_DELAY = 3000; // Wait 3 seconds after idle to reload
const VERSION_CHECK_TIMEOUT = 8000; // 8 second timeout for version check

/**
 * Smooth auto-update hook that:
 * - Detects new Vercel deployments automatically
 * - Checks with aggressive cache busting
 * - Waits for idle moment to reload
 * - Shows subtle progress indicator
 * - Preserves user state across reload
 */
export function useSmoothAppUpdate() {
  const [updateState, setUpdateState] = useState<SmoothUpdateState>({
    isUpdateAvailable: false,
    isReloading: false,
    reloadProgress: 0,
  });

  const { isIdle, canSafelyReload } = useIdleDetection();
  const currentVersionRef = useRef<string | null>(null);
  const reloadScheduledRef = useRef(false);
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastCheckRef = useRef<number>(0);

  const checkVersion = useCallback(async () => {
    try {
      // Aggressive cache busting for Vercel deployments
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 9);
      const cacheBusters = `v=${timestamp}&r=${random}&t=${lastCheckRef.current}`;
      
      // Try multiple approaches to bypass caches
      const urls = [
        `/version.json?${cacheBusters}`,
        `/api/version?${cacheBusters}`, // Fallback if version.json not found
      ];

      let res: Response | null = null;
      
      for (const url of urls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), VERSION_CHECK_TIMEOUT);

          res = await fetch(url, {
            cache: 'no-store',
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Pragma': 'no-cache',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Expires': '0',
            },
          });

          clearTimeout(timeoutId);

          if (res.ok) break;
        } catch (error) {
          // Continue to next URL
          continue;
        }
      }

      if (!res || !res.ok) {
        console.debug('Version check: no response or not ok');
        return;
      }

      lastCheckRef.current = timestamp;
      const data = await res.json();
      const newVersion = data?.v;
      if (!newVersion) {
        console.debug('Version check: no version in response');
        return;
      }

      // First check - just record the version
      if (currentVersionRef.current === null) {
        currentVersionRef.current = newVersion;
        return;
      }

      // New version detected
      if (newVersion !== currentVersionRef.current) {
        console.log('🔄 New version detected:', newVersion);
        setUpdateState((prev) => ({
          ...prev,
          isUpdateAvailable: true,
        }));
      }
    } catch (error) {
      console.debug('Version check failed:', error);
    }
  }, []);

  const scheduleReload = useCallback(() => {
    if (reloadScheduledRef.current) return;

    reloadScheduledRef.current = true;
    console.log('⏳ Steady state reached, reload scheduled in 3 seconds');

    // Show progress
    setUpdateState((prev) => ({
      ...prev,
      reloadProgress: 20,
    }));

    reloadTimeoutRef.current = setTimeout(() => {
      setUpdateState((prev) => ({
        ...prev,
        isReloading: true,
        reloadProgress: 50,
      }));

      // Save state before reload
      saveAppState();

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUpdateState((prev) => {
          const newProgress = Math.min(prev.reloadProgress + 10, 90);
          if (newProgress === 90) {
            clearInterval(progressInterval);
          }
          return {
            ...prev,
            reloadProgress: newProgress,
          };
        });
      }, 100);

      // Reload after short delay
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }, AUTO_RELOAD_DELAY);
  }, []);

  // Check for version updates periodically
  useEffect(() => {
    checkVersion();
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [checkVersion]);

  // Auto-reload when update is available AND user is in idle steady state
  useEffect(() => {
    if (!updateState.isUpdateAvailable || updateState.isReloading) {
      return;
    }

    if (canSafelyReload) {
      scheduleReload();
    } else {
      // If user becomes active, cancel the reload
      reloadScheduledRef.current = false;
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
      setUpdateState((prev) => ({
        ...prev,
        reloadProgress: 0,
      }));
    }
  }, [canSafelyReload, updateState.isUpdateAvailable, updateState.isReloading, scheduleReload]);

  const cancelReload = useCallback(() => {
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }
    reloadScheduledRef.current = false;
    setUpdateState((prev) => ({
      ...prev,
      isUpdateAvailable: false,
      reloadProgress: 0,
    }));
  }, []);

  return {
    ...updateState,
    cancelReload,
  };
}
