import { useTranslation } from 'react-i18next';
import type { SalaryBreakdown } from '../../types/hr.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTnd } from '../../utils/money';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Landmark, Scale, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';

export function PaySlipDetail(props: { breakdown: SalaryBreakdown }) {
  const { t } = useTranslation('hr');
  const b = props.breakdown;

  const totalDeductions = b.cnss + b.irpp + b.css;

  const overtimeHours = Number(b.overtimeHours ?? 0);
  const overtimeAmount = Number(b.overtimeAmount ?? 0);
  const hasOvertime = overtimeHours > 0 || overtimeAmount > 0;
  const unpaidDays = Number(b.unpaidDays ?? 0);
  const absenceDeduction = Number(b.absenceDeduction ?? 0);
  const hasAbsenceDeduction = unpaidDays > 0 || absenceDeduction > 0;

  const rows: Array<{ label: string; value: number; hint?: string }> = [
    { label: t('payrollSlip.grossSalary'), value: b.grossSalary },
  ];
  if (hasOvertime) {
    rows.push({
      label: t('payrollSlip.overtime', { defaultValue: 'Overtime' }),
      value: overtimeAmount,
      hint: `${overtimeHours.toFixed(2)} h`,
    });
  }
  if (hasAbsenceDeduction) {
    rows.push({
      label: t('payrollSlip.absenceDeduction', { defaultValue: 'Unpaid absence deduction' }),
      value: -absenceDeduction,
      hint: t('payrollSlip.unpaidDays', { count: unpaidDays, defaultValue: '{{count}} unpaid days' }),
    });
  }
  rows.push(
    { label: t('payrollSlip.cnss'), value: b.cnss },
    { label: t('payrollSlip.taxableGross'), value: b.taxableGross },
    { label: t('payrollSlip.abattement'), value: b.abattement },
    { label: t('payrollSlip.taxableBase'), value: b.taxableBase },
    { label: t('payrollSlip.irpp'), value: b.irpp },
    { label: t('payrollSlip.css'), value: b.css },
    { label: t('payrollSlip.netSalary'), value: b.netSalary },
  );


  return (
    <Card className="shadow-card border-0 bg-card">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{t('payrollSlip.methodology')}</CardTitle>
          <Badge variant="secondary" className="text-px-11 inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t('payrollSlip.tunisianLaw2025')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('payrollSlip.grossSalary')}
            </div>
            <div className="text-lg font-semibold mt-1">{formatTnd(b.grossSalary)}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              {t('payrollSlip.totalDeductions')}
            </div>
            <div className="text-lg font-semibold mt-1">{formatTnd(totalDeductions)}</div>
          </div>
          <div className="rounded-lg border bg-primary/5 p-3 border-primary/20">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              {t('payrollSlip.netSalary')}
            </div>
            <div className="text-lg font-semibold mt-1 text-primary">{formatTnd(b.netSalary)}</div>
          </div>
        </div>

        <Alert>
          <AlertDescription className="text-sm text-muted-foreground flex items-start gap-2">
            <Scale className="h-4 w-4 mt-0.5" />
            <span>{t('payrollSlip.methodologyHint')}</span>
          </AlertDescription>
        </Alert>

        <div className="grid gap-2">
          {rows.map(r => (
            <div key={r.label} className="flex justify-between border-b py-1 text-sm">
              <span className="text-muted-foreground">
                {r.label}
                {r.hint ? <span className="ml-2 text-xs opacity-70">({r.hint})</span> : null}
              </span>
              <span className="font-medium">{formatTnd(r.value)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{t('payrollSlip.brackets')}</div>
            <Badge variant="outline" className="text-px-11">
              {b.irppBrackets.length} {t('payrollSlip.bracketCount')}
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('payrollSlip.from')}</TableHead>
                <TableHead>{t('payrollSlip.to')}</TableHead>
                <TableHead>{t('payrollSlip.rate')}</TableHead>
                <TableHead>{t('payrollSlip.taxableInBracket')}</TableHead>
                <TableHead>{t('payrollSlip.taxAmount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {b.irppBrackets.map((br, idx) => (
                <TableRow key={idx}>
                  <TableCell>{br.from}</TableCell>
                  <TableCell>{Number.isFinite(br.to) ? br.to : t('payrollSlip.infinity')}</TableCell>
                  <TableCell>{(br.rate * 100).toFixed(0)}%</TableCell>
                  <TableCell>{br.taxableInBracket.toFixed(3)}</TableCell>
                  <TableCell>{br.taxAmount.toFixed(3)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

