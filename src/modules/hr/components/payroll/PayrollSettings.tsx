import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { TUNISIAN_2025_DEFAULT_RATES } from '../../utils/tunisianTaxEngine';
import { RotateCcw, Percent, ListOrdered, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatTnd } from '../../utils/money';

export function PayrollSettings() {
  const { t } = useTranslation('hr');

  return (
    <Card className="shadow-card border-0 bg-card">
      <CardHeader>
        <CardTitle className="text-base">{t('payrollSettings.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert>
          <AlertDescription className="text-sm text-muted-foreground">
            {t('payrollSettings.hint')}
          </AlertDescription>
        </Alert>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <Percent className="h-4 w-4 text-primary" />
                {t('payrollSettings.ratesTitle')}
              </div>
              <Badge variant="secondary" className="text-[11px]">{t('payrollSettings.defaultsBadge')}</Badge>
            </div>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('payrollSettings.cnssRate')}</span>
                <span className="font-medium">{(TUNISIAN_2025_DEFAULT_RATES.cnssRate * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('payrollSettings.cssRate')}</span>
                <span className="font-medium">{(TUNISIAN_2025_DEFAULT_RATES.cssRate * 100).toFixed(2)}%</span>
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
                <span className="font-medium">{formatTnd(TUNISIAN_2025_DEFAULT_RATES.abattement.headOfFamily)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('payrollSettings.perChild')}</span>
                <span className="font-medium">{formatTnd(TUNISIAN_2025_DEFAULT_RATES.abattement.perChild)}</span>
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
            {TUNISIAN_2025_DEFAULT_RATES.brackets.map((b, idx) => (
              <TableRow key={idx}>
                <TableCell>{formatTnd(b.from)}</TableCell>
                <TableCell>{b.to == null ? t('payrollSlip.infinity') : formatTnd(b.to)}</TableCell>
                <TableCell className="font-medium">{(b.rate * 100).toFixed(0)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-end">
          <Button variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            {t('payrollSettings.resetDefaults')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

