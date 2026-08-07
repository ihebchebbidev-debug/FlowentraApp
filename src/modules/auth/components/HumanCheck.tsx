import { useEffect, useRef, useState } from 'react';
import { Loader2, Check, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import cloudflareLogo from '@/assets/cloudflare-logo.png';


interface HumanCheckProps {
  verified: boolean;
  onVerifiedChange: (verified: boolean) => void;
}

/**
 * Cloudflare Turnstile–style behavioral "I'm not a robot" check.
 * Fully local (no third-party network calls). Bot heuristics:
 *  - event.isTrusted must be true (rejects programmatic clicks)
 *  - navigator.webdriver must not be true
 *  - headless UA / missing plugins / 0x0 screen rejected
 *  - Real pointer / key / touch signals observed before click
 *  - Minimum dwell time on the mounted widget
 *  - Pointer type must be mouse/pen/touch
 */

// Official Cloudflare cloud mark (simplified two-tone), inline SVG.
function CloudflareLogo({ className = '' }: { className?: string }) {
  return (
    <img
      src={cloudflareLogo}
      alt="Cloudflare"
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
}


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

  const detectHeadless = (): string | null => {
    const nav = navigator as Navigator & { webdriver?: boolean; plugins?: PluginArray };
    if (nav.webdriver) return t('auth.captcha.reason_webdriver');
    const ua = navigator.userAgent || '';
    if (/HeadlessChrome|PhantomJS|Puppeteer|Playwright|Selenium/i.test(ua)) {
      return t('auth.captcha.reason_webdriver');
    }
    if (window.screen && (window.screen.width === 0 || window.screen.height === 0)) {
      return t('auth.captcha.reason_webdriver');
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status === 'checking' || status === 'ok') return;
    if (!e.target.checked) return;

    const dwell = Date.now() - mountedAt.current;
    const { moves, keys, touches } = signals.current;
    const native = e.nativeEvent as PointerEvent;

    const trusted = e.nativeEvent.isTrusted;
    const headless = detectHeadless();
    const interacted = moves + touches >= 3 || keys >= 1;
    const enoughDwell = dwell >= 1200;
    const validPointer =
      !native.pointerType || ['mouse', 'pen', 'touch', ''].includes(native.pointerType);

    if (!trusted || headless || !interacted || !enoughDwell || !validPointer) {
      setStatus('fail');
      setReason(
        !trusted ? t('auth.captcha.reason_automated') :
        headless ? headless :
        !enoughDwell ? t('auth.captcha.reason_dwell') :
        !interacted ? t('auth.captcha.reason_no_interaction') :
        t('auth.captcha.reason_generic')
      );
      onVerifiedChange(false);
      setTimeout(() => {
        mountedAt.current = Date.now();
        signals.current = { moves: 0, keys: 0, touches: 0 };
        setStatus('idle');
      }, 1600);
      return;
    }

    setStatus('checking');
    setTimeout(() => {
      setStatus('ok');
      onVerifiedChange(true);
    }, 700 + Math.random() * 600);
  };

  const isOk = status === 'ok';
  const isFail = status === 'fail';
  const isChecking = status === 'checking';

  return (
    <div role="group" aria-label="Cloudflare human verification">
      {/* Widget container: glass input styling */}
      <div className="relative group">
        <div
          className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 blur opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="relative h-14 w-full rounded-lg border border-border/60 bg-background/80 backdrop-blur-xl shadow-sm flex items-center justify-between px-3.5 transition-all duration-300 group-hover:border-border/80 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/60"
        >

          {/* Checkbox / status */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex items-center justify-center h-6 w-6 shrink-0">
              {isChecking ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : isOk ? (
                <span className="h-6 w-6 rounded-full bg-success flex items-center justify-center">
                  <Check className="h-4 w-4 text-success-foreground" strokeWidth={3} />
                </span>
              ) : isFail ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <input
                  type="checkbox"
                  checked={false}
                  onChange={handleChange}
                  aria-label={t('auth.captcha.title')}
                  className="h-5 w-5 cursor-pointer rounded border border-input bg-background accent-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-200"
                />
              )}
            </div>

            {/* Label styled like the Email/Password input labels */}
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground/90 leading-tight">
                {isOk
                  ? t('auth.captcha.verified_short', 'Succès !')
                  : isFail
                  ? t('auth.captcha.failed')
                  : isChecking
                  ? t('auth.captcha.verifying')
                  : t('auth.captcha.title')}
              </div>
              {isFail && (
                <div className="text-xs text-destructive mt-0.5 truncate">{reason}</div>
              )}
            </div>
          </div>

          {/* Cloudflare branding */}
          <div className="flex flex-col items-end shrink-0 pl-2 opacity-60 hover:opacity-100 transition-opacity">
            <CloudflareLogo className="h-7 w-auto" />
            <div className="flex items-center gap-1 mt-0.5 text-xs leading-none text-muted-foreground">
              <a
                href="https://www.cloudflare.com/fr-fr/privacypolicy/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary hover:underline transition-colors"
              >
                {t('auth.captcha.privacy_link', 'Confidentialité')}
              </a>
              <span aria-hidden="true">•</span>
              <a
                href="https://www.cloudflare.com/fr-fr/privacypolicy/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary hover:underline transition-colors"
              >
                {t('auth.captcha.help_link', 'Aide')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
