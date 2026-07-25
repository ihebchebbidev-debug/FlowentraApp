import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, ChevronDown, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CollapsibleSearch } from '@/components/ui/collapsible-search';
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
import type { ActivityBucket, ActivitySource } from '../types';
import { ALL_SOURCES, WORKSPACE_SOURCES } from '../types';
import { usePermissions } from '@/hooks/usePermissions';
import { SOURCE_TO_MODULE } from '../permissions';


const POLL_MS = 20_000;

export default function TraceabilityPage() {
  const { t } = useTranslation('traceability');
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
    newEventIds,
    refresh,
  } = useAggregatedActivity({
    sources: allowedSources,
    enabled: !permsLoading && allowedSources.length > 0,
    pollIntervalMs: POLL_MS,
  });

  const [tab, setTab] = useState<ActivitySource | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [filterBucket, setFilterBucket] = useState<'all' | ActivityBucket>('all');
  const [filterActor, setFilterActor] = useState<'all' | string>('all');
  const [filterDateRange, setFilterDateRange] = useState<'any' | '7' | '30' | '365'>('any');

  useEffect(() => {
    if (tab !== 'all' && !allowedSources.includes(tab)) setTab('all');
  }, [allowedSources, tab]);

  const resolveActorName = (a: { id?: string | number; name?: string }) => {
    const idStr = a.id != null ? String(a.id) : '';
    const nameStr = a.name != null ? String(a.name) : '';
    if (idStr === '1' || nameStr === '1') return 'MainAdminUser';
    return nameStr || 'System';
  };

  const actorOptions = useMemo(
    () => Array.from(new Set(events.map((e) => resolveActorName(e.actor)).filter(Boolean))),
    [events],
  );

  const activeFilterCount =
    (filterBucket !== 'all' ? 1 : 0) +
    (filterActor !== 'all' ? 1 : 0) +
    (filterDateRange !== 'any' ? 1 : 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (tab !== 'all' && e.source !== tab) return false;
      if (filterBucket !== 'all' && e.bucket !== filterBucket) return false;
      if (filterActor !== 'all' && resolveActorName(e.actor) !== filterActor) return false;
      if (filterDateRange !== 'any') {
        const days = Number(filterDateRange);
        if (e.performedAt) {
          const performed = new Date(e.performedAt);
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - days);
          if (performed < cutoff) return false;
        }
      }
      if (!q) return true;
      return (
        e.message?.toLowerCase().includes(q) ||
        e.entityLabel?.toLowerCase().includes(q) ||
        e.actor.name?.toLowerCase().includes(q) ||
        e.actionLabel?.toLowerCase().includes(q)
      );
    });
  }, [events, tab, search, filterBucket, filterActor, filterDateRange]);

  const pagination = usePaginatedData(filtered, 20);

  // Reset to first page when filters change
  useEffect(() => {
    pagination.actions.goToPage(1);
  }, [tab, search, filterBucket, filterActor, filterDateRange]);


  const perSourceNewCount = useMemo(() => {
    const counts: Record<string, number> = { all: newEventIds.size };
    for (const ev of events) {
      if (newEventIds.has(ev.id)) counts[ev.source] = (counts[ev.source] || 0) + 1;
    }
    return counts;
  }, [events, newEventIds]);



  const subtitle = workspace

    ? t('subtitleWorkspace', {
        workspace: t(`workspaces.${workspace}`, { defaultValue: workspace }),
      })
    : t('subtitle');

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col bg-white">
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
              <p className="text-px-11 text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4 mr-1.5', (loading || isRefetching) && 'animate-spin')} />
              {t('refresh')}
            </Button>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="p-3 sm:p-4 border-b border-border bg-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
            <div className="flex gap-2 sm:gap-3 flex-1 w-full items-center">
              <div className="flex-1">
                <CollapsibleSearch
                  placeholder={t('search')}
                  value={search}
                  onChange={setSearch}
                  className="w-full"
                />
              </div>
              {/* Filter dropdown replaced by slide-down filter bar (see below) */}
              <div className="relative">
                <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3" onClick={() => setShowFilterBar((s) => !s)}>
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('filters.filters')}</span>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Slide-down filter bar */}
        {showFilterBar && (
          <div className="p-3 sm:p-4 border-b border-border bg-background/50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="relative">
                  <select
                    className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full text-sm"
                    value={filterBucket}
                    onChange={(e) => setFilterBucket(e.target.value as 'all' | ActivityBucket)}
                  >
                    <option value="all">{t('filters.allActions')}</option>
                    <option value="created">{t('stats.created')}</option>
                    <option value="updated">{t('stats.updated')}</option>
                    <option value="status">{t('stats.status')}</option>
                    <option value="other">{t('stats.other')}</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <div className="relative">
                  <select
                    className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full text-sm"
                    value={filterActor}
                    onChange={(e) => setFilterActor(e.target.value)}
                  >
                    <option value="all">{t('filters.allUsers')}</option>
                    {actorOptions.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <div className="relative">
                  <select
                    className="border rounded px-3 py-2 pr-10 appearance-none bg-background text-foreground w-full text-sm"
                    value={filterDateRange}
                    onChange={(e) => setFilterDateRange(e.target.value as 'any' | '7' | '30' | '365')}
                  >
                    <option value="any">{t('filters.anyTime')}</option>
                    <option value="7">{t('filters.last7Days')}</option>
                    <option value="30">{t('filters.last30Days')}</option>
                    <option value="365">{t('filters.lastYear')}</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded-full border border-border text-sm"
                  onClick={() => {
                    setFilterBucket('all');
                    setFilterActor('all');
                    setFilterDateRange('any');
                  }}
                >
                  {t('filters.clear')}
                </button>
              </div>
            </div>
          </div>
        )}

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
