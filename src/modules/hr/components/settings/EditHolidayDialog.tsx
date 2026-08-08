import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { usePublicHolidays } from '../../hooks/useHolidays';
import { useHrPermissionGuard } from '../../hooks/useHrPermissionGuard';
import { translateHrServerError } from '../../utils/hrServerError';
import type { PublicHoliday } from '../../types/hr.types';

/** Edit an existing public holiday (PUT /api/hr/holidays/{id}). */
export function EditHolidayDialog(props: {
  holiday: PublicHoliday | null;
  onOpenChange: (v: boolean) => void;
  year?: number;
}) {
  const { t } = useTranslation('hr');
  const { toast } = useToast();
  const guardHr = useHrPermissionGuard();
  const { updateHoliday } = usePublicHolidays(props.year);

  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    if (!props.holiday) return;
    setDate(String(props.holiday.date).slice(0, 10));
    setName(props.holiday.name ?? '');
    setIsRecurring(!!props.holiday.isRecurring);
  }, [props.holiday]);

  const submit = async () => {
    if (!props.holiday) return;
    if (!guardHr('update')) return;
    if (!date || !name.trim()) {
      toast({ title: t('settingsPage.holidays.validation'), variant: 'destructive' });
      return;
    }
    try {
      await updateHoliday.mutateAsync({
        id: props.holiday.id,
        payload: { date, name: name.trim(), isRecurring },
      });
      toast({ title: t('settingsPage.holidays.updated') });
      props.onOpenChange(false);
    } catch (e) {
      toast({ title: translateHrServerError(t, e), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={!!props.holiday} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t('settingsPage.holidays.editTitle')}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>{t('settingsPage.holidays.date')}</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>{t('settingsPage.holidays.name')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            <Label>{t('settingsPage.holidays.recurring')}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={submit} disabled={updateHoliday.isPending}>{t('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
