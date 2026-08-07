import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { emailAccountsApi } from '@/services/api/emailAccountsApi';

// ─── OAuth user info stored after sign-in for onboarding/settings ───
export interface OAuthUserInfo {
  email: string;
  firstName: string;
  lastName: string;
  provider: 'google' | 'microsoft';
  profilePictureUrl?: string;
}

const OAUTH_USER_KEY = 'oauth-user-info';

export function getOAuthUserInfo(): OAuthUserInfo | null {
  try {
    const raw = localStorage.getItem(OAUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setOAuthUserInfo(info: OAuthUserInfo) {
  localStorage.setItem(OAUTH_USER_KEY, JSON.stringify(info));
}

export function clearOAuthUserInfo() {
  localStorage.removeItem(OAUTH_USER_KEY);
}

// ─── Google GSI script loader ───
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => { requestAccessToken: () => void };
        };
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

let gsiScriptLoaded = false;
function loadGsiScript(): Promise<void> {
  if (gsiScriptLoaded && window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const check = setInterval(() => {
        if (window.google?.accounts?.oauth2) { gsiScriptLoaded = true; clearInterval(check); resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(check); reject(new Error('GSI script load timeout')); }, 10000);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => { gsiScriptLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.head.appendChild(script);
  });
}




interface OAuthLoginProps {
  isSignUp?: boolean;
  onOAuthPrefill?: (info: { email: string; firstName: string; lastName: string; profilePictureUrl?: string; provider: 'google' | 'microsoft' }) => void;
}

export function OAuthLogin({ isSignUp = false, onOAuthPrefill }: OAuthLoginProps = {}) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { oAuthLogin } = useAuth();

  // Fetch Google OAuth config using the PUBLIC endpoint (no auth required)
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      emailAccountsApi.getOAuthConfigPublic('google').catch(() => null),
      loadGsiScript().catch(() => null),
    ]).then(([config]) => {
      if (!cancelled && config?.clientId) {
        setGoogleClientId(config.clientId);
        setIsGoogleReady(true);
      }
      if (!cancelled) setConfigLoaded(true);
    });

    return () => { cancelled = true; };
  }, []);

  // ─── Helper: decode JWT credential from One Tap ───
  const decodeJwtPayload = useCallback((token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }, []);

  // ─── Handle successful OAuth ───
  const handleOAuthSuccess = useCallback(async (
    userInfo: { email: string; given_name?: string; family_name?: string; name?: string; picture?: string },
    provider: 'google' | 'microsoft'
  ) => {
    if (!userInfo.email) throw new Error(`No email received from ${provider}`);

    const firstName = userInfo.given_name || userInfo.name?.split(' ')[0] || '';
    const lastName = userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || '';

    // Store OAuth info for onboarding & settings
    setOAuthUserInfo({
      email: userInfo.email,
      firstName,
      lastName,
      provider,
      profilePictureUrl: userInfo.picture,
    });

    // In signup mode: just prefill the form, don't try to log in
    if (isSignUp && onOAuthPrefill) {
      onOAuthPrefill({ email: userInfo.email, firstName, lastName, profilePictureUrl: userInfo.picture, provider });
      toast({
        title: t('auth.success'),
        description: t('auth.oauth_prefill_success'),
      });
      return;
    }

    // In login mode: check if user exists and log in
    const result = await oAuthLogin(userInfo.email);

    if (result.success && result.user) {
      toast({
        title: t('auth.success'),
        description: provider === 'google' ? t('auth.google_signin_success') : t('auth.microsoft_signin_success', 'Microsoft sign-in successful!'),
      });
      if (result.user.onboardingCompleted) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    } else {
      toast({
        title: t('auth.oauth_signin_failed_title'),
        description: result.message || t('auth.oauth_signin_failed_desc'),
        variant: 'destructive',
      });
    }
  }, [oAuthLogin, navigate, t, isSignUp, onOAuthPrefill]);

  // ─── Google One Tap: auto-prompt if user has a Google session (once only) ───
  const oneTapInitializedRef = useRef(false);
  useEffect(() => {
    if (!googleClientId || !isGoogleReady || !window.google?.accounts?.id) return;
    if (oneTapInitializedRef.current) return;
    oneTapInitializedRef.current = true;

    const handleOneTapResponse = async (response: { credential: string }) => {
      const payload = decodeJwtPayload(response.credential);
      if (!payload?.email) return;

      setIsGoogleLoading(true);
      try {
        await handleOAuthSuccess({
          email: payload.email,
          given_name: payload.given_name,
          family_name: payload.family_name,
          name: payload.name,
          picture: payload.picture,
        }, 'google');
      } catch (error) {
        console.error('Google One Tap error:', error);
        toast({ title: t('auth.oauth_signin_failed_title'), description: t('auth.oauth_signin_failed_desc'), variant: 'destructive' });
      } finally {
        setIsGoogleLoading(false);
      }
    };

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleOneTapResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Disabled automatic prompt to prevent unwanted popup on page load
    // Users can still use the "Continue with Google" button for manual signin
    // window.google.accounts.id.prompt((notification: any) => {
    //   if (notification.isNotDisplayed()) {
    //     console.log('[OneTap] Not displayed:', notification.getNotDisplayedReason());
    //   }
    //   if (notification.isSkippedMoment()) {
    //     console.log('[OneTap] Skipped:', notification.getSkippedReason());
    //   }
    // });

    return () => {
      try { window.google?.accounts?.id?.cancel(); } catch {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId, isGoogleReady]);

  // ─── Google Sign-In ───
  const handleGoogleSignIn = useCallback(async () => {
    if (!googleClientId || !window.google?.accounts?.oauth2) {
      toast({ title: t('auth.error'), description: t('auth.oauth_not_ready'), variant: 'destructive' });
      return;
    }

    setIsGoogleLoading(true);

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: 'email profile openid',
      callback: async (response: any) => {
        if (response.error) {
          setIsGoogleLoading(false);
          toast({ title: t('auth.oauth_signin_failed_title'), description: t('auth.oauth_signin_failed_desc'), variant: 'destructive' });
          return;
        }
        try {
          const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` },
          }).then(r => r.json());

          await handleOAuthSuccess({
            email: userInfo.email,
            given_name: userInfo.given_name,
            family_name: userInfo.family_name,
            name: userInfo.name,
            picture: userInfo.picture,
          }, 'google');
        } catch (error: any) {
          console.error('Google OAuth error:', error);
          toast({ title: t('auth.oauth_signin_failed_title'), description: t('auth.oauth_signin_failed_desc'), variant: 'destructive' });
        } finally {
          setIsGoogleLoading(false);
        }
      },
    });

    tokenClient.requestAccessToken();
  }, [googleClientId, handleOAuthSuccess, t]);



  return (
    <div className="space-y-3">
      {/* Google */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-11"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{t('auth.connecting')}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="font-medium">{t('auth.continue_with_google')}</span>
          </div>
        )}
      </Button>
    </div>
  );
}
