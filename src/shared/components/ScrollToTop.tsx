import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top on route change. Also reset the scroll of main content containers if present.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    // If the app uses a central content wrapper with overflow, try to reset its scroll too.
    const mainEl = document.querySelector('main') || document.querySelector('#root') || document.querySelector('.app-root');
    if (mainEl && 'scrollTop' in mainEl) {
      try { (mainEl as HTMLElement).scrollTop = 0; } catch { /* ignore */ }
    }
  }, [pathname]);

  return null;
}
