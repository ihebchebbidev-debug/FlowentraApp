import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { EmployeeSalaryConfig } from '../../types/hr.types';
import { useDepartments } from '../../hooks/useDepartments';
import { User, BriefcaseBusiness, IdCard, MapPin, HeartHandshake, Coins } from 'lucide-react';
import { ProfilePictureUpload } from '@/components/ui/profile-picture-upload';

export type EmployeeEditFormValues = {
  // User fields
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  // Work
  department: string;
  position: string;
  employmentType: EmployeeSalaryConfig['employmentType'];
  hireDate: string;
  contractType: 'CDI' | 'CDD' | 'Stage' | '';
  contractEndDate: string;
  // Compensation
  grossSalary: number;
  customDeductions?: number;
  cnssNumber: string;
  bankAccount: string;
  // Family
  isHeadOfFamily: boolean;
  childrenCount: number;
  // Identity
  cin: string;
  birthDate: string;
  maritalStatus: EmployeeSalaryConfig['maritalStatus'];
  // Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  // Emergency
  emergencyContactName: string;
  emergencyContactPhone: string;
};

export function EmployeeEditForm(props: {
  user: { id: number; firstName?: string; lastName?: string; email?: string; phoneNumber?: string; profilePictureUrl?: string | null } | null;
  salaryConfig?: Partial<EmployeeSalaryConfig> | null;
  onSubmit: (values: EmployeeEditFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
}) {
  const { t } = useTranslation('hr');
  const qc = useQueryClient();
  const { departmentsQuery } = useDepartments();
  const departments = departmentsQuery.data ?? [];

  const form = useForm<EmployeeEditFormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      department: '',
      position: '',
      employmentType: 'full_time',
      hireDate: '',
      contractType: '',
      contractEndDate: '',
      grossSalary: 0,
      customDeductions: undefined,
      cnssNumber: '',
      bankAccount: '',
      isHeadOfFamily: false,
      childrenCount: 0,
      cin: '',
      birthDate: '',
      maritalStatus: 'single',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postalCode: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    },
  });

  useEffect(() => {
    if (props.user || props.salaryConfig) {
      form.reset({
        firstName: props.user?.firstName ?? '',
        lastName: props.user?.lastName ?? '',
        email: props.user?.email ?? '',
        phoneNumber: props.user?.phoneNumber ?? '',
        department: props.salaryConfig?.department ?? '',
        position: props.salaryConfig?.position ?? '',
        employmentType: props.salaryConfig?.employmentType ?? 'full_time',
        hireDate: props.salaryConfig?.hireDate ?? '',
        contractType: ((props.salaryConfig as any)?.contractType ?? '') as EmployeeEditFormValues['contractType'],
        contractEndDate: ((props.salaryConfig as any)?.contractEndDate ?? '').toString().slice(0, 10),
        grossSalary: props.salaryConfig?.grossSalary ?? 0,
        customDeductions: props.salaryConfig?.customDeductions,
        cnssNumber: props.salaryConfig?.cnssNumber ?? '',
        bankAccount: props.salaryConfig?.bankAccount ?? '',
        isHeadOfFamily: props.salaryConfig?.isHeadOfFamily ?? false,
        childrenCount: props.salaryConfig?.childrenCount ?? 0,
        cin: props.salaryConfig?.cin ?? '',
        birthDate: props.salaryConfig?.birthDate ?? '',
        maritalStatus: (props.salaryConfig?.maritalStatus as EmployeeEditFormValues['maritalStatus']) ?? 'single',
        addressLine1: props.salaryConfig?.addressLine1 ?? '',
        addressLine2: props.salaryConfig?.addressLine2 ?? '',
        city: props.salaryConfig?.city ?? '',
        postalCode: props.salaryConfig?.postalCode ?? '',
        emergencyContactName: props.salaryConfig?.emergencyContactName ?? '',
        emergencyContactPhone: props.salaryConfig?.emergencyContactPhone ?? '',
      });
    }
  }, [props.user, props.salaryConfig, form]);

  const departmentNames = departments.map((d) => d.name);
  const watch = form.watch();
  const currentDept = watch.department?.trim();
  const departmentOptions = [...new Set([...departmentNames, ...(currentDept && !departmentNames.includes(currentDept) ? [currentDept] : [])])].sort();

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => props.onSubmit(values))}
    >
      {/* Personal info */}
      <Card className="shadow-card border-0 bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('employeeEdit.personalInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {props.user && (
            <div className="md:col-span-2">
              <Label className="mb-2 block">{t('employeeEdit.profilePicture')}</Label>
              <ProfilePictureUpload
                label=""
                currentUrl={props.user.profilePictureUrl ?? undefined}
                onUploaded={async (url) => {
                  try {
                    const { profilePictureApi } = await import('@/services/api/profilePictureApi');
                    await profilePictureApi.updateUserProfilePicture(props.user!.id, url);
                    qc.invalidateQueries({ queryKey: ['hr', 'employees'] });
                  } catch {
                    // non-fatal
                  }
                }}
                onRemoved={async () => {
                  try {
                    const { profilePictureApi } = await import('@/services/api/profilePictureApi');
                    await profilePictureApi.removeUserProfilePicture(props.user!.id);
                    qc.invalidateQueries({ queryKey: ['hr', 'employees'] });
                  } catch {
                    // non-fatal
                  }
                }}
                size="md"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="firstName">{t('employeeEdit.firstName')}</Label>
            <Input id="firstName" {...form.register('firstName', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">{t('employeeEdit.lastName')}</Label>
            <Input id="lastName" {...form.register('lastName', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('labels.email')}</Label>
            <Input id="email" type="email" {...form.register('email', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">{t('labels.phone')}</Label>
            <Input id="phoneNumber" {...form.register('phoneNumber')} placeholder="+216 ..." />
          </div>
        </CardContent>
      </Card>

      {/* Work info */}
      <Card className="shadow-card border-0 bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BriefcaseBusiness className="h-4 w-4" />
            {t('employeeEdit.workInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="department">{t('employee.department')}</Label>
            <Input
              id="department"
              list="department-list"
              {...form.register('department')}
              placeholder={t('employeeEdit.departmentPlaceholder')}
            />
            <datalist id="department-list">
              {departmentOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground">{t('employeeEdit.departmentHint')}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">{t('employee.position')}</Label>
            <Input id="position" {...form.register('position')} placeholder={t('employeeEdit.positionPlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label>{t('employee.employmentType')}</Label>
            <Select
              value={watch.employmentType}
              onValueChange={(v) => form.setValue('employmentType', v as EmployeeEditFormValues['employmentType'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_time">{t('employeeEdit.employmentFullTime')}</SelectItem>
                <SelectItem value="part_time">{t('employeeEdit.employmentPartTime')}</SelectItem>
                <SelectItem value="contract">{t('employeeEdit.employmentContract')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hireDate">{t('employee.hireDate')}</Label>
            <Input id="hireDate" type="date" {...form.register('hireDate')} />
          </div>
          <div className="space-y-2">
            <Label>{t('employeeEdit.contractType', 'Contract type')}</Label>
            <Select
              value={watch.contractType || ''}
              onValueChange={(v) => form.setValue('contractType', (v || '') as EmployeeEditFormValues['contractType'])}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('employeeEdit.contractTypePlaceholder', 'Select contract type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CDI">{t('employeeEdit.contract.cdi', 'CDI (permanent)')}</SelectItem>
                <SelectItem value="CDD">{t('employeeEdit.contract.cdd', 'CDD (fixed-term)')}</SelectItem>
                <SelectItem value="Stage">{t('employeeEdit.contract.stage', 'Stage (internship)')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contractEndDate">{t('employeeEdit.contractEndDate', 'Contract end date')}</Label>
            <Input id="contractEndDate" type="date" {...form.register('contractEndDate')} />
            <p className="text-xs text-muted-foreground">{t('employeeEdit.contractEndDateHint', 'Required for CDD / Stage. Leave empty for CDI.')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Compensation */}
      <Card className="shadow-card border-0 bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Coins className="h-4 w-4" />
            {t('employeeEdit.compensation')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="grossSalary">{t('employee.grossSalary')} (TND)</Label>
            <Input
              id="grossSalary"
              type="number"
              step="0.001"
              {...form.register('grossSalary', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customDeductions">{t('employee.customDeductions')} (TND)</Label>
            <Input
              id="customDeductions"
              type="number"
              step="0.001"
              {...form.register('customDeductions', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnssNumber">{t('employee.cnssNumber')}</Label>
            <Input id="cnssNumber" {...form.register('cnssNumber')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccount">{t('employee.bankAccount')}</Label>
            <Input id="bankAccount" {...form.register('bankAccount')} />
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
            <Label htmlFor="childrenCount">{t('employee.childrenCount')}</Label>
            <Input
              id="childrenCount"
              type="number"
              {...form.register('childrenCount', { valueAsNumber: true })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Identity */}
      <Card className="shadow-card border-0 bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <IdCard className="h-4 w-4" />
            {t('employeeHr.section.identity')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cin">{t('employeeHr.cin')}</Label>
            <Input id="cin" {...form.register('cin')} placeholder="01234567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthDate">{t('employeeHr.birthDate')}</Label>
            <Input id="birthDate" type="date" {...form.register('birthDate')} />
          </div>
          <div className="space-y-2">
            <Label>{t('employeeHr.maritalStatus')}</Label>
            <Select
              value={watch.maritalStatus}
              onValueChange={(v) => form.setValue('maritalStatus', v as EmployeeEditFormValues['maritalStatus'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">{t('employeeHr.marital.single')}</SelectItem>
                <SelectItem value="married">{t('employeeHr.marital.married')}</SelectItem>
                <SelectItem value="divorced">{t('employeeHr.marital.divorced')}</SelectItem>
                <SelectItem value="widowed">{t('employeeHr.marital.widowed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card className="shadow-card border-0 bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t('employeeHr.section.address')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
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
        </CardContent>
      </Card>

      {/* Emergency contact */}
      <Card className="shadow-card border-0 bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HeartHandshake className="h-4 w-4" />
            {t('employeeHr.section.contact')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">{t('employeeHr.emergencyContactName')}</Label>
            <Input id="emergencyContactName" {...form.register('emergencyContactName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">{t('employeeHr.emergencyContactPhone')}</Label>
            <Input id="emergencyContactPhone" {...form.register('emergencyContactPhone')} placeholder="+216 ..." />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={props.isSubmitting}>
          {t('save')}
        </Button>
      </div>
    </form>
  );
}
