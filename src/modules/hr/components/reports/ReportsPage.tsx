import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, FileDown, FileSpreadsheet } from 'lucide-react';
import { HRPageHeader } from '../HRPageHeader';
import { useEmployees } from '../../hooks/useEmployees';
import { useBonuses } from '../../hooks/useBonuses';
import { useCnssRates } from '../../hooks/useCnss';
import { formatTnd } from '../../utils/money';
import { calculateTunisianNetSalary } from '../../utils/tunisianTaxEngine';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { schedulesApi, type UserLeave } from '@/services/api/schedulesApi';
import * as XLSX from 'xlsx';
import { useCurrency } from '@/shared/hooks/useCurrency';

export function ReportsPage() {
  const { t } = useTranslation('hr');
  const { current: currency } = useCurrency();
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);

  const { employeesQuery } = useEmployees();
  const { bonusesQuery } = useBonuses({ year, month });
  const { activeRateQuery } = useCnssRates();
  const { bonusesQuery: ytdBonusesQuery } = useBonuses({ year });

  const employerRate = Number(activeRateQuery.data?.employerRate ?? 0.1657);

  const employeeCostRows = useMemo(() => {
    const bonusByUser = new Map<number, { bonus: number; deduction: number }>();
    for (const b of bonusesQuery.data ?? []) {
      const cur = bonusByUser.get(b.userId) ?? { bonus: 0, deduction: 0 };
      const amt = Number(b.amount) || 0;
      if (b.kind === 'other_cost' || amt < 0) cur.deduction += Math.abs(amt);
      else cur.bonus += amt;
      bonusByUser.set(b.userId, cur);
    }
    const ytdBonusByUser = new Map<number, number>();
    for (const b of ytdBonusesQuery.data ?? []) {
      if (b.month && b.month > month) continue; // YTD = Jan..month
      const amt = Number(b.amount) || 0;
      if (b.kind === 'other_cost' || amt < 0) continue;
      ytdBonusByUser.set(b.userId, (ytdBonusByUser.get(b.userId) ?? 0) + amt);
    }
    return (employeesQuery.data ?? []).map((r: any) => {
      const u = r.user;
      const cfg = r.salaryConfig;
      const gross = Number(cfg?.grossSalary ?? 0);
      const ub = bonusByUser.get(Number(u?.id)) ?? { bonus: 0, deduction: 0 };
      const cnssEmployer = gross * employerRate;
      const totalCost = gross + ub.bonus - ub.deduction + cnssEmployer;
      const breakdown = cfg ? calculateTunisianNetSalary({
        grossSalary: gross + ub.bonus,
        isHeadOfFamily: Boolean(cfg.isHeadOfFamily),
        childrenCount: Number(cfg.childrenCount || 0),
        customDeductions: Number(cfg.customDeductions || 0) + ub.deduction,
      }) : null;
      // YTD = Jan..selected month  => `month` months of base salary
      const ytdGross = gross * month;
      const ytdBonuses = ytdBonusByUser.get(Number(u?.id)) ?? 0;
      const ytdEmployerCnss = ytdGross * employerRate;
      const ytdTotalCost = ytdGross + ytdBonuses + ytdEmployerCnss;
      return {
        userId: Number(u?.id),
        name: `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim() || u?.email || `#${u?.id}`,
        gross, bonuses: ub.bonus, deductions: ub.deduction, cnssEmployer,
        net: breakdown?.netSalary ?? 0, totalCost,
        ytdGross, ytdBonuses, ytdEmployerCnss, ytdTotalCost,
      };
    });
  }, [employeesQuery.data, bonusesQuery.data, ytdBonusesQuery.data, employerRate, month]);

  const totals = useMemo(() => employeeCostRows.reduce(
    (acc, r) => ({
      gross: acc.gross + r.gross,
      bonuses: acc.bonuses + r.bonuses,
      deductions: acc.deductions + r.deductions,
      cnssEmployer: acc.cnssEmployer + r.cnssEmployer,
      net: acc.net + r.net,
      totalCost: acc.totalCost + r.totalCost,
      ytdTotalCost: acc.ytdTotalCost + r.ytdTotalCost,
    }),
    { gross: 0, bonuses: 0, deductions: 0, cnssEmployer: 0, net: 0, totalCost: 0, ytdTotalCost: 0 },
  ), [employeeCostRows]);

  const exportCsv = (filename: string, header: string[], rows: (string | number)[][]) => {
    const csv = [header, ...rows].map(line => line.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const exportXlsx = (
    filename: string,
    sheetName: string,
    header: string[],
    rows: (string | number)[][],
  ) => {
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    // Auto-size columns based on content length (capped)
    const colWidths = header.map((h, i) => {
      const maxRowLen = rows.reduce((m, r) => Math.max(m, String(r[i] ?? '').length), 0);
      return { wch: Math.min(40, Math.max(10, Math.max(h.length, maxRowLen) + 2)) };
    });
    (ws as any)['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31) || 'Report');
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="flex flex-col">
      <HRPageHeader
        title={t('reports')}
        subtitle={t('reportsPage.subtitle')}
        icon={BarChart3}
        accentColor="chart-5"
        backTo={{ to: '/dashboard/hr', label: t('dashboard') }}
      />

      <div className="p-3 sm:p-4 lg:p-6 space-y-4">
        <Card className="shadow-card border-0 bg-card">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <Label>{t('reportsPage.month')}</Label>
                <Input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-24" />
              </div>
              <div>
                <Label>{t('reportsPage.year')}</Label>
                <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-32" />
              </div>
              <Badge variant="secondary" className="ml-auto">{String(month).padStart(2, '0')}/{year}</Badge>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="cost">
          <TabsList variant="underline">
            <TabsTrigger value="cost">{t('reportsPage.tabs.cost')}</TabsTrigger>
            <TabsTrigger value="payroll">{t('reportsPage.tabs.payroll')}</TabsTrigger>
            <TabsTrigger value="cnss">{t('reportsPage.tabs.cnss')}</TabsTrigger>
            <TabsTrigger value="absences">{t('reportsPage.tabs.absences')}</TabsTrigger>
          </TabsList>


          <TabsContent value="cost" className="mt-3">
            <Card className="shadow-card border-0 bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t('reportsPage.employeeCostTitle')}</CardTitle>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const header = ['Employee', 'Gross', 'Bonuses', 'Deductions', 'CNSS Employer', 'Net', 'Total Cost'];
                      const headerYtd = [...header, 'YTD Gross', 'YTD Bonuses', 'YTD CNSS Employer', 'YTD Total Cost'];
                      const rows = employeeCostRows.map(r => [
                        r.name, Number(r.gross.toFixed(3)), Number(r.bonuses.toFixed(3)), Number(r.deductions.toFixed(3)),
                        Number(r.cnssEmployer.toFixed(3)), Number(r.net.toFixed(3)), Number(r.totalCost.toFixed(3)),
                        Number(r.ytdGross.toFixed(3)), Number(r.ytdBonuses.toFixed(3)),
                        Number(r.ytdEmployerCnss.toFixed(3)), Number(r.ytdTotalCost.toFixed(3)),
                      ]);
                      const base = `employee-cost-${year}-${String(month).padStart(2, '0')}`;
                      return (
                        <>
                          <Button size="sm" variant="outline" className="gap-2" onClick={() => exportCsv(`${base}.csv`, headerYtd, rows as any)}>
                            <FileDown className="h-4 w-4" /> {t('reportsPage.exportCsv')}
                          </Button>
                          <Button size="sm" variant="outline" className="gap-2" onClick={() => exportXlsx(`${base}.xlsx`, 'Employee Cost', headerYtd, rows as any)}>
                            <FileSpreadsheet className="h-4 w-4" /> {t('reportsPage.exportXlsx', 'Export Excel')}
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table className="min-w-[650px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('reportsPage.employee')}</TableHead>
                      <TableHead>{t('reportsPage.gross')}</TableHead>
                      <TableHead>{t('reportsPage.bonuses')}</TableHead>
                      <TableHead>{t('reportsPage.deductions')}</TableHead>
                      <TableHead>{t('reportsPage.cnssEmployer')}</TableHead>
                      <TableHead>{t('reportsPage.totalCost')}</TableHead>
                      <TableHead className="border-l">{t('reportsPage.ytdTotalCost', 'YTD total cost')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeCostRows.map(r => (
                      <TableRow key={r.userId}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>{formatTnd(r.gross)}</TableCell>
                        <TableCell className="text-primary">{formatTnd(r.bonuses)}</TableCell>
                        <TableCell className="text-destructive">{formatTnd(r.deductions)}</TableCell>
                        <TableCell>{formatTnd(r.cnssEmployer)}</TableCell>
                        <TableCell className="font-semibold">{formatTnd(r.totalCost)}</TableCell>
                        <TableCell className="border-l font-semibold text-primary">{formatTnd(r.ytdTotalCost)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell>{t('reportsPage.total')}</TableCell>
                      <TableCell>{formatTnd(totals.gross)}</TableCell>
                      <TableCell>{formatTnd(totals.bonuses)}</TableCell>
                      <TableCell>{formatTnd(totals.deductions)}</TableCell>
                      <TableCell>{formatTnd(totals.cnssEmployer)}</TableCell>
                      <TableCell>{formatTnd(totals.totalCost)}</TableCell>
                      <TableCell className="border-l">{formatTnd(totals.ytdTotalCost)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="mt-3">
            <Card className="shadow-card border-0 bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t('reportsPage.payrollTitle')}</CardTitle>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const header = ['Metric', `Amount (${currency.code})`];
                      const rows = [
                        [t('reportsPage.totalGross'), Number(totals.gross.toFixed(3))],
                        [t('reportsPage.totalNet'), Number(totals.net.toFixed(3))],
                        [t('reportsPage.totalCost'), Number(totals.totalCost.toFixed(3))],
                      ];
                      const base = `payroll-summary-${year}-${String(month).padStart(2, '0')}`;
                      return (
                        <>
                          <Button size="sm" variant="outline" className="gap-2" onClick={() => exportCsv(`${base}.csv`, header, rows as any)}>
                            <FileDown className="h-4 w-4" /> {t('reportsPage.exportCsv')}
                          </Button>
                          <Button size="sm" variant="outline" className="gap-2" onClick={() => exportXlsx(`${base}.xlsx`, 'Payroll Summary', header, rows as any)}>
                            <FileSpreadsheet className="h-4 w-4" /> {t('reportsPage.exportXlsx', 'Export Excel')}
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">{t('reportsPage.totalGross')}</div>
                    <div className="text-xl font-semibold mt-1">{formatTnd(totals.gross)}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">{t('reportsPage.totalNet')}</div>
                    <div className="text-xl font-semibold mt-1">{formatTnd(totals.net)}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">{t('reportsPage.totalCost')}</div>
                    <div className="text-xl font-semibold mt-1">{formatTnd(totals.totalCost)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cnss" className="mt-3">
            <Card className="shadow-card border-0 bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t('reportsPage.cnssTitle')}</CardTitle>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const header = ['Employee', 'Gross', 'CNSS Employer', 'Employer Rate'];
                      const rows = employeeCostRows.map(r => [r.name, Number(r.gross.toFixed(3)), Number(r.cnssEmployer.toFixed(3)), Number((employerRate * 100).toFixed(2))]);
                      const base = `cnss-report-${year}-${String(month).padStart(2, '0')}`;
                      return (
                        <>
                          <Button size="sm" variant="outline" className="gap-2" onClick={() => exportCsv(`${base}.csv`, header, rows as any)}>
                            <FileDown className="h-4 w-4" /> {t('reportsPage.exportCsv')}
                          </Button>
                          <Button size="sm" variant="outline" className="gap-2" onClick={() => exportXlsx(`${base}.xlsx`, 'CNSS Report', header, rows as any)}>
                            <FileSpreadsheet className="h-4 w-4" /> {t('reportsPage.exportXlsx', 'Export Excel')}
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">{t('reportsPage.cnssEmployer')}</div>
                    <div className="text-xl font-semibold mt-1">{formatTnd(totals.cnssEmployer)}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">{t('reportsPage.employerRate')}</div>
                    <div className="text-xl font-semibold mt-1">{(employerRate * 100).toFixed(2)}%</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">{t('reportsPage.headcount')}</div>
                    <div className="text-xl font-semibold mt-1">{employeeCostRows.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <AbsenceStatsTab
            year={year}
            month={month}
            employeesQuery={employeesQuery}
            t={t}
            exportCsv={exportCsv}
            exportXlsx={exportXlsx}
          />
        </Tabs>
      </div>
    </div>
  );
}

function AbsenceStatsTab({ year, month, employeesQuery, t, exportCsv, exportXlsx }: {
  year: number;
  month: number;
  employeesQuery: any;
  t: any;
  exportCsv: (filename: string, header: string[], rows: (string | number)[][]) => void;
  exportXlsx: (filename: string, sheetName: string, header: string[], rows: (string | number)[][]) => void;
}) {
  const users = useMemo(() => {
    const rows = employeesQuery.data ?? [];
    return rows
      .map((r: any) => r.user)
      .filter(Boolean)
      .map((u: any) => ({
        id: Number(u.id),
        name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || `#${u.id}`,
      }))
      .filter((u: any) => Number.isFinite(u.id) && u.id > 0);
  }, [employeesQuery.data]);

  const leavesQuery = useQuery({
    queryKey: ['hr', 'reportAbsences', users.map((u: any) => u.id), year],
    enabled: users.length > 0,
    queryFn: async () => {
      const all: (UserLeave & { userId: number })[] = [];
      for (const u of users) {
        const leaves = await schedulesApi.getLeaves(u.id);
        for (const l of leaves) all.push({ ...l, userId: u.id } as any);
      }
      return all;
    },
  });

  const stats = useMemo(() => {
    const leaves = leavesQuery.data ?? [];
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const inPeriod = leaves.filter((l: any) => {
      const s = String(l.startDate).slice(0, 7);
      const e = String(l.endDate).slice(0, 7);
      return s <= monthStr && e >= monthStr;
    });
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const l of inPeriod) {
      const tp = String((l as any).leaveType ?? 'other');
      const st = String((l as any).status ?? 'unknown');
      byType[tp] = (byType[tp] ?? 0) + 1;
      byStatus[st] = (byStatus[st] ?? 0) + 1;
    }
    return { total: inPeriod.length, byType, byStatus };
  }, [leavesQuery.data, year, month]);

  return (
    <TabsContent value="absences" className="mt-3">
      <Card className="shadow-card border-0 bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('reportsPage.absenceTitle')}</CardTitle>
            <div className="flex items-center gap-2">
              {(() => {
                const header = [t('reportsPage.absenceType'), t('reportsPage.absenceCount')];
                const rows = Object.entries(stats.byType).map(([type, count]) => [
                  t(`leaveType.${type}`, { defaultValue: type.replace(/_/g, ' ') }) as string,
                  count as number,
                ]);
                const base = `absences-${year}-${String(month).padStart(2, '0')}`;
                return (
                  <>
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => exportCsv(`${base}.csv`, header, rows as any)}>
                      <FileDown className="h-4 w-4" /> {t('reportsPage.exportCsv')}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => exportXlsx(`${base}.xlsx`, 'Absences', header, rows as any)}>
                      <FileSpreadsheet className="h-4 w-4" /> {t('reportsPage.exportXlsx', 'Export Excel')}
                    </Button>
                  </>
                );
              })()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground">{t('reportsPage.absenceTotal')}</div>
              <div className="text-xl font-semibold mt-1">{stats.total}</div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground">{t('reportsPage.absenceApproved')}</div>
              <div className="text-xl font-semibold mt-1">{stats.byStatus['approved'] ?? 0}</div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground">{t('reportsPage.absencePending')}</div>
              <div className="text-xl font-semibold mt-1">{stats.byStatus['pending'] ?? 0}</div>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reportsPage.absenceType')}</TableHead>
                <TableHead>{t('reportsPage.absenceCount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(stats.byType).map(([type, count]) => (
                <TableRow key={type}>
                  <TableCell className="capitalize">{t(`leaveType.${type}`, { defaultValue: type.replace(/_/g, ' ') })}</TableCell>
                  <TableCell>{count}</TableCell>
                </TableRow>
              ))}
              {Object.keys(stats.byType).length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">{t('reportsPage.absenceEmpty')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
