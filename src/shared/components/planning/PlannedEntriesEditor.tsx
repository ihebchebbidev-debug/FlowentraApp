import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Clock, Wallet, Users, AlertCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  plannedEntriesApi,
  type PlannedLineEntry,
  type PlannedParentType,
  type PlannedExpenseType,
  type CreatePlannedLineEntry,
  formatPlannedMinutes,
  sumPlannedMinutes,
  sumPlannedExpenses,
} from '@/services/plannedEntriesService';

/**
 * Drop-in editor for planned time & expenses on an offer/sale/service-order-job line.
 * Renders only when the parent line is a service (caller decides).
 */
interface Props {
  parentType: PlannedParentType;
  parentId: number | string | null | undefined;
  currency?: string;
  /** When true, disables CRUD (e.g. when the source document is locked/converted). */
  readOnly?: boolean;
}

const EXPENSE_TYPES: PlannedExpenseType[] = ['travel', 'per_diem', 'materials', 'subcontractor'];

export function PlannedEntriesEditor({ parentType, parentId, currency = 'TND', readOnly = false }: Props) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<PlannedLineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PlannedLineEntry | null>(null);
  const [draft, setDraft] = useState<CreatePlannedLineEntry>({ kind: 'time', technicianCount: 1, plannedMinutes: 60 });
  const [pendingDelete, setPendingDelete] = useState<PlannedLineEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const idReady = parentId !== null && parentId !== undefined && parentId !== '' && Number(parentId) > 0;

  const reload = async () => {
    if (!idReady) return;
    setLoading(true);
    try {
      const data = await plannedEntriesApi.list(parentType, parentId as number);
      setEntries(data);
    } catch (e) {
      console.error('Failed to load planned entries', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [parentType, parentId]);

  const totalMinutes = sumPlannedMinutes(entries);
  const totalExpenses = sumPlannedExpenses(entries);

  const openAdd = (kind: 'time' | 'expense') => {
    setEditing(null);
    setDraft(
      kind === 'time'
        ? { kind: 'time', technicianCount: 1, plannedMinutes: 60 }
        : { kind: 'expense', expenseType: 'travel', plannedAmount: 0, currency }
    );
    setEditorOpen(true);
  };

  const openEdit = (entry: PlannedLineEntry) => {
    setEditing(entry);
    setDraft({
      kind: entry.kind,
      plannedMinutes: entry.plannedMinutes ?? undefined,
      technicianCount: entry.technicianCount ?? undefined,
      hourlyRate: entry.hourlyRate ?? undefined,
      expenseType: entry.expenseType ?? undefined,
      plannedAmount: entry.plannedAmount ?? undefined,
      currency: entry.currency ?? currency,
      description: entry.description ?? undefined,
    });
    setEditorOpen(true);
  };

  const save = async () => {
    if (!idReady) {
      toast.error(t('planning.saveLineFirst', 'Save the line first, then plan time/expenses.'));
      return;
    }
    if (draft.kind === 'time') {
      const mins = Number(draft.plannedMinutes ?? 0);
      if (!Number.isFinite(mins) || mins <= 0) {
        toast.error(t('planning.durationRequired', 'Planned duration must be greater than 0 minutes.'));
        return;
      }
    }
    try {
      if (editing) {
        await plannedEntriesApi.update(editing.id, draft);
      } else {
        await plannedEntriesApi.create(parentType, parentId as number, draft);
      }
      toast.success(t('planning.savedToast', 'Plan saved'));
      setEditorOpen(false);
      await reload();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save');
    }
  };

  const remove = (entry: PlannedLineEntry) => {
    setPendingDelete(entry);
  };

  const confirmRemove = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await plannedEntriesApi.remove(pendingDelete.id);
      setPendingDelete(null);
      await reload();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const timeEntries = entries.filter(e => e.kind === 'time');
  const expenseEntries = entries.filter(e => e.kind === 'expense');

  return (
    <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">{t('planning.title', 'Planned time & expenses')}</h4>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" /> {formatPlannedMinutes(totalMinutes)}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Wallet className="h-3 w-3" /> {totalExpenses.toFixed(2)} {currency}
          </Badge>
        </div>
      </div>

      {!idReady && (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-3 w-3" />
          {t('planning.saveLineFirst', 'Save the line first, then plan time/expenses.')}
        </div>
      )}

      {/* Time entries */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-medium">{t('planning.plannedTime', 'Planned time')}</Label>
          {!readOnly && idReady && (
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openAdd('time')}>
              <Plus className="h-3 w-3 mr-1" /> {t('add', 'Add')}
            </Button>
          )}
        </div>
        {timeEntries.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">{t('planning.noTime', 'No planned time')}</p>
        ) : (
          <ul className="space-y-1">
            {timeEntries.map(e => (
              <li key={e.id} className="flex items-center justify-between bg-background border rounded px-2 py-1.5 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{e.technicianCount ?? 1} × {formatPlannedMinutes(e.plannedMinutes ?? 0)}</span>
                  {e.description && <span className="text-xs text-muted-foreground truncate">— {e.description}</span>}
                </div>
                {!readOnly && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEdit(e)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => remove(e)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Expenses */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-medium">{t('planning.plannedExpenses', 'Planned expenses')}</Label>
          {!readOnly && idReady && (
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openAdd('expense')}>
              <Plus className="h-3 w-3 mr-1" /> {t('add', 'Add')}
            </Button>
          )}
        </div>
        {expenseEntries.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">{t('planning.noExpenses', 'No planned expenses')}</p>
        ) : (
          <ul className="space-y-1">
            {expenseEntries.map(e => (
              <li key={e.id} className="flex items-center justify-between bg-background border rounded px-2 py-1.5 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs">{t(`planning.expenseTypes.${e.expenseType}`, e.expenseType ?? '')}</Badge>
                  <span className="font-medium">{(e.plannedAmount ?? 0).toFixed(2)} {e.currency ?? currency}</span>
                  {e.description && <span className="text-xs text-muted-foreground truncate">— {e.description}</span>}
                </div>
                {!readOnly && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEdit(e)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => remove(e)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Editor dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? t('planning.editEntry', 'Edit planned entry')
                : draft.kind === 'time'
                  ? t('planning.addTime', 'Add planned time')
                  : t('planning.addExpense', 'Add planned expense')}
            </DialogTitle>
          </DialogHeader>

          {draft.kind === 'time' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">{t('planning.technicianCount', 'Technicians')}</Label>
                  <Input type="number" min={1} value={draft.technicianCount ?? 1}
                    onChange={e => setDraft({ ...draft, technicianCount: Math.max(1, parseInt(e.target.value) || 1) })} />
                </div>
                <div>
                  <Label className="text-xs">{t('planning.durationMinutes', 'Duration (min)')}</Label>
                  <Input type="number" min={1} value={draft.plannedMinutes ?? 0}
                    onChange={e => setDraft({ ...draft, plannedMinutes: Math.max(0, parseInt(e.target.value) || 0) })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">{t('planning.hourlyRate', 'Hourly rate (optional)')}</Label>
                <Input type="number" step="0.01" min={0} value={draft.hourlyRate ?? ''}
                  onChange={e => setDraft({ ...draft, hourlyRate: e.target.value === '' ? null : parseFloat(e.target.value) })} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">{t('planning.expenseType', 'Expense type')}</Label>
                <Select
                  value={draft.expenseType ?? 'travel'}
                  onValueChange={v => setDraft({ ...draft, expenseType: v as PlannedExpenseType })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_TYPES.map(et => (
                      <SelectItem key={et} value={et}>{t(`planning.expenseTypes.${et}`, et)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">{t('planning.amount', 'Amount')}</Label>
                  <Input type="number" step="0.01" min={0} value={draft.plannedAmount ?? 0}
                    onChange={e => setDraft({ ...draft, plannedAmount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label className="text-xs">{t('planning.currency', 'Currency')}</Label>
                  <Input value={draft.currency ?? currency} maxLength={3}
                    onChange={e => setDraft({ ...draft, currency: e.target.value.toUpperCase() })} />
                </div>
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs">{t('planning.description', 'Description (optional)')}</Label>
            <Textarea rows={2} value={draft.description ?? ''}
              onChange={e => setDraft({ ...draft, description: e.target.value })} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>{t('cancel', 'Cancel')}</Button>
            <Button onClick={save}>{t('save', 'Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && !deleting && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('planning.confirmDeleteTitle', 'Delete planned entry?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('planning.confirmDelete', 'Delete this planned entry?')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmRemove(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? t('deleting', 'Deleting…') : t('delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default PlannedEntriesEditor;
