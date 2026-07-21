import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useReviewCycles } from '../../hooks/usePerformance';
import type { ReviewCycleFrequency, ReviewCycleStatus } from '../../types/performance.types';
import { ConfirmDeleteButton } from '../common/ConfirmDeleteButton';

export function ReviewCyclesTab() {
  const { toast } = useToast();
  const { cyclesQuery, createCycle, updateCycle, deleteCycle } = useReviewCycles();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<ReviewCycleFrequency>('annual');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [selfReq, setSelfReq] = useState(true);

  const submit = async () => {
    if (!name || !periodStart || !periodEnd) {
      toast({ title: 'Name and period are required', variant: 'destructive' });
      return;
    }
    await createCycle.mutateAsync({
      name, frequency, periodStart, periodEnd,
      selfAssessmentRequired: selfReq, status: 'draft',
    });
    toast({ title: 'Cycle created' });
    setOpen(false);
    setName(''); setPeriodStart(''); setPeriodEnd(''); setSelfReq(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Review Cycles</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />New cycle</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New review cycle</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="2025 Annual Review" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Frequency</Label>
                  <Select value={frequency} onValueChange={v => setFrequency(v as ReviewCycleFrequency)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="semi_annual">Semi-annual</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Period start</Label>
                  <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
                </div>
                <div>
                  <Label>Period end</Label>
                  <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Require self-assessment</Label>
                <Switch checked={selfReq} onCheckedChange={setSelfReq} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={createCycle.isPending}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reviews</TableHead>
                <TableHead>Self-assessment</TableHead>
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(cyclesQuery.data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No cycles yet</TableCell></TableRow>
              )}
              {(cyclesQuery.data ?? []).map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.frequency.replace('_', ' ')}</TableCell>
                  <TableCell className="text-xs">{new Date(c.periodStart).toLocaleDateString()} → {new Date(c.periodEnd).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant={c.status === 'open' ? 'default' : c.status === 'closed' ? 'outline' : 'secondary'}>{c.status}</Badge></TableCell>
                  <TableCell className="text-xs">{c.completedReviewsCount}/{c.reviewsCount}</TableCell>
                  <TableCell>{c.selfAssessmentRequired ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Select
                        value={c.status}
                        onValueChange={(v) => updateCycle.mutate({ id: c.id, payload: { status: v as ReviewCycleStatus } })}
                      >
                        <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <ConfirmDeleteButton
                        size="icon"
                        variant="ghost"
                        disabled={deleteCycle.isPending}
                        onConfirm={() => deleteCycle.mutate(c.id)}
                        triggerContent={<Trash2 className="h-4 w-4" />}
                        title="Delete review cycle?"
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