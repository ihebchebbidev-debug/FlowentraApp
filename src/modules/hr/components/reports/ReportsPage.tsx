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
import { useCnssRates } from '../../hooks/useCnss';
import { hrApi } from '../../services/hrApi';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { schedulesApi, type UserLeave } from '@/services/api/schedulesApi';
import * as XLSX from 'xlsx';
import { useCurrency } from '@/shared/hooks/useCurrency';

export function ReportsPage() {
  const { t } = useTranslation('hr');
  const { current: currency, format: formatMoney } = useCurrency();
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);

  const { employeesQuery } = useEmployees();
  const { activeRateQuery } = useCnssRates();
  const employerRate = Number(activeRateQuery.data?.employerRate ?? 0);

  // Employee cost is computed SERVER-SIDE (GET /api/hr/reports/employee-cost)
  // so report figures always reconcile with the payroll engine.
  const costQuery = useQuery({
    queryKey: ['hr', 'reports', 'employee-cost', year, month],
    queryFn: () => hrApi.getEmployeeCostReport(year, month),
  });
  const employeeCostRows = costQuery.data ?? [];

  const totals = useMemo(() => employeeCostRows.reduce(
    (acc, r) => ({
      gross: acc.gross + Number(r.gross || 0),
      bonuses: acc.bonuses + Number(r.bonuses || 0),
      allowances: acc.allowances + Number(r.allowances || 0),
      employerCnss: acc.employerCnss + Number(r.employerCnss || 0),
      totalCost: acc.totalCost + Number(r.totalCost || 0),
      ytdTotalCost: acc.ytdTotalCost + Number(r.ytdTotalCost || 0),
    }),
    { gross: 0, bonuses: 0, allowances: 0, employerCnss: 0, totalCost: 0, ytdTotalCost: 0 },
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
                      const header = [t('reportsExport.employee'), t('reportsExport.department'), t('reportsExport.gross'), t('reportsExport.bonuses'), t('reportsExport.allowances'), t('reportsExport.cnssEmployer'), t('reportsExport.totalCost')];
                      const headerYtd = [...header, t('reportsExport.ytdGross'), t('reportsExport.ytdBonuses'), t('reportsExport.ytdCnssEmployer'), t('reportsExport.ytdTotalCost')];
                      const rows = employeeCostRows.map(r => [
                        r.userName, r.department ?? '', Number(Number(r.gross).toFixed(3)), Number(Number(r.bonuses).toFixed(3)),
                        Number(Number(r.allowances).toFixed(3)), Number(Number(r.employerCnss).toFixed(3)), Number(Number(r.totalCost).toFixed(3)),
                        Number(Number(r.ytdGross).toFixed(3)), Number(Number(r.ytdBonuses).toFixed(3)),
                        Number(Number(r.ytdEmployerCnss).toFixed(3)), Number(Number(r.ytdTotalCost).toFixed(3)),
                      ]);
                      const base = `employee-cost-${year}-${String(month).padStart(2, '0')}`;
                      return (
                        <>
                          <Button size="sm" variant="outline" className="gap-2" onClick={() => exportCsv(`${base}.csv`, headerYtd, rows as any)}>
                            <FileDown className="h-4 w-4" /> {t('reportsPage.exportCsv')}
                          </Button>
                          <Button size="sm" variant="outline" className="gap-2" onClick={() => exportXlsx(`${base}.xlsx`, t('reportsExport.costSheet'), headerYtd, rows as any)}>
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
                      <TableHead>{t('reportsPage.allowances', 'Allowances')}</TableHead>
                      <TableHead>{t('reportsPage.cnssEmployer')}</TableHead>
                      <TableHead>{t('reportsPage.totalCost')}</TableHead>
                      <TableHead className="border-l">{t('reportsPage.ytdTotalCost', 'YTD total cost')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costQuery.isLoading && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">{t('loading', { defaultValue: 'Loading…' })}</TableCell></TableRow>
                    )}
                    {!costQuery.isLoading && employeeCostRows.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">{t('reportsPage.noData', { defaultValue: 'No data for this period.' })}</TableCell></TableRow>
                    )}
                    {employeeCostRows.map(r => (
                      <TableRow key={r.userId}>
                        <TableCell className="font-medium">{r.userName}</TableCell>
                        <TableCell>{formatMoney(r.gross)}</TableCell>
                        <TableCell className="text-primary">{formatMoney(r.bonuses)}</TableCell>
                        <TableCell>{formatMoney(r.allowances)}</TableCell>
                        <TableCell>{formatMoney(r.employerCnss)}</TableCell>
                        <TableCell className="font-semibold">{formatMoney(r.totalCost)}</TableCell>
                        <TableCell className="border-l font-semibold text-primary">{formatMoney(r.ytdTotalCost)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell>{t('reportsPage.total')}</TableCell>
                      <TableCell>{formatMoney(totals.gross)}</TableCell>
                      <TableCell>{formatMoney(totals.bonuses)}</TableCell>
                      <TableCell>{formatMoney(totals.allowances)}</TableCell>
                      <TableCell>{formatMoney(totals.employerCnss)}</TableCell>
                      <TableCell>{formatMoney(totals.totalCost)}</TableCell>
                      <TableCell className="border-l">{formatMoney(totals.ytdTotalCost)}</TableCell>
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
                        [t('reportsPage.cnssEmployer'), Number(totals.employerCnss.toFixed(3))],
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
                    <div className="text-xl font-semibold mt-1">{formatMoney(totals.gross)}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">{t('reportsPage.cnssEmployer')}</div>
                    <div className="text-xl font-semibold mt-1">{formatMoney(totals.employerCnss)}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">{t('reportsPage.totalCost')}</div>
                    <div className="text-xl font-semibold mt-1">{formatMoney(totals.totalCost)}</div>
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
                      const header = [t('reportsExport.employee'), t('reportsExport.gross'), t('reportsExport.cnssEmployer'), t('reportsExport.employerRate')];
                      const rows = employeeCostRows.map(r => [r.userName, Number(Number(r.gross).toFixed(3)), Number(Number(r.employerCnss).toFixed(3)), Number((employerRate * 100).toFixed(2))]);
                      const base = `cnss-report-${year}-${String(month).padStart(2, '0')}`;
                      return (
                        <>
                          <Button size="sm" variant="outline" className="gap-2" onClick={() => exportCsv(`${base}.csv`, header, rows as any)}>
                            <FileDown className="h-4 w-4" /> {t('reportsPage.exportCsv')}
                          </Button>
                          <Button size="sm" variant="outline" className="gap-2" onClick={() => exportXlsx(`${base}.xlsx`, t('reportsExport.cnssSheet'), header, rows as any)}>
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
                    <div className="text-xl font-semibold mt-1">{formatMoney(totals.employerCnss)}</div>
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
      const results = await Promise.all(
        users.map(async (u: any) => {
          try {
            const leaves = await schedulesApi.getLeaves(u.id);
            return leaves.map((l) => ({ ...l, userId: u.id } as UserLeave & { userId: number }));
          } catch {
            return [] as (UserLeave & { userId: number })[];
          }
        })
      );
      return results.flat();
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
