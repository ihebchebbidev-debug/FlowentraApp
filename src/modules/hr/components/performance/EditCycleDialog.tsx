import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useReviewCycles } from '../../hooks/usePerformance';
import { useHrPermissionGuard } from '../../hooks/useHrPermissionGuard';
import { translateHrServerError } from '../../utils/hrServerError';
import type { HrReviewCycle, ReviewCycleFrequency, ReviewCycleStatus } from '../../types/performance.types';

const FREQUENCIES: ReviewCycleFrequency[] = ['annual', 'semi_annual', 'quarterly', 'custom'];
const CYCLE_STATUSES: ReviewCycleStatus[] = ['draft', 'open', 'closed'];

/** Full edit of a review cycle — name, frequency, period, self-assessment and status. */
export function EditCycleDialog(props: {
  cycle: HrReviewCycle | null;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useTranslation('hr');
  const { toast } = useToast();
  const guardHr = useHrPermissionGuard();
  const { updateCycle } = useReviewCycles();

  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<ReviewCycleFrequency>('annual');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [status, setStatus] = useState<ReviewCycleStatus>('draft');
  const [selfReq, setSelfReq] = useState(true);

  useEffect(() => {
    const c = props.cycle;
    if (!c) return;
    setName(c.name ?? '');
    setFrequency(c.frequency);
    setPeriodStart(String(c.periodStart).slice(0, 10));
    setPeriodEnd(String(c.periodEnd).slice(0, 10));
    setStatus(c.status);
    setSelfReq(!!c.selfAssessmentRequired);
  }, [props.cycle]);

  const submit = async () => {
    if (!props.cycle) return;
    if (!guardHr('update')) return;
    if (!name.trim() || !periodStart || !periodEnd) {
      toast({ title: t('performancePage.cycles.requiredError'), variant: 'destructive' });
      return;
    }
    try {
      await updateCycle.mutateAsync({
        id: props.cycle.id,
        payload: {
          name: name.trim(),
          frequency,
          periodStart,
          periodEnd,
          status,
          selfAssessmentRequired: selfReq,
        },
      });
      toast({ title: t('performancePage.cycles.updatedToast') });
      props.onOpenChange(false);
    } catch (e) {
      toast({ title: translateHrServerError(t, e), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={!!props.cycle} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{t('performancePage.cycles.editCycle')}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>{t('performancePage.cycles.name')}</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>{t('performancePage.cycles.frequency')}</Label>
              <Select value={frequency} onValueChange={v => setFrequency(v as ReviewCycleFrequency)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map(f => (
                    <SelectItem key={f} value={f}>{t(`performancePage.cycles.frequencyOptions.${f}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('performancePage.cycles.periodStart')}</Label>
              <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
            </div>
            <div>
              <Label>{t('performancePage.cycles.periodEnd')}</Label>
              <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>{t('performancePage.cycles.table.status')}</Label>
            <Select value={status} onValueChange={v => setStatus(v as ReviewCycleStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CYCLE_STATUSES.map(s => (
                  <SelectItem key={s} value={s}>{t(`performancePage.status.${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label>{t('performancePage.cycles.requireSelfAssessment')}</Label>
            <Switch checked={selfReq} onCheckedChange={setSelfReq} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => props.onOpenChange(false)}>{t('performancePage.common.cancel')}</Button>
          <Button onClick={submit} disabled={updateCycle.isPending}>{t('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
