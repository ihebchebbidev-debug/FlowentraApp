/**
 * Utility to broadcast permission invalidation events
 * This allows real-time permission updates across browser tabs
 * and triggers refetch in the usePermissions hook
 */

const PERMISSION_INVALIDATION_EVENT = 'permissions-invalidated';

/**
 * Broadcasts a permission invalidation event to all tabs and the current window
 * Call this after updating role permissions to ensure all logged-in users
 * get the updated permissions without needing to log out
 */
export function broadcastPermissionChange(): void {
  const timestamp = Date.now().toString();
  
  // Trigger cross-tab notification via localStorage
  // Other tabs will receive this via the 'storage' event
  localStorage.setItem(PERMISSION_INVALIDATION_EVENT, timestamp);
  
  // Clean up immediately - we just need the event to fire
  setTimeout(() => {
    localStorage.removeItem(PERMISSION_INVALIDATION_EVENT);
  }, 100);
  
  // Also dispatch a custom event for the current tab
  window.dispatchEvent(new CustomEvent(PERMISSION_INVALIDATION_EVENT));
  
  console.log('[Permissions] Broadcasted permission invalidation event');
}

/**
 * Broadcasts permission change for a specific user
 * Useful when you know which user's permissions were affected
 */
export function broadcastUserPermissionChange(userId: number): void {
  const eventData = {
    userId,
    timestamp: Date.now(),
  };
  
  // Store with user ID for more targeted invalidation
  localStorage.setItem(PERMISSION_INVALIDATION_EVENT, JSON.stringify(eventData));
  
  setTimeout(() => {
    localStorage.removeItem(PERMISSION_INVALIDATION_EVENT);
  }, 100);
  
  window.dispatchEvent(new CustomEvent(PERMISSION_INVALIDATION_EVENT, { detail: eventData }));
  
  console.log(`[Permissions] Broadcasted permission invalidation for user ${userId}`);
}

export default broadcastPermissionChange;
