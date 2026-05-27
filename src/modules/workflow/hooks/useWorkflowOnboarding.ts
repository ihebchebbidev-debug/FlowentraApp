import { useCallback, useEffect, useState } from 'react';

const SEEN_KEY = 'wf-autopilot-seen-v1';

export interface UseWorkflowOnboardingReturn {
  isOpen: boolean;
  hasSeen: boolean;
  open: () => void;
  close: (markSeen?: boolean) => void;
  reset: () => void;
}

export function useWorkflowOnboarding(): UseWorkflowOnboardingReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeen, setHasSeen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(SEEN_KEY) === '1';
  });

  // Auto-open on first visit
  useEffect(() => {
    if (!hasSeen) {
      const t = setTimeout(() => setIsOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [hasSeen]);

  const open = useCallback(() => setIsOpen(true), []);

  const close = useCallback((markSeen = true) => {
    setIsOpen(false);
    if (markSeen) {
      localStorage.setItem(SEEN_KEY, '1');
      setHasSeen(true);
    }
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(SEEN_KEY);
    setHasSeen(false);
    setIsOpen(true);
  }, []);

  return { isOpen, hasSeen, open, close, reset };
}
