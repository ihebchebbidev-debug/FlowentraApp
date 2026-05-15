import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { schedulesApi, type UserLeave } from '@/services/api/schedulesApi';
import { useEmployees } from '../../hooks/useEmployees';
import { SearchAndFilterBar, type FilterGroup } from '@/shared/components/SearchAndFilterBar';
import { Badge } from '@/components/ui/badge';
import dayjs from 'dayjs';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';

type LeaveRow = UserLeave & { userId: number; userName: string };

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let idx = 0;

  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (idx < items.length) {
      const current = idx++;
      results[current] = await fn(items[current]);
    }
  });

  await Promise.all(workers);
  return results;
}

export function LeavesList() {
  const { t } = useTranslation('hr');
  const { employeesQuery } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<{ employeeId?: string; status?: string; type?: string }>({
    employeeId: 'all',
    status: 'all',
    type: 'all',
  });

  const users = useMemo(() => {
    const rows = employeesQuery.data ?? [];
    return rows
      .map((r: any) => r.user)
      .filter(Boolean)
      .map((u: any) => ({
        id: Number(u.id),
        name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || `#${u.id}`,
        profilePictureUrl: u.profilePictureUrl ?? null,
        email: u.email ?? null,
      }));
  }, [employeesQuery.data]);

  const usersById = useMemo(() => {
    const map = new Map<number, { name: string; profilePictureUrl?: string | null; email?: string | null }>();
    for (const u of users) map.set(Number(u.id), u);
    return map;
  }, [users]);

  const leavesQuery = useQuery({
    queryKey: ['hr', 'planningLeaves', users.map(u => u.id)],
    enabled: users.length > 0,
    queryFn: async () => {
      const perUser = await mapWithConcurrency(users, 5, async (u) => {
        const leaves = await schedulesApi.getLeaves(u.id);
        return leaves.map(l => ({ ...l, userId: u.id, userName: u.name })) as LeaveRow[];
      });
      return perUser.flat();
    },
  });

  const sorted = useMemo(() => {
    const list = leavesQuery.data ?? [];
    return [...list].sort((a, b) => (a.startDate > b.startDate ? -1 : 1));
  }, [leavesQuery.data]);

  const statusClass = (status: string) => {
    switch (String(status)) {
      case 'approved':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200';
      case 'rejected':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-200';
      case 'pending':
        return 'bg-amber-500/15 text-amber-800 dark:text-amber-200';
      case 'cancelled':
        return 'bg-zinc-500/10 text-muted-foreground';
      default:
        return 'bg-zinc-500/10 text-muted-foreground';
    }
  };

  const formatRange = (start: string, end: string) => {
    const s = dayjs(start);
    const e = dayjs(end);
    if (!s.isValid() || !e.isValid()) return `${start} → ${end}`;
    if (s.isSame(e, 'day')) return s.format('DD MMM YYYY');
    if (s.isSame(e, 'month')) return `${s.format('DD')}–${e.format('DD MMM YYYY')}`;
    if (s.isSame(e, 'year')) return `${s.format('DD MMM')}–${e.format('DD MMM YYYY')}`;
    return `${s.format('DD MMM YYYY')}–${e.format('DD MMM YYYY')}`;
  };

  const filterGroups: FilterGroup[] = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    for (const l of sorted) {
      const s = String(l.status || 'pending');
      statusCounts[s] = (statusCounts[s] || 0) + 1;
      const tp = String(l.leaveType || 'annual');
      typeCounts[tp] = (typeCounts[tp] || 0) + 1;
    }

    const formatToken = (v: string) => v.replace(/_/g, ' ').trim();

    return [
      {
        key: 'employeeId',
        label: t('filters.employee'),
        options: users.map(u => ({ value: String(u.id), label: u.name })),
      },
      {
        key: 'status',
        label: t('filters.status'),
        options: Object.keys(statusCounts).sort().map(k => ({
          value: k,
          label: t(`leaveStatus.${k}`, { defaultValue: formatToken(k) }),
          count: statusCounts[k],
        })),
      },
      {
        key: 'type',
        label: t('filters.type'),
        options: Object.keys(typeCounts).sort().map(k => ({
          value: k,
          label: t(`leaveType.${k}`, { defaultValue: formatToken(k) }),
          count: typeCounts[k],
        })),
      },
    ];
  }, [sorted, t, users]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return sorted.filter(l => {
      const matchesQ =
        q === '' ||
        l.userName.toLowerCase().includes(q) ||
        String(l.leaveType || '').toLowerCase().includes(q) ||
        String(l.status || '').toLowerCase().includes(q) ||
        String(l.reason || '').toLowerCase().includes(q);

      const matchesEmployee = activeFilters.employeeId === 'all' || String(l.userId) === String(activeFilters.employeeId);
      const matchesStatus = activeFilters.status === 'all' || String(l.status || '') === String(activeFilters.status);
      const matchesType = activeFilters.type === 'all' || String(l.leaveType || '') === String(activeFilters.type);
      return matchesQ && matchesEmployee && matchesStatus && matchesType;
    });
  }, [activeFilters.employeeId, activeFilters.status, activeFilters.type, searchTerm, sorted]);

  const statusSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of filtered) {
      const s = String(l.status || 'pending');
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [filtered]);

  return (
    <Card className="shadow-card border-0 bg-card">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{t('leavesPage.listTitle')}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-[11px]">
              {filtered.length}
            </Badge>
            {(['pending', 'approved', 'rejected'] as const).map((k) => (
              <Badge key={k} variant="outline" className="text-[11px] capitalize">
                {t(`leaveStatus.${k}`)}: {statusSummary[k] || 0}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder={t('common.searchPlaceholder')}
          filterGroups={filterGroups}
          activeFilters={activeFilters as any}
          onFilterChange={(key, value) => setActiveFilters(prev => ({ ...prev, [key]: value as string }))}
          onClearFilters={() => setActiveFilters({ employeeId: 'all', status: 'all', type: 'all' })}
          labels={{
            allPrefix: t('common.all'),
            clearAll: t('common.clearAll'),
            filters: t('common.filters'),
            filtersTitle: t('common.filters'),
            selectPrefix: t('common.select'),
            filterCountSuffixSingular: t('common.filter'),
            filterCountSuffixPlural: t('common.filtersPlural'),
          }}
          className="mb-4"
          fullWidth
        />

        {employeesQuery.isLoading || leavesQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">{t('loading')}</div>
        ) : (employeesQuery.error || leavesQuery.error) ? (
          <div className="text-sm text-destructive">{String(employeesQuery.error || leavesQuery.error)}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('employee.employee')}</TableHead>
                <TableHead>{t('leavesPage.type')}</TableHead>
                <TableHead>{t('leavesPage.dates')}</TableHead>
                <TableHead>{t('leavesPage.status')}</TableHead>
                <TableHead>{t('leavesPage.reason')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    {t('leavesPage.noLeaves')}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">
                      {(() => {
                        const u = usersById.get(Number(l.userId));
                        const nm = u?.name ?? l.userName;
                        return (
                          <div className="flex items-center gap-2.5 min-w-0">
                            <UserAvatar src={u?.profilePictureUrl} name={nm} seed={Number(l.userId)} size="sm" />
                            <div className="min-w-0">
                              <div className="truncate">{nm}</div>
                              <div className="truncate text-xs text-muted-foreground">{u?.email ?? '—'}</div>
                            </div>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="capitalize">{t(`leaveType.${String(l.leaveType)}`, { defaultValue: String(l.leaveType).replace(/_/g, ' ') })}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatRange(String(l.startDate), String(l.endDate))}</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center rounded px-2 py-1 text-xs font-medium capitalize", statusClass(String(l.status || 'pending')))}>
                        {t(`leaveStatus.${String(l.status || 'pending')}`, { defaultValue: String(l.status || '').replace(/_/g, ' ') })}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate">{l.reason ?? '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

