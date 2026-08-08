import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLeaveManagement } from '../../hooks/useLeaveManagement';
import { useHrPermissionGuard } from '../../hooks/useHrPermissionGuard';
import { translateHrServerError } from '../../utils/hrServerError';

/** Leave types the allowance can be configured for (mirrors backend leave_type values). */
export const HR_LEAVE_TYPES = ['annual', 'sick', 'unpaid', 'maternity', 'paternity'] as const;

export type AllowanceTarget = {
  userId: number;
  leaveType: string;
  annualAllowance: number;
};

/**
 * Create/update a yearly leave allowance for one employee & leave type.
 * Backed by PUT /api/hr/leaves/balances/{userId} (upsert on user+year+type).
 */
export function SetAllowanceDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  year: number;
  employees: { id: number; name: string }[];
  /** When provided the dialog edits that row; otherwise it creates a new allowance. */
  initial?: AllowanceTarget | null;
}) {
  const { t } = useTranslation('hr');
  const { toast } = useToast();
  const guardHr = useHrPermissionGuard();
  const { setAllowance } = useLeaveManagement(props.year);

  const isEdit = !!props.initial;
  const [userId, setUserId] = useState('');
  const [leaveType, setLeaveType] = useState('annual');
  const [allowance, setAllowanceValue] = useState<number | ''>('');

  useEffect(() => {
    if (!props.open) return;
    setUserId(props.initial ? String(props.initial.userId) : '');
    setLeaveType(props.initial?.leaveType ?? 'annual');
    setAllowanceValue(props.initial ? Number(props.initial.annualAllowance) : '');
  }, [props.open, props.initial]);

  const employeeName = useMemo(
    () => props.employees.find(e => e.id === Number(userId))?.name ?? (userId ? `#${userId}` : ''),
    [props.employees, userId],
  );

  const submit = async () => {
    if (!guardHr('update')) return;
    if (!userId || allowance === '' || Number(allowance) < 0) {
      toast({ title: t('leavesPage.allowanceDialog.validation'), variant: 'destructive' });
      return;
    }
    try {
      await setAllowance.mutateAsync({
        userId: Number(userId),
        year: props.year,
        leaveType,
        annualAllowance: Number(allowance),
      });
      toast({ title: t('leavesPage.allowanceDialog.saved') });
      props.onOpenChange(false);
    } catch (e) {
      toast({ title: translateHrServerError(t, e), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('leavesPage.allowanceDialog.editTitle') : t('leavesPage.allowanceDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('leavesPage.allowanceDialog.hint', { year: props.year })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div>
            <Label>{t('leavesPage.allowanceDialog.employee')}</Label>
            {isEdit ? (
              <Input value={employeeName} disabled />
            ) : (
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger><SelectValue placeholder={t('employee.selectEmployee', 'Select employee...')} /></SelectTrigger>
                <SelectContent>
                  {props.employees.map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label>{t('leavesPage.type')}</Label>
            <Select value={leaveType} onValueChange={setLeaveType} disabled={isEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {HR_LEAVE_TYPES.map(lt => (
                  <SelectItem key={lt} value={lt}>{t(`leaveType.${lt}`, { defaultValue: lt })}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('leavesPage.allowanceDialog.days')}</Label>
            <Input
              type="number"
              step="0.5"
              min={0}
              value={allowance}
              onChange={(e) => setAllowanceValue(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={submit} disabled={setAllowance.isPending}>{t('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
