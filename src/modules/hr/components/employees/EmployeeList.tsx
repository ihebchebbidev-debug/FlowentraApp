import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmployees } from '../../hooks/useEmployees';
import { UserAvatar } from '@/components/ui/user-avatar';
import { formatTnd } from '../../utils/money';
import { HRPageHeader } from '../HRPageHeader';
import { HRStatsStrip, type HRStatItem } from '../HRStatsStrip';
import { CheckCircle2, CircleAlert, Users, UserCheck } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchAndFilterBar } from '@/shared/components/SearchAndFilterBar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { selectEmployeeRows } from '../../utils/employeeRows';

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
            <Badge variant="secondary" className="text-[11px]">
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
        <CardContent className="overflow-x-auto">
          {employeesQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">{t('loading')}</div>
          ) : employeesQuery.error ? (
            <div className="text-sm text-destructive">{String(employeesQuery.error)}</div>
          ) : filteredBySalary.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-sm font-medium">{t('employeesPage.emptyTitle')}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('employeesPage.emptyHint')}</div>
            </div>
          ) : (
            <Table className="min-w-[650px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('employee.name')}</TableHead>
                  <TableHead>{t('employeesPage.cin')}</TableHead>
                  <TableHead>{t('employee.position')}</TableHead>
                  <TableHead>{t('employee.department')}</TableHead>
                  <TableHead>{t('employeesPage.status')}</TableHead>
                  <TableHead>{t('employee.cnssNumber')}</TableHead>
                  <TableHead>{t('employee.grossSalary')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBySalary.map((r: any) => {
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
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}

