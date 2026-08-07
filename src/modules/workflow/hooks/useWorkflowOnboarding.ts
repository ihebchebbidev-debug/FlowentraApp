import { useCallback, useEffect, useState } from 'react';

/**
 * Bump this when the autopilot script changes meaningfully so existing
 * users see the refreshed tour once.
 */
const SEEN_KEY = 'wf-autopilot-seen-v2';
const LEGACY_KEYS = ['wf-autopilot-seen-v1'];

export interface UseWorkflowOnboardingReturn {
  isOpen: boolean;
  hasSeen: boolean;
  open: () => void;
  close: (markSeen?: boolean) => void;
  reset: () => void;
}

interface Options {
  /** When false, the tour will not auto-open on first visit. Manual open still works. */
  autoOpen?: boolean;
}

export function useWorkflowOnboarding({ autoOpen = true }: Options = {}): UseWorkflowOnboardingReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeen, setHasSeen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    // Migrate legacy keys: if v1 was seen, treat v2 as unseen (intentional re-tour).
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    return localStorage.getItem(SEEN_KEY) === '1';
  });

  useEffect(() => {
    if (!autoOpen) return;
    if (!hasSeen) {
      const t = setTimeout(() => setIsOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [hasSeen, autoOpen]);

  const open = useCallback(() => setIsOpen(true), []);

  const close = useCallback((markSeen = true) => {
    setIsOpen(false);
    if (markSeen) {
      try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore quota */ }
      setHasSeen(true);
    }
  }, []);

  const reset = useCallback(() => {
    try { localStorage.removeItem(SEEN_KEY); } catch { /* ignore */ }
    setHasSeen(false);
    setIsOpen(true);
  }, []);

  return { isOpen, hasSeen, open, close, reset };
}
