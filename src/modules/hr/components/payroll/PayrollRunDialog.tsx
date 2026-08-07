import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarDays } from 'lucide-react';
import { TenantSelector } from '@/components/TenantSelector';
import { useTargetTenant } from '@/hooks/useTargetTenant';
import { toast } from 'sonner';

type Values = { month: number; year: number };

export function PayrollRunDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: Values) => Promise<void> | void;
  isSubmitting?: boolean;
}) {
  const { t } = useTranslation('hr');
  const { targetTenantId, handleTenantChange, isTenantRequired } = useTargetTenant();
  const form = useForm<Values>({ defaultValues: { month: new Date().getMonth() + 1, year: new Date().getFullYear() } });

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('payrollPage.generateRunTitle')}</DialogTitle>
        </DialogHeader>
        <Alert>
          <AlertDescription className="text-sm text-muted-foreground">
            {t('payrollPage.generateRunHint')}
          </AlertDescription>
        </Alert>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(async (values) => {
            if (isTenantRequired) {
              toast.error(t('validation.tenantRequired', 'Please select a target company'));
              return;
            }
            await props.onConfirm(values);
            props.onOpenChange(false);
          })}
        >
          <TenantSelector value={targetTenantId} onChange={handleTenantChange} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {t('attendancePage.month')}
              </Label>
              <Input type="number" min={1} max={12} {...form.register('month', { valueAsNumber: true })} />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {t('attendancePage.year')}
              </Label>
              <Input type="number" {...form.register('year', { valueAsNumber: true })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={props.isSubmitting}>
              {t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

