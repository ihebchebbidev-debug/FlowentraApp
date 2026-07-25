import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr as frLocale } from 'date-fns/locale';
import {
  Activity,
  ArrowRightLeft,
  Download,
  Pause,
  PencilLine,
  Play,
  PlusCircle,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAggregatedActivity } from '../hooks/useAggregatedActivity';
import { ActivityFeed, SOURCE_ICON } from '../components/ActivityFeed';
import type { ActivityBucket, ActivitySource } from '../types';
import { ALL_SOURCES, WORKSPACE_SOURCES } from '../types';
import { usePermissions } from '@/hooks/usePermissions';
import { SOURCE_TO_MODULE } from '../permissions';
import { formatStatValue } from '@/lib/formatters';

const POLL_MS = 20_000;
const POLL_SECONDS = POLL_MS / 1000;

function localeFor(lang: string) {
  if (lang?.startsWith('fr')) return frLocale;
  return enUS;
}

export default function TraceabilityPage() {
  const { t, i18n } = useTranslation('traceability');
  const { isMainAdmin, hasAnyPermission, isLoading: permsLoading } = usePermissions();
  const [searchParams] = useSearchParams();
  const workspace = (searchParams.get('workspace') || '').toLowerCase();

  // Sources allowed by workspace scope (undefined workspace → all)
  const scopedSources = useMemo<ActivitySource[]>(() => {
    if (!workspace) return ALL_SOURCES;
    return WORKSPACE_SOURCES[workspace] ?? ALL_SOURCES;
  }, [workspace]);

  // Intersect with permissions
  const allowedSources = useMemo<ActivitySource[]>(() => {
    if (isMainAdmin) return scopedSources;
    return scopedSources.filter((src) =>
      hasAnyPermission(SOURCE_TO_MODULE[src], ['read', 'read_logs', 'view_all', 'view_own']),
    );
  }, [scopedSources, isMainAdmin, hasAnyPermission]);

  const tabKeys = useMemo<Array<ActivitySource | 'all'>>(
    () => ['all', ...allowedSources],
    [allowedSources],
  );

  const {
    events,
    loading,
    isRefetching,
    error,
    lastUpdatedAt,
    newEventIds,
    autoRefresh,
    setAutoRefresh,
    refresh,
  } = useAggregatedActivity({
    sources: allowedSources,
    enabled: !permsLoading && allowedSources.length > 0,
    pollIntervalMs: POLL_MS,
  });

  const [tab, setTab] = useState<ActivitySource | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedBucket, setSelectedBucket] = useState<'all' | ActivityBucket>('all');

  useEffect(() => {
    if (tab !== 'all' && !allowedSources.includes(tab)) setTab('all');
  }, [allowedSources, tab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (tab !== 'all' && e.source !== tab) return false;
      if (selectedBucket !== 'all' && e.bucket !== selectedBucket) return false;
      if (!q) return true;
      return (
        e.message?.toLowerCase().includes(q) ||
        e.entityLabel?.toLowerCase().includes(q) ||
        e.actor.name?.toLowerCase().includes(q) ||
        e.actionLabel?.toLowerCase().includes(q)
      );
    });
  }, [events, tab, search, selectedBucket]);

  const perSourceNewCount = useMemo(() => {
    const counts: Record<string, number> = { all: newEventIds.size };
    for (const ev of events) {
      if (newEventIds.has(ev.id)) counts[ev.source] = (counts[ev.source] || 0) + 1;
    }
    return counts;
  }, [events, newEventIds]);

  const bucketCounts = useMemo(() => {
    const c = { total: events.length, created: 0, updated: 0, status: 0, other: 0 };
    for (const ev of events) c[ev.bucket]++;
    return c;
  }, [events]);

  const exportCsv = () => {
    const header = [
      t('csv.timestamp'),
      t('csv.source'),
      t('csv.action'),
      t('csv.entity'),
      t('csv.user'),
      t('csv.message'),
    ];
    const rows = filtered.map((e) => [
      e.performedAt,
      t(`source.${e.source}`, { defaultValue: e.source }),
      t(`action.${e.action}`, { defaultValue: e.actionLabel }),
      e.entityLabel,
      e.actor.name,
      (e.message || '').replace(/"/g, '""'),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? '')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traceability-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const dateLocale = localeFor(i18n.language);
  const updatedLabel = lastUpdatedAt
    ? t('live.updated', {
        time: formatDistanceToNow(lastUpdatedAt, { addSuffix: true, locale: dateLocale }),
      })
    : null;

  const statsData: Array<{
    key: 'all' | ActivityBucket;
    label: string;
    value: number;
    icon: typeof Activity;
    color: string;
  }> = [
    { key: 'all', label: t('stats.total'), value: bucketCounts.total, icon: Activity, color: 'chart-1' },
    { key: 'created', label: t('stats.created'), value: bucketCounts.created, icon: PlusCircle, color: 'chart-2' },
    { key: 'updated', label: t('stats.updated'), value: bucketCounts.updated, icon: PencilLine, color: 'chart-3' },
    { key: 'status', label: t('stats.status'), value: bucketCounts.status, icon: ArrowRightLeft, color: 'chart-4' },
    { key: 'other', label: t('stats.other'), value: bucketCounts.other, icon: Sparkles, color: 'chart-5' },
  ];

  const subtitle = workspace
    ? t('subtitleWorkspace', {
        workspace: t(`workspaces.${workspace}`, { defaultValue: workspace }),
      })
    : t('subtitle');

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between gap-2 p-3 border-b border-border bg-card/50 backdrop-blur">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-foreground truncate">{t('title')}</h1>
              <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', (loading || isRefetching) && 'animate-spin')} />
          </Button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
              <p className="text-[11px] text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                    autoRefresh
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15'
                      : 'border-border bg-muted text-muted-foreground hover:bg-muted/70',
                  )}
                >
                  {autoRefresh ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                      {t('live.on')}
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
                      {t('live.off')}
                    </>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {autoRefresh ? t('live.tooltip', { seconds: POLL_SECONDS }) : t('live.resume')}
              </TooltipContent>
            </Tooltip>
            <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
              {autoRefresh ? (
                <>
                  <Pause className="h-4 w-4 mr-1.5" /> {t('live.pause')}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1.5" /> {t('live.resume')}
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4 mr-1.5', (loading || isRefetching) && 'animate-spin')} />
              {t('refresh')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={!filtered.length}
              className="bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
            >
              <Download className="h-4 w-4 mr-1.5" /> {t('export')}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="p-3 sm:p-4 border-b border-border">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {statsData.map((stat) => {
              const isSelected = selectedBucket === stat.key;
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.key}
                  className={cn(
                    'shadow-card hover-lift gradient-card group cursor-pointer transition-all hover:shadow-lg',
                    isSelected ? 'border-2 border-primary bg-primary/5' : 'border-0',
                  )}
                  onClick={() => setSelectedBucket(stat.key)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={cn(
                            'p-2 rounded-lg transition-all flex-shrink-0',
                            isSelected
                              ? 'bg-primary/20'
                              : `bg-${stat.color}/10 group-hover:bg-${stat.color}/20`,
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4 transition-all',
                              isSelected ? 'text-primary' : `text-${stat.color}`,
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground font-medium truncate">
                            {stat.label}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
                          {formatStatValue(stat.value)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="p-3 sm:p-4 border-b border-border bg-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-3 sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-3 sm:ml-auto">
              {updatedLabel && <span className="hidden sm:inline">{updatedLabel}</span>}
              <span>{t('counts', { shown: filtered.length, total: events.length })}</span>
            </div>
          </div>
        </div>

        {/* Tabs + Feed */}
        <div className="p-3 sm:p-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as ActivitySource | 'all')}>
            <TabsList className="flex-wrap h-auto justify-start">
              {tabKeys.map((key) => {
                const count = perSourceNewCount[key] || 0;
                const Icon = key === 'all' ? Activity : SOURCE_ICON[key as ActivitySource] ?? Activity;
                return (
                  <TabsTrigger key={key} value={key} className="text-xs relative gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {t(`tabs.${key}`)}
                    {count > 0 && (
                      <Badge
                        variant="default"
                        className="ml-1 h-4 min-w-[16px] px-1 text-[10px] leading-none"
                      >
                        {count}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={tab} className="mt-4">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              ) : error ? (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-destructive">
                    {t('loadError')}: {error}
                  </CardContent>
                </Card>
              ) : allowedSources.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    {t('noAccess')}
                  </CardContent>
                </Card>
              ) : (
                <ActivityFeed events={filtered} highlightIds={newEventIds} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}
