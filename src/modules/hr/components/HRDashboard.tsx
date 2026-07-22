import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  CalendarDays,
  Coins,
  ClipboardList,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Gift,
  BarChart3,
  Play,
} from 'lucide-react';
import { useEmployees } from '../hooks/useEmployees';
import { HRPageHeader } from './HRPageHeader';
import { useMemo, useState } from 'react';
import { HRAutopilotDemo } from './onboarding/HRAutopilotDemo';
import { useQuery } from '@tanstack/react-query';
import { schedulesApi, type UserLeave } from '@/services/api/schedulesApi';
import dayjs from 'dayjs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useCnssRates } from '../hooks/useCnss';
import { formatTnd } from '../utils/money';
import { calculateTunisianNetSalary, cnssRateToTaxEngineRates } from '../utils/tunisianTaxEngine';
import { hrApi } from '../services/hrApi';
import { selectEmployeeRows } from '../utils/employeeRows';

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

export function HRDashboard() {
  const { t } = useTranslation('hr');
  const { employeesQuery, tenantScope } = useEmployees();
  const { activeRateQuery } = useCnssRates();
  const [demoOpen, setDemoOpen] = useState(false);

  // Single source of truth for normalizing the employees response.
  // Shared with EmployeeList so dashboard KPIs and the table can never
  // disagree on which rows are "the employees".
  const employeeRows = useMemo<any[]>(
    () => selectEmployeeRows(employeesQuery.data),
    [employeesQuery.data],
  );

  const headcount = employeeRows.length;

  const expiringContractsQuery = useQuery({
    // Tenant-scoped: prevents stale rows from a previously-selected company
    // from leaking into the dashboard alerts after a company-filter switch.
    queryKey: ['hr', 'expiringContracts', 60, tenantScope.slug, tenantScope.companyId],
    queryFn: () => hrApi.getExpiringContracts(60),
  });
  const expiringContracts = expiringContractsQuery.data ?? [];

  const userRefs = useMemo(() => {
    return employeeRows
      .map((r: any) => r.user)
      .filter(Boolean)
      .map((u: any) => ({
        id: Number(u.id),
        name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || `#${u.id}`,
        profilePictureUrl: u.profilePictureUrl ?? null,
      }))
      .filter((u: any) => Number.isFinite(u.id) && u.id > 0);
  }, [employeeRows]);

  const leavesQuery = useQuery({
    // Tenant-scoped + driven by tenant-scoped userRefs (which come from the
    // tenant-scoped employees query), so KPIs cannot mix data across tenants.
    queryKey: ['hr', 'dashboardLeaves', tenantScope.slug, tenantScope.companyId, userRefs.map(u => u.id)],
    enabled: userRefs.length > 0,
    queryFn: async () => {
      const perUser = await mapWithConcurrency(userRefs.map(u => u.id), 5, async (userId) => {
        return schedulesApi.getLeaves(userId);
      });
      return perUser.flat() as UserLeave[];
    },
  });

  const today = dayjs().format('YYYY-MM-DD');
  const pendingLeaves = useMemo(
    () => (leavesQuery.data ?? []).filter(l => String(l.status) === 'pending').length,
    [leavesQuery.data],
  );

  const outToday = useMemo(() => {
    return (leavesQuery.data ?? []).filter(l => {
      if (String(l.status) !== 'approved') return false;
      const s = dayjs(String(l.startDate)).format('YYYY-MM-DD');
      const e = dayjs(String(l.endDate)).format('YYYY-MM-DD');
      return s <= today && today <= e;
    }).length;
  }, [leavesQuery.data, today]);

  const upcomingLeaves = useMemo(() => {
    const limit = dayjs().add(14, 'day').format('YYYY-MM-DD');
    return (leavesQuery.data ?? [])
      .filter(l => String(l.status) === 'approved' && String(l.startDate) > today && String(l.startDate) <= limit)
      .sort((a, b) => (String(a.startDate) > String(b.startDate) ? 1 : -1))
      .slice(0, 6);
  }, [leavesQuery.data, today]);

  const payrollEstimate = useMemo(() => {
    let totalGross = 0;
    let totalNet = 0;
    let totalCnssEmployer = 0;
    const employerRate = Number(activeRateQuery.data?.employerRate ?? 0.1657);
    // Use the ACTIVE backend CNSS rate (employee rate, CSS rate, salary
    // ceiling, abattements, IRPP brackets) so the dashboard estimate
    // matches backend payroll and the CNSS declaration.
    const engineRates = cnssRateToTaxEngineRates(activeRateQuery.data as any);
    const ceiling = Number(engineRates.salaryCeiling ?? 0);
    for (const r of employeeRows as any[]) {
      const cfg = r.salaryConfig;
      if (!cfg || !Number.isFinite(Number(cfg.grossSalary))) continue;
      const gross = Number(cfg.grossSalary);
      const breakdown = calculateTunisianNetSalary({
        grossSalary: gross,
        isHeadOfFamily: Boolean(cfg.isHeadOfFamily),
        childrenCount: Number(cfg.childrenCount || 0),
        customDeductions: cfg.customDeductions,
      }, engineRates);
      totalGross += gross;
      totalNet += breakdown.netSalary;
      // Employer CNSS is capped at the same ceiling as employee CNSS
      // (backend HrService: `capped = SalaryCeiling > 0 ? min(subject, SalaryCeiling) : subject`).
      const employerBase = ceiling > 0 ? Math.min(gross, ceiling) : gross;
      totalCnssEmployer += employerBase * employerRate;
    }
    return { totalGross, totalNet, totalCnssEmployer, totalCost: totalGross + totalCnssEmployer };
  }, [employeeRows, activeRateQuery.data]);

  const payrollReadiness = useMemo(() => {
    const missingSalaryUsers = employeeRows
      .filter((r: any) => !r?.salaryConfig || !Number.isFinite(Number(r?.salaryConfig?.grossSalary)))
      .map((r: any) => r.user)
      .filter(Boolean);
    const missingCnss = employeeRows.filter((r: any) => r?.salaryConfig && !r.salaryConfig.cnssNumber).length;
    return {
      missingSalaryCount: missingSalaryUsers.length,
      sampleUsers: missingSalaryUsers.slice(0, 4),
      missingCnss,
    };
  }, [employeeRows]);

  return (
    <div className="flex flex-col">
      <HRPageHeader
        title={t('title')}
        subtitle={t('header.subtitle')}
        icon={Users}
        accentColor="chart-1"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setDemoOpen(true)} className="hidden sm:inline-flex gap-1.5">
              <Play className="h-3.5 w-3.5" /> {t('watchDemo', 'Watch Demo')}
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/hr/employees" className="inline-flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">{t('employees')}</span>
                <ArrowRight className="h-4 w-4 opacity-70" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/hr/payroll" className="inline-flex items-center gap-2">
                <Coins className="h-4 w-4" />
                <span className="hidden sm:inline">{t('payroll')}</span>
                <ArrowRight className="h-4 w-4 opacity-70" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/hr/cnss" className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">{t('cnss')}</span>
                <ArrowRight className="h-4 w-4 opacity-70" />
              </Link>
            </Button>
          </div>
        }
      />

      <div className="p-3 sm:p-4 lg:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="shadow-card border-0 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('summary.headcount')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{headcount}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('dashboardPage.headcountHint')}</div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('summary.absentToday')}</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leavesQuery.isLoading ? '—' : outToday}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('dashboardPage.absentTodayHint')}</div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('summary.payrollEstimate')}</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTnd(payrollEstimate.totalNet)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {t('dashboardPage.payrollEstimateHint', { gross: formatTnd(payrollEstimate.totalGross) })}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('summary.cnssEmployer')}</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTnd(payrollEstimate.totalCnssEmployer)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {t('dashboardPage.cnssEmployerHint', { rate: ((Number(activeRateQuery.data?.employerRate ?? 0.1657)) * 100).toFixed(2) })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="shadow-card border-0 bg-card lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{t('dashboardPage.upcomingTitle')}</CardTitle>
                <Badge variant="secondary" className="text-[11px]">{upcomingLeaves.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {leavesQuery.isLoading ? (
                <div className="text-sm text-muted-foreground">{t('loading')}</div>
              ) : upcomingLeaves.length === 0 ? (
                <Alert>
                  <AlertDescription className="text-sm text-muted-foreground">
                    {t('dashboardPage.upcomingEmpty')}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {upcomingLeaves.map((l: any) => (
                    <div key={l.id} className="flex items-center justify-between gap-3 rounded-md border p-2.5">
                      <div className="text-sm">
                        <div className="font-medium">{t(`leaveType.${String(l.leaveType)}`, { defaultValue: String(l.leaveType).replace(/_/g, ' ') })}</div>
                        <div className="text-xs text-muted-foreground">{l.startDate} → {l.endDate}</div>
                      </div>
                      <Badge variant="outline" className="capitalize">{String(l.status)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-base">{t('dashboardPage.alertsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {payrollReadiness.missingSalaryCount > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {t('dashboardPage.alertMissingSalary', { count: payrollReadiness.missingSalaryCount })}
                  </AlertDescription>
                </Alert>
              )}
              {payrollReadiness.missingCnss > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {t('dashboardPage.alertMissingCnss', { count: payrollReadiness.missingCnss })}
                  </AlertDescription>
                </Alert>
              )}
              {pendingLeaves > 0 && (
                <Alert>
                  <ClipboardList className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {t('dashboardPage.alertPendingLeaves', { count: pendingLeaves })}
                  </AlertDescription>
                </Alert>
              )}
              {expiringContracts.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {t('dashboardPage.alertExpiringContracts', { count: expiringContracts.length })}
                    <ul className="mt-2 space-y-1">
                      {expiringContracts.slice(0, 4).map((c: any) => (
                        <li key={c.userId} className="flex items-center justify-between gap-2 text-xs">
                          <Link to={`/dashboard/hr/employees/${c.userId}`} className="truncate hover:underline">
                            {c.userName} {c.contractType ? `· ${c.contractType}` : ''}
                          </Link>
                          <Badge variant={c.daysUntilExpiry <= 14 ? 'destructive' : 'secondary'} className="text-[10px]">
                            {t('dashboardPage.daysLeft', { count: c.daysUntilExpiry, defaultValue: '{{count}} days' })}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              {payrollReadiness.missingSalaryCount === 0 && payrollReadiness.missingCnss === 0 && pendingLeaves === 0 && expiringContracts.length === 0 && (
                <div className="text-sm text-muted-foreground">{t('dashboardPage.allGood')}</div>
              )}

              {payrollReadiness.sampleUsers.length > 0 && (
                <div className="pt-2 border-t mt-2">
                  <div className="text-xs text-muted-foreground mb-2">{t('dashboardPage.missingSalarySample')}</div>
                  <div className="flex flex-wrap gap-2">
                    {payrollReadiness.sampleUsers.map((u: any) => {
                      const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || `#${u.id}`;
                      return (
                        <Link
                          key={u.id}
                          to={`/dashboard/hr/employees/${u.id}`}
                          className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs hover:bg-muted/40"
                        >
                          <UserAvatar src={u.profilePictureUrl} name={name} seed={u.id} size="xs" />
                          <span className="max-w-[140px] truncate">{name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button asChild variant="outline" className="h-auto py-4 justify-start">
            <Link to="/dashboard/hr/leaves" className="flex items-start gap-3">
              <ClipboardList className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-left">
                <div className="text-sm font-medium">{t('absences')}</div>
                <div className="text-xs text-muted-foreground">{t('dashboardPage.gotoAbsences')}</div>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 justify-start">
            <Link to="/dashboard/hr/bonuses" className="flex items-start gap-3">
              <Gift className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-left">
                <div className="text-sm font-medium">{t('bonuses')}</div>
                <div className="text-xs text-muted-foreground">{t('dashboardPage.gotoBonuses')}</div>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 justify-start">
            <Link to="/dashboard/hr/reports" className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-left">
                <div className="text-sm font-medium">{t('reports')}</div>
                <div className="text-xs text-muted-foreground">{t('dashboardPage.gotoReports')}</div>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 justify-start">
            <Link to="/dashboard/hr/settings" className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-left">
                <div className="text-sm font-medium">{t('settings')}</div>
                <div className="text-xs text-muted-foreground">{t('dashboardPage.gotoSettings')}</div>
              </div>
            </Link>
          </Button>
        </div>
      </div>

      <HRAutopilotDemo open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
