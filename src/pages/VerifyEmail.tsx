import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { emailVerificationApi } from '@/services/emailVerificationApi';

/**
 * Full-page email verification step. Used for:
 *  - Fresh MainAdmin signup → verify before /onboarding.
 *  - Already-created admin whose email is still unverified → hard block
 *    on login before the app shell renders.
 */
export default function VerifyEmail() {
  const { t, i18n } = useTranslation('auth');
  const navigate = useNavigate();
  const { user, isMainAdmin, refreshUser, logout } = useAuth();

  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);
  const [masked, setMasked] = useState('');
  const [resendAttempts, setResendAttempts] = useState(0);
  const MAX_RESEND_ATTEMPTS = 5;
  const resendLimitReached = resendAttempts >= MAX_RESEND_ATTEMPTS;

  const lang = (i18n.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';

  const displayEmail = useMemo(() => {
    if (masked) return masked;
    const raw = user?.email || '';
    if (!raw.includes('@')) return raw;
    const [local, domain] = raw.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}${'•'.repeat(Math.max(1, local.length - 2))}${local.slice(-1)}@${domain}`;
  }, [masked, user?.email]);

  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);
  useEffect(() => {
    if (!expiresIn) return;
    const t = setInterval(() => setExpiresIn((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [expiresIn]);

  // Instant client-side redirect if the auth context already knows the email
  // is verified (existing connected users landing here by mistake).
  useEffect(() => {
    if (user?.emailVerified === true) {
      navigate(
        isMainAdmin && !user?.onboardingCompleted ? '/onboarding' : '/dashboard',
        { replace: true },
      );
    }
  }, [user?.emailVerified, user?.onboardingCompleted, isMainAdmin, navigate]);

  useEffect(() => {
    (async () => {
      const status = await emailVerificationApi.getStatus();
      if (status?.email) setMasked(status.email);
      if (status?.emailVerified) {
        navigate(
          isMainAdmin && !user?.onboardingCompleted ? '/onboarding' : '/dashboard',
          { replace: true },
        );
        return;
      }
      if (status?.canResendInSeconds && status.canResendInSeconds > 0) {
        setCooldown(status.canResendInSeconds);
      } else {
        await handleRequest();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRequest = async (isManualResend = false) => {
    if (isManualResend && resendLimitReached) {
      setError(t('verifyEmail.errors.resend_limit'));
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await emailVerificationApi.requestCode(lang as 'en' | 'fr');
      if (res.success) {
        setCooldown(res.cooldownSeconds ?? 60);
        setExpiresIn(res.expiresInSeconds ?? 600);
        if (isManualResend) setResendAttempts((n) => n + 1);
        toast({
          title: t('verifyEmail.codeSentTitle'),
          description: t('verifyEmail.codeSentDesc'),
        });
      } else {
        if (res.cooldownSeconds) setCooldown(res.cooldownSeconds);
        setError(
          t(`verifyEmail.errors.${res.error || 'generic'}`, {
            defaultValue: t('verifyEmail.errors.generic'),
          }),
        );
      }
    } catch {
      setError(t('verifyEmail.errors.network'));
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (code.trim().length < 4) {
      setError(t('verifyEmail.errors.invalid_code'));
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const res = await emailVerificationApi.verifyCode(code.trim());
      if (res.success) {
        toast({
          title: t('verifyEmail.successTitle'),
          description: t('verifyEmail.successDesc'),
        });
        await refreshUser();
        navigate(isMainAdmin && !user?.onboardingCompleted ? '/onboarding' : '/dashboard', {
          replace: true,
        });
      } else {
        setError(
          t(`verifyEmail.errors.${res.error || 'invalid_code'}`, {
            defaultValue: t('verifyEmail.errors.invalid_code'),
          }),
        );
      }
    } catch {
      setError(t('verifyEmail.errors.network'));
    } finally {
      setVerifying(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <CardTitle>{t('verifyEmail.title')}</CardTitle>
          <CardDescription className="flex items-center justify-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="truncate">{displayEmail}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {t('verifyEmail.description', { email: displayEmail })}
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('verifyEmail.codeLabel')}</label>
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
            {expiresIn > 0 && (
              <p className="text-xs text-muted-foreground">
                {t('verifyEmail.expiresIn', { seconds: expiresIn })}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleVerify}
            disabled={verifying || code.length < 4}
            className="w-full"
          >
            {verifying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('verifyEmail.submit')}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRequest(true)}
              disabled={sending || cooldown > 0 || resendLimitReached}
            >
              {sending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {resendLimitReached
                ? t('verifyEmail.resendLimitReached')
                : cooldown > 0
                ? t('verifyEmail.resendIn', { seconds: cooldown })
                : t('verifyEmail.resend')}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleSignOut}>
              {t('verifyEmail.signOut')}
            </Button>
          </div>
          {resendAttempts > 0 && !resendLimitReached && (
            <p className="text-xs text-muted-foreground text-center">
              {t('verifyEmail.resendAttempts', {
                used: resendAttempts,
                max: MAX_RESEND_ATTEMPTS,
              })}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
