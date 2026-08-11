import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Pencil, Settings as SettingsIcon } from 'lucide-react';
import { HRPageHeader } from '../HRPageHeader';
import { useCnssRates } from '../../hooks/useCnss';
import { usePublicHolidays } from '../../hooks/useHolidays';
import { useAttendanceSettings } from '../../hooks/useAttendance';
import type { AttendanceSettings, PublicHoliday } from '../../types/hr.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import dayjs from 'dayjs';
import { HrPermissionButton } from '../common/HrPermissionButton';
import { useHrPermissionGuard } from '../../hooks/useHrPermissionGuard';
import { EditHolidayDialog } from './EditHolidayDialog';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/shared/SortableHeader';




export function HrSettingsPage() {
  const { t } = useTranslation('hr');
  const { toast } = useToast();
  const guardHr = useHrPermissionGuard();
  const { ratesQuery, upsertRate } = useCnssRates();
  const [year, setYear] = useState(dayjs().year());
  const { holidaysQuery, createHoliday, deleteHoliday } = usePublicHolidays(year);

  // CNSS rate add form
  const [employeeRate, setEmployeeRate] = useState(9.18);
  const [employerRate, setEmployerRate] = useState(16.57);
  const [ceiling, setCeiling] = useState<number | ''>('');
  const [effectiveFrom, setEffectiveFrom] = useState(dayjs().format('YYYY-MM-DD'));

  const addRate = async () => {
    if (!guardHr('update')) return;
    await upsertRate.mutateAsync({
      employeeRate: employeeRate / 100,
      employerRate: employerRate / 100,
      ceiling: ceiling === '' ? null : Number(ceiling),
      effectiveFrom,
      isActive: true,
    });
    toast({ title: t('settingsPage.cnss.added') });
  };

  // Holiday form
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [holidayRecurring, setHolidayRecurring] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<PublicHoliday | null>(null);


  const addHoliday = async () => {
    if (!guardHr('create')) return;
    if (!holidayDate || !holidayName) {
      toast({ title: t('settingsPage.holidays.validation'), variant: 'destructive' });
      return;
    }
    await createHoliday.mutateAsync({ date: holidayDate, name: holidayName, isRecurring: holidayRecurring });
    setHolidayDate(''); setHolidayName(''); setHolidayRecurring(false);
    toast({ title: t('settingsPage.holidays.added') });
  };

  // Working-time configuration — persisted server-side in hr_attendance_settings
  // and consumed by the attendance/overtime calculation. No local-only state.
  const { settingsQuery, saveSettings } = useAttendanceSettings();
  const [draft, setDraft] = useState<Partial<AttendanceSettings> | null>(null);
  const settings = draft ?? settingsQuery.data ?? null;

  const patch = (p: Partial<AttendanceSettings>) =>
    setDraft({ ...(settingsQuery.data ?? {}), ...(draft ?? {}), ...p });

  const saveConfig = async () => {
    if (!guardHr('configure')) return;
    if (!settings) return;
    await saveSettings.mutateAsync({
      workDays: settings.workDays ?? [1, 2, 3, 4, 5],
      standardHoursPerDay: Number(settings.standardHoursPerDay ?? 8),
      overtimeThresholdHours: Number(settings.overtimeThresholdHours ?? 8),
      overtimeMultiplier: Number(settings.overtimeMultiplier ?? 1.75),
      lateThresholdMinutes: Number(settings.lateThresholdMinutes ?? 15),
      roundingMethod: settings.roundingMethod ?? '15min',
      calculationMethod: settings.calculationMethod ?? 'actual_hours',
    });
    setDraft(null);
    toast({ title: t('settingsPage.general.saved') });
  };

  const dayLabels = useMemo(() => ([
    { id: 1, label: t('attendanceSettings.days.mon') },
    { id: 2, label: t('attendanceSettings.days.tue') },
    { id: 3, label: t('attendanceSettings.days.wed') },
    { id: 4, label: t('attendanceSettings.days.thu') },
    { id: 5, label: t('attendanceSettings.days.fri') },
    { id: 6, label: t('attendanceSettings.days.sat') },
    { id: 0, label: t('attendanceSettings.days.sun') },
  ]), [t]);

  const toggleDay = (id: number) => {
    const set = new Set<number>(settings?.workDays ?? []);
    if (set.has(id)) set.delete(id); else set.add(id);
    patch({ workDays: Array.from(set).sort((a, b) => a - b) });
  };

  // Unified table sorting
  const rateSort = useTableSort<any>({
    effectiveFrom: (r) => r.effectiveFrom,
    employeeRate: (r) => r.employeeRate,
    employerRate: (r) => r.employerRate,
    ceiling: (r) => (r.salaryCeiling && r.salaryCeiling > 0 ? r.salaryCeiling : r.ceiling),
    isActive: (r) => !!r.isActive,
  });
  const sortedRates = useMemo(
    () => rateSort.sortItems(ratesQuery.data ?? []),
    [ratesQuery.data, rateSort]
  );

  const holidaySort = useTableSort<any>({
    date: (h) => h.date,
    name: (h) => h.name,
    isRecurring: (h) => !!h.isRecurring,
  });
  const sortedHolidays = useMemo(
    () => holidaySort.sortItems(holidaysQuery.data ?? []),
    [holidaysQuery.data, holidaySort]
  );


  return (
    <div className="flex flex-col">
      <HRPageHeader
        title={t('settings')}
        subtitle={t('settingsPage.subtitle')}
        icon={SettingsIcon}
        accentColor="primary"
        backTo={{ to: '/dashboard/hr', label: t('dashboard') }}
      />

      <div className="p-3 sm:p-4 lg:p-6">
        <Tabs defaultValue="cnss">
          <TabsList variant="underline">
            <TabsTrigger value="cnss">{t('settingsPage.tabs.cnss')}</TabsTrigger>
            <TabsTrigger value="holidays">{t('settingsPage.tabs.holidays')}</TabsTrigger>
            <TabsTrigger value="general">{t('settingsPage.tabs.general')}</TabsTrigger>
          </TabsList>


          <TabsContent value="cnss" className="mt-3 space-y-4">
            <Card className="shadow-card border-0 bg-card">
              <CardHeader><CardTitle className="text-base">{t('settingsPage.cnss.title')}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div>
                    <Label>{t('cnssPage.employeeRate')}</Label>
                    <Input type="number" step="0.01" value={employeeRate} onChange={(e) => setEmployeeRate(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>{t('cnssPage.employerRate')}</Label>
                    <Input type="number" step="0.01" value={employerRate} onChange={(e) => setEmployerRate(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>{t('cnssPage.ceiling')} (TND)</Label>
                    <Input type="number" step="0.001" value={ceiling} onChange={(e) => setCeiling(e.target.value === '' ? '' : Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>{t('cnssPage.effectiveFrom')}</Label>
                    <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <HrPermissionButton action="update" onClick={addRate} disabled={upsertRate.isPending} className="gap-2">
                    <Plus className="h-4 w-4" /> {t('settingsPage.cnss.add')}
                  </HrPermissionButton>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-0 bg-card">
              <CardHeader><CardTitle className="text-base">{t('settingsPage.cnss.history')}</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table className="min-w-[500px]">
                  <TableHeader>
                    <TableRow>
                      <SortableHeader columnKey="effectiveFrom" sortKey={rateSort.sortKey} sortDirection={rateSort.sortDirection} onSort={rateSort.toggleSort}>{t('cnssPage.effectiveFrom')}</SortableHeader>
                      <SortableHeader columnKey="employeeRate" sortKey={rateSort.sortKey} sortDirection={rateSort.sortDirection} onSort={rateSort.toggleSort}>{t('cnssPage.employeeRate')}</SortableHeader>
                      <SortableHeader columnKey="employerRate" sortKey={rateSort.sortKey} sortDirection={rateSort.sortDirection} onSort={rateSort.toggleSort}>{t('cnssPage.employerRate')}</SortableHeader>
                      <SortableHeader columnKey="ceiling" sortKey={rateSort.sortKey} sortDirection={rateSort.sortDirection} onSort={rateSort.toggleSort}>{t('cnssPage.ceiling')}</SortableHeader>
                      <SortableHeader columnKey="isActive" sortKey={rateSort.sortKey} sortDirection={rateSort.sortDirection} onSort={rateSort.toggleSort}>{t('settingsPage.cnss.active')}</SortableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRates.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{r.effectiveFrom}</TableCell>
                        <TableCell>{(r.employeeRate * 100).toFixed(2)}%</TableCell>
                        <TableCell>{(r.employerRate * 100).toFixed(2)}%</TableCell>
                        <TableCell>{(r.salaryCeiling && r.salaryCeiling > 0) ? r.salaryCeiling : (r.ceiling ?? '—')}</TableCell>
                        <TableCell>{r.isActive ? <Badge>{t('settingsPage.cnss.activeYes')}</Badge> : <Badge variant="outline">{t('settingsPage.cnss.activeNo')}</Badge>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="holidays" className="mt-3 space-y-4">
            <Card className="shadow-card border-0 bg-card">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">{t('settingsPage.holidays.title')}</CardTitle>
                  <div>
                    <Label>{t('settingsPage.holidays.year')}</Label>
                    <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-32" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-4 mb-4">
                  <div>
                    <Label>{t('settingsPage.holidays.date')}</Label>
                    <Input type="date" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{t('settingsPage.holidays.name')}</Label>
                    <Input value={holidayName} onChange={(e) => setHolidayName(e.target.value)} />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Switch checked={holidayRecurring} onCheckedChange={setHolidayRecurring} />
                      <Label>{t('settingsPage.holidays.recurring')}</Label>
                    </div>
                    <HrPermissionButton action="create" aria-label={t('settingsPage.holidays.add', 'Add holiday')} title={t('settingsPage.holidays.add', 'Add holiday')} onClick={addHoliday} disabled={createHoliday.isPending} size="icon" className="ml-auto">
                      <Plus className="h-4 w-4" />
                    </HrPermissionButton>
                  </div>
                </div>

                <div className="overflow-x-auto">
                <Table className="min-w-[400px]">
                  <TableHeader>
                    <TableRow>
                      <SortableHeader columnKey="date" sortKey={holidaySort.sortKey} sortDirection={holidaySort.sortDirection} onSort={holidaySort.toggleSort}>{t('settingsPage.holidays.date')}</SortableHeader>
                      <SortableHeader columnKey="name" sortKey={holidaySort.sortKey} sortDirection={holidaySort.sortDirection} onSort={holidaySort.toggleSort}>{t('settingsPage.holidays.name')}</SortableHeader>
                      <SortableHeader columnKey="isRecurring" sortKey={holidaySort.sortKey} sortDirection={holidaySort.sortDirection} onSort={holidaySort.toggleSort}>{t('settingsPage.holidays.recurring')}</SortableHeader>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedHolidays.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t('settingsPage.holidays.empty')}</TableCell>
                      </TableRow>
                    )}
                    {sortedHolidays.map(h => (
                      <TableRow key={h.id}>
                        <TableCell>{h.date}</TableCell>
                        <TableCell>{h.name}</TableCell>
                        <TableCell>{h.isRecurring ? '✓' : '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <HrPermissionButton action="update" aria-label={t('settingsPage.holidays.editTitle')} title={t('settingsPage.holidays.editTitle')} size="icon" variant="ghost" onClick={() => setEditingHoliday(h)}>
                              <Pencil className="h-4 w-4" />
                            </HrPermissionButton>
                            <HrPermissionButton action="delete" aria-label={t('settingsPage.holidays.delete', 'Delete holiday')} title={t('settingsPage.holidays.delete', 'Delete holiday')} size="icon" variant="ghost" onClick={() => { if (guardHr('delete')) deleteHoliday.mutate(h.id); }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </HrPermissionButton>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>

            <EditHolidayDialog
              holiday={editingHoliday}
              year={year}
              onOpenChange={(v) => { if (!v) setEditingHoliday(null); }}
            />
          </TabsContent>


          <TabsContent value="general" className="mt-3">
            <Card className="shadow-card border-0 bg-card">
              <CardHeader><CardTitle className="text-base">{t('settingsPage.general.title')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {settingsQuery.isLoading || !settings ? (
                  <div className="text-sm text-muted-foreground">{t('loading', { defaultValue: 'Loading…' })}</div>
                ) : (
                  <>
                    <div>
                      <Label>{t('settingsPage.general.workingDays')}</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {dayLabels.map(d => (
                          <Button
                            key={d.id}
                            type="button"
                            size="sm"
                            variant={(settings.workDays ?? []).includes(d.id) ? 'default' : 'outline'}
                            onClick={() => toggleDay(d.id)}
                          >
                            {d.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <Label>{t('attendanceSettings.standardHoursPerDay', { defaultValue: 'Standard hours / day' })}</Label>
                        <Input
                          type="number" step="0.25" min={0}
                          value={settings.standardHoursPerDay ?? 8}
                          onChange={(e) => patch({ standardHoursPerDay: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>{t('attendanceSettings.overtimeThresholdHours', { defaultValue: 'Overtime threshold (h)' })}</Label>
                        <Input
                          type="number" step="0.25" min={0}
                          value={settings.overtimeThresholdHours ?? 8}
                          onChange={(e) => patch({ overtimeThresholdHours: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>{t('attendanceSettings.overtimeMultiplier', { defaultValue: 'Overtime multiplier' })}</Label>
                        <Input
                          type="number" step="0.05" min={1}
                          value={settings.overtimeMultiplier ?? 1.75}
                          onChange={(e) => patch({ overtimeMultiplier: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>{t('attendanceSettings.lateThresholdMinutes', { defaultValue: 'Late threshold (min)' })}</Label>
                        <Input
                          type="number" min={0}
                          value={settings.lateThresholdMinutes ?? 15}
                          onChange={(e) => patch({ lateThresholdMinutes: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>{t('attendanceSettings.roundingMethod', { defaultValue: 'Rounding' })}</Label>
                        <Select value={String(settings.roundingMethod ?? '15min')} onValueChange={(v) => patch({ roundingMethod: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t('attendanceSettings.rounding.none', { defaultValue: 'None' })}</SelectItem>
                            <SelectItem value="15min">15 min</SelectItem>
                            <SelectItem value="30min">30 min</SelectItem>
                            <SelectItem value="hour">{t('attendanceSettings.rounding.hour', { defaultValue: '1 hour' })}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{t('attendanceSettings.calculationMethod', { defaultValue: 'Calculation method' })}</Label>
                        <Select value={String(settings.calculationMethod ?? 'actual_hours')} onValueChange={(v) => patch({ calculationMethod: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="actual_hours">{t('attendanceSettings.calc.actualHours', { defaultValue: 'Actual hours' })}</SelectItem>
                            <SelectItem value="standard_day">{t('attendanceSettings.calc.standardDay', { defaultValue: 'Standard day' })}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <HrPermissionButton action="configure" onClick={saveConfig} disabled={saveSettings.isPending}>
                        {t('save')}
                      </HrPermissionButton>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
