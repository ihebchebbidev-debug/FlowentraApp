/**
 * ActivatedModulesSection
 * Read-only view of which modules are active for this tenant.
 * Module activation is managed exclusively from the database — users cannot toggle.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Lock, Search } from 'lucide-react';
import { usePlugins } from '@/modules/shared/plugins';
import { getLucideIcon } from './plugins/lucideIconResolver';

export function ActivatedModulesSection() {
  const { t } = useTranslation('settings');
  const { runtimeState, activeCount, totalCount, isLoading } = usePlugins();

  const [search, setSearch] = useState('');

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
                'Modules included in your subscription. Contact support to change your plan.',
              )}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {activeCount} / {totalCount}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3">
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
                    s.isEnabled
                      ? 'border-border/60 bg-background'
                      : 'border-dashed border-muted-foreground/20 opacity-60'
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
                  <Badge
                    variant={s.isEnabled ? 'success' : 'ghost'}
                    className="text-[10px] shrink-0"
                  >
                    {s.isEnabled
                      ? t('plugins.statusActive', 'Active')
                      : t('plugins.statusInactive', 'Inactive')}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ActivatedModulesSection;
