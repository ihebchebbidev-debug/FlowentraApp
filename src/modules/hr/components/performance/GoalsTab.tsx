import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDeleteButton } from '../common/ConfirmDeleteButton';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useGoals, useReviewCycles } from '../../hooks/usePerformance';
import { useEmployees } from '../../hooks/useEmployees';
import type { GoalCategory, GoalStatus } from '../../types/performance.types';

const STATUS_VARIANT: Record<GoalStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  not_started: 'outline',
  in_progress: 'secondary',
  achieved: 'default',
  partially: 'secondary',
  missed: 'destructive',
  cancelled: 'outline',
};

const GOAL_STATUSES: GoalStatus[] = ['not_started', 'in_progress', 'achieved', 'partially', 'missed', 'cancelled'];
const GOAL_CATEGORIES: GoalCategory[] = ['smart', 'okr', 'kpi', 'other'];

export function GoalsTab() {
  const { t } = useTranslation('hr');
  const { toast } = useToast();
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { employeesQuery } = useEmployees();
  const { cyclesQuery } = useReviewCycles();
  const { goalsQuery, createGoal, updateGoal, deleteGoal } = useGoals({
    userId: filterUser === 'all' ? undefined : Number(filterUser),
    status: filterStatus === 'all' ? undefined : filterStatus,
  });

  const users = useMemo(() => (employeesQuery.data ?? []).map((r: any) => r.user).filter(Boolean), [employeesQuery.data]);

  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [cycleId, setCycleId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('smart');
  const [weight, setWeight] = useState(0);
  const [dueDate, setDueDate] = useState('');

  const submit = async () => {
    if (!userId || !title) {
      toast({ title: t('performancePage.goals.requiredError'), variant: 'destructive' });
      return;
    }
    await createGoal.mutateAsync({
      userId: Number(userId),
      cycleId: cycleId ? Number(cycleId) : null,
      title, description, category, weight,
      dueDate: dueDate || undefined,
      progress: 0, status: 'not_started',
    });
    toast({ title: t('performancePage.goals.addedToast') });
    setOpen(false);
    setTitle(''); setDescription(''); setWeight(0); setDueDate(''); setCycleId('');
  };

  const goals = goalsQuery.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('performancePage.goals.title')}</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />{t('performancePage.goals.addGoal')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('performancePage.goals.newGoal')}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>{t('performancePage.common.employee')}</Label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger><SelectValue placeholder={t('performancePage.common.selectEmployee')} /></SelectTrigger>
                  <SelectContent>
                    {users.map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)}>{`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('performancePage.common.reviewCycleOptional')}</Label>
                <Select value={cycleId} onValueChange={setCycleId}>
                  <SelectTrigger><SelectValue placeholder={t('performancePage.common.none')} /></SelectTrigger>
                  <SelectContent>
                    {(cyclesQuery.data ?? []).map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('performancePage.goals.titleField')}</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>{t('performancePage.goals.description')}</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>{t('performancePage.goals.category')}</Label>
                  <Select value={category} onValueChange={v => setCategory(v as GoalCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GOAL_CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{t(`performancePage.goals.categoryOptions.${c}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('performancePage.goals.weight')}</Label>
                  <Input type="number" min={0} max={100} value={weight} onChange={e => setWeight(Number(e.target.value))} />
                </div>
                <div>
                  <Label>{t('performancePage.goals.dueDate')}</Label>
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>{t('performancePage.common.cancel')}</Button>
              <Button onClick={submit} disabled={createGoal.isPending}>{t('performancePage.common.save')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="min-w-[200px]">
            <Label className="text-xs">{t('performancePage.goals.filterEmployee')}</Label>
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('performancePage.common.all')}</SelectItem>
                {users.map((u: any) => (
                  <SelectItem key={u.id} value={String(u.id)}>{`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[180px]">
            <Label className="text-xs">{t('performancePage.goals.filterStatus')}</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('performancePage.common.all')}</SelectItem>
                {GOAL_STATUSES.map(s => (
                  <SelectItem key={s} value={s}>{t(`performancePage.status.${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table className="min-w-[750px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t('performancePage.goals.table.employee')}</TableHead>
                <TableHead>{t('performancePage.goals.table.title')}</TableHead>
                <TableHead>{t('performancePage.goals.table.category')}</TableHead>
                <TableHead>{t('performancePage.goals.table.cycle')}</TableHead>
                <TableHead>{t('performancePage.goals.table.weight')}</TableHead>
                <TableHead>{t('performancePage.goals.table.progress')}</TableHead>
                <TableHead>{t('performancePage.goals.table.status')}</TableHead>
                <TableHead>{t('performancePage.goals.table.due')}</TableHead>
                <TableHead className="w-[160px]">{t('performancePage.goals.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">{t('performancePage.goals.noGoals')}</TableCell></TableRow>
              )}
              {goals.map(g => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.userName}</TableCell>
                  <TableCell>{g.title}</TableCell>
                  <TableCell><Badge variant="outline">{t(`performancePage.goals.categoryOptions.${g.category}`, { defaultValue: g.category })}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-xs">{g.cycleName ?? '—'}</TableCell>
                  <TableCell>{g.weight}%</TableCell>
                  <TableCell className="min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <Progress value={g.progress} className="h-2 w-24" />
                      <span className="text-xs text-muted-foreground w-9">{g.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[g.status]}>{t(`performancePage.status.${g.status}`, { defaultValue: g.status.replace('_', ' ') })}</Badge></TableCell>
                  <TableCell className="text-xs">{g.dueDate ? new Date(g.dueDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Select
                        value={g.status}
                        onValueChange={(v) => updateGoal.mutate({ id: g.id, payload: { status: v as GoalStatus } })}
                      >
                        <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {GOAL_STATUSES.map(s => (
                            <SelectItem key={s} value={s}>{t(`performancePage.status.${s}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <ConfirmDeleteButton
                        size="icon"
                        variant="ghost"
                        disabled={deleteGoal.isPending}
                        onConfirm={() => deleteGoal.mutate(g.id)}
                        triggerContent={<Trash2 className="h-4 w-4" />}
                        title={t('performancePage.goals.deleteConfirmTitle')}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
