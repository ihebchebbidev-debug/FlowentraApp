import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, FileDown, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HRPageHeader } from '../HRPageHeader';
import { useEmployees } from '../../hooks/useEmployees';
import { useCnssRates } from '../../hooks/useCnss';
import { formatTnd } from '../../utils/money';
import { useToast } from '@/hooks/use-toast';
import dayjs from 'dayjs';
import { z } from 'zod';

const cnssRateSchema = z.object({
  employeeRatePct: z.coerce.number({ invalid_type_error: 'Employee rate is required' })
    .min(0, 'Employee rate must be ≥ 0')
    .max(100, 'Employee rate must be ≤ 100'),
  employerRatePct: z.coerce.number({ invalid_type_error: 'Employer rate is required' })
    .min(0, 'Employer rate must be ≥ 0')
    .max(100, 'Employer rate must be ≤ 100'),
  ceiling: z.union([z.literal(''), z.coerce.number().min(0, 'Ceiling must be ≥ 0')]),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Effective date is required'),
});
type CnssRateErrors = Partial<Record<'employeeRatePct' | 'employerRatePct' | 'ceiling' | 'effectiveFrom', string>>;

export function CnssPage() {
  const { t } = useTranslation('hr');
  const { toast } = useToast();
  const { employeesQuery } = useEmployees();
  const { ratesQuery, activeRateQuery, upsertRate } = useCnssRates();

  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);

  // Editable rate form
  const active = activeRateQuery.data;
  // Read either the new `salaryCeiling` field or the legacy `ceiling` so we
  // stay compatible with rate rows created before the contract was aligned.
  const activeCeiling = active
    ? (Number.isFinite(Number(active.salaryCeiling)) && Number(active.salaryCeiling) > 0
        ? Number(active.salaryCeiling)
        : (active.ceiling ?? null))
    : null;
  // Round to 4 decimals to avoid float artefacts like 9.180000000000001
  const [employeeRate, setEmployeeRate] = useState<number>(active ? Math.round(active.employeeRate * 1000000) / 10000 : 9.18);
  const [employerRate, setEmployerRate] = useState<number>(active ? Math.round(active.employerRate * 1000000) / 10000 : 16.57);
  const [ceiling, setCeiling] = useState<number | ''>(activeCeiling ?? '');
  const [effectiveFrom, setEffectiveFrom] = useState<string>(active?.effectiveFrom ?? dayjs().format('YYYY-MM-DD'));
  const [rateErrors, setRateErrors] = useState<CnssRateErrors>({});

  const calcs = useMemo(() => {
    const er = Number(employerRate) / 100;
    const ee = Number(employeeRate) / 100;
    const rows = (employeesQuery.data ?? []).map((r: any) => {
      const cfg = r.salaryConfig ?? null;
      const gross = Number(cfg?.grossSalary ?? 0);
      const subject = ceiling && Number(ceiling) > 0 ? Math.min(gross, Number(ceiling)) : gross;
      const employee = subject * ee;
      const employer = subject * er;
      return {
        userId: Number(r.user?.id),
        name: `${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.trim() || r.user?.email || `#${r.user?.id}`,
        cnssNumber: cfg?.cnssNumber ?? null,
        gross, subject, employee, employer,
      };
    });
    const totals = rows.reduce(
      (acc, r) => ({
        gross: acc.gross + r.gross,
        subject: acc.subject + r.subject,
        employee: acc.employee + r.employee,
        employer: acc.employer + r.employer,
      }),
      { gross: 0, subject: 0, employee: 0, employer: 0 },
    );
    return { rows, totals };
  }, [employeesQuery.data, employeeRate, employerRate, ceiling]);

  const saveRate = async () => {
    const parsed = cnssRateSchema.safeParse({
      employeeRatePct: employeeRate,
      employerRatePct: employerRate,
      ceiling,
      effectiveFrom,
    });
    if (!parsed.success) {
      const fieldErrors: CnssRateErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof CnssRateErrors | undefined;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setRateErrors(fieldErrors);
      toast({
        title: t('cnssPage.rateInvalid', { defaultValue: 'Invalid CNSS rate' }),
        description: parsed.error.issues[0]?.message,
        variant: 'destructive',
      });
      return;
    }
    setRateErrors({});
    const ceilingNum = parsed.data.ceiling === '' ? 0 : Number(parsed.data.ceiling);
    await upsertRate.mutateAsync({
      id: active?.id,
      employeeRate: parsed.data.employeeRatePct / 100,
      employerRate: parsed.data.employerRatePct / 100,
      // Send both `salaryCeiling` (new contract) and `ceiling` (legacy alias).
      // hrApi.upsertCnssRate will fill in cssRate, abattements and IRPP
      // brackets from active rate / Tunisian defaults so backend validation
      // never strips CSS or abattement to zero on save.
      salaryCeiling: ceilingNum,
      ceiling: parsed.data.ceiling === '' ? null : ceilingNum,
      cssRate: active?.cssRate,
      abattementHeadOfFamily: active?.abattementHeadOfFamily,
      abattementPerChild: active?.abattementPerChild,
      irppBrackets: active?.irppBrackets,
      effectiveFrom: parsed.data.effectiveFrom,
      isActive: true,
    });
    toast({ title: t('cnssPage.rateSaved') });
  };

  const exportCsv = () => {
    const header = ['cnssNumber', 'employee', 'gross', 'subject', 'employeeShare', 'employerShare'];
    const rows = calcs.rows.map(r => [
      r.cnssNumber ?? '',
      r.name,
      r.gross.toFixed(3),
      r.subject.toFixed(3),
      r.employee.toFixed(3),
      r.employer.toFixed(3),
    ]);
    const csv = [header, ...rows].map(line => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `cnss-declaration-${year}-${String(month).padStart(2, '0')}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  return (
    <div className="flex flex-col">
      <HRPageHeader
        title={t('cnss')}
        subtitle={t('cnssPage.subtitle')}
        icon={ShieldCheck}
        accentColor="chart-2"
        backTo={{ to: '/dashboard/hr', label: t('dashboard') }}
        actions={
          <Button size="sm" variant="outline" className="gap-2" onClick={exportCsv}>
            <FileDown className="h-4 w-4" /> {t('cnssPage.exportCsv')}
          </Button>
        }
      />

      <div className="p-3 sm:p-4 lg:p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="shadow-card border-0 bg-card">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{t('cnssPage.totals.gross')}</div>
              <div className="text-xl font-semibold mt-1">{formatTnd(calcs.totals.gross)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0 bg-card">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{t('cnssPage.totals.subject')}</div>
              <div className="text-xl font-semibold mt-1">{formatTnd(calcs.totals.subject)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0 bg-card">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{t('cnssPage.totals.employee')}</div>
              <div className="text-xl font-semibold mt-1">{formatTnd(calcs.totals.employee)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0 bg-card">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{t('cnssPage.totals.employer')}</div>
              <div className="text-xl font-semibold mt-1">{formatTnd(calcs.totals.employer)}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card border-0 bg-card">
          <CardHeader><CardTitle className="text-base">{t('cnssPage.rateConfig')}</CardTitle></CardHeader>
          <CardContent>
            <Alert className="mb-3">
              <AlertDescription className="text-sm text-muted-foreground">{t('cnssPage.rateHint')}</AlertDescription>
            </Alert>
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <Label>{t('cnssPage.employeeRate')}</Label>
                <Input type="number" step="0.01" min={0} max={100} value={employeeRate} onChange={(e) => setEmployeeRate(Number(e.target.value))} aria-invalid={!!rateErrors.employeeRatePct} />
                {rateErrors.employeeRatePct && <p className="text-xs text-destructive mt-1">{rateErrors.employeeRatePct}</p>}
              </div>
              <div>
                <Label>{t('cnssPage.employerRate')}</Label>
                <Input type="number" step="0.01" min={0} max={100} value={employerRate} onChange={(e) => setEmployerRate(Number(e.target.value))} aria-invalid={!!rateErrors.employerRatePct} />
                {rateErrors.employerRatePct && <p className="text-xs text-destructive mt-1">{rateErrors.employerRatePct}</p>}
              </div>
              <div>
                <Label>{t('cnssPage.ceiling')} (TND)</Label>
                <Input type="number" step="0.001" min={0} value={ceiling} onChange={(e) => setCeiling(e.target.value === '' ? '' : Number(e.target.value))} placeholder={t('cnssPage.noCeiling')} aria-invalid={!!rateErrors.ceiling} />
                {rateErrors.ceiling && <p className="text-xs text-destructive mt-1">{rateErrors.ceiling}</p>}
              </div>
              <div>
                <Label>{t('cnssPage.effectiveFrom')}</Label>
                <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} aria-invalid={!!rateErrors.effectiveFrom} />
                {rateErrors.effectiveFrom && <p className="text-xs text-destructive mt-1">{rateErrors.effectiveFrom}</p>}
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <Button onClick={saveRate} disabled={upsertRate.isPending} className="gap-2">
                <Save className="h-4 w-4" /> {t('cnssPage.saveRate')}
              </Button>
            </div>

            {(ratesQuery.data ?? []).length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-muted-foreground mb-2">{t('cnssPage.history')}</div>
                <div className="flex flex-wrap gap-2">
                  {(ratesQuery.data ?? []).map(r => (
                    <Badge key={r.id} variant={r.isActive ? 'default' : 'outline'} className="text-[11px]">
                      {r.effectiveFrom} · ee {(r.employeeRate * 100).toFixed(2)}% · er {(r.employerRate * 100).toFixed(2)}%
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-card">
          <CardHeader>
            <div className="flex flex-wrap items-end gap-3">
              <CardTitle className="text-base">{t('cnssPage.declaration')}</CardTitle>
              <div className="flex items-end gap-2 ml-auto">
                <div>
                  <Label>{t('cnssPage.month')}</Label>
                  <Input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-24" />
                </div>
                <div>
                  <Label>{t('cnssPage.year')}</Label>
                  <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-32" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[550px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('cnssPage.cnssNumber')}</TableHead>
                  <TableHead>{t('cnssPage.employee')}</TableHead>
                  <TableHead>{t('cnssPage.gross')}</TableHead>
                  <TableHead>{t('cnssPage.subject')}</TableHead>
                  <TableHead>{t('cnssPage.employeeShare')}</TableHead>
                  <TableHead>{t('cnssPage.employerShare')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calcs.rows.map(r => (
                  <TableRow key={r.userId}>
                    <TableCell className="font-mono text-xs">{r.cnssNumber ?? '—'}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{formatTnd(r.gross)}</TableCell>
                    <TableCell>{formatTnd(r.subject)}</TableCell>
                    <TableCell>{formatTnd(r.employee)}</TableCell>
                    <TableCell>{formatTnd(r.employer)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
