import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

// Public routes where session banner should never appear
const PUBLIC_ROUTES = ['/', '/login', '/user-login', '/onboarding', '/sso-callback'];

// Short grace period so the user can see *why* they're being redirected.
const AUTO_REDIRECT_MS = 1000;

// Decode the `exp` claim from a JWT (seconds since epoch). Returns 0 if invalid.
function getJwtExpMs(token: string | null): number {
  if (!token) return 0;
  try {
    const payload = token.split('.')[1];
    if (!payload) return 0;
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '='));
    const data = JSON.parse(json);
    return typeof data?.exp === 'number' ? data.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

function clearAuthAndRedirect() {
  try {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
  } catch {
    /* ignore */
  }

  // Preserve where the user was so we can send them back after re-login.
  const here = window.location.pathname + window.location.search + window.location.hash;
  const isPublic = PUBLIC_ROUTES.includes(window.location.pathname);
  const target = isPublic
    ? '/login'
    : `/login?redirect=${encodeURIComponent(here)}`;

  // Use replace so the expired page isn't kept in history.
  window.location.replace(target);
}

export function SessionExpiredBanner() {
  const [isExpired, setIsExpired] = useState(false);
  const { t } = useTranslation();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleSessionExpired = () => {
      // Don't react if user is already on a public/login page
      const currentPath = window.location.pathname;
      if (PUBLIC_ROUTES.includes(currentPath)) {
        return;
      }

      setIsExpired(true);

      // Auto-redirect to login so the user doesn't have to click anything.
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(clearAuthAndRedirect, AUTO_REDIRECT_MS);
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);

    // Proactive watcher — decode the JWT's `exp` and fire the same event the
    // moment the token is past expiry, so the user is sent to /login within
    // ~1s of expiry without needing to make an API request first.
    const tick = () => {
      if (PUBLIC_ROUTES.includes(window.location.pathname)) return;
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;
      const expMs = getJwtExpMs(token);
      if (expMs > 0 && Date.now() >= expMs) {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }
    };
    const intervalId = window.setInterval(tick, 1000);
    tick();

    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
      window.clearInterval(intervalId);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  if (!isExpired) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium shadow-lg"
      role="alert"
      aria-live="assertive"
    >
      <AlertTriangle className="h-4 w-4" />
      <span>Session expired. Redirecting to login…</span>
      <button
        onClick={clearAuthAndRedirect}
        className="underline hover:no-underline font-semibold cursor-pointer"
      >
        Go now
      </button>
    </div>
  );
}
