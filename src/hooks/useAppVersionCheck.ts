import { useEffect, useRef, useState, useCallback } from 'react';

const POLL_INTERVAL = 60 * 1000; // 1 minute (more frequent than before)
const AGGRESSIVE_POLL_INTERVAL = 10 * 1000; // 10 seconds after tab visibility

interface VersionCheckState {
  isUpdateAvailable: boolean;
  currentVersion: string | null;
  newVersion: string | null;
}

/**
 * Enhanced version check that:
 * - Polls /version.json frequently to detect new deployments
 * - Returns state instead of just showing toasts
 * - Automatically checks when tab becomes visible
 * - Supports manual refresh calls
 */
export function useAppVersionCheck() {
  const [versionState, setVersionState] = useState<VersionCheckState>({
    isUpdateAvailable: false,
    currentVersion: null,
    newVersion: null,
  });
  const checkCountRef = useRef(0);
  const lastCheckTimeRef = useRef(0);

  const checkVersion = useCallback(async () => {
    try {
      // Prevent too frequent checks (less than 2 seconds apart)
      const now = Date.now();
      if (now - lastCheckTimeRef.current < 2000) {
        return;
      }
      lastCheckTimeRef.current = now;

      const res = await fetch(`/version.json?t=${Date.now()}&check=${++checkCountRef.current}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      const newVersion = data?.v;
      if (!newVersion) return;

      setVersionState((prev) => {
        // First check - set as current version
        if (prev.currentVersion === null) {
          return {
            ...prev,
            currentVersion: newVersion,
          };
        }

        // Subsequent checks - detect changes
        if (newVersion !== prev.currentVersion) {
          return {
            currentVersion: prev.currentVersion,
            newVersion: newVersion,
            isUpdateAvailable: true,
          };
        }

        return prev;
      });
    } catch (error) {
      // Log but don't crash on version check failure
      console.debug('Version check failed:', error);
    }
  }, []);

  const refreshApp = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    // Check version immediately
    checkVersion();

    // Set up periodic checks
    const interval = setInterval(checkVersion, POLL_INTERVAL);

    // Handle tab visibility changes
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkVersion]);

  return {
    ...versionState,
    refreshApp,
  };
}
