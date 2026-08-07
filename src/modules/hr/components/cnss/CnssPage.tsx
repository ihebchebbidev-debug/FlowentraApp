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
import { useCnssRates, useCnssDeclaration } from '../../hooks/useCnss';
import { formatTnd } from '../../utils/money';
import { useToast } from '@/hooks/use-toast';
import dayjs from 'dayjs';
import { z } from 'zod';
import { HrPermissionButton } from '../common/HrPermissionButton';
import { useHrPermissionGuard } from '../../hooks/useHrPermissionGuard';

type TFunc = (key: string, options?: any) => string;

const makeCnssRateSchema = (t: TFunc) => z.object({
  employeeRatePct: z.coerce.number({ invalid_type_error: t('cnssErrors.employeeRateRequired') })
    .min(0, t('cnssErrors.employeeRateMin'))
    .max(100, t('cnssErrors.employeeRateMax')),
  employerRatePct: z.coerce.number({ invalid_type_error: t('cnssErrors.employerRateRequired') })
    .min(0, t('cnssErrors.employerRateMin'))
    .max(100, t('cnssErrors.employerRateMax')),
  ceiling: z.union([z.literal(''), z.coerce.number().min(0, t('cnssErrors.ceilingMin'))]),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t('cnssErrors.effectiveFromRequired')),
});
type CnssRateErrors = Partial<Record<'employeeRatePct' | 'employerRatePct' | 'ceiling' | 'effectiveFrom', string>>;

export function CnssPage() {
  const { t } = useTranslation('hr');
  const cnssRateSchema = useMemo(() => makeCnssRateSchema(t), [t]);
  const { toast } = useToast();
  const guardHr = useHrPermissionGuard();
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

  // The declaration is computed SERVER-SIDE (GET /api/hr/cnss/declaration) so the
  // filed figures always match the payroll engine. No client-side re-derivation.
  const declarationQuery = useCnssDeclaration(year, month);
  const declaration = declarationQuery.data ?? null;
  const lines = declaration?.lines ?? [];

  const saveRate = async () => {
    if (!guardHr('update')) return;
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
    const header = ['cnssNumber', 'employee', 'salarySubject', 'employeeCnss', 'employerCnss', 'css'];
    const rows = lines.map(r => [
      r.cnssNumber ?? '',
      r.userName,
      Number(r.salarySubject).toFixed(3),
      Number(r.employeeCnss).toFixed(3),
      Number(r.employerCnss).toFixed(3),
      Number(r.css).toFixed(3),
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
              <div className="text-xs text-muted-foreground">{t('cnssPage.totals.subject')}</div>
              <div className="text-xl font-semibold mt-1">{formatTnd(declaration?.totalSalarySubject ?? 0)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0 bg-card">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{t('cnssPage.totals.css', { defaultValue: 'CSS' })}</div>
              <div className="text-xl font-semibold mt-1">{formatTnd(declaration?.totalCss ?? 0)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0 bg-card">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{t('cnssPage.totals.employee')}</div>
              <div className="text-xl font-semibold mt-1">{formatTnd(declaration?.totalEmployeeCnss ?? 0)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0 bg-card">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{t('cnssPage.totals.employer')}</div>
              <div className="text-xl font-semibold mt-1">{formatTnd(declaration?.totalEmployerCnss ?? 0)}</div>
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
              <HrPermissionButton action="update" onClick={saveRate} disabled={upsertRate.isPending} className="gap-2">
                <Save className="h-4 w-4" /> {t('cnssPage.saveRate')}
              </HrPermissionButton>
            </div>

            {(ratesQuery.data ?? []).length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-muted-foreground mb-2">{t('cnssPage.history')}</div>
                <div className="flex flex-wrap gap-2">
                  {(ratesQuery.data ?? []).map(r => (
                    <Badge key={r.id} variant={r.isActive ? 'default' : 'outline'} className="text-px-11">
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
                  <TableHead>{t('cnssPage.subject')}</TableHead>
                  <TableHead>{t('cnssPage.employeeShare')}</TableHead>
                  <TableHead>{t('cnssPage.employerShare')}</TableHead>
                  <TableHead>{t('cnssPage.totals.css', { defaultValue: 'CSS' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {declarationQuery.isLoading && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">{t('loading', { defaultValue: 'Loading…' })}</TableCell></TableRow>
                )}
                {!declarationQuery.isLoading && lines.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">{t('cnssPage.noData', { defaultValue: 'No declaration data for this period.' })}</TableCell></TableRow>
                )}
                {lines.map(r => (
                  <TableRow key={r.userId}>
                    <TableCell className="font-mono text-xs">{r.cnssNumber ?? '—'}</TableCell>
                    <TableCell className="font-medium">{r.userName}</TableCell>
                    <TableCell>{formatTnd(r.salarySubject)}</TableCell>
                    <TableCell>{formatTnd(r.employeeCnss)}</TableCell>
                    <TableCell>{formatTnd(r.employerCnss)}</TableCell>
                    <TableCell>{formatTnd(r.css)}</TableCell>
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
