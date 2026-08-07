import { useCallback, useEffect, useState } from 'react';

const SEEN_KEY = 'int-hub-autopilot-seen-v1';

export interface UseIntegrationOnboardingReturn {
  isOpen: boolean;
  hasSeen: boolean;
  open: () => void;
  close: (markSeen?: boolean) => void;
  reset: () => void;
}

interface Options {
  autoOpen?: boolean;
}

export function useIntegrationOnboarding({ autoOpen = true }: Options = {}): UseIntegrationOnboardingReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeen, setHasSeen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
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
