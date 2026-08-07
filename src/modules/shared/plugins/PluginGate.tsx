/**
 * PluginGate — render-level gate for module routes/components.
 *
 * Usage:
 *   <PluginGate code="PL0002SALES">
 *     <SalesRoutes />
 *   </PluginGate>
 *
 * Default behavior when the plugin is disabled:
 *   - Renders <PluginPaywall /> (a blurred sales-CTA overlay).
 *
 * Opt-in alternatives:
 *   - `fallback`     — render arbitrary ReactNode instead of the paywall.
 *   - `redirectTo`   — navigate away (with toast) instead of showing the paywall.
 *   - `silent`       — suppress the toast that accompanies redirects.
 */
import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useIsPluginEnabled } from './usePlugins';
import { getPluginByCode } from './registry';
import { PluginPaywall } from './PluginPaywall';

/** Skeleton placeholder shown while plugin activations are loading. */
function PluginGateSkeleton() {
  return (
    <div
      className="container mx-auto p-6 space-y-6 animate-in fade-in"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      <span className="sr-only">Loading module…</span>
    </div>
  );
}

interface PluginGateProps {
  code: string;
  children: ReactNode;
  /** If provided, renders this instead of the paywall when disabled. */
  fallback?: ReactNode;
  /** Suppress redirect toast (only relevant when `redirectTo` is set). */
  silent?: boolean;
  /**
   * If set, navigate the user to this path instead of rendering the paywall.
   * Leave undefined (default) to render <PluginPaywall />.
   */
  redirectTo?: string;
}

export function PluginGate({
  code,
  children,
  fallback,
  silent = false,
  redirectTo,
}: PluginGateProps) {
  const { isEnabled, isLoading } = useIsPluginEnabled(code);
  const { toast } = useToast();
  const { t } = useTranslation('settings');
  const location = useLocation();

  useEffect(() => {
    // Toast only fires when the legacy redirect mode is active.
    if (!isLoading && !isEnabled && redirectTo && !silent && !fallback) {
      const manifest = getPluginByCode(code);
      toast({
        title: t('plugins.disabledTitle', 'Module disabled'),
        description: t(
          'plugins.disabledMessage',
          '{{name}} is currently disabled. Enable it in Settings → Plugins.',
          { name: manifest?.moduleKey ?? code }
        ),
        variant: 'destructive',
      });
    }
  }, [isLoading, isEnabled, silent, fallback, code, toast, t, redirectTo]);

  if (isLoading) {
    return <PluginGateSkeleton />;
  }

  if (!isEnabled) {
    // 1. Caller-supplied fallback wins.
    if (fallback !== undefined) return <>{fallback}</>;
    // 2. Explicit redirect mode (legacy behavior).
    if (redirectTo) {
      if (location.pathname.startsWith(redirectTo)) return null;
      return <Navigate to={redirectTo} replace />;
    }
    // 3. Default: blurred paywall with sales CTA.
    return <PluginPaywall code={code} />;
  }

  return <>{children}</>;
}

export default PluginGate;
