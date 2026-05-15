import { useMemo, useState } from 'react';
import { Briefcase, Plus, Trash2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    if (!oTitle) { toast({ title: 'Title required', variant: 'destructive' }); return; }
    await createOpening.mutateAsync({
      title: oTitle, contractType: oContract, seniority: oSeniority,
      openingsCount: oCount, description: oDesc, status: oStatus, currency: 'TND',
    });
    toast({ title: 'Opening created' });
    setOpenOpening(false); setOTitle(''); setODesc(''); setOCount(1);
  };

  return (
    <div className="flex flex-col">
      <HRPageHeader
        title="Recruitment"
        subtitle="Job openings, applicants and interview pipeline"
        icon={Briefcase}
        accentColor="chart-4"
      />
      <div className="p-4 md:p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="openings">Job openings</TabsTrigger>
            <TabsTrigger value="applicants">Applicants</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Open positions" value={dash.data?.openPositions ?? 0} />
              <Stat label="Active applicants" value={dash.data?.activeApplicants ?? 0} />
              <Stat label="Interviews this week" value={dash.data?.interviewsThisWeek ?? 0} />
              <Stat label="Offers out" value={dash.data?.offersOut ?? 0} />
            </div>
            <Card className="mt-4">
              <CardHeader><CardTitle>Pipeline</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {APPLICANT_STAGES.map(s => (
                    <div key={s} className="rounded-md border p-3 text-center">
                      <div className="text-xs text-muted-foreground capitalize">{s}</div>
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
                <CardTitle>Job openings</CardTitle>
                <Dialog open={openOpening} onOpenChange={setOpenOpening}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-2" />New opening</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>New job opening</DialogTitle></DialogHeader>
                    <div className="grid gap-3">
                      <div><Label>Title</Label><Input value={oTitle} onChange={e => setOTitle(e.target.value)} /></div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label>Contract</Label>
                          <Select value={oContract} onValueChange={setOContract}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CDI">CDI</SelectItem>
                              <SelectItem value="CDD">CDD</SelectItem>
                              <SelectItem value="Stage">Stage</SelectItem>
                              <SelectItem value="Freelance">Freelance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Seniority</Label>
                          <Select value={oSeniority} onValueChange={setOSeniority}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="junior">Junior</SelectItem>
                              <SelectItem value="mid">Mid</SelectItem>
                              <SelectItem value="senior">Senior</SelectItem>
                              <SelectItem value="lead">Lead</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Openings</Label>
                          <Input type="number" min={1} value={oCount} onChange={e => setOCount(Number(e.target.value))} />
                        </div>
                      </div>
                      <div><Label>Description</Label><Textarea rows={4} value={oDesc} onChange={e => setODesc(e.target.value)} /></div>
                      <div>
                        <Label>Status</Label>
                        <Select value={oStatus} onValueChange={(v) => setOStatus(v as JobOpeningStatus)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="on_hold">On hold</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="filled">Filled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setOpenOpening(false)}>Cancel</Button>
                      <Button onClick={submitOpening} disabled={createOpening.isPending}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Contract</TableHead>
                        <TableHead>Seniority</TableHead>
                        <TableHead>Openings</TableHead>
                        <TableHead>Applicants</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[200px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(openingsQuery.data ?? []).length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No openings yet</TableCell></TableRow>
                      )}
                      {(openingsQuery.data ?? []).map(o => (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium">{o.title}</TableCell>
                          <TableCell>{o.contractType}</TableCell>
                          <TableCell className="capitalize">{o.seniority}</TableCell>
                          <TableCell>{o.hiredCount}/{o.openingsCount}</TableCell>
                          <TableCell>{o.applicantsCount}</TableCell>
                          <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Select
                                value={o.status}
                                onValueChange={(v) => updateOpening.mutate({ id: o.id, payload: { status: v as JobOpeningStatus } })}
                              >
                                <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="on_hold">On hold</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                  <SelectItem value="filled">Filled</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button size="icon" variant="ghost" onClick={() => deleteOpening.mutate(o.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
      toast({ title: 'Opening, first & last name required', variant: 'destructive' });
      return;
    }
    await createApplicant.mutateAsync({
      openingId: Number(openingId), firstName, lastName, email, phone, source, stage: 'applied',
    });
    toast({ title: 'Applicant added' });
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
        <CardTitle>Applicants</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />New applicant</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New applicant</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Opening</Label>
                <Select value={openingId} onValueChange={setOpeningId}>
                  <SelectTrigger><SelectValue placeholder="Select opening" /></SelectTrigger>
                  <SelectContent>
                    {(openingsQuery.data ?? []).map(o => (
                      <SelectItem key={o.id} value={String(o.id)}>{o.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>First name</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
                <div><Label>Last name</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
              </div>
              <div>
                <Label>Source</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={createApplicant.isPending}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="min-w-[200px]">
            <Label className="text-xs">Opening</Label>
            <Select value={filterOpening} onValueChange={setFilterOpening}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {(openingsQuery.data ?? []).map(o => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[180px]">
            <Label className="text-xs">Stage</Label>
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {APPLICANT_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Opening</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Interviews</TableHead>
                <TableHead className="w-[230px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(applicantsQuery.data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No applicants yet</TableCell></TableRow>
              )}
              {(applicantsQuery.data ?? []).map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.firstName} {a.lastName}</TableCell>
                  <TableCell className="text-xs">{a.openingTitle}</TableCell>
                  <TableCell className="text-xs">{a.email}</TableCell>
                  <TableCell className="text-xs">{a.source}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${STAGE_COLOR[a.stage]}`}>{a.stage}</span>
                  </TableCell>
                  <TableCell>{a.interviewsCount}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Select value={a.stage} onValueChange={(v) => moveStage.mutate({ id: a.id, stage: v as ApplicantStage })}>
                        <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {APPLICANT_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" onClick={() => setNotesFor(a.id)}>Notes</Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteApplicant.mutate(a.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
          <DialogHeader><DialogTitle>Applicant notes</DialogTitle></DialogHeader>
          <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
            <div className="flex gap-2">
              <Input placeholder="Add a note…" value={noteBody} onChange={e => setNoteBody(e.target.value)} />
              <Button onClick={async () => {
                if (!notesFor || !noteBody.trim()) return;
                await addNote.mutateAsync({ applicantId: notesFor, body: noteBody });
                setNoteBody('');
              }}>Add</Button>
            </div>
            <ul className="space-y-2">
              {(notesQuery.data ?? []).map(n => (
                <li key={n.id} className="rounded border p-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <div>{n.body}</div>
                    <Button size="sm" variant="ghost" onClick={() => deleteNote.mutate(n.id)}>Delete</Button>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{n.authorName ?? 'System'} • {new Date(n.createdAt).toLocaleString()}</div>
                </li>
              ))}
              {(notesQuery.data ?? []).length === 0 && (
                <li className="text-sm text-muted-foreground text-center py-4">No notes</li>
              )}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function InterviewsTab() {
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
      toast({ title: 'Applicant and date are required', variant: 'destructive' });
      return;
    }
    await createInterview.mutateAsync({
      applicantId: Number(applicantId), kind: kind as any, scheduledAt: new Date(scheduledAt).toISOString(),
      durationMinutes: duration, meetingUrl, status: 'scheduled',
    });
    toast({ title: 'Interview scheduled' });
    setOpen(false); setApplicantId(''); setScheduledAt(''); setMeetingUrl('');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle><Users className="h-4 w-4 inline mr-2" />Interviews</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Schedule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule interview</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Applicant</Label>
                <Select value={applicantId} onValueChange={setApplicantId}>
                  <SelectTrigger><SelectValue placeholder="Select applicant" /></SelectTrigger>
                  <SelectContent>
                    {(applicantsQuery.data ?? []).map(a => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.firstName} {a.lastName} — {a.openingTitle}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Kind</Label>
                  <Select value={kind} onValueChange={setKind}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="onsite">Onsite</SelectItem>
                      <SelectItem value="final">Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>When</Label>
                  <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
                </div>
                <div>
                  <Label>Duration (min)</Label>
                  <Input type="number" min={15} value={duration} onChange={e => setDuration(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <Label>Meeting URL</Label>
                <Input value={meetingUrl} onChange={e => setMeetingUrl(e.target.value)} placeholder="https://meet…" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={createInterview.isPending}>Schedule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recommendation</TableHead>
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(interviewsQuery.data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No interviews scheduled</TableCell></TableRow>
              )}
              {(interviewsQuery.data ?? []).map(i => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.applicantName ?? applicantById.get(i.applicantId)}</TableCell>
                  <TableCell className="capitalize">{i.kind}</TableCell>
                  <TableCell className="text-xs">{new Date(i.scheduledAt).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{i.durationMinutes} min</TableCell>
                  <TableCell><Badge variant="outline">{i.status}</Badge></TableCell>
                  <TableCell className="text-xs">{i.recommendation ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Select value={i.status} onValueChange={(v) => updateInterview.mutate({ id: i.id, payload: { status: v as any } })}>
                        <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="no_show">No show</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost" onClick={() => deleteInterview.mutate(i.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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