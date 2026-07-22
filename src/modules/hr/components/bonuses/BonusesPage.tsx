import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Gift } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useEmployees } from '../../hooks/useEmployees';
import { useBonuses } from '../../hooks/useBonuses';
import { HRPageHeader } from '../HRPageHeader';
import { useToast } from '@/hooks/use-toast';
import { formatTnd } from '../../utils/money';
import type { BonusCost } from '../../types/hr.types';
import dayjs from 'dayjs';
import { z } from 'zod';
import { HrPermissionButton } from '../common/HrPermissionButton';
import { useHrPermissionGuard } from '../../hooks/useHrPermissionGuard';

const BONUS_KINDS = ['bonus', 'allowance', 'reimbursement', 'other_cost'] as const;
const BONUS_FREQUENCIES = ['monthly', 'one_off'] as const;

const bonusFormSchema = z.object({
  userId: z.coerce.number({ invalid_type_error: 'Employee is required' })
    .int().positive('Employee is required'),
  kind: z.enum(BONUS_KINDS, { errorMap: () => ({ message: 'Invalid bonus kind' }) }),
  frequency: z.enum(BONUS_FREQUENCIES, { errorMap: () => ({ message: 'Invalid frequency' }) }),
  label: z.string().trim().min(1, 'Label is required').max(120, 'Label too long'),
  amount: z.coerce.number({ invalid_type_error: 'Amount must be a number' })
    .refine((n) => Number.isFinite(n) && n !== 0, 'Amount must be a non-zero number'),
  month: z.coerce.number().int().min(1, 'Month 1-12').max(12, 'Month 1-12'),
  year: z.coerce.number().int().min(2000, 'Invalid year').max(2100, 'Invalid year'),
  subjectToCnss: z.boolean(),
  affectsPayroll: z.boolean(),
});
type BonusFormValues = z.infer<typeof bonusFormSchema>;

export function BonusesPage() {
  const { t } = useTranslation('hr');
  const { toast } = useToast();
  const guardHr = useHrPermissionGuard();
  const [filterMonth, setFilterMonth] = useState<number>(dayjs().month() + 1);
  const [filterYear, setFilterYear] = useState<number>(dayjs().year());
  const [filterUser, setFilterUser] = useState<string>('all');

  const { employeesQuery } = useEmployees();
  const { bonusesQuery, createBonus, deleteBonus } = useBonuses({
    year: filterYear, month: filterMonth,
    userId: filterUser === 'all' ? undefined : Number(filterUser),
  });

  const users = useMemo(() => {
    return (employeesQuery.data ?? [])
      .map((r: any) => r.user).filter(Boolean)
      .map((u: any) => ({
        id: Number(u.id),
        name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || `#${u.id}`,
      }));
  }, [employeesQuery.data]);

  const userById = useMemo(() => {
    const map = new Map<number, string>();
    for (const u of users) map.set(u.id, u.name);
    return map;
  }, [users]);

  // Add dialog
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [kind, setKind] = useState<'bonus' | 'allowance' | 'reimbursement' | 'other_cost'>('bonus');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [month, setMonth] = useState<number>(dayjs().month() + 1);
  const [year, setYear] = useState<number>(dayjs().year());
  const [subjectToCnss, setSubjectToCnss] = useState<boolean>(false);
  const [affectsPayroll, setAffectsPayroll] = useState<boolean>(true);

  const [errors, setErrors] = useState<Partial<Record<keyof BonusFormValues, string>>>({});

  const submit = async () => {
    if (!guardHr('create')) return;
    const parsed = bonusFormSchema.safeParse({
      userId, kind, label, amount,
      frequency: 'one_off' as const,
      month, year, subjectToCnss, affectsPayroll,
    });
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof BonusFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof BonusFormValues | undefined;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast({
        title: t('bonusesPage.validationRequired'),
        description: parsed.error.issues[0]?.message,
        variant: 'destructive',
      });
      return;
    }
    setErrors({});
    await createBonus.mutateAsync(parsed.data);
    toast({ title: t('bonusesPage.added') });
    setOpen(false);
    setLabel(''); setAmount(0);
  };

  // A bonus row counts as a "negative" line when its kind is `other_cost`
  // (e.g. salary advance, fine) or when its amount was entered as a negative
  // number. Everything else (bonus / allowance / reimbursement) is positive.
  const isNegativeBonus = (b: BonusCost) => b.kind === 'other_cost' || Number(b.amount) < 0;

  const totals = useMemo(() => {
    const list = bonusesQuery.data ?? [];
    let bonuses = 0, deductions = 0;
    for (const b of list) {
      const amt = Math.abs(Number(b.amount) || 0);
      if (isNegativeBonus(b)) deductions += amt;
      else bonuses += amt;
    }
    return { bonuses, deductions, net: bonuses - deductions, count: list.length };
  }, [bonusesQuery.data]);

  return (
    <div className="flex flex-col">
      <HRPageHeader
        title={t('bonuses')}
        subtitle={t('bonusesPage.subtitle')}
        icon={Gift}
        accentColor="chart-5"
        backTo={{ to: '/dashboard/hr', label: t('dashboard') }}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <HrPermissionButton action="create" size="sm" className="gap-2"><Plus className="h-4 w-4" /> {t('bonusesPage.add')}</HrPermissionButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('bonusesPage.addTitle')}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>{t('bonusesPage.employee')}</Label>
                  <Select value={userId} onValueChange={setUserId}>
                    <SelectTrigger aria-invalid={!!errors.userId}><SelectValue placeholder={t('bonusesPage.selectEmployee')} /></SelectTrigger>
                    <SelectContent>
                      {users.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.userId && <p className="text-xs text-destructive mt-1">{errors.userId}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>{t('bonusesPage.kind')}</Label>
                    <Select value={kind} onValueChange={(v: any) => setKind(v)}>
                      <SelectTrigger aria-invalid={!!errors.kind}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bonus">{t('bonusKind.bonus')}</SelectItem>
                        <SelectItem value="allowance">{t('bonusKind.allowance')}</SelectItem>
                        <SelectItem value="reimbursement">{t('bonusKind.reimbursement')}</SelectItem>
                        <SelectItem value="other_cost">{t('bonusKind.other_cost', { defaultValue: 'Other cost / deduction' })}</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.kind && <p className="text-xs text-destructive mt-1">{errors.kind}</p>}
                  </div>
                  <div>
                    <Label>{t('bonusesPage.amount')}</Label>
                    <Input type="number" step="0.001" value={amount} onChange={(e) => setAmount(Number(e.target.value))} aria-invalid={!!errors.amount} />
                    {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount}</p>}
                  </div>
                </div>
                <div>
                  <Label>{t('bonusesPage.label')}</Label>
                  <Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={120} aria-invalid={!!errors.label} />
                  {errors.label && <p className="text-xs text-destructive mt-1">{errors.label}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-4 rounded-md border p-3 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Switch checked={affectsPayroll} onCheckedChange={setAffectsPayroll} id="bonus-affects-payroll" />
                    <Label htmlFor="bonus-affects-payroll" className="text-xs">
                      {t('bonusesPage.affectsPayroll', { defaultValue: 'Affects payroll' })}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={subjectToCnss} onCheckedChange={setSubjectToCnss} id="bonus-subject-cnss" />
                    <Label htmlFor="bonus-subject-cnss" className="text-xs">
                      {t('bonusesPage.subjectToCnss', { defaultValue: 'Subject to CNSS' })}
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>{t('bonusesPage.month')}</Label>
                    <Input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} aria-invalid={!!errors.month} />
                    {errors.month && <p className="text-xs text-destructive mt-1">{errors.month}</p>}
                  </div>
                  <div>
                    <Label>{t('bonusesPage.year')}</Label>
                    <Input type="number" min={2000} max={2100} value={year} onChange={(e) => setYear(Number(e.target.value))} aria-invalid={!!errors.year} />
                    {errors.year && <p className="text-xs text-destructive mt-1">{errors.year}</p>}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>{t('cancel')}</Button>
                <HrPermissionButton action="create" onClick={submit} disabled={createBonus.isPending}>{t('save')}</HrPermissionButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="p-3 sm:p-4 lg:p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="shadow-card border-0 bg-card">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{t('bonusesPage.totals.count')}</div>
              <div className="text-2xl font-semibold mt-1">{totals.count}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0 bg-card">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{t('bonusesPage.totals.bonuses')}</div>
              <div className="text-2xl font-semibold mt-1 text-primary">{formatTnd(totals.bonuses)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0 bg-card">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{t('bonusesPage.totals.deductions')}</div>
              <div className="text-2xl font-semibold mt-1 text-destructive">{formatTnd(totals.deductions)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0 bg-card">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{t('bonusesPage.totals.net')}</div>
              <div className="text-2xl font-semibold mt-1">{formatTnd(totals.net)}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card border-0 bg-card">
          <CardHeader>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <Label>{t('bonusesPage.month')}</Label>
                <Input type="number" min={1} max={12} value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="w-24" />
              </div>
              <div>
                <Label>{t('bonusesPage.year')}</Label>
                <Input type="number" value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="w-32" />
              </div>
              <div className="min-w-[180px]">
                <Label>{t('bonusesPage.employee')}</Label>
                <Select value={filterUser} onValueChange={setFilterUser}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('bonusesPage.allEmployees')}</SelectItem>
                    {users.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {bonusesQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">{t('loading')}</div>
            ) : (bonusesQuery.data ?? []).length === 0 ? (
              <div className="py-8 text-center">
                <div className="text-sm font-medium">{t('bonusesPage.empty')}</div>
                <div className="text-xs text-muted-foreground mt-1">{t('bonusesPage.emptyHint')}</div>
              </div>
            ) : (
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('bonusesPage.employee')}</TableHead>
                    <TableHead>{t('bonusesPage.kind')}</TableHead>
                    <TableHead>{t('bonusesPage.label')}</TableHead>
                    <TableHead>{t('bonusesPage.period')}</TableHead>
                    <TableHead>{t('bonusesPage.amount')}</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(bonusesQuery.data ?? []).map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{userById.get(b.userId) ?? `#${b.userId}`}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{t(`bonusKind.${b.kind}`)}</Badge></TableCell>
                      <TableCell>{b.label}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {b.month && b.year ? `${String(b.month).padStart(2, '0')}/${b.year}` : '—'}
                      </TableCell>
                      <TableCell className={isNegativeBonus(b) ? 'text-destructive font-medium' : 'text-emerald-600 dark:text-emerald-400 font-medium'}>
                        {isNegativeBonus(b) ? '-' : '+'}{formatTnd(Math.abs(Number(b.amount)))}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <HrPermissionButton action="delete" size="icon" variant="ghost" aria-label={t('delete', 'Delete') as string}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </HrPermissionButton>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('bonuses.deleteTitle', 'Delete bonus?')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('bonuses.deleteDescription', 'This action cannot be undone. The bonus will be permanently removed.')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('cancel', 'Cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => { if (guardHr('delete')) deleteBonus.mutate(b.id); }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t('delete', 'Delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
