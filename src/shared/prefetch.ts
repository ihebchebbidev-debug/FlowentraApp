// Centralized prefetchers for lazy route chunks
// Vite will create separate chunks for these dynamic imports.

export const preloadDashboard = () => import("@/modules/dashboard/pages/Dashboard");
export const preloadSupport = () => import("@/modules/support/SupportModuleRoutes");
export const preloadOnboarding = () => import("@/modules/onboarding/pages/Onboarding");
export const preloadLogin = () => import("@/modules/auth/pages/Login");
export const preloadNotFound = () => import("@/pages/NotFound");

// Dispatcher data prefetcher - call this when hovering over dispatcher nav
export const preloadDispatcherData = async () => {
  try {
    // Dynamic import to avoid circular dependencies
    const { DispatcherService } = await import("@/modules/dispatcher/services/dispatcher.service");
    return DispatcherService.prefetch();
  } catch (error) {
    console.warn('[Prefetch] Failed to prefetch dispatcher data:', error);
  }
};

// Small helper to schedule work during idle time
export function runWhenIdle(fn: () => void, timeout = 1500) {
  if (typeof (window as any).requestIdleCallback === "function") {
    (window as any).requestIdleCallback(fn, { timeout });
  } else {
    setTimeout(fn, timeout);
  }
}

// Prefetch dispatcher data on hover with debounce
let dispatcherPrefetchTimer: ReturnType<typeof setTimeout> | null = null;

export function prefetchDispatcherOnHover() {
  // Debounce to avoid multiple rapid prefetches
  if (dispatcherPrefetchTimer) return;
  
  dispatcherPrefetchTimer = setTimeout(() => {
    dispatcherPrefetchTimer = null;
    preloadDispatcherData();
  }, 100);
}
