import { useEffect, useState, useRef, useCallback } from 'react';

interface IdleState {
  isIdle: boolean;
  isEditingForm: boolean;
  canSafelyReload: boolean;
}

const IDLE_TIME = 60 * 1000; // 1 minute of no activity = idle
const EDITING_TIMEOUT = 5 * 1000; // 5 seconds after last edit before we consider it safe

/**
 * Detects when user is idle and not editing critical content
 * Helps determine optimal time for background page reloads
 */
export function useIdleDetection(): IdleState {
  const [idleState, setIdleState] = useState<IdleState>({
    isIdle: false,
    isEditingForm: false,
    canSafelyReload: false,
  });

  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const editingTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastActivityRef = useRef<number>(Date.now());

  // Detect when user is editing forms
  const handleFormActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Set editing flag
    setIdleState((prev) => ({
      ...prev,
      isEditingForm: true,
    }));

    // Clear the editing timer if it exists
    if (editingTimerRef.current) {
      clearTimeout(editingTimerRef.current);
    }

    // Set a timer to mark editing as complete
    editingTimerRef.current = setTimeout(() => {
      setIdleState((prev) => ({
        ...prev,
        isEditingForm: false,
      }));
    }, EDITING_TIMEOUT);
  }, []);

  const handleUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Clear idle state if user becomes active
    setIdleState((prev) => ({
      ...prev,
      isIdle: false,
    }));

    // Reset idle timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // Set new idle timer
    idleTimerRef.current = setTimeout(() => {
      setIdleState((prev) => ({
        ...prev,
        isIdle: true,
      }));
    }, IDLE_TIME);
  }, []);

  useEffect(() => {
    // Listen for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Listen for form input
    const handleInputChange = (e: Event) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || 
          (e.target as HTMLElement).tagName === 'TEXTAREA') {
        handleFormActivity();
      }
    };
    document.addEventListener('input', handleInputChange, true);

    // Initial setup
    handleUserActivity();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity);
      });
      document.removeEventListener('input', handleInputChange, true);
      
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (editingTimerRef.current) clearTimeout(editingTimerRef.current);
    };
  }, [handleUserActivity, handleFormActivity]);

  // Update canSafelyReload based on idle and editing states
  useEffect(() => {
    const canReload = idleState.isIdle && !idleState.isEditingForm;
    setIdleState((prev) => ({
      ...prev,
      canSafelyReload: canReload,
    }));
  }, [idleState.isIdle, idleState.isEditingForm]);

  return idleState;
}
