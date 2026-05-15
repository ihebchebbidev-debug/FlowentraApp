/**
 * ActivatedModulesSection
 * Compact, embeddable view of plugin activations for the Subscription page.
 * Shares the SAME data source as the full Plugins page (usePlugins hook),
 * so toggles here are reflected everywhere (sidebar, gates, paywall).
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Lock, Loader2, ExternalLink } from 'lucide-react';
import {
  usePlugins,
  getDependentsOf,
  type PluginManifest,
} from '@/modules/shared/plugins';
import { getLucideIcon } from './plugins/lucideIconResolver';

export function ActivatedModulesSection() {
  const { t } = useTranslation('settings');
  const {
    runtimeState,
    activeCount,
    totalCount,
    toggle,
    bulkToggle,
    isToggling,
    isLoading,
    isApiAvailable,
    isUsingCachedFallback,
  } = usePlugins();

  const [search, setSearch] = useState('');
  const [pendingDisable, setPendingDisable] = useState<{
    plugin: PluginManifest;
    dependents: PluginManifest[];
  } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return runtimeState;
    return runtimeState.filter((s) => {
      const name = t(`${s.manifest.moduleKey}:plugin.name`, {
        defaultValue: s.manifest.moduleKey,
      }).toLowerCase();
      return (
        name.includes(q) ||
        s.manifest.code.toLowerCase().includes(q) ||
        s.manifest.moduleKey.toLowerCase().includes(q)
      );
    });
  }, [runtimeState, search, t]);

  const handleToggle = (code: string, enabled: boolean) => {
    if (!enabled) {
      const dependents = getDependentsOf(code).filter((d) => {
        const st = runtimeState.find((s) => s.manifest.code === d.code);
        return st?.isEnabled;
      });
      if (dependents.length > 0) {
        const plugin = runtimeState.find((s) => s.manifest.code === code)?.manifest;
        if (plugin) {
          setPendingDisable({ plugin, dependents });
          return;
        }
      }
    }
    toggle(code, enabled);
  };

  const confirmSingleDisable = () => {
    if (pendingDisable) {
      toggle(pendingDisable.plugin.code, false);
      setPendingDisable(null);
    }
  };

  const cascadeDisable = () => {
    if (pendingDisable) {
      const codes = [pendingDisable.plugin.code, ...pendingDisable.dependents.map((d) => d.code)];
      bulkToggle(codes, false);
      setPendingDisable(null);
    }
  };

  return (
    <Card className="shadow-card border-0 bg-card">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <CardTitle className="text-sm font-medium text-foreground">
              {t('subscription.activatedModulesTitle', 'Activated modules')}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {t(
                'subscription.activatedModulesDesc',
                'Modules included in your subscription. Toggle to enable or disable for your tenant.',
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="text-xs">
              {activeCount} / {totalCount}
            </Badge>
            <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1.5">
              <Link to="/dashboard/settings/plugins">
                {t('subscription.openFullManager', 'Full manager')}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3">
        {!isApiAvailable && !isLoading && (
          <Alert className="py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <AlertTitle className="text-xs">
              {isUsingCachedFallback
                ? t('plugins.cachedFallbackTitle')
                : t('plugins.unavailableTitle')}
            </AlertTitle>
            <AlertDescription className="text-xs">
              {isUsingCachedFallback
                ? t('plugins.cachedFallbackDesc')
                : t('plugins.unavailableDesc')}
            </AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('plugins.search.placeholder')}
            className="pl-8 h-8 text-xs"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-muted/40 rounded-md animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            {t('plugins.empty')}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
            {filtered.map((s) => {
              const Icon = getLucideIcon(s.manifest.icon);
              const name = t(`${s.manifest.moduleKey}:plugin.name`, {
                defaultValue: s.manifest.moduleKey,
              });
              return (
                <div
                  key={s.manifest.code}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md border transition-colors ${
                    s.isEnabled ? 'border-border/60 bg-background' : 'border-dashed border-muted-foreground/20 opacity-70'
                  }`}
                >
                  <div
                    className={`shrink-0 h-7 w-7 rounded-md flex items-center justify-center ${
                      s.isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-foreground truncate">{name}</p>
                      {s.manifest.isCore && (
                        <Lock className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                      {s.manifest.code}
                    </p>
                  </div>
                  <Switch
                    checked={s.isEnabled}
                    disabled={s.manifest.isCore || isToggling}
                    onCheckedChange={(checked) => handleToggle(s.manifest.code, checked)}
                    aria-label={s.isEnabled ? t('plugins.toggleOff') : t('plugins.toggleOn')}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Dependency cascade modal */}
      <AlertDialog
        open={!!pendingDisable}
        onOpenChange={(o) => { if (!o) setPendingDisable(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('plugins.dependencyModalTitle', 'Disable dependent modules?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDisable && (
                <>
                  {t(
                    'plugins.dependencyModalDesc',
                    'The following modules depend on {{name}}:',
                    { name: pendingDisable.plugin.moduleKey },
                  )}
                  <ul className="mt-2 list-disc list-inside text-xs">
                    {pendingDisable.dependents.map((d) => (
                      <li key={d.code} className="font-mono">{d.code}</li>
                    ))}
                  </ul>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>{t('plugins.cancel')}</AlertDialogCancel>
            <Button variant="outline" onClick={confirmSingleDisable}>
              {t('plugins.disableOnlyThis', 'Disable only this')}
            </Button>
            <AlertDialogAction onClick={cascadeDisable}>
              {t('plugins.cascadeDisable', 'Disable all')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export default ActivatedModulesSection;
