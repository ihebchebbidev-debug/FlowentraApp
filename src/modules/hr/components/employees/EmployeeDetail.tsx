import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmployees } from '../../hooks/useEmployees';
import { SalaryConfigForm, type SalaryConfigFormValues } from './SalaryConfigForm';
import { EmployeeEditForm, type EmployeeEditFormValues } from './EmployeeEditForm';
import { useToast } from '@/hooks/use-toast';
import { HRPageHeader } from '../HRPageHeader';
import { Badge } from '@/components/ui/badge';
import { Building2, BriefcaseBusiness, User, Plus, Trash2, History as HistoryIcon, DollarSign, Award, Calendar, FileText } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
import { usePlanningLeaves } from '../../hooks/usePlanning';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { UserLeave } from '@/services/api/schedulesApi';
import { EmployeeDocumentsTab } from './EmployeeDocumentsTab';
import { useBonuses } from '../../hooks/useBonuses';
import { ConfirmDeleteButton } from '../common/ConfirmDeleteButton';
import { useAuditLog } from '../../hooks/useAuditLog';
import { useSalaryHistory } from '../../hooks/useSalaryHistory';
import { useCnssRates } from '../../hooks/useCnss';
import { Button } from '@/components/ui/button';
import { formatTnd } from '../../utils/money';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import dayjs from 'dayjs';

export function EmployeeDetail() {
  const { id } = useParams();
  const userId = Number(id);
  const { t } = useTranslation('hr');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const { employeesQuery, upsertSalaryConfig, updateUser } = useEmployees();
  const planningLeavesQuery = usePlanningLeaves(userId);
  const { activeRateQuery } = useCnssRates();

  const employee = useMemo(() => {
    const source = employeesQuery.data as any;
    const rows = Array.isArray(source) ? source : (source?.data && Array.isArray(source.data) ? source.data : []);
    return rows.find((r: any) => Number(r?.user?.id) === userId) ?? null;
  }, [employeesQuery.data, userId]);

  const user = employee?.user ?? null;
  const cfg = employee?.salaryConfig ?? null;
  const name = user ? (`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || `#${user.id}`) : `#${userId}`;

  // Bonuses scoped to this employee
  const { bonusesQuery, createBonus, deleteBonus } = useBonuses({ userId });
  const auditQuery = useAuditLog({ userId, take: 50 });
  const salaryHistoryQuery = useSalaryHistory(userId);

  const handleSave = async (values: SalaryConfigFormValues) => {
    await upsertSalaryConfig.mutateAsync({ userId, payload: values as any });
    toast({ title: t('employee.salaryConfigSaved') });
  };

  const handleSaveProfile = async (values: EmployeeEditFormValues) => {
    const hrPayload = {
      department: values.department || undefined,
      position: values.position || undefined,
      employmentType: values.employmentType,
      hireDate: values.hireDate || undefined,
      contractType: (values.contractType || undefined) as any,
      contractEndDate: values.contractEndDate || undefined,
      grossSalary: values.grossSalary,
      customDeductions: values.customDeductions,
      cnssNumber: values.cnssNumber || undefined,
      bankAccount: values.bankAccount || undefined,
      isHeadOfFamily: values.isHeadOfFamily,
      childrenCount: values.childrenCount,
      cin: values.cin || undefined,
      birthDate: values.birthDate || undefined,
      maritalStatus: values.maritalStatus,
      addressLine1: values.addressLine1 || undefined,
      addressLine2: values.addressLine2 || undefined,
      city: values.city || undefined,
      postalCode: values.postalCode || undefined,
      emergencyContactName: values.emergencyContactName || undefined,
      emergencyContactPhone: values.emergencyContactPhone || undefined,
    };

    let userOk = false;
    try {
      await updateUser.mutateAsync({
        userId,
        payload: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phoneNumber: values.phoneNumber || undefined,
        },
      });
      userOk = true;
    } catch {
      toast({ title: t('employeeEdit.userUpdateError'), variant: 'destructive' });
    }

    try {
      await upsertSalaryConfig.mutateAsync({ userId, payload: hrPayload });
      toast({ title: userOk ? t('employeeEdit.saved') : t('employeeEdit.hrSavedOnly') });
    } catch {
      toast({ title: t('employeeEdit.hrUpdateError'), variant: 'destructive' });
      if (!userOk) throw new Error('Save failed');
    }
  };

  const formatLeaveRange = (l: UserLeave) => {
    const s = String(l.startDate);
    const e = String(l.endDate);
    return s === e ? s : `${s} → ${e}`;
  };

  // Bonus dialog
  const [bonusOpen, setBonusOpen] = useState(false);
  const [bonusKind, setBonusKind] = useState<'bonus' | 'allowance' | 'reimbursement' | 'other_cost'>('bonus');
  const [bonusLabel, setBonusLabel] = useState('');
  const [bonusAmount, setBonusAmount] = useState<number>(0);
  const [bonusMonth, setBonusMonth] = useState<number>(dayjs().month() + 1);
  const [bonusYear, setBonusYear] = useState<number>(dayjs().year());

  const submitBonus = async () => {
    if (!bonusLabel || !bonusAmount) {
      toast({ title: t('bonusesPage.validationRequired'), variant: 'destructive' });
      return;
    }
    await createBonus.mutateAsync({
      userId,
      kind: bonusKind,
      label: bonusLabel,
      amount: Number(bonusAmount),
      frequency: 'one_off',
      month: bonusMonth,
      year: bonusYear,
      affectsPayroll: true,
      subjectToCnss: false,
    });
    toast({ title: t('bonusesPage.added') });
    setBonusOpen(false);
    setBonusLabel('');
    setBonusAmount(0);
  };

  const cnssNumber = cfg?.cnssNumber ?? null;
  const grossForCnss = Number(cfg?.grossSalary ?? 0);
  const employeeShare = grossForCnss * Number(activeRateQuery.data?.employeeRate ?? 0.0918);
  const employerShare = grossForCnss * Number(activeRateQuery.data?.employerRate ?? 0.1657);

  return (
    <div className="flex flex-col">
      <HRPageHeader
        title={name}
        subtitle={t('employee.employee')}
        icon={User}
        accentColor="chart-1"
        backTo={{ to: '/dashboard/hr/employees', label: t('employees') }}
        actions={
          user ? (
            <div className="hidden sm:flex items-center gap-2">
              <UserAvatar src={user.profilePictureUrl} name={name} seed={user.id} size="sm" />
            </div>
          ) : null
        }
      />

      <div className="p-3 sm:p-4 lg:p-6">
        <Card className="shadow-card border-0 bg-card">
          <CardContent className="p-4">
            {employeesQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">{t('loading')}</div>
            ) : !user ? (
              <div className="text-sm text-muted-foreground">{t('labels.employeeNotFound')}</div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar src={user.profilePictureUrl} name={name} seed={user.id} size="md" />
                  <div className="min-w-0">
                    <div className="text-base font-semibold truncate">{name}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.email ?? '—'}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {cfg?.department ?? '—'}
                  </Badge>
                  <Badge variant="secondary" className="gap-1.5">
                    <BriefcaseBusiness className="h-3.5 w-3.5" />
                    {cfg?.position ?? '—'}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {(cfg?.employmentType ?? '—').replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4 mt-4">
          {/* Mobile: Select dropdown */}
          {(() => {
            const TABS = [
              { value: 'profile',   icon: User,         label: t('tabs.profile') },
              { value: 'salary',    icon: DollarSign,   label: t('tabs.salary') },
              { value: 'cnss',      icon: Building2,    label: t('tabs.cnss') },
              { value: 'bonuses',   icon: Award,        label: t('tabs.bonuses') },
              { value: 'leaves',    icon: Calendar,     label: t('leaves') },
              { value: 'documents', icon: FileText,     label: t('tabs.documents') },
              { value: 'history',   icon: HistoryIcon,  label: t('tabs.history') },
            ];
            const current = TABS.find(tab => tab.value === activeTab);
            return (
              <div className="md:hidden">
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger className="w-full h-11 rounded-xl border-primary/20 bg-primary/5 text-foreground font-medium shadow-sm focus:ring-primary/30">
                    <SelectValue>
                      {current && (
                        <span className="flex items-center gap-2">
                          <current.icon className="h-4 w-4 text-primary flex-shrink-0" />
                          {current.label}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-card rounded-xl shadow-lg border-border/60">
                    {TABS.map(({ value, icon: Icon, label }) => (
                      <SelectItem key={value} value={value} className="rounded-lg cursor-pointer py-2.5">
                        <span className="flex items-center gap-2.5">
                          <span className={`p-1 rounded-md ${activeTab === value ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Icon className={`h-3.5 w-3.5 ${activeTab === value ? 'text-primary' : 'text-muted-foreground'}`} />
                          </span>
                          <span className={activeTab === value ? 'text-primary font-medium' : ''}>{label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })()}
          {/* Desktop: tab pills */}
          <div className="hidden md:block">
            <TabsList variant="underline">
              <TabsTrigger value="profile">{t('tabs.profile')}</TabsTrigger>
              <TabsTrigger value="salary">{t('tabs.salary')}</TabsTrigger>
              <TabsTrigger value="cnss">{t('tabs.cnss')}</TabsTrigger>
              <TabsTrigger value="bonuses">{t('tabs.bonuses')}</TabsTrigger>
              <TabsTrigger value="leaves">{t('leaves')}</TabsTrigger>
              <TabsTrigger value="documents">{t('tabs.documents')}</TabsTrigger>
              <TabsTrigger value="history">{t('tabs.history')}</TabsTrigger>
            </TabsList>

          </div>

          <TabsContent value="profile" className="mt-3 space-y-3">
            {employeesQuery.isLoading ? (
              <Card className="shadow-card border-0 bg-card">
                <CardContent className="py-8 text-center text-muted-foreground">{t('loading')}</CardContent>
              </Card>
            ) : !user ? (
              <Card className="shadow-card border-0 bg-card">
                <CardContent className="py-8 text-center text-muted-foreground">{t('labels.employeeNotFound')}</CardContent>
              </Card>
            ) : (
              <EmployeeEditForm
                user={user}
                salaryConfig={cfg}
                onSubmit={handleSaveProfile}
                isSubmitting={updateUser.isPending || upsertSalaryConfig.isPending}
              />
            )}
          </TabsContent>

          <TabsContent value="salary" className="mt-3">
            <SalaryConfigForm initial={cfg} isSubmitting={upsertSalaryConfig.isPending} onSubmit={handleSave} />

            <Card className="shadow-card border-0 bg-card mt-4">
              <CardHeader>
                <CardTitle className="text-base">{t('employeeDetail.salaryHistoryTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                {salaryHistoryQuery.isLoading ? (
                  <div className="text-sm text-muted-foreground">{t('loading')}</div>
                ) : (salaryHistoryQuery.data ?? []).length === 0 ? (
                  <div className="text-sm text-muted-foreground">{t('employeeDetail.noSalaryHistory')}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('employeeDetail.effectiveDate')}</TableHead>
                        <TableHead>{t('employeeDetail.gross')}</TableHead>
                        <TableHead>{t('employeeDetail.notes')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(salaryHistoryQuery.data ?? []).map(h => (
                        <TableRow key={h.id}>
                          <TableCell>{h.effectiveDate}</TableCell>
                          <TableCell>{formatTnd(h.grossSalary)}</TableCell>
                          <TableCell className="text-muted-foreground">{h.notes ?? '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cnss" className="mt-3">
            <Card className="shadow-card border-0 bg-card">
              <CardHeader>
                <CardTitle className="text-base">{t('tabs.cnss')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">{t('cnssTab.number')}</div>
                    <div className="text-base font-semibold mt-1">{cnssNumber ?? '—'}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">{t('cnssTab.salarySubject')}</div>
                    <div className="text-base font-semibold mt-1">{formatTnd(grossForCnss)}</div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">{t('cnssTab.employeeShare')}</div>
                    <div className="text-lg font-semibold mt-1">{formatTnd(employeeShare)}</div>
                    <div className="text-xs text-muted-foreground">
                      {((Number(activeRateQuery.data?.employeeRate ?? 0.0918)) * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">{t('cnssTab.employerShare')}</div>
                    <div className="text-lg font-semibold mt-1">{formatTnd(employerShare)}</div>
                    <div className="text-xs text-muted-foreground">
                      {((Number(activeRateQuery.data?.employerRate ?? 0.1657)) * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertDescription className="text-sm text-muted-foreground">
                    {t('cnssTab.editHint')}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bonuses" className="mt-3">
            <Card className="shadow-card border-0 bg-card">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{t('tabs.bonuses')}</CardTitle>
                  <Dialog open={bonusOpen} onOpenChange={setBonusOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" /> {t('bonusesPage.add')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('bonusesPage.addTitle')}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label>{t('bonusesPage.kind')}</Label>
                          <Select value={bonusKind} onValueChange={(v: any) => setBonusKind(v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bonus">{t('bonusKind.bonus')}</SelectItem>
                              <SelectItem value="allowance">{t('bonusKind.allowance')}</SelectItem>
                              <SelectItem value="reimbursement">{t('bonusKind.reimbursement')}</SelectItem>
                              <SelectItem value="deduction">{t('bonusKind.deduction')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>{t('bonusesPage.label')}</Label>
                          <Input value={bonusLabel} onChange={(e) => setBonusLabel(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label>{t('bonusesPage.amount')}</Label>
                            <Input type="number" step="0.001" value={bonusAmount} onChange={(e) => setBonusAmount(Number(e.target.value))} />
                          </div>
                          <div>
                            <Label>{t('bonusesPage.month')}</Label>
                            <Input type="number" min={1} max={12} value={bonusMonth} onChange={(e) => setBonusMonth(Number(e.target.value))} />
                          </div>
                          <div>
                            <Label>{t('bonusesPage.year')}</Label>
                            <Input type="number" value={bonusYear} onChange={(e) => setBonusYear(Number(e.target.value))} />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setBonusOpen(false)}>{t('cancel')}</Button>
                        <Button onClick={submitBonus} disabled={createBonus.isPending}>{t('save')}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {bonusesQuery.isLoading ? (
                  <div className="text-sm text-muted-foreground">{t('loading')}</div>
                ) : (bonusesQuery.data ?? []).length === 0 ? (
                  <div className="text-sm text-muted-foreground">{t('bonusesPage.empty')}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('bonusesPage.kind')}</TableHead>
                        <TableHead>{t('bonusesPage.label')}</TableHead>
                        <TableHead>{t('bonusesPage.period')}</TableHead>
                        <TableHead>{t('bonusesPage.amount')}</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(bonusesQuery.data ?? []).map(b => (
                        <TableRow key={b.id}>
                          <TableCell><Badge variant="outline" className="capitalize">{t(`bonusKind.${b.kind}`)}</Badge></TableCell>
                          <TableCell>{b.label}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {b.month && b.year ? `${String(b.month).padStart(2, '0')}/${b.year}` : '—'}
                          </TableCell>
                          <TableCell className={(b.kind === 'other_cost' || Number(b.amount) < 0) ? 'text-destructive' : 'text-primary'}>
                            {(b.kind === 'other_cost' || Number(b.amount) < 0) ? '-' : '+'}{formatTnd(Math.abs(Number(b.amount)))}
                          </TableCell>
                          <TableCell>
                            <ConfirmDeleteButton
                              size="icon"
                              variant="ghost"
                              onConfirm={() => deleteBonus.mutate(b.id)}
                              disabled={deleteBonus.isPending}
                              triggerContent={<Trash2 className="h-4 w-4 text-destructive" />}
                              title={t('bonuses.deleteTitle', { defaultValue: 'Delete bonus?' })}
                              description={t('bonuses.deleteHint', { defaultValue: 'This action cannot be undone.' })}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaves" className="mt-3">
            <Card className="shadow-card border-0 bg-card">
              <CardHeader>
                <CardTitle className="text-base">{t('leaves')}</CardTitle>
              </CardHeader>
              <CardContent>
                {planningLeavesQuery.isLoading ? (
                  <div className="text-sm text-muted-foreground">{t('loading')}</div>
                ) : planningLeavesQuery.error ? (
                  <div className="text-sm text-destructive">{String(planningLeavesQuery.error)}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('leavesPage.type')}</TableHead>
                        <TableHead>{t('leavesPage.dates')}</TableHead>
                        <TableHead>{t('leavesPage.status')}</TableHead>
                        <TableHead>{t('leavesPage.reason')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(planningLeavesQuery.data ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-muted-foreground">
                            {t('employeeDetail.noLeaves')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        (planningLeavesQuery.data ?? []).map(l => (
                          <TableRow key={l.id}>
                            <TableCell className="capitalize">{t(`leaveType.${String(l.leaveType)}`, { defaultValue: String(l.leaveType).replace(/_/g, ' ') })}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatLeaveRange(l)}</TableCell>
                            <TableCell className="capitalize">{t(`leaveStatus.${String(l.status)}`, { defaultValue: String(l.status) })}</TableCell>
                            <TableCell className="max-w-[320px] truncate">{l.reason ?? '—'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-3">
            {user ? (
              <Card className="shadow-card border-0 bg-card">
                <CardHeader>
                  <CardTitle className="text-base">{t('employeeDetail.documentsTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmployeeDocumentsTab userId={Number(user.id)} />
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="history" className="mt-3">
            <Card className="shadow-card border-0 bg-card">
              <CardHeader>
                <CardTitle className="text-base inline-flex items-center gap-2">
                  <HistoryIcon className="h-4 w-4" />
                  {t('tabs.history')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {auditQuery.isLoading ? (
                  <div className="text-sm text-muted-foreground">{t('loading')}</div>
                ) : (auditQuery.data ?? []).length === 0 ? (
                  <div className="text-sm text-muted-foreground">{t('historyTab.empty')}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('historyTab.timestamp')}</TableHead>
                        <TableHead>{t('historyTab.event')}</TableHead>
                        <TableHead>{t('historyTab.description')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(auditQuery.data ?? []).map(e => (
                        <TableRow key={e.id}>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {dayjs(e.timestamp).format('YYYY-MM-DD HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[11px]">{e.eventType.replace(/_/g, ' ')}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{e.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
