/**
 * PluginPaywall — full-screen "module not activated" overlay.
 *
 * Rendered by <PluginGate /> when the requested module is disabled.
 * Visually blurs a faux module preview behind a glass-morphism card with
 * a sales CTA pointing to flowentra.io.
 *
 * Fully translated via the `settings` namespace (`plugins.paywall.*`).
 */
import { useTranslation } from 'react-i18next';
import { Lock, Mail, ExternalLink, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { getPluginByCode } from './registry';

const SALES_WEBSITE = 'https://flowentra.io';
const SALES_EMAIL = 'sales@flowentra.io';

interface PluginPaywallProps {
  code: string;
}

/** Faux blurred backdrop — gives the impression of a real module behind the lock. */
function BlurredBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none overflow-hidden"
    >
      {/* Decorative gradient orbs */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
      <div className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
      <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-secondary/40 blur-3xl" />

      {/* Faux UI scaffolding (heavily blurred) */}
      <div className="absolute inset-0 p-6 opacity-40 blur-md">
        <div className="mb-6 h-10 w-1/3 rounded-lg bg-muted" />
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-card shadow-sm" />
          ))}
        </div>
        <div className="mb-3 h-8 w-48 rounded-md bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-card shadow-sm" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PluginPaywall({ code }: PluginPaywallProps) {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();
  const manifest = getPluginByCode(code);

  // Resolve the human-readable module name from its own namespace if possible,
  // otherwise fall back to the moduleKey or the plugin code.
  const moduleName = manifest?.nameI18nKey
    ? t(manifest.nameI18nKey, { defaultValue: manifest.moduleKey ?? code })
    : (manifest?.moduleKey ?? code);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plugin-paywall-title"
      aria-describedby="plugin-paywall-desc"
      className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center overflow-hidden bg-background p-4"
    >
      <BlurredBackdrop />

      <Card className="relative z-10 w-full max-w-lg border-border/60 bg-card/80 p-8 shadow-2xl backdrop-blur-xl supports-[backdrop-filter]:bg-card/70">
        {/* Lock icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <Lock className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>

        {/* Module badge */}
        <div className="mb-4 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {moduleName}
          </span>
        </div>

        <h1
          id="plugin-paywall-title"
          className="mb-3 text-center text-2xl font-semibold tracking-tight text-foreground"
        >
          {t('plugins.paywall.title', 'Module not activated')}
        </h1>

        <p
          id="plugin-paywall-desc"
          className="mb-6 text-center text-sm leading-relaxed text-muted-foreground"
        >
          {t(
            'plugins.paywall.description',
            "Sorry, the {{name}} module isn't activated for your company yet. Interested in unlocking it? Visit our website or get in touch with our sales team — we'll be happy to help.",
            { name: moduleName }
          )}
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-2.5">
          <Button asChild size="lg" className="w-full">
            <a href={SALES_WEBSITE} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
              {t('plugins.paywall.visitWebsite', 'Visit flowentra.io')}
            </a>
          </Button>

          <Button asChild variant="outline" size="lg" className="w-full">
            <a href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent(
              t('plugins.paywall.emailSubject', 'Module activation request: {{name}}', {
                name: moduleName,
              })
            )}`}>
              <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
              {t('plugins.paywall.contactSales', 'Contact sales')}
            </a>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('plugins.paywall.goBack', 'Go back')}
          </Button>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground/80">
          {t('plugins.paywall.footer', 'Plugin code: {{code}}', { code })}
        </p>
      </Card>
    </div>
  );
}

export default PluginPaywall;
