import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Closeable header banner prompting users to enable two-factor authentication.
 * - MainAdmin: CTA links to security settings to enable 2FA.
 * - Regular user: informational — asks them to contact their administrator.
 * Dismiss is session-only (reappears next login).
 */
export function TwoFactorReminderBanner() {
  const { t } = useTranslation('auth');
  const { user, isAuthenticated, isMainAdmin } = useAuth();
  const navigate = useNavigate();

  const storageKey = 'twofactor:banner:dismissed';
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });

  if (!isAuthenticated || !user) return null;
  if (user.twoFactorEnabled === true) return null;
  if (dismissed) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(storageKey, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const handleClick = () => {
    if (isMainAdmin) {
      navigate('/dashboard/settings?section=security');
    }
  };

  const text = isMainAdmin
    ? t('twoFactorBanner.admin.text')
    : t('twoFactorBanner.user.text');
  const cta = isMainAdmin ? t('twoFactorBanner.admin.cta') : null;

  return (
    <div
      role={isMainAdmin ? 'button' : undefined}
      tabIndex={isMainAdmin ? 0 : undefined}
      onClick={isMainAdmin ? handleClick : undefined}
      onKeyDown={
        isMainAdmin
          ? (e) => (e.key === 'Enter' || e.key === ' ') && handleClick()
          : undefined
      }
      className={`w-full bg-amber-500 text-black text-sm px-4 py-2 flex items-center justify-between gap-3 transition ${
        isMainAdmin ? 'cursor-pointer hover:brightness-105' : ''
      }`}
      aria-label={cta ?? text}
    >
      <div className="flex items-center gap-2 min-w-0">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <span className="truncate">
          {text}
          {cta ? (
            <>
              {' '}
              <span className="underline font-medium">{cta}</span>
            </>
          ) : null}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-black hover:bg-black/10"
        onClick={(e) => {
          e.stopPropagation();
          dismiss();
        }}
        aria-label={t('twoFactorBanner.dismiss')}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default TwoFactorReminderBanner;