import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarDays, Check, ChevronsUpDown, StickyNote, UserRound } from 'lucide-react';
import { TenantSelector } from '@/components/TenantSelector';
import { useTargetTenant } from '@/hooks/useTargetTenant';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useEmployees } from '../../hooks/useEmployees';
import { selectEmployeeRows } from '../../utils/employeeRows';

export type FormValues = {
  userId: number;
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
};

export function LeaveRequestForm(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormValues) => Promise<void> | void;
  isSubmitting?: boolean;
}) {
  const { t } = useTranslation('hr');
  const { targetTenantId, handleTenantChange, isTenantRequired } = useTargetTenant();
  const form = useForm<FormValues>({
    defaultValues: { userId: 0, type: 'annual', startDate: '', endDate: '', reason: '' },
  });

  const { employeesQuery } = useEmployees();
  const employeesData = employeesQuery.data;
  const employees = useMemo(() => {
    return selectEmployeeRows(employeesData).map((row: any) => {
      const e = row?.user ?? row;
      return {
        id: Number(e.id ?? e.userId ?? e.user_id ?? 0),
        name:
          [e.firstName ?? e.first_name, e.lastName ?? e.last_name].filter(Boolean).join(' ').trim() ||
          e.fullName ||
          e.name ||
          e.email ||
          `#${e.id ?? e.userId ?? ''}`,
        email: e.email,
      };
    }).filter((e) => e.id > 0);
  }, [employeesData]);
  const [empOpen, setEmpOpen] = useState(false);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('leavesPage.newRequest')}</DialogTitle>
        </DialogHeader>
        <Alert>
          <AlertDescription className="text-sm text-muted-foreground">
            {t('leavesPage.newRequestHint')}
          </AlertDescription>
        </Alert>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(async (values) => {
            if (isTenantRequired) {
              toast.error(t('validation.tenantRequired', 'Please select a target company'));
              return;
            }
            if (!values.startDate || !values.endDate) {
              toast.error(t('validation.datesRequired', 'Start and end dates are required'));
              return;
            }
            if (values.endDate < values.startDate) {
              toast.error(t('validation.endBeforeStart', 'End date must be after start date'));
              return;
            }
            try {
              await props.onSubmit(values);
              props.onOpenChange(false);
              form.reset();
            } catch {
              // parent shows toast
            }
          }, (errors) => {
            const first = Object.values(errors)[0] as any;
            toast.error(first?.message || t('validation.checkForm', 'Please complete the required fields'));
          })}
        >
          <TenantSelector value={targetTenantId} onChange={handleTenantChange} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                {t('employee.employee')}
              </Label>
              <Controller
                control={form.control}
                name="userId"
                rules={{ validate: (v) => (v && v > 0) || (t('validation.required', 'Required') as string) }}
                render={({ field }) => {
                  const selected = employees.find((e) => e.id === Number(field.value));
                  return (
                    <Popover open={empOpen} onOpenChange={setEmpOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={empOpen}
                          className={cn('justify-between font-normal', !selected && 'text-muted-foreground')}
                        >
                          {selected ? selected.name : t('employee.selectEmployee', 'Select employee...')}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command
                          filter={(value, search) => {
                            return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                          }}
                        >
                          <CommandInput placeholder={t('employee.searchPlaceholder', 'Search employees...') as string} />
                          <CommandList>
                            <CommandEmpty>{t('common.noResults', 'No results.')}</CommandEmpty>
                            <CommandGroup>
                              {employees.map((emp) => (
                                <CommandItem
                                  key={emp.id}
                                  value={`${emp.name} ${emp.email ?? ''} ${emp.id}`}
                                  onSelect={() => {
                                    field.onChange(emp.id);
                                    setEmpOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      Number(field.value) === emp.id ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  <span className="flex flex-col">
                                    <span>{emp.name}</span>
                                    {emp.email && (
                                      <span className="text-xs text-muted-foreground">{emp.email}</span>
                                    )}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  );
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                {t('leavesPage.type')}
              </Label>
              <Input {...form.register('type')} />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {t('leavesPage.startDate')}
              </Label>
              <Input type="date" {...form.register('startDate', { required: t('validation.required', 'Required') as string })} />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {t('leavesPage.endDate')}
              </Label>
              <Input type="date" {...form.register('endDate', { required: t('validation.required', 'Required') as string })} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>{t('leavesPage.reason')}</Label>
            <Input {...form.register('reason')} />
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

