import { useSmoothAppUpdate } from '@/hooks/useSmoothAppUpdate';
import { SmoothUpdateProgress } from '@/components/SmoothUpdateProgress';

/**
 * Wrapper component that manages automatic updates and connection status
 * Should be placed at the top level of your app (in pages/MainApp.tsx or App.tsx)
 * 
 * Features:
 * - Silent auto-update when user is idle
 * - Preserves app state across reload
 * - Subtle progress indicator
 */
export function DeploymentNotificationSystem() {
  const {
    isReloading,
    reloadProgress,
    cancelReload,
  } = useSmoothAppUpdate();

  return (
    <>
      {/* Subtle progress bar during silent reload */}
      <SmoothUpdateProgress
        isReloading={isReloading}
        progress={reloadProgress}
        onCancel={cancelReload}
      />
    </>
  );
}
