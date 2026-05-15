import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';
import { LeaveRequestForm } from './LeaveRequestForm';
import { LeaveApproval } from './LeaveApproval';
import { LeaveBalances } from './LeaveBalances';
import { HRPageHeader } from '../HRPageHeader';
import { CalendarRange, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeavesCalendar } from './LeavesCalendar';
import { LeavesList } from './LeavesList';
import { schedulesApi } from '@/services/api/schedulesApi';
import { cn } from '@/lib/utils';
import { useEmployees } from '../../hooks/useEmployees';
import { useQuery } from '@tanstack/react-query';

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

export function LeavesPage() {
  const { t } = useTranslation('hr');
  const [open, setOpen] = useState(false);
  const year = dayjs().year();
  const { employeesQuery } = useEmployees();

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
    queryKey: ['hr', 'planningLeavesCalendar', users.map(u => u.id)],
    enabled: users.length > 0,
    queryFn: async () => {
      const perUser = await mapWithConcurrency(users, 5, async (u) => {
        const leaves = await schedulesApi.getLeaves(u.id);
        return leaves.map(l => ({ ...l, userName: u.name, userId: u.id }));
      });
      return perUser.flat() as any[];
    },
  });

  const calendarEvents = useMemo(() => {
    const list = leavesQuery.data ?? [];
    return list
      .filter(l => String(l.status) === 'approved')
      .map(l => {
        const tp = t(`leaveType.${String(l.leaveType)}`, { defaultValue: String(l.leaveType).replace(/_/g, ' ') });
        return {
          id: String(l.id),
          title: `${l.userName} • ${tp}`,
          start: dayjs(String(l.startDate)).toDate(),
          end: dayjs(String(l.endDate)).add(1, 'day').toDate(), // inclusive end
          allDay: true,
        };
      });
  }, [leavesQuery.data, t]);

  return (
    <div className="flex flex-col">
      <HRPageHeader
        title={t('leaves')}
        subtitle={t('leavesPage.subtitle')}
        icon={CalendarRange}
        accentColor="chart-4"
        backTo={{ to: '/dashboard/hr', label: t('dashboard') }}
        actions={
          <Button size="sm" onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('leavesPage.newRequest')}
          </Button>
        }
      />

      <div className="p-3 sm:p-4 lg:p-6">
        <Tabs defaultValue="calendar">
          <TabsList className={cn(
            "w-full h-auto p-1 bg-muted/50 rounded-lg grid gap-1",
            "grid-cols-2 sm:grid-cols-4"
          )}>
            <TabsTrigger value="calendar" className="px-4 py-2.5 text-sm font-medium">{t('leavesPage.calendarTab')}</TabsTrigger>
            <TabsTrigger value="list" className="px-4 py-2.5 text-sm font-medium">{t('leavesPage.listTab')}</TabsTrigger>
            <TabsTrigger value="balances" className="px-4 py-2.5 text-sm font-medium">{t('leavesPage.balancesTab')}</TabsTrigger>
            <TabsTrigger value="approvals" className="px-4 py-2.5 text-sm font-medium">{t('leavesPage.approvalsTab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-3">
            <LeavesCalendar events={calendarEvents} />
          </TabsContent>

          <TabsContent value="list" className="mt-3">
            <LeavesList />
          </TabsContent>

          <TabsContent value="balances" className="mt-3">
            <LeaveBalances year={year} />
          </TabsContent>

          <TabsContent value="approvals" className="mt-3">
            <LeaveApproval />
          </TabsContent>
        </Tabs>
      </div>

      <LeaveRequestForm
        open={open}
        onOpenChange={setOpen}
        onSubmit={async (values) => {
          await schedulesApi.createLeave({
            userId: Number(values.userId),
            leaveType: values.type,
            startDate: values.startDate,
            endDate: values.endDate,
            reason: values.reason,
          });
        }}
      />
    </div>
  );
}

