/**
 * OAuth Callback Page
 * 
 * Handles three flows:
 * 1. Backend redirect: Backend redirects here with tokens in the URL fragment (#access_token=...)
 *    → extracts tokens, stores them, and redirects to dashboard.
 * 2. Popup flow (email/calendar): Google/Microsoft redirects to the backend callback,
 *    which redirects here with ?code=... The page posts the code to the opener via postMessage.
 * 3. Direct popup landing: If this page is opened in a popup and has ?code= in the URL,
 *    it sends postMessage to the opener and closes.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // ── Flow 1: Backend redirect with tokens in hash ──
    const hash = window.location.hash.substring(1);
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const expiresAt = params.get('expires_at');
      const userId = params.get('user_id');
      const email = params.get('email');

      if (accessToken) {
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
        if (expiresAt) localStorage.setItem('token_expires_at', expiresAt);
        if (userId) localStorage.setItem('user_id', userId);
        if (email) localStorage.setItem('user_email', email);
        window.location.href = '/dashboard';
        return;
      }
    }

    // ── Flow 2 & 3: Popup with ?code= or ?error= ──
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const oauthError = searchParams.get('error') || searchParams.get('oauth_error');

    if (window.opener) {
      // We're in a popup — send the code/error back to the parent window
      if (code) {
        window.opener.postMessage({ type: 'oauth-callback', code }, '*');
        // The parent will close us, but close ourselves as fallback
        setTimeout(() => window.close(), 1000);
        return;
      }
      if (oauthError) {
        window.opener.postMessage(
          { type: 'oauth-callback', error: oauthError.replace(/_/g, ' ') },
          '*'
        );
        setTimeout(() => window.close(), 1000);
        return;
      }
      // No code or error yet — just show spinner, parent polls for close
      return;
    }

    // ── Not in a popup — show error and redirect to login ──
    if (oauthError) {
      setStatus('error');
      setErrorMsg(oauthError.replace(/_/g, ' '));
      setTimeout(() => navigate('/login', { replace: true }), 3000);
      return;
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-2">
        {status === 'error' ? (
          <>
            <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <span className="text-destructive text-lg">✕</span>
            </div>
            <p className="text-sm text-destructive font-medium">Authentication failed</p>
            <p className="text-xs text-muted-foreground">{errorMsg || 'An error occurred'}</p>
            <p className="text-xs text-muted-foreground">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-muted-foreground">Completing authentication...</p>
            <p className="text-xs text-muted-foreground">This window will close automatically.</p>
          </>
        )}
      </div>
    </div>
  );
}
