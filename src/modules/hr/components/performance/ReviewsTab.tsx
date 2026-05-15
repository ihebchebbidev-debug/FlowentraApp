import { useMemo, useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useReviewCycles, useReviews } from '../../hooks/usePerformance';
import { useEmployees } from '../../hooks/useEmployees';
import type { ReviewRating, ReviewStatus, HrPerformanceReview } from '../../types/performance.types';

const STATUS_VARIANT: Record<ReviewStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline',
  self_assessment: 'secondary',
  manager_review: 'secondary',
  completed: 'default',
  acknowledged: 'default',
};

export function ReviewsTab() {
  const { toast } = useToast();
  const { employeesQuery } = useEmployees();
  const { cyclesQuery } = useReviewCycles();
  const [filterCycle, setFilterCycle] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { reviewsQuery, createReview, updateReview, deleteReview } = useReviews({
    cycleId: filterCycle === 'all' ? undefined : Number(filterCycle),
    status: filterStatus === 'all' ? undefined : filterStatus,
  });

  const users = useMemo(() => (employeesQuery.data ?? []).map((r: any) => r.user).filter(Boolean), [employeesQuery.data]);

  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [cycleId, setCycleId] = useState('');
  const [reviewerId, setReviewerId] = useState('');

  const submit = async () => {
    if (!userId || !cycleId) {
      toast({ title: 'Employee and cycle are required', variant: 'destructive' });
      return;
    }
    await createReview.mutateAsync({
      userId: Number(userId),
      cycleId: Number(cycleId),
      reviewerUserId: reviewerId ? Number(reviewerId) : undefined,
      status: 'self_assessment',
    });
    toast({ title: 'Review created' });
    setOpen(false);
    setUserId(''); setCycleId(''); setReviewerId('');
  };

  const [detail, setDetail] = useState<HrPerformanceReview | null>(null);
  const [draft, setDraft] = useState<Partial<HrPerformanceReview>>({});

  const openDetail = (r: HrPerformanceReview) => {
    setDetail(r);
    setDraft({
      status: r.status,
      selfAssessment: r.selfAssessment,
      managerComments: r.managerComments,
      overallScore: r.overallScore,
      rating: r.rating,
      strengths: r.strengths,
      improvements: r.improvements,
      developmentPlan: r.developmentPlan,
    });
  };
  const saveDetail = async () => {
    if (!detail) return;
    await updateReview.mutateAsync({ id: detail.id, payload: draft });
    toast({ title: 'Review updated' });
    setDetail(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Performance Reviews</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />New review</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Start a new review</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Employee</Label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {users.map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)}>{`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Review cycle</Label>
                <Select value={cycleId} onValueChange={setCycleId}>
                  <SelectTrigger><SelectValue placeholder="Select cycle" /></SelectTrigger>
                  <SelectContent>
                    {(cyclesQuery.data ?? []).map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reviewer (manager)</Label>
                <Select value={reviewerId} onValueChange={setReviewerId}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {users.map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)}>{`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={createReview.isPending}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="min-w-[200px]">
            <Label className="text-xs">Cycle</Label>
            <Select value={filterCycle} onValueChange={setFilterCycle}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {(cyclesQuery.data ?? []).map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[180px]">
            <Label className="text-xs">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="self_assessment">Self-assessment</SelectItem>
                <SelectItem value="manager_review">Manager review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Cycle</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(reviewsQuery.data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No reviews yet</TableCell></TableRow>
              )}
              {(reviewsQuery.data ?? []).map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.userName}</TableCell>
                  <TableCell className="text-xs">{r.cycleName}</TableCell>
                  <TableCell className="text-xs">{r.reviewerName ?? '—'}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[r.status]}>{r.status.replace('_', ' ')}</Badge></TableCell>
                  <TableCell>{r.overallScore != null ? Number(r.overallScore).toFixed(1) : '—'}</TableCell>
                  <TableCell className="text-xs">{r.rating ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openDetail(r)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteReview.mutate(r.id)}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.userName} — {detail?.cycleName}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={draft.status as string} onValueChange={(v) => setDraft(d => ({ ...d, status: v as ReviewStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="self_assessment">Self-assessment</SelectItem>
                    <SelectItem value="manager_review">Manager review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Overall score (0–5)</Label>
                <Input type="number" min={0} max={5} step={0.1}
                  value={draft.overallScore ?? ''}
                  onChange={e => setDraft(d => ({ ...d, overallScore: e.target.value === '' ? null : Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Rating</Label>
                <Select value={(draft.rating ?? '') as string} onValueChange={(v) => setDraft(d => ({ ...d, rating: v as ReviewRating }))}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exceeds">Exceeds expectations</SelectItem>
                    <SelectItem value="meets">Meets expectations</SelectItem>
                    <SelectItem value="partially_meets">Partially meets</SelectItem>
                    <SelectItem value="below">Below expectations</SelectItem>
                    <SelectItem value="new_to_role">New to role</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Self-assessment (employee)</Label>
              <Textarea rows={4} value={draft.selfAssessment ?? ''}
                onChange={e => setDraft(d => ({ ...d, selfAssessment: e.target.value }))} />
            </div>
            <div>
              <Label>Manager comments</Label>
              <Textarea rows={3} value={draft.managerComments ?? ''}
                onChange={e => setDraft(d => ({ ...d, managerComments: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Strengths</Label>
                <Textarea rows={3} value={draft.strengths ?? ''}
                  onChange={e => setDraft(d => ({ ...d, strengths: e.target.value }))} />
              </div>
              <div>
                <Label>Improvements</Label>
                <Textarea rows={3} value={draft.improvements ?? ''}
                  onChange={e => setDraft(d => ({ ...d, improvements: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Development plan</Label>
              <Textarea rows={3} value={draft.developmentPlan ?? ''}
                onChange={e => setDraft(d => ({ ...d, developmentPlan: e.target.value }))} />
            </div>
            {detail?.goals && detail.goals.length > 0 && (
              <div className="rounded-md border p-3">
                <div className="text-sm font-medium mb-2">Linked goals</div>
                <ul className="space-y-1 text-xs">
                  {detail.goals.map(g => (
                    <li key={g.id} className="flex justify-between">
                      <span>{g.title}</span>
                      <span className="text-muted-foreground">{g.progress}% • {g.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDetail(null)}>Close</Button>
            <Button onClick={saveDetail} disabled={updateReview.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}