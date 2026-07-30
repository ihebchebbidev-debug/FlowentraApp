import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useReviewCycles } from '../../hooks/usePerformance';
import type { ReviewCycleFrequency, ReviewCycleStatus } from '../../types/performance.types';
import { ConfirmDeleteButton } from '../common/ConfirmDeleteButton';

const FREQUENCIES: ReviewCycleFrequency[] = ['annual', 'semi_annual', 'quarterly', 'custom'];
const CYCLE_STATUSES: ReviewCycleStatus[] = ['draft', 'open', 'closed'];

export function ReviewCyclesTab() {
  const { t } = useTranslation('hr');
  const { toast } = useToast();
  const { cyclesQuery, createCycle, updateCycle, deleteCycle } = useReviewCycles();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<ReviewCycleFrequency>('annual');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [selfReq, setSelfReq] = useState(true);

  const submit = async () => {
    if (!name || !periodStart || !periodEnd) {
      toast({ title: t('performancePage.cycles.requiredError'), variant: 'destructive' });
      return;
    }
    await createCycle.mutateAsync({
      name, frequency, periodStart, periodEnd,
      selfAssessmentRequired: selfReq, status: 'draft',
    });
    toast({ title: t('performancePage.cycles.createdToast') });
    setOpen(false);
    setName(''); setPeriodStart(''); setPeriodEnd(''); setSelfReq(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('performancePage.cycles.title')}</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />{t('performancePage.cycles.newCycle')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('performancePage.cycles.newReviewCycle')}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>{t('performancePage.cycles.name')}</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('performancePage.cycles.namePlaceholder')} />
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
              <div className="flex items-center justify-between">
                <Label>{t('performancePage.cycles.requireSelfAssessment')}</Label>
                <Switch checked={selfReq} onCheckedChange={setSelfReq} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>{t('performancePage.common.cancel')}</Button>
              <Button onClick={submit} disabled={createCycle.isPending}>{t('performancePage.common.create')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('performancePage.cycles.table.name')}</TableHead>
                <TableHead>{t('performancePage.cycles.table.frequency')}</TableHead>
                <TableHead>{t('performancePage.cycles.table.period')}</TableHead>
                <TableHead>{t('performancePage.cycles.table.status')}</TableHead>
                <TableHead>{t('performancePage.cycles.table.reviews')}</TableHead>
                <TableHead>{t('performancePage.cycles.table.selfAssessment')}</TableHead>
                <TableHead className="w-[200px]">{t('performancePage.cycles.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(cyclesQuery.data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t('performancePage.cycles.noCycles')}</TableCell></TableRow>
              )}
              {(cyclesQuery.data ?? []).map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{t(`performancePage.cycles.frequencyOptions.${c.frequency}`, { defaultValue: c.frequency.replace('_', ' ') })}</TableCell>
                  <TableCell className="text-xs">{new Date(c.periodStart).toLocaleDateString()} → {new Date(c.periodEnd).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant={c.status === 'open' ? 'default' : c.status === 'closed' ? 'outline' : 'secondary'}>{t(`performancePage.status.${c.status}`, { defaultValue: c.status })}</Badge></TableCell>
                  <TableCell className="text-xs">{c.completedReviewsCount}/{c.reviewsCount}</TableCell>
                  <TableCell>{c.selfAssessmentRequired ? t('performancePage.cycles.yes') : t('performancePage.cycles.no')}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Select
                        value={c.status}
                        onValueChange={(v) => updateCycle.mutate({ id: c.id, payload: { status: v as ReviewCycleStatus } })}
                      >
                        <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CYCLE_STATUSES.map(s => (
                            <SelectItem key={s} value={s}>{t(`performancePage.status.${s}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <ConfirmDeleteButton
                        size="icon"
                        variant="ghost"
                        disabled={deleteCycle.isPending}
                        onConfirm={() => deleteCycle.mutate(c.id)}
                        triggerContent={<Trash2 className="h-4 w-4" />}
                        title={t('performancePage.cycles.deleteConfirmTitle')}
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
