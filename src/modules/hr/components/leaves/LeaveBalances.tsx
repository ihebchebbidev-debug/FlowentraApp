import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { useLeaveManagement } from '../../hooks/useLeaveManagement';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function LeaveBalances(props: { year: number }) {
  const { t } = useTranslation('hr');
  const { balancesQuery } = useLeaveManagement(props.year);
  const total = (balancesQuery.data ?? []).length;

  return (
    <Card className="shadow-card border-0 bg-card">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{t('leavesPage.balancesTitle')}</CardTitle>
          <Badge variant="secondary" className="text-[11px]">{total}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {balancesQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">{t('loading')}</div>
        ) : balancesQuery.error ? (
          <div className="text-sm text-destructive">{String(balancesQuery.error)}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('labels.employeeId')}</TableHead>
                <TableHead>{t('leavesPage.type')}</TableHead>
                <TableHead>{t('leavesPage.allowance')}</TableHead>
                <TableHead>{t('leavesPage.used')}</TableHead>
                <TableHead>{t('leavesPage.pending')}</TableHead>
                <TableHead>{t('leavesPage.remaining')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(balancesQuery.data ?? []).map(b => (
                <TableRow key={`${b.userId}-${b.leaveType}`}>
                  <TableCell>{b.userId}</TableCell>
                  <TableCell className="capitalize">{t(`leaveType.${String(b.leaveType)}`, { defaultValue: String(b.leaveType).replace(/_/g, ' ') })}</TableCell>
                  <TableCell>{b.annualAllowance}</TableCell>
                  <TableCell>{b.used}</TableCell>
                  <TableCell>{b.pending}</TableCell>
                  <TableCell>{b.remaining}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

