import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { EmployeeSalaryConfig, SalaryInput } from '../../types/hr.types';
import { usePayrollCalculation } from '../../hooks/usePayrollCalculation';
import { formatTnd } from '../../utils/money';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Coins, ShieldCheck } from 'lucide-react';

export type SalaryConfigFormValues = {
  grossSalary: number;
  isHeadOfFamily: boolean;
  childrenCount: number;
  customDeductions?: number;
  bankAccount?: string;
  cnssNumber?: string;
  department?: string;
  position?: string;
  employmentType: EmployeeSalaryConfig['employmentType'];

  cin?: string;
  birthDate?: string;
  maritalStatus?: EmployeeSalaryConfig['maritalStatus'];
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
};

export function SalaryConfigForm(props: {
  initial?: Partial<EmployeeSalaryConfig> | null;
  onSubmit: (values: SalaryConfigFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
}) {
  const { t } = useTranslation('hr');
  const form = useForm<SalaryConfigFormValues>({
    defaultValues: {
      grossSalary: props.initial?.grossSalary ?? 0,
      isHeadOfFamily: props.initial?.isHeadOfFamily ?? false,
      childrenCount: props.initial?.childrenCount ?? 0,
      customDeductions: props.initial?.customDeductions ?? undefined,
      bankAccount: props.initial?.bankAccount ?? '',
      cnssNumber: props.initial?.cnssNumber ?? '',
      department: props.initial?.department ?? '',
      position: props.initial?.position ?? '',
      employmentType: props.initial?.employmentType ?? 'full_time',

      cin: (props.initial as any)?.cin ?? '',
      birthDate: (props.initial as any)?.birthDate ?? '',
      maritalStatus: (props.initial as any)?.maritalStatus ?? 'single',
      addressLine1: (props.initial as any)?.addressLine1 ?? '',
      addressLine2: (props.initial as any)?.addressLine2 ?? '',
      city: (props.initial as any)?.city ?? '',
      postalCode: (props.initial as any)?.postalCode ?? '',
      emergencyContactName: (props.initial as any)?.emergencyContactName ?? '',
      emergencyContactPhone: (props.initial as any)?.emergencyContactPhone ?? '',
    },
  });

  const watch = form.watch();
  const salaryInput: SalaryInput = {
    grossSalary: Number(watch.grossSalary || 0),
    isHeadOfFamily: Boolean(watch.isHeadOfFamily),
    childrenCount: Number(watch.childrenCount || 0),
    customDeductions: watch.customDeductions,
  };
  const breakdown = usePayrollCalculation(salaryInput);

  return (
    <Card className="shadow-card border-0 bg-card">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{t('employee.saveSalaryConfig')}</CardTitle>
          <Badge variant="secondary" className="text-[11px] inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t('payrollSlip.tunisianLaw2025')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertDescription className="text-sm text-muted-foreground">
            {t('employee.salaryConfigHint')}
          </AlertDescription>
        </Alert>

        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={form.handleSubmit(async (values) => props.onSubmit(values))}
        >
          <div className="md:col-span-2">
            <div className="text-sm font-medium">{t('employeeHr.section.identity')}</div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cin">{t('employeeHr.cin')}</Label>
                <Input id="cin" {...form.register('cin')} placeholder="01234567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">{t('employeeHr.birthDate')}</Label>
                <Input id="birthDate" type="date" {...form.register('birthDate')} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grossSalary">{t('employee.grossSalary')}</Label>
            <Input
              id="grossSalary"
              type="number"
              step="0.001"
              {...form.register('grossSalary', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="childrenCount">{t('employee.childrenCount')}</Label>
            <Input
              id="childrenCount"
              type="number"
              {...form.register('childrenCount', { valueAsNumber: true })}
            />
          </div>

          <div className="flex items-center gap-3 md:col-span-2">
            <Switch
              checked={watch.isHeadOfFamily}
              onCheckedChange={(v) => form.setValue('isHeadOfFamily', v)}
              id="isHeadOfFamily"
            />
            <Label htmlFor="isHeadOfFamily">{t('employee.headOfFamily')}</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnssNumber">{t('employee.cnssNumber')}</Label>
            <Input id="cnssNumber" {...form.register('cnssNumber')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankAccount">{t('employee.bankAccount')}</Label>
            <Input id="bankAccount" {...form.register('bankAccount')} />
          </div>

          <div className="md:col-span-2">
            <div className="text-sm font-medium">{t('employeeHr.section.contact')}</div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">{t('employeeHr.emergencyContactName')}</Label>
                <Input id="emergencyContactName" {...form.register('emergencyContactName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">{t('employeeHr.emergencyContactPhone')}</Label>
                <Input id="emergencyContactPhone" {...form.register('emergencyContactPhone')} placeholder="+216 ..." />
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="text-sm font-medium">{t('employeeHr.section.address')}</div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressLine1">{t('employeeHr.addressLine1')}</Label>
                <Input id="addressLine1" {...form.register('addressLine1')} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressLine2">{t('employeeHr.addressLine2')}</Label>
                <Input id="addressLine2" {...form.register('addressLine2')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{t('employeeHr.city')}</Label>
                <Input id="city" {...form.register('city')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">{t('employeeHr.postalCode')}</Label>
                <Input id="postalCode" {...form.register('postalCode')} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('payrollSlip.netSalary')}</Label>
            <div className="rounded-md border p-3 text-sm bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('employee.netPreview')}</span>
                <span className="font-semibold text-primary">{breakdown ? formatTnd(breakdown.netSalary) : '—'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('payrollSlip.irpp')}</Label>
            <div className="rounded-md border p-3 text-sm bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('employee.irppPreview')}</span>
                <span className="font-medium">{breakdown ? formatTnd(breakdown.irpp) : '—'}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={props.isSubmitting}>
              <Coins className="h-4 w-4 mr-2" />
              {t('save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

