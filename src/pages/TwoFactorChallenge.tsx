import { isMainAdminAccount } from '@/utils/authClaims';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { twoFactorApi } from '@/services/api/twoFactorApi';
import { authService } from '@/services/authService';

interface ChallengeState {
  challengeToken: string;
  maskedEmail?: string;
  userType?: 'admin' | 'user';
  rememberMe?: boolean;
}

/**
 * Second step of a 2FA login. Reads challenge context from router state (or
 * sessionStorage as a refresh-safe fallback), lets the user submit the OTP,
 * and completes authentication by saving the returned session and redirecting.
 */
export default function TwoFactorChallenge() {
  const { t, i18n } = useTranslation('auth');
  const navigate = useNavigate();
  const location = useLocation();

  const initial = useMemo<ChallengeState | null>(() => {
    const fromState = (location.state as ChallengeState) || null;
    if (fromState?.challengeToken) return fromState;
    try {
      const raw = sessionStorage.getItem('twofa_challenge');
      return raw ? (JSON.parse(raw) as ChallengeState) : null;
    } catch {
      return null;
    }
  }, [location.state]);

  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);
  const [resendAttempts, setResendAttempts] = useState(0);
  const MAX_RESEND_ATTEMPTS = 5;
  const resendLimitReached = resendAttempts >= MAX_RESEND_ATTEMPTS;

  const lang = (i18n.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';

  useEffect(() => {
    if (!initial?.challengeToken) {
      navigate('/', { replace: true });
      return;
    }
    // Persist so a browser refresh keeps the challenge alive.
    sessionStorage.setItem('twofa_challenge', JSON.stringify(initial));
  }, [initial, navigate]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const displayEmail = initial?.maskedEmail || '';

  const handleVerify = async () => {
    if (!initial?.challengeToken) return;
    if (code.trim().length < 6) {
      setError(t('twoFactor.errors.invalid_code'));
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const res = await twoFactorApi.verify(initial.challengeToken, code.trim(), initial.rememberMe ?? true);
      if (res.success && res.accessToken) {
        // Finalize the session using the shared helper.
        authService.saveSessionFromResponse(res, initial.rememberMe ?? true, initial.userType || 'admin');
        sessionStorage.removeItem('twofa_challenge');

        toast({
          title: t('twoFactor.successTitle'),
          description: t('twoFactor.successDesc'),
        });

        const user = res.user;
        const isMainAdmin = isMainAdminAccount();
        if (isMainAdmin && user?.emailVerified === false) {
          navigate('/verify-email', { replace: true });
        } else if (isMainAdmin && !user?.onboardingCompleted) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setError(
          t(`twoFactor.errors.${res.message || 'invalid_code'}`, {
            defaultValue: t('twoFactor.errors.invalid_code'),
          }),
        );
      }
    } catch {
      setError(t('twoFactor.errors.network'));
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!initial?.challengeToken || resendLimitReached) return;
    setResending(true);
    setError(null);
    try {
      const res = await twoFactorApi.resend(initial.challengeToken, lang as 'en' | 'fr');
      if (res.success) {
        setCooldown(res.cooldownSeconds || 60);
        setResendAttempts((n) => n + 1);
        toast({
          title: t('twoFactor.codeSentTitle'),
          description: t('twoFactor.codeSentDesc'),
        });
      } else {
        if (res.cooldownSeconds) setCooldown(res.cooldownSeconds);
        setError(
          t(`twoFactor.errors.${res.message || 'generic'}`, {
            defaultValue: t('twoFactor.errors.generic'),
          }),
        );
      }
    } catch {
      setError(t('twoFactor.errors.network'));
    } finally {
      setResending(false);
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem('twofa_challenge');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <CardTitle>{t('twoFactor.title')}</CardTitle>
          <CardDescription className="flex items-center justify-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="truncate">{displayEmail}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {t('twoFactor.description', { email: displayEmail })}
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('twoFactor.codeLabel')}</label>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="text-center text-2xl tracking-[0.5em] font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleVerify} disabled={verifying || code.length < 6} className="w-full">
            {verifying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('twoFactor.submit')}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={resending || cooldown > 0 || resendLimitReached}
            >
              {resending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {resendLimitReached
                ? t('twoFactor.resendLimitReached')
                : cooldown > 0
                ? t('twoFactor.resendIn', { seconds: cooldown })
                : t('twoFactor.resend')}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
              {t('twoFactor.cancel')}
            </Button>
          </div>
          {resendAttempts > 0 && !resendLimitReached && (
            <p className="text-xs text-muted-foreground text-center">
              {t('twoFactor.resendAttempts', { used: resendAttempts, max: MAX_RESEND_ATTEMPTS })}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
