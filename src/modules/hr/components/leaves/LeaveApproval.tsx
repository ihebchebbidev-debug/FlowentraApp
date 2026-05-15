import { useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { schedulesApi, type UserLeave } from '@/services/api/schedulesApi';
import { useEmployees } from '../../hooks/useEmployees';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import dayjs from 'dayjs';
import { CheckCircle2, XCircle } from 'lucide-react';

type LeaveRow = UserLeave & { userId: number; userName: string; profilePictureUrl?: string | null; email?: string | null };

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let idx = 0;

  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (idx < items.length) {
      const current = idx++;
      results[current] = await fn(items[current]);
    }
  });

  await Promise.all(workers);
  return results;
}

export function LeaveApproval() {
  const { t } = useTranslation('hr');
  const { employeesQuery } = useEmployees();

  const users = useMemo(() => {
    const rows = employeesQuery.data ?? [];
    return rows
      .map((r: any) => r.user)
      .filter(Boolean)
      .map((u: any) => ({
        id: Number(u.id),
        name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || `#${u.id}`,
        profilePictureUrl: u.profilePictureUrl ?? null,
        email: u.email ?? null,
      }))
      .filter((u: any) => Number.isFinite(u.id) && u.id > 0);
  }, [employeesQuery.data]);

  const leavesQuery = useQuery({
    queryKey: ['hr', 'leaveApprovals', users.map(u => u.id)],
    enabled: users.length > 0,
    queryFn: async () => {
      const perUser = await mapWithConcurrency(users, 5, async (u) => {
        const leaves = await schedulesApi.getLeaves(u.id);
        return leaves.map(l => ({
          ...l,
          userId: u.id,
          userName: u.name,
          profilePictureUrl: u.profilePictureUrl,
          email: u.email,
        })) as LeaveRow[];
      });
      return perUser.flat();
    },
  });

  const pending = useMemo(() => {
    const list = leavesQuery.data ?? [];
    return list
      .filter(l => String(l.status || 'pending') === 'pending')
      .sort((a, b) => (String(a.startDate) > String(b.startDate) ? 1 : -1));
  }, [leavesQuery.data]);

  const approveMutation = useMutation({
    mutationFn: async (leaveId: number) => schedulesApi.updateLeave(leaveId, { status: 'approved' }),
    onSuccess: () => leavesQuery.refetch(),
  });

  const rejectMutation = useMutation({
    mutationFn: async (leaveId: number) => schedulesApi.updateLeave(leaveId, { status: 'rejected' }),
    onSuccess: () => leavesQuery.refetch(),
  });

  const formatRange = (start: string, end: string) => {
    const s = dayjs(start);
    const e = dayjs(end);
    if (!s.isValid() || !e.isValid()) return `${start} → ${end}`;
    if (s.isSame(e, 'day')) return s.format('DD MMM YYYY');
    if (s.isSame(e, 'month')) return `${s.format('DD')}–${e.format('DD MMM YYYY')}`;
    if (s.isSame(e, 'year')) return `${s.format('DD MMM')}–${e.format('DD MMM YYYY')}`;
    return `${s.format('DD MMM YYYY')}–${e.format('DD MMM YYYY')}`;
  };

  return (
    <Card className="shadow-card border-0 bg-card">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{t('leavesPage.approvalTitle')}</CardTitle>
          <Badge variant="secondary" className="text-[11px]">
            {pending.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert>
          <AlertDescription className="text-sm text-muted-foreground">
            {t('leavesPage.approvalHint')}
          </AlertDescription>
        </Alert>

        {employeesQuery.isLoading || leavesQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">{t('loading')}</div>
        ) : (employeesQuery.error || leavesQuery.error) ? (
          <div className="text-sm text-destructive">{String(employeesQuery.error || leavesQuery.error)}</div>
        ) : pending.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-sm font-medium">{t('leavesPage.approvalEmptyTitle')}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('leavesPage.approvalEmptyHint')}</div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('employee.employee')}</TableHead>
                <TableHead>{t('leavesPage.type')}</TableHead>
                <TableHead>{t('leavesPage.dates')}</TableHead>
                <TableHead>{t('leavesPage.reason')}</TableHead>
                <TableHead className="text-right">{t('leavesPage.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar src={l.profilePictureUrl} name={l.userName} seed={Number(l.userId)} size="sm" />
                      <div className="min-w-0">
                        <div className="truncate">{l.userName}</div>
                        {l.email ? <div className="truncate text-xs text-muted-foreground">{l.email}</div> : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">
                    {t(`leaveType.${String(l.leaveType)}`, { defaultValue: String(l.leaveType).replace(/_/g, ' ') })}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatRange(String(l.startDate), String(l.endDate))}</TableCell>
                  <TableCell className="max-w-[320px] truncate">{l.reason ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        onClick={() => approveMutation.mutate(Number(l.id))}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {t('leavesPage.approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        onClick={() => rejectMutation.mutate(Number(l.id))}
                      >
                        <XCircle className="h-4 w-4" />
                        {t('leavesPage.reject')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

