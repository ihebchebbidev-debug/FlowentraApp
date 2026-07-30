import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, Plus, Trash2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDeleteButton } from '../common/ConfirmDeleteButton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { HRPageHeader } from '../HRPageHeader';
import {
  useApplicants, useApplicantNotes, useInterviews, useJobOpenings,
  useRecruitmentDashboard,
} from '../../hooks/useRecruitment';
import { APPLICANT_STAGES, type ApplicantStage, type JobOpeningStatus } from '../../types/recruitment.types';

const STAGE_COLOR: Record<ApplicantStage, string> = {
  applied: 'bg-muted text-foreground',
  screening: 'bg-secondary text-secondary-foreground',
  interview: 'bg-primary/10 text-primary',
  offer: 'bg-primary text-primary-foreground',
  hired: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  rejected: 'bg-destructive/15 text-destructive',
  withdrawn: 'bg-muted text-muted-foreground',
};

export function RecruitmentPage() {
  const { t } = useTranslation('hr');
  const { toast } = useToast();
  const dash = useRecruitmentDashboard();
  const { openingsQuery, createOpening, updateOpening, deleteOpening } = useJobOpenings();
  const [tab, setTab] = useState('dashboard');

  // Openings dialog
  const [openOpening, setOpenOpening] = useState(false);
  const [oTitle, setOTitle] = useState('');
  const [oContract, setOContract] = useState('CDI');
  const [oSeniority, setOSeniority] = useState('mid');
  const [oCount, setOCount] = useState(1);
  const [oDesc, setODesc] = useState('');
  const [oStatus, setOStatus] = useState<JobOpeningStatus>('open');

  const submitOpening = async () => {
    if (!oTitle) { toast({ title: t('recruitmentPage.openings.toasts.titleRequired'), variant: 'destructive' }); return; }
    await createOpening.mutateAsync({
      title: oTitle, contractType: oContract, seniority: oSeniority,
      openingsCount: oCount, description: oDesc, status: oStatus, currency: 'TND',
    });
    toast({ title: t('recruitmentPage.openings.toasts.created') });
    setOpenOpening(false); setOTitle(''); setODesc(''); setOCount(1);
  };

  return (
    <div className="flex flex-col">
      <HRPageHeader
        title={t('recruitmentPage.header.title')}
        subtitle={t('recruitmentPage.header.subtitle')}
        icon={Briefcase}
        accentColor="chart-4"
      />
      <div className="p-4 md:p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList variant="underline">
            <TabsTrigger value="dashboard">{t('recruitmentPage.tabs.dashboard')}</TabsTrigger>
            <TabsTrigger value="openings">{t('recruitmentPage.tabs.openings')}</TabsTrigger>
            <TabsTrigger value="applicants">{t('recruitmentPage.tabs.applicants')}</TabsTrigger>
            <TabsTrigger value="interviews">{t('recruitmentPage.tabs.interviews')}</TabsTrigger>
          </TabsList>


          <TabsContent value="dashboard" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label={t('recruitmentPage.dashboard.openPositions')} value={dash.data?.openPositions ?? 0} />
              <Stat label={t('recruitmentPage.dashboard.activeApplicants')} value={dash.data?.activeApplicants ?? 0} />
              <Stat label={t('recruitmentPage.dashboard.interviewsThisWeek')} value={dash.data?.interviewsThisWeek ?? 0} />
              <Stat label={t('recruitmentPage.dashboard.offersOut')} value={dash.data?.offersOut ?? 0} />
            </div>
            <Card className="mt-4">
              <CardHeader><CardTitle>{t('recruitmentPage.dashboard.pipeline')}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {APPLICANT_STAGES.map(s => (
                    <div key={s} className="rounded-md border p-3 text-center">
                      <div className="text-xs text-muted-foreground">{t(`recruitmentPage.stages.${s}`)}</div>
                      <div className="text-2xl font-semibold">{dash.data?.byStage?.[s] ?? 0}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="openings" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('recruitmentPage.openings.title')}</CardTitle>
                <Dialog open={openOpening} onOpenChange={setOpenOpening}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-2" />{t('recruitmentPage.openings.newOpening')}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{t('recruitmentPage.openings.newOpeningDialogTitle')}</DialogTitle></DialogHeader>
                    <div className="grid gap-3">
                      <div><Label>{t('recruitmentPage.openings.fields.title')}</Label><Input value={oTitle} onChange={e => setOTitle(e.target.value)} /></div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label>{t('recruitmentPage.openings.fields.contract')}</Label>
                          <Select value={oContract} onValueChange={setOContract}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CDI">{t('recruitmentPage.contracts.CDI')}</SelectItem>
                              <SelectItem value="CDD">{t('recruitmentPage.contracts.CDD')}</SelectItem>
                              <SelectItem value="Stage">{t('recruitmentPage.contracts.Stage')}</SelectItem>
                              <SelectItem value="Freelance">{t('recruitmentPage.contracts.Freelance')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>{t('recruitmentPage.openings.fields.seniority')}</Label>
                          <Select value={oSeniority} onValueChange={setOSeniority}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="junior">{t('recruitmentPage.seniority.junior')}</SelectItem>
                              <SelectItem value="mid">{t('recruitmentPage.seniority.mid')}</SelectItem>
                              <SelectItem value="senior">{t('recruitmentPage.seniority.senior')}</SelectItem>
                              <SelectItem value="lead">{t('recruitmentPage.seniority.lead')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>{t('recruitmentPage.openings.fields.openings')}</Label>
                          <Input type="number" min={1} value={oCount} onChange={e => setOCount(Number(e.target.value))} />
                        </div>
                      </div>
                      <div><Label>{t('recruitmentPage.openings.fields.description')}</Label><Textarea rows={4} value={oDesc} onChange={e => setODesc(e.target.value)} /></div>
                      <div>
                        <Label>{t('recruitmentPage.openings.fields.status')}</Label>
                        <Select value={oStatus} onValueChange={(v) => setOStatus(v as JobOpeningStatus)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">{t('recruitmentPage.openingStatuses.draft')}</SelectItem>
                            <SelectItem value="open">{t('recruitmentPage.openingStatuses.open')}</SelectItem>
                            <SelectItem value="on_hold">{t('recruitmentPage.openingStatuses.on_hold')}</SelectItem>
                            <SelectItem value="closed">{t('recruitmentPage.openingStatuses.closed')}</SelectItem>
                            <SelectItem value="filled">{t('recruitmentPage.openingStatuses.filled')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setOpenOpening(false)}>{t('recruitmentPage.actions.cancel')}</Button>
                      <Button onClick={submitOpening} disabled={createOpening.isPending}>{t('recruitmentPage.actions.create')}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <div className="rounded-md border">
                  <Table className="min-w-[550px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('recruitmentPage.openings.table.title')}</TableHead>
                        <TableHead>{t('recruitmentPage.openings.table.contract')}</TableHead>
                        <TableHead>{t('recruitmentPage.openings.table.seniority')}</TableHead>
                        <TableHead>{t('recruitmentPage.openings.table.openings')}</TableHead>
                        <TableHead>{t('recruitmentPage.openings.table.applicants')}</TableHead>
                        <TableHead>{t('recruitmentPage.openings.table.status')}</TableHead>
                        <TableHead className="w-[200px]">{t('recruitmentPage.openings.table.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(openingsQuery.data ?? []).length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t('recruitmentPage.openings.empty')}</TableCell></TableRow>
                      )}
                      {(openingsQuery.data ?? []).map(o => (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium">{o.title}</TableCell>
                          <TableCell>{t(`recruitmentPage.contracts.${o.contractType}`, { defaultValue: o.contractType })}</TableCell>
                          <TableCell className="capitalize">{t(`recruitmentPage.seniority.${o.seniority}`, { defaultValue: o.seniority })}</TableCell>
                          <TableCell>{o.hiredCount}/{o.openingsCount}</TableCell>
                          <TableCell>{o.applicantsCount}</TableCell>
                          <TableCell><Badge variant="outline">{t(`recruitmentPage.openingStatuses.${o.status}`, { defaultValue: o.status })}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Select
                                value={o.status}
                                onValueChange={(v) => updateOpening.mutate({ id: o.id, payload: { status: v as JobOpeningStatus } })}
                              >
                                <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">{t('recruitmentPage.openingStatuses.draft')}</SelectItem>
                                  <SelectItem value="open">{t('recruitmentPage.openingStatuses.open')}</SelectItem>
                                  <SelectItem value="on_hold">{t('recruitmentPage.openingStatuses.on_hold')}</SelectItem>
                                  <SelectItem value="closed">{t('recruitmentPage.openingStatuses.closed')}</SelectItem>
                                  <SelectItem value="filled">{t('recruitmentPage.openingStatuses.filled')}</SelectItem>
                                </SelectContent>
                              </Select>
                              <ConfirmDeleteButton
                                size="icon"
                                variant="ghost"
                                disabled={deleteOpening.isPending}
                                onConfirm={() => deleteOpening.mutate(o.id)}
                                triggerContent={<Trash2 className="h-4 w-4" />}
                                title={t('recruitmentPage.openings.deleteConfirmTitle')}
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
          </TabsContent>

          <TabsContent value="applicants" className="mt-4">
            <ApplicantsTab />
          </TabsContent>

          <TabsContent value="interviews" className="mt-4">
            <InterviewsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function ApplicantsTab() {
  const { t } = useTranslation('hr');
  const { toast } = useToast();
  const { openingsQuery } = useJobOpenings();
  const [filterOpening, setFilterOpening] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  const { applicantsQuery, createApplicant, moveStage, deleteApplicant } = useApplicants({
    openingId: filterOpening === 'all' ? undefined : Number(filterOpening),
    stage: filterStage === 'all' ? undefined : filterStage,
  });

  const [open, setOpen] = useState(false);
  const [openingId, setOpeningId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('linkedin');

  const submit = async () => {
    if (!openingId || !firstName || !lastName) {
      toast({ title: t('recruitmentPage.applicants.toasts.requiredFields'), variant: 'destructive' });
      return;
    }
    await createApplicant.mutateAsync({
      openingId: Number(openingId), firstName, lastName, email, phone, source, stage: 'applied',
    });
    toast({ title: t('recruitmentPage.applicants.toasts.added') });
    setOpen(false);
    setFirstName(''); setLastName(''); setEmail(''); setPhone('');
  };

  // Notes dialog
  const [notesFor, setNotesFor] = useState<number | null>(null);
  const { notesQuery, addNote, deleteNote } = useApplicantNotes(notesFor ?? undefined);
  const [noteBody, setNoteBody] = useState('');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('recruitmentPage.applicants.title')}</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />{t('recruitmentPage.applicants.newApplicant')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('recruitmentPage.applicants.newApplicantDialogTitle')}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>{t('recruitmentPage.applicants.fields.opening')}</Label>
                <Select value={openingId} onValueChange={setOpeningId}>
                  <SelectTrigger><SelectValue placeholder={t('recruitmentPage.applicants.fields.openingPlaceholder')} /></SelectTrigger>
                  <SelectContent>
                    {(openingsQuery.data ?? []).map(o => (
                      <SelectItem key={o.id} value={String(o.id)}>{o.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t('recruitmentPage.applicants.fields.firstName')}</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
                <div><Label>{t('recruitmentPage.applicants.fields.lastName')}</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t('recruitmentPage.applicants.fields.email')}</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div><Label>{t('recruitmentPage.applicants.fields.phone')}</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
              </div>
              <div>
                <Label>{t('recruitmentPage.applicants.fields.source')}</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linkedin">{t('recruitmentPage.sources.linkedin')}</SelectItem>
                    <SelectItem value="referral">{t('recruitmentPage.sources.referral')}</SelectItem>
                    <SelectItem value="website">{t('recruitmentPage.sources.website')}</SelectItem>
                    <SelectItem value="other">{t('recruitmentPage.sources.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>{t('recruitmentPage.actions.cancel')}</Button>
              <Button onClick={submit} disabled={createApplicant.isPending}>{t('recruitmentPage.actions.add')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="min-w-[200px]">
            <Label className="text-xs">{t('recruitmentPage.applicants.filters.opening')}</Label>
            <Select value={filterOpening} onValueChange={setFilterOpening}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('recruitmentPage.applicants.filters.all')}</SelectItem>
                {(openingsQuery.data ?? []).map(o => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[180px]">
            <Label className="text-xs">{t('recruitmentPage.applicants.filters.stage')}</Label>
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('recruitmentPage.applicants.filters.all')}</SelectItem>
                {APPLICANT_STAGES.map(s => <SelectItem key={s} value={s}>{t(`recruitmentPage.stages.${s}`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t('recruitmentPage.applicants.table.name')}</TableHead>
                <TableHead>{t('recruitmentPage.applicants.table.opening')}</TableHead>
                <TableHead>{t('recruitmentPage.applicants.table.email')}</TableHead>
                <TableHead>{t('recruitmentPage.applicants.table.source')}</TableHead>
                <TableHead>{t('recruitmentPage.applicants.table.stage')}</TableHead>
                <TableHead>{t('recruitmentPage.applicants.table.interviews')}</TableHead>
                <TableHead className="w-[230px]">{t('recruitmentPage.applicants.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(applicantsQuery.data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t('recruitmentPage.applicants.empty')}</TableCell></TableRow>
              )}
              {(applicantsQuery.data ?? []).map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.firstName} {a.lastName}</TableCell>
                  <TableCell className="text-xs">{a.openingTitle}</TableCell>
                  <TableCell className="text-xs">{a.email}</TableCell>
                  <TableCell className="text-xs">{t(`recruitmentPage.sources.${a.source}`, { defaultValue: a.source })}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${STAGE_COLOR[a.stage]}`}>{t(`recruitmentPage.stages.${a.stage}`)}</span>
                  </TableCell>
                  <TableCell>{a.interviewsCount}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Select value={a.stage} onValueChange={(v) => moveStage.mutate({ id: a.id, stage: v as ApplicantStage })}>
                        <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {APPLICANT_STAGES.map(s => <SelectItem key={s} value={s}>{t(`recruitmentPage.stages.${s}`)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" onClick={() => setNotesFor(a.id)}>{t('recruitmentPage.applicants.notesButton')}</Button>
                      <ConfirmDeleteButton
                        size="icon"
                        variant="ghost"
                        disabled={deleteApplicant.isPending}
                        onConfirm={() => deleteApplicant.mutate(a.id)}
                        triggerContent={<Trash2 className="h-4 w-4" />}
                        title={t('recruitmentPage.applicants.deleteConfirmTitle')}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={!!notesFor} onOpenChange={(o) => !o && setNotesFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('recruitmentPage.applicants.notesDialogTitle')}</DialogTitle></DialogHeader>
          <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
            <div className="flex gap-2">
              <Input placeholder={t('recruitmentPage.applicants.notesPlaceholder')} value={noteBody} onChange={e => setNoteBody(e.target.value)} />
              <Button onClick={async () => {
                if (!notesFor || !noteBody.trim()) return;
                await addNote.mutateAsync({ applicantId: notesFor, body: noteBody });
                setNoteBody('');
              }}>{t('recruitmentPage.applicants.notesAdd')}</Button>
            </div>
            <ul className="space-y-2">
              {(notesQuery.data ?? []).map(n => (
                <li key={n.id} className="rounded border p-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <div>{n.body}</div>
                    <ConfirmDeleteButton
                      size="sm"
                      variant="ghost"
                      disabled={deleteNote.isPending}
                      onConfirm={() => deleteNote.mutate(n.id)}
                      triggerContent={<>{t('recruitmentPage.applicants.notesDeleteLabel')}</>}
                      title={t('recruitmentPage.applicants.notesDeleteConfirmTitle')}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{n.authorName ?? t('recruitmentPage.applicants.notesSystemAuthor')} • {new Date(n.createdAt).toLocaleString()}</div>
                </li>
              ))}
              {(notesQuery.data ?? []).length === 0 && (
                <li className="text-sm text-muted-foreground text-center py-4">{t('recruitmentPage.applicants.notesEmpty')}</li>
              )}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function InterviewsTab() {
  const { t } = useTranslation('hr');
  const { toast } = useToast();
  const { applicantsQuery } = useApplicants();
  const { interviewsQuery, createInterview, updateInterview, deleteInterview } = useInterviews();

  const applicantById = useMemo(() => {
    const m = new Map<number, string>();
    for (const a of applicantsQuery.data ?? []) m.set(a.id, `${a.firstName} ${a.lastName}`);
    return m;
  }, [applicantsQuery.data]);

  const [open, setOpen] = useState(false);
  const [applicantId, setApplicantId] = useState('');
  const [kind, setKind] = useState('phone');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState(45);
  const [meetingUrl, setMeetingUrl] = useState('');

  const submit = async () => {
    if (!applicantId || !scheduledAt) {
      toast({ title: t('recruitmentPage.interviews.toasts.requiredFields'), variant: 'destructive' });
      return;
    }
    await createInterview.mutateAsync({
      applicantId: Number(applicantId), kind: kind as any, scheduledAt: new Date(scheduledAt).toISOString(),
      durationMinutes: duration, meetingUrl, status: 'scheduled',
    });
    toast({ title: t('recruitmentPage.interviews.toasts.scheduled') });
    setOpen(false); setApplicantId(''); setScheduledAt(''); setMeetingUrl('');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle><Users className="h-4 w-4 inline mr-2" />{t('recruitmentPage.interviews.title')}</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />{t('recruitmentPage.interviews.schedule')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('recruitmentPage.interviews.scheduleDialogTitle')}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>{t('recruitmentPage.interviews.fields.applicant')}</Label>
                <Select value={applicantId} onValueChange={setApplicantId}>
                  <SelectTrigger><SelectValue placeholder={t('recruitmentPage.interviews.fields.applicantPlaceholder')} /></SelectTrigger>
                  <SelectContent>
                    {(applicantsQuery.data ?? []).map(a => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.firstName} {a.lastName} — {a.openingTitle}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>{t('recruitmentPage.interviews.fields.kind')}</Label>
                  <Select value={kind} onValueChange={setKind}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">{t('recruitmentPage.interviewKinds.phone')}</SelectItem>
                      <SelectItem value="technical">{t('recruitmentPage.interviewKinds.technical')}</SelectItem>
                      <SelectItem value="hr">{t('recruitmentPage.interviewKinds.hr')}</SelectItem>
                      <SelectItem value="onsite">{t('recruitmentPage.interviewKinds.onsite')}</SelectItem>
                      <SelectItem value="final">{t('recruitmentPage.interviewKinds.final')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('recruitmentPage.interviews.fields.when')}</Label>
                  <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
                </div>
                <div>
                  <Label>{t('recruitmentPage.interviews.fields.durationMinutes')}</Label>
                  <Input type="number" min={15} value={duration} onChange={e => setDuration(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <Label>{t('recruitmentPage.interviews.fields.meetingUrl')}</Label>
                <Input value={meetingUrl} onChange={e => setMeetingUrl(e.target.value)} placeholder="https://meet…" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>{t('recruitmentPage.actions.cancel')}</Button>
              <Button onClick={submit} disabled={createInterview.isPending}>{t('recruitmentPage.interviews.schedule')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="rounded-md border">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t('recruitmentPage.interviews.table.applicant')}</TableHead>
                <TableHead>{t('recruitmentPage.interviews.table.kind')}</TableHead>
                <TableHead>{t('recruitmentPage.interviews.table.when')}</TableHead>
                <TableHead>{t('recruitmentPage.interviews.table.duration')}</TableHead>
                <TableHead>{t('recruitmentPage.interviews.table.status')}</TableHead>
                <TableHead>{t('recruitmentPage.interviews.table.recommendation')}</TableHead>
                <TableHead className="w-[200px]">{t('recruitmentPage.interviews.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(interviewsQuery.data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t('recruitmentPage.interviews.empty')}</TableCell></TableRow>
              )}
              {(interviewsQuery.data ?? []).map(i => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.applicantName ?? applicantById.get(i.applicantId)}</TableCell>
                  <TableCell className="capitalize">{t(`recruitmentPage.interviewKinds.${i.kind}`, { defaultValue: i.kind })}</TableCell>
                  <TableCell className="text-xs">{new Date(i.scheduledAt).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{t('recruitmentPage.interviews.durationMinutesShort', { count: i.durationMinutes })}</TableCell>
                  <TableCell><Badge variant="outline">{t(`recruitmentPage.interviewStatuses.${i.status}`, { defaultValue: i.status })}</Badge></TableCell>
                  <TableCell className="text-xs">{i.recommendation ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Select value={i.status} onValueChange={(v) => updateInterview.mutate({ id: i.id, payload: { status: v as any } })}>
                        <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">{t('recruitmentPage.interviewStatuses.scheduled')}</SelectItem>
                          <SelectItem value="done">{t('recruitmentPage.interviewStatuses.done')}</SelectItem>
                          <SelectItem value="cancelled">{t('recruitmentPage.interviewStatuses.cancelled')}</SelectItem>
                          <SelectItem value="no_show">{t('recruitmentPage.interviewStatuses.no_show')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <ConfirmDeleteButton
                        size="icon"
                        variant="ghost"
                        disabled={deleteInterview.isPending}
                        onConfirm={() => deleteInterview.mutate(i.id)}
                        triggerContent={<Trash2 className="h-4 w-4" />}
                        title={t('recruitmentPage.interviews.deleteConfirmTitle')}
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
