import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { HRPageHeader } from '../HRPageHeader';
import { useCnssRates } from '../../hooks/useCnss';
import { usePublicHolidays } from '../../hooks/useHolidays';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import dayjs from 'dayjs';
import { getCurrentTenant } from '@/utils/tenant';

const HR_SETTINGS_KEY = () => `t:${getCurrentTenant() || 'default'}:hr_settings_v1`;

export function HrSettingsPage() {
  const { t } = useTranslation('hr');
  const { toast } = useToast();
  const { ratesQuery, upsertRate } = useCnssRates();
  const [year, setYear] = useState(dayjs().year());
  const { holidaysQuery, createHoliday, deleteHoliday } = usePublicHolidays(year);

  // CNSS rate add form
  const [employeeRate, setEmployeeRate] = useState(9.18);
  const [employerRate, setEmployerRate] = useState(16.57);
  const [ceiling, setCeiling] = useState<number | ''>('');
  const [effectiveFrom, setEffectiveFrom] = useState(dayjs().format('YYYY-MM-DD'));

  const addRate = async () => {
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

  const addHoliday = async () => {
    if (!holidayDate || !holidayName) {
      toast({ title: t('settingsPage.holidays.validation'), variant: 'destructive' });
      return;
    }
    await createHoliday.mutateAsync({ date: holidayDate, name: holidayName, isRecurring: holidayRecurring });
    setHolidayDate(''); setHolidayName(''); setHolidayRecurring(false);
    toast({ title: t('settingsPage.holidays.added') });
  };

  // Working-day & leave config saved in localStorage
  const [config, setConfig] = useState(() => {
    try {
      const scopedKey = HR_SETTINGS_KEY();
      const raw = localStorage.getItem(scopedKey) ?? localStorage.getItem('hr_settings_v1');
      if (raw) return JSON.parse(raw);
    } catch { /* noop */ }
    return { workingDays: [1, 2, 3, 4, 5], annualLeaveDays: 21, currency: 'TND' };
  });

  const saveConfig = () => {
    try { localStorage.setItem(HR_SETTINGS_KEY(), JSON.stringify(config)); } catch { /* noop */ }
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
    const set = new Set<number>(config.workingDays);
    if (set.has(id)) set.delete(id); else set.add(id);
    setConfig({ ...config, workingDays: Array.from(set).sort() });
  };

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
                  <Button onClick={addRate} disabled={upsertRate.isPending} className="gap-2">
                    <Plus className="h-4 w-4" /> {t('settingsPage.cnss.add')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-0 bg-card">
              <CardHeader><CardTitle className="text-base">{t('settingsPage.cnss.history')}</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table className="min-w-[500px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('cnssPage.effectiveFrom')}</TableHead>
                      <TableHead>{t('cnssPage.employeeRate')}</TableHead>
                      <TableHead>{t('cnssPage.employerRate')}</TableHead>
                      <TableHead>{t('cnssPage.ceiling')}</TableHead>
                      <TableHead>{t('settingsPage.cnss.active')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(ratesQuery.data ?? []).map(r => (
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
                    <Button onClick={addHoliday} disabled={createHoliday.isPending} size="icon" className="ml-auto">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                <Table className="min-w-[400px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('settingsPage.holidays.date')}</TableHead>
                      <TableHead>{t('settingsPage.holidays.name')}</TableHead>
                      <TableHead>{t('settingsPage.holidays.recurring')}</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(holidaysQuery.data ?? []).map(h => (
                      <TableRow key={h.id}>
                        <TableCell>{h.date}</TableCell>
                        <TableCell>{h.name}</TableCell>
                        <TableCell>{h.isRecurring ? '✓' : '—'}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => deleteHoliday.mutate(h.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="mt-3">
            <Card className="shadow-card border-0 bg-card">
              <CardHeader><CardTitle className="text-base">{t('settingsPage.general.title')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t('settingsPage.general.workingDays')}</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {dayLabels.map(d => (
                      <Button
                        key={d.id}
                        type="button"
                        size="sm"
                        variant={config.workingDays.includes(d.id) ? 'default' : 'outline'}
                        onClick={() => toggleDay(d.id)}
                      >
                        {d.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>{t('settingsPage.general.annualLeaveDays')}</Label>
                    <Input type="number" min={0} value={config.annualLeaveDays} onChange={(e) => setConfig({ ...config, annualLeaveDays: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>{t('settingsPage.general.currency')}</Label>
                    <Input value={config.currency} onChange={(e) => setConfig({ ...config, currency: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveConfig}>{t('save')}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
