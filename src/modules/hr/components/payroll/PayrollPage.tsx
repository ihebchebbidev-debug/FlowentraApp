import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PayrollRunDialog } from './PayrollRunDialog';
import { PayrollSettings } from './PayrollSettings';
import dayjs from 'dayjs';
import { PaySlipDetail } from './PaySlipDetail';
import { formatTnd } from '../../utils/money';
import { HRPageHeader } from '../HRPageHeader';
import { Coins, Eye, FileDown, Loader2, Wand2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEmployees } from '../../hooks/useEmployees';
import { usePayrollRuns } from '../../hooks/usePayrollRuns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserAvatar } from '@/components/ui/user-avatar';
import type { PayrollEntry, PayrollRun, SalaryBreakdown } from '../../types/hr.types';
import { Checkbox } from '@/components/ui/checkbox';
import { pdf } from '@react-pdf/renderer';
import { PaySlipPDF } from './PaySlipPDF';
import { useToast } from '@/hooks/use-toast';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { HrPermissionButton } from '../common/HrPermissionButton';
import { useHrPermissionGuard } from '../../hooks/useHrPermissionGuard';

/**
 * Build a SalaryBreakdown shape from a server-persisted PayrollEntry so the
 * existing PaySlipDetail / PaySlipPDF components render unchanged.
 */
function entryToBreakdown(e: PayrollEntry): SalaryBreakdown {
  // `details` is typed as a record client-side but the backend serialises it as
  // a JSON string in some responses. Handle both without throwing.
  let details: any = e.details ?? {};
  if (typeof details === 'string') {
    try { details = JSON.parse(details); } catch { details = {}; }
  }
  const rate = (details && typeof details === 'object' ? details.rate : null) ?? {};
  const overtimeAmount = Number(details?.overtimeAmount ?? 0);
  return {
    grossSalary: Number(e.grossSalary || 0),
    cnss: Number(e.cnss || 0),
    cnssRate: Number(rate?.EmployeeRate ?? rate?.employeeRate ?? 0),
    taxableGross: Number(e.taxableGross || 0),
    abattement: Number(e.abattement || 0),
    abattementDetail: { headOfFamily: 0, children: 0 },
    taxableBase: Number(e.taxableBase || 0),
    irpp: Number(e.irpp || 0),
    irppBrackets: Array.isArray(details?.irppBrackets) ? details.irppBrackets : [],
    css: Number(e.css || 0),
    cssRate: Number(rate?.CssRate ?? rate?.cssRate ?? 0),
    netSalary: Number(e.netSalary || 0),
    totalHours: Number(e.totalHours || 0),
    overtimeHours: Number(e.overtimeHours || 0),
    overtimeAmount,
  };
}

export function PayrollPage() {
  const { t } = useTranslation('hr');
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [year, setYear] = useState<number>(dayjs().year());
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeEntryUserId, setActiveEntryUserId] = useState<number | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const { employeesQuery } = useEmployees();
  const { runsQuery, generateMutation, confirmMutation, payMutation } = usePayrollRuns(year);
  const guardHr = useHrPermissionGuard();

  const runs = runsQuery.data ?? [];
  const activeRun = useMemo(
    () => runs.find(r => r.id === activeRunId) ?? runs[0] ?? null,
    [activeRunId, runs],
  );

  // Auto-select first run, and reset when the current active run disappears
  // from the visible list (e.g. after switching year).
  useEffect(() => {
    if (runs.length === 0) {
      if (activeRunId !== null) setActiveRunId(null);
      if (selectedUserIds.size) setSelectedUserIds(new Set());
      return;
    }
    const stillVisible = activeRunId != null && runs.some(r => r.id === activeRunId);
    if (!stillVisible) {
      setActiveRunId(runs[0].id);
      setSelectedUserIds(new Set());
    }
  }, [runs, activeRunId, selectedUserIds.size]);

  const periodMonth = activeRun?.month ?? (dayjs().month() + 1);
  const periodYear = activeRun?.year ?? year;

  const users = useMemo(() => {
    const rows = employeesQuery.data ?? [];
    return rows
      .map((r: any) => r.user)
      .filter(Boolean)
      .map((u: any) => ({
        id: Number(u.id),
        name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || `#${u.id}`,
        email: u.email ?? null,
        profilePictureUrl: u.profilePictureUrl ?? null,
      }))
      .filter((u: any) => Number.isFinite(u.id) && u.id > 0);
  }, [employeesQuery.data]);

  const statusBadgeClass = (status: string) => {
    switch (String(status)) {
      case 'draft': return 'bg-amber-500/15 text-amber-800 dark:text-amber-200';
      case 'confirmed': return 'bg-sky-500/15 text-sky-700 dark:text-sky-200';
      case 'paid': return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200';
      default: return 'bg-zinc-500/10 text-muted-foreground';
    }
  };

  const activeEntry = useMemo(() => {
    const uid = activeEntryUserId;
    if (!activeRun || !uid) return null;
    return activeRun.entries.find(e => e.userId === uid) ?? null;
  }, [activeEntryUserId, activeRun]);

  const activeEntryBreakdown = useMemo(
    () => (activeEntry ? entryToBreakdown(activeEntry) : null),
    [activeEntry],
  );

  const pdfLabels = useMemo(() => ({
    title: t('payrollDraft.pdf.title'),
    employee: t('payrollDraft.pdf.employee'),
    period: t('payrollDraft.pdf.period'),
    gross: t('payrollSlip.grossSalary'),
    overtime: t('payrollSlip.overtime', { defaultValue: 'Overtime / Heures sup.' }),
    cnss: t('payrollSlip.cnss'),
    taxableGross: t('payrollSlip.taxableGross'),
    abattement: t('payrollSlip.abattement'),
    taxableBase: t('payrollSlip.taxableBase'),
    irpp: t('payrollSlip.irpp'),
    css: t('payrollSlip.css'),
    net: t('payrollSlip.netSalary'),
  }), [t]);

  const canConfirm = Boolean(activeRun && String(activeRun.status) === 'draft');
  const canMarkPaid = Boolean(activeRun && String(activeRun.status) === 'confirmed');

  const exportSelectedPdfs = async () => {
    if (!activeRun) return;
    const ids = Array.from(selectedUserIds);
    if (ids.length === 0) return;
    try {
      setIsExporting(true);
      toast({ title: t('payrollDraft.export.preparing') });
      for (const uid of ids) {
        const entry = activeRun.entries.find(e => e.userId === uid);
        if (!entry) continue;
        const breakdown = entryToBreakdown(entry);
        const name = users.find(u => u.id === uid)?.name ?? entry.userName ?? `#${uid}`;
        const safe = String(name).replace(/[\\/:*?"<>|]+/g, '-').trim() || `employee-${uid}`;
        const fileName = `payslip-${safe}-${String(activeRun.month).padStart(2, '0')}-${activeRun.year}.pdf`;
        const doc = (
          <PaySlipPDF
            breakdown={breakdown}
            month={activeRun.month}
            year={activeRun.year}
            employeeName={name}
            labels={pdfLabels}
          />
        );
        const blob = await pdf(doc as any).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      }
      toast({ title: t('payrollDraft.export.done'), description: t('payrollDraft.export.doneHint', { count: ids.length }) });
    } catch (e) {
      toast({ title: t('payrollDraft.export.error'), description: String(e), variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerate = async (values: { month: number; year: number }) => {
    if (!guardHr('create')) throw new Error('forbidden');
    try {
      const run = await generateMutation.mutateAsync({ month: Number(values.month), year: Number(values.year) });
      setYear(Number(values.year));
      if (run?.id) setActiveRunId(run.id);
      setSelectedUserIds(new Set());
      toast({ title: t('payrollDraft.actions.generated', { defaultValue: 'Payroll run generated' }) });
    } catch (e) {
      toast({ title: t('common.error', { defaultValue: 'Error' }), description: extractApiErrorMessage(e), variant: 'destructive' });
      throw e;
    }
  };

  const handleConfirm = async () => {
    if (!guardHr('approve')) return;
    if (!activeRun) return;
    try {
      await confirmMutation.mutateAsync(activeRun.id);
      toast({ title: t('payrollDraft.actions.confirmed') });
    } catch (e) {
      toast({ title: t('common.error', { defaultValue: 'Error' }), description: extractApiErrorMessage(e), variant: 'destructive' });
    }
  };

  const handleMarkPaid = async () => {
    if (!guardHr('approve')) return;
    if (!activeRun) return;
    try {
      await payMutation.mutateAsync(activeRun.id);
      toast({ title: t('payrollDraft.actions.paid') });
    } catch (e) {
      toast({ title: t('common.error', { defaultValue: 'Error' }), description: extractApiErrorMessage(e), variant: 'destructive' });
    }
  };

  const totalCnss = activeRun?.totalCnss ?? activeRun?.entries?.reduce((a, e) => a + Number(e.cnss || 0), 0) ?? 0;
  const totalIrpp = activeRun?.entries?.reduce((a, e) => a + Number(e.irpp || 0), 0) ?? 0;

  const isLoading = runsQuery.isLoading;
  const isMutating = generateMutation.isPending || confirmMutation.isPending || payMutation.isPending;

  return (
    <div className="flex flex-col">
      <HRPageHeader
        title={t('payroll')}
        subtitle={t('payrollPage.subtitle')}
        icon={Coins}
        accentColor="chart-3"
        backTo={{ to: '/dashboard/hr', label: t('dashboard') }}
        actions={
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              aria-label="Year"
            >
              {Array.from({ length: 5 }, (_, i) => dayjs().year() - 2 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <HrPermissionButton action="create" size="sm" onClick={() => setDialogOpen(true)} className="gap-2" disabled={isMutating}>
              {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {t('payrollPage.generatePayroll')}
            </HrPermissionButton>
          </div>
        }
      />

      <div className="p-3 sm:p-4 lg:p-6 space-y-4">
        <Card className="shadow-card border-0 bg-card">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold">{t('payrollPage.overviewTitle')}</div>
                <div className="text-xs text-muted-foreground">{t('payrollPage.overviewHint')}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-[11px]">
                  {t('payrollDraft.kpis.totalNet')}: {formatTnd(activeRun?.totalNet ?? 0)}
                </Badge>
                <Badge variant="secondary" className="text-[11px]">
                  {t('payrollDraft.kpis.totalCnss')}: {formatTnd(totalCnss)}
                </Badge>
                <Badge variant="secondary" className="text-[11px]">
                  {t('payrollDraft.kpis.totalIrpp')}: {formatTnd(totalIrpp)}
                </Badge>
                <Badge variant="secondary" className="text-[11px]">
                  {t('payrollDraft.kpis.period')}: {String(periodMonth).padStart(2, '0')}/{periodYear}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-card border-0 bg-card">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{t('payrollPage.runsTitle')}</CardTitle>
                <Badge variant="secondary" className="text-[11px]">{runs.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Alert className="mb-3">
                <AlertDescription className="text-sm text-muted-foreground">
                  {t('payrollDraft.runsHint')}
                </AlertDescription>
              </Alert>
              {isLoading ? (
                <div className="py-10 text-center text-sm text-muted-foreground inline-flex items-center gap-2 justify-center w-full">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t('loading', { defaultValue: 'Loading…' })}
                </div>
              ) : runs.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="text-sm font-medium">{t('payrollDraft.emptyTitle')}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t('payrollDraft.emptyHint')}</div>
                </div>
              ) : (
                <Table className="min-w-[400px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('payrollPage.month')}</TableHead>
                      <TableHead>{t('payrollPage.status')}</TableHead>
                      <TableHead>{t('payrollPage.totalNet')}</TableHead>
                      <TableHead className="text-right">{t('payrollDraft.open')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.map((r: PayrollRun) => (
                      <TableRow key={r.id} className={cn(activeRun?.id === r.id && 'bg-muted/30')}>
                        <TableCell>{r.month}/{r.year}</TableCell>
                        <TableCell>
                          <span className={cn('inline-flex items-center rounded px-2 py-1 text-xs font-medium capitalize', statusBadgeClass(String(r.status)))}>
                            {String(r.status).replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell>{formatTnd(r.totalNet)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => setActiveRunId(r.id)}>
                            {t('payrollDraft.open')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 bg-card">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{t('payrollDraft.entriesTitle')}</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-[11px]">{activeRun?.entries?.length ?? 0}</Badge>
                  <Button
                    size="sm" variant="outline" className="gap-2"
                    disabled={!activeRun || selectedUserIds.size === 0 || isExporting}
                    onClick={exportSelectedPdfs}
                  >
                    <FileDown className="h-4 w-4" />
                    <span className="hidden sm:inline">{isExporting ? t('payrollDraft.export.exporting') : t('payrollDraft.export.button')}</span>
                  </Button>
                  <HrPermissionButton
                    action="approve"
                    size="sm" variant={canConfirm ? 'default' : 'outline'}
                    disabled={!canConfirm || confirmMutation.isPending}
                    onClick={handleConfirm}
                  >
                    {confirmMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <span className="hidden sm:inline">{t('payrollDraft.actions.confirm')}</span>
                    )}
                  </HrPermissionButton>
                  <HrPermissionButton
                    action="approve"
                    size="sm" variant={canMarkPaid ? 'default' : 'outline'}
                    disabled={!canMarkPaid || payMutation.isPending}
                    onClick={handleMarkPaid}
                  >
                    {payMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <span className="hidden sm:inline">{t('payrollDraft.actions.markPaid')}</span>
                    )}
                  </HrPermissionButton>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {!activeRun ? (
                <div className="py-10 text-center">
                  <div className="text-sm font-medium">{t('payrollDraft.noActiveRunTitle')}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t('payrollDraft.noActiveRunHint')}</div>
                </div>
              ) : (
                <Table className="min-w-[650px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={activeRun.entries.length > 0 && selectedUserIds.size === activeRun.entries.length}
                          onCheckedChange={(val) => {
                            const checked = Boolean(val);
                            setSelectedUserIds(checked ? new Set(activeRun.entries.map(e => e.userId)) : new Set());
                          }}
                          aria-label={t('payrollDraft.selectAll')}
                        />
                      </TableHead>
                      <TableHead>{t('employee.employee')}</TableHead>
                      <TableHead>{t('payrollDraft.gross')}</TableHead>
                      <TableHead>{t('payrollDraft.bonusesShort')}</TableHead>
                      <TableHead>{t('payrollDraft.cnssShort')}</TableHead>
                      <TableHead>{t('payrollDraft.net')}</TableHead>
                      <TableHead className="text-right">{t('payrollDraft.details')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeRun.entries.map(e => {
                      const u = users.find(x => x.id === e.userId);
                      const isSelected = selectedUserIds.has(e.userId);
                      return (
                        <TableRow key={e.userId}>
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(val) => {
                                const checked = Boolean(val);
                                setSelectedUserIds(prev => {
                                  const next = new Set(prev);
                                  if (checked) next.add(e.userId); else next.delete(e.userId);
                                  return next;
                                });
                              }}
                              aria-label={t('payrollDraft.selectEmployee')}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <UserAvatar src={u?.profilePictureUrl} name={e.userName} seed={e.userId} size="sm" />
                              <div className="min-w-0">
                                <div className="truncate">{e.userName}</div>
                                {u?.email ? <div className="truncate text-xs text-muted-foreground">{u.email}</div> : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatTnd(e.grossSalary)}</TableCell>
                          <TableCell className="text-primary">{formatTnd(Number(e.bonuses ?? 0))}</TableCell>
                          <TableCell className="text-muted-foreground">{formatTnd(e.cnss)}</TableCell>
                          <TableCell className="font-semibold text-primary">{formatTnd(e.netSalary)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm" variant="outline" className="gap-2"
                              onClick={() => { setActiveEntryUserId(e.userId); setDetailOpen(true); }}
                            >
                              <Eye className="h-4 w-4" />
                              {t('payrollDraft.viewSlip')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <PayrollSettings />
      </div>

      <PayrollRunDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleGenerate}
        isSubmitting={generateMutation.isPending}
      />

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{t('payrollDraft.slipTitle')}</DialogTitle>
          </DialogHeader>
          {activeEntryBreakdown ? (
            <PaySlipDetail breakdown={activeEntryBreakdown} />
          ) : (
            <div className="text-sm text-muted-foreground">{t('payrollDraft.noSlip')}</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
