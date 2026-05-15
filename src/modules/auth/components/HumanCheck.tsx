import { useEffect, useRef, useState } from 'react';
import { Loader2, Check, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import shieldImg from '@/assets/captcha-shield.png';

interface HumanCheckProps {
  verified: boolean;
  onVerifiedChange: (verified: boolean) => void;
}

/**
 * Lightweight behavioral "I'm not a robot" check.
 * Heuristics (no third-party service):
 *  - event.isTrusted must be true (rejects programmatic clicks)
 *  - navigator.webdriver must not be true
 *  - At least N real pointer/key events observed before click
 *  - Minimum dwell time on the page before click
 *  - Click pointerType must be mouse/pen/touch (not synthetic)
 */
export function HumanCheck({ verified, onVerifiedChange }: HumanCheckProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>(
    verified ? 'ok' : 'idle'
  );
  const [reason, setReason] = useState<string>('');
  const mountedAt = useRef<number>(Date.now());
  const signals = useRef({ moves: 0, keys: 0, touches: 0 });

  useEffect(() => {
    const onMove = () => { signals.current.moves += 1; };
    const onKey = () => { signals.current.keys += 1; };
    const onTouch = () => { signals.current.touches += 1; };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouch, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouch);
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (status === 'checking' || status === 'ok') return;
    const dwell = Date.now() - mountedAt.current;
    const { moves, keys, touches } = signals.current;
    const native = (e.nativeEvent as PointerEvent);

    const isWebdriver = !!(navigator as Navigator & { webdriver?: boolean }).webdriver;
    const trusted = e.nativeEvent.isTrusted;
    const interacted = moves + touches >= 3 || keys >= 1;
    const enoughDwell = dwell >= 1200;
    const validPointer =
      !native.pointerType || ['mouse', 'pen', 'touch'].includes(native.pointerType);

    if (!trusted || isWebdriver || !interacted || !enoughDwell || !validPointer) {
      setStatus('fail');
      setReason(
        !trusted ? t('auth.captcha.reason_automated') :
        isWebdriver ? t('auth.captcha.reason_webdriver') :
        !enoughDwell ? t('auth.captcha.reason_dwell') :
        !interacted ? t('auth.captcha.reason_no_interaction') :
        t('auth.captcha.reason_generic')
      );
      onVerifiedChange(false);
      // allow retry after short cooldown
      setTimeout(() => {
        mountedAt.current = Date.now();
        signals.current = { moves: 0, keys: 0, touches: 0 };
        setStatus('idle');
      }, 1500);
      return;
    }

    setStatus('checking');
    // simulate async validation for UX
    setTimeout(() => {
      setStatus('ok');
      onVerifiedChange(true);
    }, 700 + Math.random() * 500);
  };

  return (
    <div className="w-full rounded-lg border border-border/60 bg-background/80 p-3 flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === 'checking' || status === 'ok'}
        aria-pressed={status === 'ok'}
        className={`relative h-7 w-7 shrink-0 rounded-md border transition-all flex items-center justify-center
          ${status === 'ok' ? 'bg-green-500 border-green-500' :
            status === 'fail' ? 'bg-destructive/10 border-destructive' :
            'bg-background border-border hover:border-primary/60'}`}
      >
        {status === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        {status === 'ok' && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
        {status === 'fail' && <AlertTriangle className="h-4 w-4 text-destructive" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground/90">
          {status === 'ok' ? t('auth.captcha.verified') :
           status === 'fail' ? t('auth.captcha.failed') :
           status === 'checking' ? t('auth.captcha.verifying') :
           t('auth.captcha.title')}
        </div>
        {status === 'fail' && (
          <div className="text-xs text-destructive mt-0.5">{reason}</div>
        )}
        {status !== 'fail' && (
          <div className="text-xs text-muted-foreground mt-0.5">{t('auth.captcha.privacy')}</div>
        )}
      </div>
      <img
        src={shieldImg}
        alt=""
        loading="lazy"
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 opacity-90"
      />
    </div>
  );
}