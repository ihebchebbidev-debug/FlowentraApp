import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MailCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { emailVerificationApi } from '@/services/emailVerificationApi';

interface EmailVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified?: () => void;
}

export function EmailVerificationModal({
  open,
  onOpenChange,
  onVerified,
}: EmailVerificationModalProps) {
  const { t, i18n } = useTranslation('auth');
  const { user, refreshUser } = useAuth();
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);
  const [masked, setMasked] = useState<string>('');
  const autoRequestedRef = useRef(false);

  const lang = (i18n.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';

  const displayEmail = useMemo(() => {
    if (masked) return masked;
    const raw = user?.email || '';
    if (!raw.includes('@')) return raw;
    const [local, domain] = raw.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}${'•'.repeat(Math.max(1, local.length - 2))}${local.slice(-1)}@${domain}`;
  }, [masked, user?.email]);

  // Countdown timers
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

  // Auto-request a code once when modal opens
  useEffect(() => {
    if (!open) {
      autoRequestedRef.current = false;
      setCode('');
      setError(null);
      return;
    }
    if (autoRequestedRef.current) return;
    autoRequestedRef.current = true;
    (async () => {
      const status = await emailVerificationApi.getStatus();
      if (status?.email) setMasked(status.email);
      if (status?.canResendInSeconds && status.canResendInSeconds > 0) {
        setCooldown(status.canResendInSeconds);
        return;
      }
      await handleRequest();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleRequest = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await emailVerificationApi.requestCode(lang as 'en' | 'fr');
      if (res.success) {
        setCooldown(res.cooldownSeconds ?? 60);
        setExpiresIn(res.expiresInSeconds ?? 600);
        toast({ title: t('verifyEmail.codeSentTitle'), description: t('verifyEmail.codeSentDesc') });
      } else {
        if (res.cooldownSeconds) setCooldown(res.cooldownSeconds);
        setError(t(`verifyEmail.errors.${res.error || 'generic'}`, { defaultValue: t('verifyEmail.errors.generic') }));
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
        toast({ title: t('verifyEmail.successTitle'), description: t('verifyEmail.successDesc') });
        await refreshUser();
        onVerified?.();
        onOpenChange(false);
      } else {
        setError(t(`verifyEmail.errors.${res.error || 'invalid_code'}`, { defaultValue: t('verifyEmail.errors.invalid_code') }));
      }
    } catch {
      setError(t('verifyEmail.errors.network'));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {t('verifyEmail.title')}
          </DialogTitle>
          <DialogDescription>
            {t('verifyEmail.description', { email: displayEmail })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRequest}
              disabled={sending || cooldown > 0}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <MailCheck className="h-4 w-4 mr-1" />
              )}
              {cooldown > 0
                ? t('verifyEmail.resendIn', { seconds: cooldown })
                : t('verifyEmail.resend')}
            </Button>
            <Button onClick={handleVerify} disabled={verifying || code.length < 4}>
              {verifying && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {t('verifyEmail.submit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EmailVerificationModal;
