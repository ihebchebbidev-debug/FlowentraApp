import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Percent, ListOrdered, UserRound, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatTnd } from '../../utils/money';
import { useCnssRates } from '../../hooks/useCnss';

/**
 * Read-only view of the CNSS/IRPP parameters that are ACTUALLY used by the
 * payroll engine. It renders the active `hr_cnss_rates` row from the backend —
 * never hardcoded defaults — so the numbers here always match what a payroll
 * run will compute. Editing happens on the CNSS page.
 */
export function PayrollSettings() {
  const { t } = useTranslation('hr');
  const { activeRateQuery } = useCnssRates();
  const rate = activeRateQuery.data;

  return (
    <Card className="shadow-card border-0 bg-card">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{t('payrollSettings.title')}</CardTitle>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to="/dashboard/hr/cnss">
              <Settings2 className="h-4 w-4" />
              {t('payrollSettings.manageRates', { defaultValue: 'Manage rates' })}
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert>
          <AlertDescription className="text-sm text-muted-foreground">
            {t('payrollSettings.hint')}
          </AlertDescription>
        </Alert>

        {activeRateQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !rate ? (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">
              {t('payrollSettings.noActiveRate', {
                defaultValue:
                  'No active CNSS rate is configured. Payroll cannot be calculated until a rate is saved on the CNSS page.',
              })}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Percent className="h-4 w-4 text-primary" />
                    {t('payrollSettings.ratesTitle')}
                  </div>
                  <Badge variant="secondary" className="text-px-11">
                    {t('payrollSettings.effectiveFrom', { defaultValue: 'From' })} {rate.effectiveFrom}
                  </Badge>
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('payrollSettings.cnssRate')}</span>
                    <span className="font-medium">{(rate.employeeRate * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('cnssPage.employerRate')}</span>
                    <span className="font-medium">{(rate.employerRate * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('payrollSettings.cssRate')}</span>
                    <span className="font-medium">{((rate.cssRate ?? 0) * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('cnssPage.ceiling')}</span>
                    <span className="font-medium">
                      {rate.salaryCeiling > 0 ? formatTnd(rate.salaryCeiling) : t('cnssPage.noCeiling')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="text-sm font-medium flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-primary" />
                  {t('payrollSettings.abattementTitle')}
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('payrollSettings.headOfFamily')}</span>
                    <span className="font-medium">{formatTnd(rate.abattementHeadOfFamily ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('payrollSettings.perChild')}</span>
                    <span className="font-medium">{formatTnd(rate.abattementPerChild ?? 0)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="text-sm font-medium flex items-center gap-2">
                  <ListOrdered className="h-4 w-4 text-primary" />
                  {t('payrollSettings.bracketsTitle')}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {t('payrollSettings.bracketsHint')}
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('payrollSlip.from')}</TableHead>
                  <TableHead>{t('payrollSlip.to')}</TableHead>
                  <TableHead>{t('payrollSlip.rate')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rate.irppBrackets ?? []).map((b, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{formatTnd(b.from)}</TableCell>
                    <TableCell>{b.to == null ? t('payrollSlip.infinity') : formatTnd(b.to)}</TableCell>
                    <TableCell className="font-medium">{(b.rate * 100).toFixed(0)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
