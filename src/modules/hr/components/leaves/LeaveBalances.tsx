import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus } from 'lucide-react';
import { useLeaveManagement } from '../../hooks/useLeaveManagement';
import { useEmployees } from '../../hooks/useEmployees';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { HrPermissionButton } from '../common/HrPermissionButton';
import { SetAllowanceDialog, type AllowanceTarget } from './SetAllowanceDialog';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/shared/SortableHeader';

export function LeaveBalances(props: { year: number }) {
  const { t } = useTranslation('hr');
  const { balancesQuery } = useLeaveManagement(props.year);
  const { employeesQuery } = useEmployees();
  const total = (balancesQuery.data ?? []).length;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AllowanceTarget | null>(null);

  const employees = useMemo(() => {
    const rows = employeesQuery.data ?? [];
    return rows
      .map((r: any) => r.user)
      .filter(Boolean)
      .map((u: any) => ({
        id: Number(u.id),
        name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || `#${u.id}`,
      }))
      .filter((u: { id: number }) => Number.isFinite(u.id) && u.id > 0);
  }, [employeesQuery.data]);

  const nameOf = (userId: number) =>
    employees.find(e => e.id === userId)?.name ?? `#${userId}`;

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (target: AllowanceTarget) => { setEditing(target); setDialogOpen(true); };

  const { sortKey, sortDirection, toggleSort, sortItems } = useTableSort<any>({
    employee: (b) => nameOf(b.userId),
    type: (b) => b.leaveType,
    allowance: (b) => b.annualAllowance,
    used: (b) => b.used,
    pending: (b) => b.pending,
    remaining: (b) => b.remaining,
  });
  const sortedBalances = useMemo(() => sortItems(balancesQuery.data ?? []), [balancesQuery.data, sortItems]);

  return (
    <Card className="shadow-card border-0 bg-card">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{t('leavesPage.balancesTitle')}</CardTitle>
            <Badge variant="secondary" className="text-px-11">{total}</Badge>
          </div>
          <HrPermissionButton action="update" size="sm" className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('leavesPage.allowanceDialog.title')}
          </HrPermissionButton>
        </div>
      </CardHeader>
      <CardContent>
        {balancesQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">{t('loading')}</div>
        ) : balancesQuery.error ? (
          <div className="text-sm text-destructive">{String(balancesQuery.error)}</div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <SortableHeader columnKey="employee" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('leavesPage.allowanceDialog.employee')}</SortableHeader>
                  <SortableHeader columnKey="type" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('leavesPage.type')}</SortableHeader>
                  <SortableHeader columnKey="allowance" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('leavesPage.allowance')}</SortableHeader>
                  <SortableHeader columnKey="used" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('leavesPage.used')}</SortableHeader>
                  <SortableHeader columnKey="pending" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('leavesPage.pending')}</SortableHeader>
                  <SortableHeader columnKey="remaining" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('leavesPage.remaining')}</SortableHeader>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(balancesQuery.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {t('leavesPage.allowanceDialog.empty')}
                    </TableCell>
                  </TableRow>
                )}
                {sortedBalances.map(b => (
                  <TableRow key={`${b.userId}-${b.leaveType}`}>
                    <TableCell className="font-medium">{nameOf(b.userId)}</TableCell>
                    <TableCell className="capitalize">{t(`leaveType.${String(b.leaveType)}`, { defaultValue: String(b.leaveType).replace(/_/g, ' ') })}</TableCell>
                    <TableCell>{b.annualAllowance}</TableCell>
                    <TableCell>{b.used}</TableCell>
                    <TableCell>{b.pending}</TableCell>
                    <TableCell>{b.remaining}</TableCell>
                    <TableCell>
                      <HrPermissionButton
                        action="update"
                        size="icon"
                        variant="ghost"
                        aria-label={t('leavesPage.allowanceDialog.editTitle')}
                        title={t('leavesPage.allowanceDialog.editTitle')}
                        onClick={() => openEdit({ userId: b.userId, leaveType: String(b.leaveType), annualAllowance: Number(b.annualAllowance) })}
                      >
                        <Pencil className="h-4 w-4" />
                      </HrPermissionButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <SetAllowanceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        year={props.year}
        employees={employees}
        initial={editing}
      />
    </Card>
  );
}
