import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/shared/SortableHeader';

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [userId, setUserId] = useState('');
  const [cycleId, setCycleId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('smart');
  const [weight, setWeight] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<GoalStatus>('not_started');
  const [dueDate, setDueDate] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setUserId(''); setCycleId(''); setTitle(''); setDescription('');
    setCategory('smart'); setWeight(0); setProgress(0); setStatus('not_started'); setDueDate('');
  };

  const openCreate = () => { resetForm(); setOpen(true); };

  const openEdit = (g: any) => {
    setEditingId(g.id);
    setUserId(String(g.userId ?? ''));
    setCycleId(g.cycleId ? String(g.cycleId) : '');
    setTitle(g.title ?? '');
    setDescription(g.description ?? '');
    setCategory((g.category ?? 'smart') as GoalCategory);
    setWeight(Number(g.weight ?? 0));
    setProgress(Number(g.progress ?? 0));
    setStatus((g.status ?? 'not_started') as GoalStatus);
    setDueDate(g.dueDate ? String(g.dueDate).slice(0, 10) : '');
    setOpen(true);
  };

  const submit = async () => {
    if (!userId || !title) {
      toast({ title: t('performancePage.goals.requiredError'), variant: 'destructive' });
      return;
    }
    const payload = {
      userId: Number(userId),
      cycleId: cycleId ? Number(cycleId) : null,
      title, description, category, weight,
      dueDate: dueDate || undefined,
      progress, status,
    };
    if (editingId) {
      await updateGoal.mutateAsync({ id: editingId, payload });
      toast({ title: t('performancePage.goals.updatedToast', { defaultValue: 'Goal updated' }) });
    } else {
      await createGoal.mutateAsync(payload);
      toast({ title: t('performancePage.goals.addedToast') });
    }
    setOpen(false);
    resetForm();
  };


  const goals = goalsQuery.data ?? [];
  const { sortKey, sortDirection, toggleSort, sortItems } = useTableSort<any>({
    employee: (g) => g.userName,
    title: (g) => g.title,
    category: (g) => g.category,
    cycle: (g) => g.cycleName,
    weight: (g) => g.weight,
    progress: (g) => g.progress,
    status: (g) => g.status,
    due: (g) => g.dueDate,
  });
  const sortedGoals = useMemo(() => sortItems(goals), [goals, sortItems]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('performancePage.goals.title')}</CardTitle>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />{t('performancePage.goals.addGoal')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? t('performancePage.goals.editGoal', { defaultValue: 'Edit goal' }) : t('performancePage.goals.newGoal')}</DialogTitle></DialogHeader>

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
              {editingId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t('performancePage.goals.table.progress')}</Label>
                    <Input type="number" min={0} max={100} value={progress} onChange={e => setProgress(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>{t('performancePage.goals.table.status')}</Label>
                    <Select value={status} onValueChange={v => setStatus(v as GoalStatus)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GOAL_STATUSES.map(s => (
                          <SelectItem key={s} value={s}>{t(`performancePage.status.${s}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>{t('performancePage.common.cancel')}</Button>
              <Button onClick={submit} disabled={createGoal.isPending || updateGoal.isPending}>{t('performancePage.common.save')}</Button>

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
                <SortableHeader columnKey="employee" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('performancePage.goals.table.employee')}</SortableHeader>
                <SortableHeader columnKey="title" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('performancePage.goals.table.title')}</SortableHeader>
                <SortableHeader columnKey="category" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('performancePage.goals.table.category')}</SortableHeader>
                <SortableHeader columnKey="cycle" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('performancePage.goals.table.cycle')}</SortableHeader>
                <SortableHeader columnKey="weight" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('performancePage.goals.table.weight')}</SortableHeader>
                <SortableHeader columnKey="progress" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('performancePage.goals.table.progress')}</SortableHeader>
                <SortableHeader columnKey="status" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('performancePage.goals.table.status')}</SortableHeader>
                <SortableHeader columnKey="due" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t('performancePage.goals.table.due')}</SortableHeader>
                <TableHead className="w-[160px]">{t('performancePage.goals.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">{t('performancePage.goals.noGoals')}</TableCell></TableRow>
              )}
              {sortedGoals.map(g => (
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
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={t('performancePage.goals.editGoal', { defaultValue: 'Edit goal' })}
                        title={t('performancePage.goals.editGoal', { defaultValue: 'Edit goal' })}
                        onClick={() => openEdit(g)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

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
