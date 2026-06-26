import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { usePlugins, type PluginCategory } from '@/modules/shared/plugins';
import { PluginCounter } from '../components/plugins/PluginCounter';
import { CategoryFilter } from '../components/plugins/CategoryFilter';
import { PluginCard } from '../components/plugins/PluginCard';

export default function PluginsPage() {
  const { t } = useTranslation('settings');
  const { runtimeState, activeCount, totalCount, isLoading } = usePlugins();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<PluginCategory | 'all'>('all');

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

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{t('plugins.title')}</h1>
        <p className="text-muted-foreground">{t('plugins.subtitle')}</p>
      </div>

      <PluginCounter active={activeCount} total={totalCount} />

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
            <PluginCard key={s.manifest.code} state={s} />
          ))}
        </div>
      )}
    </div>
  );
}
