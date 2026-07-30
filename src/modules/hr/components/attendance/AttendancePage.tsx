import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { CalendarDays, Download, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { HRPageHeader } from '../HRPageHeader';
import { useEmployees } from '../../hooks/useEmployees';
import { useAttendance } from '../../hooks/useAttendance';
import type { AttendanceRecord } from '../../types/hr.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDeleteButton } from '../common/ConfirmDeleteButton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { setTargetTenantId, clearTargetTenant } from '@/utils/targetTenant';
import { HrPermissionButton } from '../common/HrPermissionButton';
import { translateHrServerError } from '../../utils/hrServerError';
import { useHrPermissionGuard } from '../../hooks/useHrPermissionGuard';

type FormState = {
  id?: number;
  userId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  breakMinutes: string;
  status: string;
  notes: string;
};

const ALLOWED_STATUSES = ['present', 'absent', 'late', 'half_day', 'leave', 'holiday'] as const;

function buildAttendanceSchema(t: (k: string, opts?: any) => string) {
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  return z
    .object({
      userId: z.string().min(1, { message: t('attendanceErrors.userRequired') }),
      date: z
        .string()
        .min(1, { message: t('attendanceErrors.dateRequired') })
        .refine((d) => dayjs(d).isValid(), { message: t('attendanceErrors.dateInvalid') })
        .refine((d) => dayjs(d).isBefore(dayjs().add(2, 'day')), {
          message: t('attendanceErrors.dateFuture'),
        }),
      checkIn: z.string().refine((v) => v === '' || timeRegex.test(v), {
        message: t('attendanceErrors.timeInvalid'),
      }),
      checkOut: z.string().refine((v) => v === '' || timeRegex.test(v), {
        message: t('attendanceErrors.timeInvalid'),
      }),
      breakMinutes: z
        .string()
        .refine((v) => v === '' || (Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 24 * 60), {
          message: t('attendanceErrors.breakInvalid'),
        }),
      status: z.enum(ALLOWED_STATUSES as unknown as [string, ...string[]], {
        errorMap: () => ({ message: t('attendanceErrors.statusInvalid') }),
      }),
      notes: z.string().max(1000, { message: t('attendanceErrors.notesTooLong') }).optional().or(z.literal('')),
    })
    .superRefine((val, ctx) => {
      if (val.checkOut && !val.checkIn) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['checkIn'],
          message: t('attendanceErrors.checkoutWithoutCheckin'),
        });
      }
      if (val.checkIn && val.checkOut) {
        const inM = dayjs(`${val.date}T${val.checkIn}`);
        const outM = dayjs(`${val.date}T${val.checkOut}`);
        if (!outM.isAfter(inM)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['checkOut'],
            message: t('attendanceErrors.checkoutBeforeCheckin'),
          });
        } else {
          const workedMin = outM.diff(inM, 'minute') - Number(val.breakMinutes || 0);
          if (workedMin <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['breakMinutes'],
              message: t('attendanceErrors.breakExceedsWorked'),
            });
          }
          if (outM.diff(inM, 'hour', true) > 24) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['checkOut'],
              message: t('attendanceErrors.rangeTooLong'),
            });
          }
        }
      }
    });
}

function mapBackendError(t: (k: string, opts?: any) => string, err: any): string {
  return translateHrServerError(t, err, t('attendancePage.saveError'));
}

const emptyForm = (date: string): FormState => ({
  userId: '',
  date,
  checkIn: '',
  checkOut: '',
  breakMinutes: '0',
  status: 'present',
  notes: '',
});

// Build a local wall-clock "YYYY-MM-DDTHH:mm:ss" string. No "Z" suffix —
// this prevents the server (or JSON deserializer) from interpreting the
// value as UTC and shifting the day across timezones.
function combineDateTime(date: string, time: string) {
  return date && time ? `${date}T${time}:00` : undefined;
}

// Parse a date value that may arrive as "YYYY-MM-DD", an ISO timestamp,
// or a "YYYY-MM-DDT00:00:00" string. We always extract the calendar
// date by string-prefix so a UTC midnight never rolls back to the
// previous day in negative-offset locales.
function toCalendarDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  const s = typeof value === 'string' ? value : dayjs(value).format('YYYY-MM-DD');
  return s.length >= 10 ? s.slice(0, 10) : s;
}

// Format an ISO/wall-clock timestamp's HH:mm without timezone shifting.
function toWallClockTime(value: string | Date | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') {
    // "2026-01-15T08:30:00" or "2026-01-15T08:30:00Z" → "08:30"
    const m = value.match(/T(\d{2}:\d{2})/);
    if (m) return m[1];
  }
  return dayjs(value).format('HH:mm');
}

function parseCsv(text: string) {
  const [headerLine, ...rows] = text.split(/\r?\n/).filter(Boolean);
  if (!headerLine) return [];
  const headers = headerLine.split(',').map((x) => x.trim());
  return rows.map((line) => {
    const cells = line.split(',');
    return headers.reduce<Record<string, string>>((acc, key, index) => {
      acc[key] = (cells[index] ?? '').trim();
      return acc;
    }, {});
  });
}

export function AttendancePage() {
  const { t } = useTranslation('hr');
  const guardHr = useHrPermissionGuard();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear] = useState(dayjs().year());
  const [userId, setUserId] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm(dayjs().format('YYYY-MM-DD')));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const { employeesQuery } = useEmployees();
  const { attendanceQuery, upsertAttendance, deleteAttendance, importAttendance } = useAttendance({
    year,
    month,
    userId: userId === 'all' ? undefined : Number(userId),
  });

  const users = useMemo(() => ((employeesQuery.data ?? []) as any[])
    .map((r) => r.user)
    .filter(Boolean)
    .map((u: any) => ({ id: Number(u.id), name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || `#${u.id}` })), [employeesQuery.data]);

  const records = attendanceQuery.data ?? [];
  const daysInMonth = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).daysInMonth();

  const monthlyRows = useMemo(() => users.map((user) => {
    const map = new Map<number, AttendanceRecord>();
    records.filter((r) => r.userId === user.id).forEach((r) => {
      const day = Number(toCalendarDate(r.date).slice(8, 10));
      if (day) map.set(day, r);
    });
    return { user, map };
  }), [records, users]);

  const summary = useMemo(() => records.reduce((acc, r) => {
    acc.totalHours += Number(r.totalHours || 0);
    acc.overtimeHours += Number(r.overtimeHours || 0);
    if (r.status === 'late') acc.lateCount += 1;
    return acc;
  }, { totalHours: 0, overtimeHours: 0, lateCount: 0, count: records.length }), [records]);

  const openCreate = () => {
    setForm(emptyForm(dayjs(`${year}-${String(month).padStart(2, '0')}-01`).format('YYYY-MM-DD')));
    setErrors({});
    setOpen(true);
  };

  const openEdit = (record: AttendanceRecord) => {
    setForm({
      id: record.id,
      userId: String(record.userId),
      date: toCalendarDate(record.date),
      checkIn: record.checkIn ? toWallClockTime(record.checkIn) : '',
      checkOut: record.checkOut ? toWallClockTime(record.checkOut) : '',
      breakMinutes: String(record.breakMinutes ?? 0),
      status: record.status,
      notes: record.notes ?? '',
    });
    setErrors({});
    setOpen(true);
  };

  const submit = async () => {
    const schema = buildAttendanceSchema(t);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof FormState;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error(parsed.error.issues[0]?.message ?? t('attendancePage.validationRequired'));
      return;
    }
    setErrors({});
    // Pin X-Target-Tenant so view-all mutations always have a target.
    // Default to TenantId=0 (default company) when no row/active filter context.
    const rowTenantId = (form as any).tenantId ?? 0;
    if (!guardHr(form.id ? 'update' : 'create')) return;
    setTargetTenantId(rowTenantId);
    try {
      await upsertAttendance.mutateAsync({
        id: form.id,
        userId: Number(form.userId),
        date: form.date,
        checkIn: combineDateTime(form.date, form.checkIn),
        checkOut: combineDateTime(form.date, form.checkOut),
        breakMinutes: Number(form.breakMinutes || 0),
        status: form.status,
        notes: form.notes,
        source: 'manual',
      });
      toast.success(t('attendancePage.saved'));
      setOpen(false);
    } catch (err: any) {
      toast.error(mapBackendError(t, err));
    } finally {
      clearTargetTenant();
    }
  };

  const onImportClick = () => fileRef.current?.click();
  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text).map((r) => ({
      userId: Number(r.userId),
      date: r.date,
      checkIn: combineDateTime(r.date, r.checkIn),
      checkOut: combineDateTime(r.date, r.checkOut),
      breakMinutes: Number(r.breakMinutes || 0),
      status: r.status || 'present',
      notes: r.notes || '',
      source: 'csv_import',
    })).filter((r) => Number.isFinite(r.userId) && r.userId > 0 && r.date);
    setTargetTenantId(0);
    try {
      const result: any = await importAttendance.mutateAsync(rows);
      const imported = result?.imported ?? 0;
      const skipped = result?.skipped ?? 0;
      if (imported === 0 && skipped > 0) {
        toast.error(t('attendancePage.importAllSkipped', { count: skipped }));
      } else if (skipped > 0) {
        toast.success(t('attendancePage.importedWithSkipped', { count: imported, skipped }));
      } else {
        toast.success(t('attendancePage.imported', { count: imported }));
      }
    } catch (err: any) {
      toast.error(mapBackendError(t, err));
    } finally {
      clearTargetTenant();
    }
    event.target.value = '';
  };

  const loading = attendanceQuery.isLoading || employeesQuery.isLoading;
  const hasError = attendanceQuery.isError || employeesQuery.isError;

  return (
    <div className="flex flex-col">
      <HRPageHeader
        title={t('attendance')}
        subtitle={t('attendancePage.subtitle')}
        icon={CalendarDays}
        accentColor="chart-2"
        backTo={{ to: '/dashboard/hr', label: t('dashboard') }}
        actions={
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
            <HrPermissionButton action="import" size="sm" variant="outline" className="gap-2" onClick={onImportClick}><Upload className="h-4 w-4" />{t('attendancePage.importCsv')}</HrPermissionButton>
            <HrPermissionButton action="create" size="sm" className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" />{t('attendancePage.addEntry')}</HrPermissionButton>
          </div>
        }
      />

      <div className="p-3 sm:p-4 lg:p-6 space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Card className="shadow-card border-0 bg-card"><CardContent className="p-4"><div className="text-xs text-muted-foreground">{t('attendancePage.totalRecords')}</div><div className="mt-1 text-2xl font-semibold">{summary.count}</div></CardContent></Card>
          <Card className="shadow-card border-0 bg-card"><CardContent className="p-4"><div className="text-xs text-muted-foreground">{t('attendanceFields.hoursWorked')}</div><div className="mt-1 text-2xl font-semibold">{summary.totalHours.toFixed(1)}</div></CardContent></Card>
          <Card className="shadow-card border-0 bg-card"><CardContent className="p-4"><div className="text-xs text-muted-foreground">{t('attendanceFields.overtimeHours')}</div><div className="mt-1 text-2xl font-semibold text-primary">{summary.overtimeHours.toFixed(1)}</div></CardContent></Card>
          <Card className="shadow-card border-0 bg-card"><CardContent className="p-4"><div className="text-xs text-muted-foreground">{t('attendancePage.lateCount')}</div><div className="mt-1 text-2xl font-semibold">{summary.lateCount}</div></CardContent></Card>
        </div>

        <Card className="shadow-card border-0 bg-card">
          <CardHeader><CardTitle className="text-base">{t('attendancePage.filtersTitle')}</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <div><Label>{t('attendancePage.month')}</Label><Input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} /></div>
            <div><Label>{t('attendancePage.year')}</Label><Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /></div>
            <div className="md:col-span-2"><Label>{t('filters.employee')}</Label><Select value={userId} onValueChange={setUserId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t('bonusesPage.allEmployees')}</SelectItem>{users.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent></Select></div>
          </CardContent>
        </Card>

        {hasError ? (
          <Alert><AlertDescription>{t('attendancePage.loadError')}</AlertDescription></Alert>
        ) : loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : users.length === 0 ? (
          <Alert><AlertDescription>{t('attendancePage.noEmployeesHint')}</AlertDescription></Alert>
        ) : (
          <Tabs defaultValue="list" className="space-y-4">
            <TabsList variant="underline">
              <TabsTrigger value="list">{t('attendancePage.listView')}</TabsTrigger>
              <TabsTrigger value="month">{t('attendancePage.matrixView')}</TabsTrigger>
            </TabsList>


            <TabsContent value="list">
              <Card className="shadow-card border-0 bg-card">
                <CardContent className="p-0 overflow-x-auto">
                  {records.length === 0 ? (
                    <div className="py-10 text-center"><div className="text-sm font-medium">{t('attendancePage.emptyTitle')}</div><div className="mt-1 text-xs text-muted-foreground">{t('attendancePage.emptyHint')}</div></div>
                  ) : (
                    <Table className="min-w-[600px]">
                      <TableHeader><TableRow><TableHead>{t('employee.employee')}</TableHead><TableHead>{t('attendanceFields.date')}</TableHead><TableHead>{t('attendanceFields.hoursWorked')}</TableHead><TableHead>{t('attendanceFields.overtimeHours')}</TableHead><TableHead>{t('attendanceFields.status')}</TableHead><TableHead className="text-right">{t('leavesPage.actions')}</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {records.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.userName}</TableCell>
                            <TableCell>{toCalendarDate(record.date)}</TableCell>
                            <TableCell>{Number(record.totalHours || 0).toFixed(2)}</TableCell>
                            <TableCell>{Number(record.overtimeHours || 0).toFixed(2)}</TableCell>
                            <TableCell><Badge variant="outline">{t(`attendanceStatus.${record.status}`, { defaultValue: record.status })}</Badge></TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <HrPermissionButton action="update" size="icon" variant="ghost" onClick={() => openEdit(record)}><Pencil className="h-4 w-4" /></HrPermissionButton>
                                <ConfirmDeleteButton
                                  size="icon"
                                  variant="ghost"
                                  disabled={deleteAttendance.isPending}
                                  onConfirm={() => {
                                    setTargetTenantId((record as any).tenantId ?? 0);
                                    deleteAttendance.mutate(record.id, {
                                      onSuccess: () => toast.success(t('attendancePage.deleted')),
                                      onSettled: () => clearTargetTenant(),
                                    });
                                  }}
                                  triggerContent={<Trash2 className="h-4 w-4 text-destructive" />}
                                  title={t('attendancePage.deleteTitle', { defaultValue: 'Delete attendance record?' })}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="month">
              <Card className="shadow-card border-0 bg-card overflow-x-auto">
                <CardHeader><CardTitle className="text-base">{t('attendancePage.monthlyGridTitle')}</CardTitle></CardHeader>
                <CardContent>
                  <div className="min-w-[980px]">
                    <Table>
                      <TableHeader><TableRow><TableHead>{t('employee.employee')}</TableHead>{Array.from({ length: daysInMonth }).map((_, i) => <TableHead key={i + 1}>{i + 1}</TableHead>)}</TableRow></TableHeader>
                      <TableBody>
                        {monthlyRows.map((row) => (
                          <TableRow key={row.user.id}>
                            <TableCell className="font-medium">{row.user.name}</TableCell>
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                              const rec = row.map.get(i + 1);
                              return <TableCell key={i} className="text-center">{rec ? <Badge variant={Number(rec.overtimeHours || 0) > 0 ? 'default' : 'outline'}>{Number(rec.totalHours || 0).toFixed(0)}h</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>;
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? t('attendancePage.editEntry') : t('attendancePage.addEntry')}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>{t('employee.employee')}</Label>
              <Select value={form.userId} onValueChange={(v) => setForm((s) => ({ ...s, userId: v }))}>
                <SelectTrigger aria-invalid={!!errors.userId}><SelectValue placeholder={t('attendancePage.selectEmployee')} /></SelectTrigger>
                <SelectContent>{users.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
              {errors.userId && <p className="mt-1 text-xs text-destructive">{errors.userId}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('attendanceFields.date')}</Label>
                <Input type="date" aria-invalid={!!errors.date} value={form.date} onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))} />
                {errors.date && <p className="mt-1 text-xs text-destructive">{errors.date}</p>}
              </div>
              <div>
                <Label>{t('attendanceFields.status')}</Label>
                <Select value={form.status} onValueChange={(v) => setForm((s) => ({ ...s, status: v }))}>
                  <SelectTrigger aria-invalid={!!errors.status}><SelectValue /></SelectTrigger>
                  <SelectContent>{ALLOWED_STATUSES.map((status) => <SelectItem key={status} value={status}>{t(`attendanceStatus.${status}`)}</SelectItem>)}</SelectContent>
                </Select>
                {errors.status && <p className="mt-1 text-xs text-destructive">{errors.status}</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>{t('attendanceFields.checkIn')}</Label>
                <Input type="time" aria-invalid={!!errors.checkIn} value={form.checkIn} onChange={(e) => setForm((s) => ({ ...s, checkIn: e.target.value }))} />
                {errors.checkIn && <p className="mt-1 text-xs text-destructive">{errors.checkIn}</p>}
              </div>
              <div>
                <Label>{t('attendanceFields.checkOut')}</Label>
                <Input type="time" aria-invalid={!!errors.checkOut} value={form.checkOut} onChange={(e) => setForm((s) => ({ ...s, checkOut: e.target.value }))} />
                {errors.checkOut && <p className="mt-1 text-xs text-destructive">{errors.checkOut}</p>}
              </div>
              <div>
                <Label>{t('attendanceFields.breakDuration')}</Label>
                <Input type="number" min={0} aria-invalid={!!errors.breakMinutes} value={form.breakMinutes} onChange={(e) => setForm((s) => ({ ...s, breakMinutes: e.target.value }))} />
                {errors.breakMinutes && <p className="mt-1 text-xs text-destructive">{errors.breakMinutes}</p>}
              </div>
            </div>
            <div>
              <Label>{t('attendanceFields.notes')}</Label>
              <Input aria-invalid={!!errors.notes} value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
              {errors.notes && <p className="mt-1 text-xs text-destructive">{errors.notes}</p>}
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>{t('cancel')}</Button><Button onClick={submit} disabled={upsertAttendance.isPending}>{t('save')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}