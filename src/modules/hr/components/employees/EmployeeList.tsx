import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmployees } from '../../hooks/useEmployees';
import { UserAvatar } from '@/components/ui/user-avatar';
import { formatTnd } from '../../utils/money';
import { HRPageHeader } from '../HRPageHeader';
import { HRStatsStrip, type HRStatItem } from '../HRStatsStrip';
import { CheckCircle2, CircleAlert, Users, UserCheck, Building2, BadgeCheck, Banknote, CreditCard } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchAndFilterBar } from '@/shared/components/SearchAndFilterBar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { selectEmployeeRows } from '../../utils/employeeRows';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/shared/SortableHeader';
import { SortMenu } from '@/components/shared/SortMenu';

export function EmployeeList() {
  const { t } = useTranslation('hr');
  const { employeesQuery } = useEmployees();
  const [q, setQ] = useState('');
  const [salaryFilter, setSalaryFilter] = useState<'all' | 'missing' | 'ready'>('all');

  const rows = useMemo(() => selectEmployeeRows(employeesQuery.data), [employeesQuery.data]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r: any) => {
      const name = `${r?.user?.firstName ?? ''} ${r?.user?.lastName ?? ''}`.trim().toLowerCase();
      const email = String(r?.user?.email ?? '').toLowerCase();
      const dept = String(r?.salaryConfig?.department ?? '').toLowerCase();
      return name.includes(s) || email.includes(s) || dept.includes(s);
    });
  }, [rows, q]);

  const salaryReadyCount = useMemo(() => {
    return rows.filter((r: any) => Number.isFinite(Number(r?.salaryConfig?.grossSalary))).length;
  }, [rows]);

  const salaryMissingCount = useMemo(() => {
    return rows.filter((r: any) => !Number.isFinite(Number(r?.salaryConfig?.grossSalary))).length;
  }, [rows]);

  const filteredBySalary = useMemo(() => {
    if (salaryFilter === 'all') return filtered;
    if (salaryFilter === 'ready') return filtered.filter((r: any) => Number.isFinite(Number(r?.salaryConfig?.grossSalary)));
    return filtered.filter((r: any) => !Number.isFinite(Number(r?.salaryConfig?.grossSalary)));
  }, [filtered, salaryFilter]);

  const { sortKey, sortDirection, toggleSort, sortItems } = useTableSort<any>({
    name: (r) => `${r?.user?.firstName ?? ''} ${r?.user?.lastName ?? ''}`.trim() || r?.user?.email,
    cin: (r) => r?.salaryConfig?.cin,
    position: (r) => r?.salaryConfig?.position,
    department: (r) => r?.salaryConfig?.department,
    status: (r) => Number.isFinite(Number(r?.salaryConfig?.grossSalary)) ? 1 : 0,
    cnssNumber: (r) => r?.salaryConfig?.cnssNumber,
    grossSalary: (r) => r?.salaryConfig?.grossSalary,
  });
  const sortedRows = useMemo(() => sortItems(filteredBySalary), [filteredBySalary, sortItems]);

  return (
    <div className="flex flex-col">
      <HRPageHeader
        title={t('employees')}
        subtitle={t('employeesPage.subtitle')}
        icon={Users}
        accentColor="chart-1"
        backTo={{ to: '/dashboard/hr', label: t('dashboard') }}
      />

      <div className="p-3 sm:p-4 lg:p-6 space-y-4">
        <HRStatsStrip
          selectedKey={salaryFilter}
          onSelect={(k) => setSalaryFilter(k as 'all' | 'missing' | 'ready')}
          items={[
            { key: 'all', label: t('employeesPage.filters.all'), value: rows.length, icon: Users, color: 'chart-1', filterable: true },
            { key: 'ready', label: t('employeesPage.filters.payrollReady'), value: salaryReadyCount, icon: CheckCircle2, color: 'chart-3', filterable: true },
            { key: 'missing', label: t('employeesPage.filters.missingSalary'), value: salaryMissingCount, icon: CircleAlert, color: 'chart-4', filterable: true },
            { key: 'active', label: t('employeesPage.statusActive'), value: salaryReadyCount, icon: UserCheck, color: 'chart-2' } as HRStatItem,
          ]}
        />

        <Card className="shadow-card border-0 bg-card">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">{t('employees')}</CardTitle>
            <Badge variant="secondary" className="text-px-11">
              {filteredBySalary.length} / {rows.length}
            </Badge>
          </div>
          <SearchAndFilterBar
            searchTerm={q}
            onSearchChange={setQ}
            placeholder={t('common.searchPlaceholder')}
            labels={{
              allPrefix: t('common.all'),
              clearAll: t('common.clearAll'),
              filters: t('common.filters'),
              filtersTitle: t('common.filters'),
              selectPrefix: t('common.select'),
              filterCountSuffixSingular: t('common.filter'),
              filterCountSuffixPlural: t('common.filtersPlural'),
            }}
            fullWidth
          />
        </CardHeader>
        <CardContent className="p-0">
          {employeesQuery.isLoading ? (
            <div className="text-sm text-muted-foreground p-4">{t('loading')}</div>
          ) : employeesQuery.error ? (
            <div className="text-sm text-destructive p-4">{String(employeesQuery.error)}</div>
          ) : filteredBySalary.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-sm font-medium">{t('employeesPage.emptyTitle')}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('employeesPage.emptyHint')}</div>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden flex justify-end p-2 border-b border-border/50">
                <SortMenu
                  options={[
                    { key: 'name', label: t('employee.name') },
                    { key: 'cin', label: t('employeesPage.cin') },
                    { key: 'position', label: t('employee.position') },
                    { key: 'department', label: t('employee.department') },
                    { key: 'status', label: t('employeesPage.status') },
                    { key: 'cnssNumber', label: t('employee.cnssNumber') },
                    { key: 'grossSalary', label: t('employee.grossSalary') },
                  ]}
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={toggleSort}
                />
              </div>
              <div className="md:hidden divide-y divide-border/50">
                {sortedRows.map((r: any) => {
                  const user = r.user ?? {};
                  const cfg = r.salaryConfig ?? null;
                  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || `#${user.id}`;
                  const salaryReady = Number.isFinite(Number(cfg?.grossSalary));
                  const firstInitial = (user.firstName ?? '').charAt(0).toUpperCase();
                  const lastInitial = (user.lastName ?? '').charAt(0).toUpperCase();
                  const initials = firstInitial || lastInitial ? `${firstInitial}${lastInitial}` : (user.email ?? '#').charAt(0).toUpperCase();
                  return (
                    <a
                      key={user.id}
                      href={`/dashboard/hr/employees/${user.id}`}
                      className="block p-4 bg-card hover:bg-muted/30 transition-colors"
                    >
                      {/* Header: initials avatar + name + status badge */}
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-sm text-foreground leading-snug line-clamp-1 flex-1">{name}</p>
                            <span
                              className={cn(
                                'inline-flex items-center rounded px-2 py-0.5 text-px-10 font-medium capitalize shrink-0',
                                salaryReady
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                                  : 'bg-amber-500/15 text-amber-800 dark:text-amber-200'
                              )}
                            >
                              {salaryReady ? t('employeesPage.statusActive') : t('employeesPage.statusIncomplete')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{cfg?.position ?? user.email ?? '—'}</p>
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-12 mt-2">
                        {cfg?.department && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span>{cfg.department}</span>
                          </div>
                        )}
                        {(cfg as any)?.cin && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CreditCard className="h-3 w-3 shrink-0" />
                            <span className="font-mono">{(cfg as any).cin}</span>
                          </div>
                        )}
                        {cfg?.cnssNumber && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <BadgeCheck className="h-3 w-3 shrink-0" />
                            <span className="font-mono">{cfg.cnssNumber}</span>
                          </div>
                        )}
                      </div>

                      {/* Footer: salary */}
                      {cfg?.grossSalary != null && (
                        <div className="flex items-center gap-1.5 pl-12 mt-2">
                          <Banknote className="h-3 w-3 shrink-0 text-primary" />
                          <span className="text-sm font-semibold text-primary">{formatTnd(cfg.grossSalary)}</span>
                        </div>
                      )}
                    </a>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table className="min-w-[650px]">
                  <TableHeader>
                    <TableRow>
                      <SortableHeader columnKey="name" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('employee.name')}</SortableHeader>
                      <SortableHeader columnKey="cin" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('employeesPage.cin')}</SortableHeader>
                      <SortableHeader columnKey="position" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('employee.position')}</SortableHeader>
                      <SortableHeader columnKey="department" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('employee.department')}</SortableHeader>
                      <SortableHeader columnKey="status" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('employeesPage.status')}</SortableHeader>
                      <SortableHeader columnKey="cnssNumber" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('employee.cnssNumber')}</SortableHeader>
                      <SortableHeader columnKey="grossSalary" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('employee.grossSalary')}</SortableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRows.map((r: any) => {
                      const user = r.user ?? {};
                      const cfg = r.salaryConfig ?? null;
                      const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || `#${user.id}`;
                      const salaryReady = Number.isFinite(Number(cfg?.grossSalary));
                      return (
                        <TableRow key={user.id} to={`/dashboard/hr/employees/${user.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <UserAvatar
                                src={user.profilePictureUrl}
                                name={name}
                                seed={user.id}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <div className="truncate font-medium">{name}</div>
                                <div className="truncate text-xs text-muted-foreground">{user.email ?? '—'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{(cfg as any)?.cin ?? '—'}</TableCell>
                          <TableCell>{cfg?.position ?? '—'}</TableCell>
                          <TableCell>{cfg?.department ?? '—'}</TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'inline-flex items-center rounded px-2 py-1 text-xs font-medium capitalize',
                                salaryReady ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200' : 'bg-amber-500/15 text-amber-800 dark:text-amber-200'
                              )}
                            >
                              {salaryReady ? t('employeesPage.statusActive') : t('employeesPage.statusIncomplete')}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{cfg?.cnssNumber ?? '—'}</TableCell>
                          <TableCell>{cfg?.grossSalary != null ? formatTnd(cfg.grossSalary) : '—'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
