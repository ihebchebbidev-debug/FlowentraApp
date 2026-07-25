import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr as frLocale, arSA } from 'date-fns/locale';
import { Activity, Download, Pause, Play, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAggregatedActivity } from '../hooks/useAggregatedActivity';
import { ActivityFeed } from '../components/ActivityFeed';
import type { ActivityLevel, ActivitySource } from '../types';
import { usePermissions } from '@/hooks/usePermissions';
import { SOURCE_TO_MODULE } from '../permissions';

const POLL_MS = 20_000;
const POLL_SECONDS = POLL_MS / 1000;

const ALL_tabKeys: Array<ActivitySource> = [
  'sales',
  'offers',
  'deals',
  'invoices',
  'purchases',
  'service',
  'system',
];

function localeFor(lang: string) {
  if (lang?.startsWith('fr')) return frLocale;
  if (lang?.startsWith('ar')) return arSA;
  return enUS;
}

export default function TraceabilityPage() {
  const { t, i18n } = useTranslation('traceability');
  const { isMainAdmin, hasAnyPermission, isLoading: permsLoading } = usePermissions();

  // Sources this user is allowed to see.
  const allowedSources = useMemo<ActivitySource[]>(() => {
    if (isMainAdmin) return ALL_tabKeys;
    return ALL_tabKeys.filter((src) =>
      hasAnyPermission(SOURCE_TO_MODULE[src], ['read', 'read_logs', 'view_all', 'view_own']),
    );
  }, [isMainAdmin, hasAnyPermission]);

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
  const [level, setLevel] = useState<ActivityLevel | 'all'>('all');

  // If the active tab is no longer permitted, snap back to "all".
  useEffect(() => {
    if (tab !== 'all' && !allowedSources.includes(tab)) setTab('all');
  }, [allowedSources, tab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (tab !== 'all' && e.source !== tab) return false;
      if (level !== 'all' && e.level !== level) return false;
      if (!q) return true;
      return (
        e.message?.toLowerCase().includes(q) ||
        e.entityLabel?.toLowerCase().includes(q) ||
        e.actor.name?.toLowerCase().includes(q) ||
        e.actionLabel?.toLowerCase().includes(q)
      );
    });
  }, [events, tab, search, level]);

  const perSourceNewCount = useMemo(() => {
    const counts: Record<string, number> = { all: newEventIds.size };
    for (const ev of events) {
      if (newEventIds.has(ev.id)) counts[ev.source] = (counts[ev.source] || 0) + 1;
    }
    return counts;
  }, [events, newEventIds]);

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
    const csv =
      [header, ...rows]
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

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col">
        <div className="border-b bg-card/40">
          <div className="p-4 md:p-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                  {t('title')}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground">{t('subtitle')}</p>
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
                  {autoRefresh
                    ? t('live.tooltip', { seconds: POLL_SECONDS })
                    : t('live.resume')}
                </TooltipContent>
              </Tooltip>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="hidden md:inline-flex"
              >
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
                <RefreshCw
                  className={`h-4 w-4 mr-1.5 ${loading || isRefetching ? 'animate-spin' : ''}`}
                />
                {t('refresh')}
              </Button>
              <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}>
                <Download className="h-4 w-4 mr-1.5" /> {t('export')}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          <Card>
            <CardContent className="p-3 md:p-4 flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <Select value={level} onValueChange={(v) => setLevel(v as ActivityLevel | 'all')}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder={t('level.label')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('level.all')}</SelectItem>
                  <SelectItem value="info">{t('level.info')}</SelectItem>
                  <SelectItem value="success">{t('level.success')}</SelectItem>
                  <SelectItem value="warning">{t('level.warning')}</SelectItem>
                  <SelectItem value="error">{t('level.error')}</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground ml-auto flex items-center gap-3">
                {updatedLabel && (
                  <span className="hidden sm:inline">{updatedLabel}</span>
                )}
                <span>
                  {t('counts', { shown: filtered.length, total: events.length })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="flex-wrap h-auto">
              {tabKeys.map((key) => {
                const count = perSourceNewCount[key] || 0;
                return (
                  <TabsTrigger key={key} value={key} className="text-xs relative">
                    {t(`tabs.${key}`)}
                    {count > 0 && (
                      <Badge
                        variant="default"
                        className="ml-1.5 h-4 min-w-[16px] px-1 text-[10px] leading-none"
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
                    {t('noAccess', {
                      defaultValue:
                        "You don't have access to any workspace activity. Ask an administrator to grant read access.",
                    })}
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
