import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr as frLocale } from 'date-fns/locale';
import { Download, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { SimplePaginationBar } from '@/components/shared/SimplePaginationBar';
import { usePaginatedData } from '@/shared/hooks/usePagination';
import { useAggregatedActivity } from '../hooks/useAggregatedActivity';
import { ActivityFeed } from '../components/ActivityFeed';
import type { ActivitySource } from '../types';
import { ALL_SOURCES, WORKSPACE_SOURCES } from '../types';
import { usePermissions } from '@/hooks/usePermissions';
import { SOURCE_TO_MODULE } from '../permissions';


const POLL_MS = 20_000;

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
    refresh,
  } = useAggregatedActivity({
    sources: allowedSources,
    enabled: !permsLoading && allowedSources.length > 0,
    pollIntervalMs: POLL_MS,
  });

  const [tab, setTab] = useState<ActivitySource | 'all'>('all');
  const [search, setSearch] = useState('');


  useEffect(() => {
    if (tab !== 'all' && !allowedSources.includes(tab)) setTab('all');
  }, [allowedSources, tab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (tab !== 'all' && e.source !== tab) return false;
      if (!q) return true;
      return (
        e.message?.toLowerCase().includes(q) ||
        e.entityLabel?.toLowerCase().includes(q) ||
        e.actor.name?.toLowerCase().includes(q) ||
        e.actionLabel?.toLowerCase().includes(q)
      );
    });
  }, [events, tab, search]);

  const pagination = usePaginatedData(filtered, 20);

  // Reset to first page when filters change
  useEffect(() => {
    pagination.actions.goToPage(1);
  }, [tab, search]);


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

  const subtitle = workspace

    ? t('subtitleWorkspace', {
        workspace: t(`workspaces.${workspace}`, { defaultValue: workspace }),
      })
    : t('subtitle');

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col bg-white">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between gap-2 p-3 border-b border-border bg-white">
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate">{t('title')}</h1>
            <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', (loading || isRefetching) && 'animate-spin')} />
          </Button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between p-4 border-b border-border bg-white">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4 mr-1.5', (loading || isRefetching) && 'animate-spin')} />
              {t('refresh')}
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}>
              <Download className="h-4 w-4 mr-1.5" /> {t('export')}
            </Button>
          </div>
        </div>

        {/* Search */}

        <div className="p-3 sm:p-4 border-b border-border bg-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-3 sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 bg-white"
              />
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-3 sm:ml-auto">
              {updatedLabel && <span className="hidden sm:inline">{updatedLabel}</span>}
              <span>{t('counts', { shown: filtered.length, total: events.length })}</span>
            </div>
          </div>
        </div>

        {/* Tabs + Feed */}
        <div className="p-3 sm:p-4 bg-white">
          <Tabs value={tab} onValueChange={(v) => setTab(v as ActivitySource | 'all')}>
            <TabsList className="flex-wrap h-auto justify-start bg-white">
              {tabKeys.map((key) => {
                const count = perSourceNewCount[key] || 0;
                return (
                  <TabsTrigger key={key} value={key} className="text-xs relative gap-1.5">
                    {t(`tabs.${key}`)}
                    {count > 0 && (
                      <Badge
                        variant="secondary"
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
                    <Skeleton key={i} className="h-10 w-full rounded-md bg-muted/30" />
                  ))}
                </div>
              ) : error ? (
                <Card className="bg-white">
                  <CardContent className="py-10 text-center text-sm text-destructive">
                    {t('loadError')}: {error}
                  </CardContent>
                </Card>
              ) : allowedSources.length === 0 ? (
                <Card className="bg-white">
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    {t('noAccess')}
                  </CardContent>
                </Card>
              ) : (
                <>
                  <SimplePaginationBar
                    className="bg-white rounded-t-md border border-border"
                    startIndex={pagination.info.startIndex}
                    endIndex={pagination.info.endIndex}
                    totalItems={filtered.length}
                    currentPage={pagination.state.currentPage}
                    totalPages={pagination.info.totalPages}
                    hasPreviousPage={pagination.info.hasPreviousPage}
                    hasNextPage={pagination.info.hasNextPage}
                    onPreviousPage={pagination.actions.previousPage}
                    onNextPage={pagination.actions.nextPage}
                  />
                  <ActivityFeed
                    events={pagination.data}
                    highlightIds={newEventIds}
                    className="rounded-none border-t-0 border-x border-b"
                  />
                  <SimplePaginationBar
                    className="bg-white rounded-b-md border border-border border-t-0"
                    startIndex={pagination.info.startIndex}
                    endIndex={pagination.info.endIndex}
                    totalItems={filtered.length}
                    currentPage={pagination.state.currentPage}
                    totalPages={pagination.info.totalPages}
                    hasPreviousPage={pagination.info.hasPreviousPage}
                    hasNextPage={pagination.info.hasNextPage}
                    onPreviousPage={pagination.actions.previousPage}
                    onNextPage={pagination.actions.nextPage}
                  />
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}
