import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { EmailVerificationModal } from './EmailVerificationModal';

/**
 * Sticky red banner shown when the current user's email is not yet verified.
 * Rendered near the top of the app shell. Clicking opens the OTP modal.
 * Dismiss is session-only — it reappears next login.
 */
export function EmailVerificationBanner() {
  const { t } = useTranslation('auth');
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('emailverify:dismissed') === '1';
    } catch {
      return false;
    }
  });

  // Auto-open once on first login for staff users
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.emailVerified !== false) return;
    try {
      const key = `emailverify:first-prompt:${user.id}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        setOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user) return null;
  if (user.emailVerified !== false) return null;
  if (dismissed) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem('emailverify:dismissed', '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen(true)}
        className="w-full bg-destructive text-destructive-foreground text-sm px-4 py-2 flex items-center justify-between gap-3 cursor-pointer hover:brightness-110 transition"
        aria-label={t('verifyEmail.banner.cta')}
      >
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {t('verifyEmail.banner.text')}{' '}
            <span className="underline font-medium">{t('verifyEmail.banner.cta')}</span>
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive-foreground hover:bg-destructive-foreground/10"
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
          aria-label={t('verifyEmail.banner.dismiss')}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <EmailVerificationModal open={open} onOpenChange={setOpen} />
    </>
  );
}

export default EmailVerificationBanner;
