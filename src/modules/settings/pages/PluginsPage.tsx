import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePlugins, getDependentsOf, type PluginCategory, type PluginManifest } from '@/modules/shared/plugins';
import { PluginCounter } from '../components/plugins/PluginCounter';
import { CategoryFilter } from '../components/plugins/CategoryFilter';
import { PluginCard } from '../components/plugins/PluginCard';
import { DependencyModal } from '../components/plugins/DependencyModal';

export default function PluginsPage() {
  const { t } = useTranslation('settings');
  const {
    runtimeState, activeCount, totalCount, toggle, bulkToggle, isToggling, isLoading,
    isApiAvailable, isUsingCachedFallback,
  } = usePlugins();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<PluginCategory | 'all'>('all');
  const [pendingDisable, setPendingDisable] = useState<{
    plugin: PluginManifest;
    dependents: PluginManifest[];
  } | null>(null);
  const [confirmBulkDisable, setConfirmBulkDisable] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: runtimeState.length };
    for (const s of runtimeState) {
      c[s.manifest.category] = (c[s.manifest.category] ?? 0) + 1;
    }
    return c;
  }, [runtimeState]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return runtimeState.filter((s) => {
      if (category !== 'all' && s.manifest.category !== category) return false;
      if (!q) return true;
      const name = t(`${s.manifest.moduleKey}:plugin.name`, { defaultValue: s.manifest.moduleKey }).toLowerCase();
      return (
        name.includes(q) ||
        s.manifest.code.toLowerCase().includes(q) ||
        s.manifest.moduleKey.toLowerCase().includes(q)
      );
    });
  }, [runtimeState, search, category, t]);

  const handleToggle = (code: string, enabled: boolean) => {
    if (!enabled) {
      // Find enabled dependents
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

  const handleEnableAll = () => {
    const codes = runtimeState.filter((s) => !s.isEnabled).map((s) => s.manifest.code);
    if (codes.length) bulkToggle(codes, true);
  };

  const handleDisableAllNonCore = () => {
    const codes = runtimeState
      .filter((s) => !s.manifest.isCore && s.isEnabled)
      .map((s) => s.manifest.code);
    if (codes.length) bulkToggle(codes, false);
    setConfirmBulkDisable(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{t('plugins.title')}</h1>
        <p className="text-muted-foreground">{t('plugins.subtitle')}</p>
      </div>

      {!isApiAvailable && !isLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>
            {isUsingCachedFallback
              ? t('plugins.cachedFallbackTitle')
              : t('plugins.unavailableTitle')}
          </AlertTitle>
          <AlertDescription>
            {isUsingCachedFallback
              ? t('plugins.cachedFallbackDesc')
              : t('plugins.unavailableDesc')}
          </AlertDescription>
        </Alert>
      )}

      <PluginCounter active={activeCount} total={totalCount} />

      {/* Bulk actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleEnableAll} disabled={isToggling} className="gap-2">
          <ToggleRight className="h-4 w-4" />
          {t('plugins.bulkEnable')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setConfirmBulkDisable(true)} disabled={isToggling} className="gap-2">
          <ToggleLeft className="h-4 w-4" />
          {t('plugins.bulkDisable')}
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('plugins.search.placeholder')}
            className="pl-9"
          />
        </div>
        <CategoryFilter value={category} onChange={setCategory} counts={counts} />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">{t('plugins.empty')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <PluginCard
              key={s.manifest.code}
              state={s}
              onToggle={handleToggle}
              isToggling={isToggling}
            />
          ))}
        </div>
      )}

      {/* Dependency cascade modal */}
      <DependencyModal
        open={!!pendingDisable}
        onOpenChange={(o) => { if (!o) setPendingDisable(null); }}
        plugin={pendingDisable?.plugin ?? null}
        dependents={pendingDisable?.dependents ?? []}
        onConfirm={confirmSingleDisable}
        onCascade={cascadeDisable}
      />

      {/* Bulk-disable confirmation */}
      <AlertDialog open={confirmBulkDisable} onOpenChange={setConfirmBulkDisable}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('plugins.bulkConfirmDisable')}</AlertDialogTitle>
            <AlertDialogDescription>{t('plugins.bulkConfirmDisableDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('plugins.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisableAllNonCore}>
              {t('plugins.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
