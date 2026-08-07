import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logger } from './useLogger';

/**
 * Hook to log page navigation events
 * Tracks route changes and logs them to the system logs
 */
export function useNavigationLogger() {
  const location = useLocation();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    const currentPath = location.pathname;
    const previousPath = previousPathRef.current;

    // Only log if this is a navigation (not initial load) or if it's the first page
    if (previousPath === null || previousPath !== currentPath) {
      // Extract module name from path
      const pathParts = currentPath.split('/').filter(Boolean);
      const module = pathParts[1] || pathParts[0] || 'Home';
      const moduleName = module.charAt(0).toUpperCase() + module.slice(1);

      logger.info(
        `Page viewed: ${currentPath}`,
        'Navigation',
        'read',
        {
          entityType: 'Page',
          entityId: currentPath,
          details: previousPath 
            ? `Navigated from ${previousPath} to ${currentPath}` 
            : `Initial page load: ${currentPath}`,
        }
      );

      previousPathRef.current = currentPath;
    }
  }, [location.pathname]);
}

export default useNavigationLogger;
