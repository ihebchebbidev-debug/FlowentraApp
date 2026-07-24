import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSubmitGuard } from '@/shared/hooks/useSubmitGuard';
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
import { useMemo as useMemoReact } from 'react';
import { useExpenseTypes } from '@/modules/lookups/hooks/useLookups';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { PlannedDateField } from './PlannedDateField';

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

export function PlannedEntriesEditor({ parentType, parentId, currency, readOnly = false }: Props) {
  const { t } = useTranslation();
  const { current: currencyInfo } = useCurrency();
  const effectiveCurrency = currency ?? currencyInfo.code;
  const { items: expenseTypeLookups } = useExpenseTypes();
  const expenseTypeOptions = useMemoReact(() => {
    const active = expenseTypeLookups
      .filter((i: any) => i.isActive)
      .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((i: any) => ({
        value: i.value || i.name.toLowerCase().replace(/\s+/g, '_'),
        label: i.name,
      }));
    if (active.length > 0) return active;
    return EXPENSE_TYPES.map((et) => ({ value: et, label: t(`planning.expenseTypes.${et}`, et) }));
  }, [expenseTypeLookups, t]);
  const [entries, setEntries] = useState<PlannedLineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PlannedLineEntry | null>(null);
  const [draft, setDraft] = useState<CreatePlannedLineEntry>({ kind: 'time', technicianCount: 1, plannedMinutes: 60 });
  const [pendingDelete, setPendingDelete] = useState<PlannedLineEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const saveGuard = useSubmitGuard();
  const deleteGuard = useSubmitGuard();


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
        : { kind: 'expense', expenseType: (expenseTypeOptions[0]?.value ?? 'travel') as PlannedExpenseType, plannedAmount: 0, currency: effectiveCurrency }
    );
    setEditorOpen(true);
  };

  const openEdit = (entry: PlannedLineEntry) => {
    setEditing(entry);
    setDraft({
      kind: entry.kind,
      plannedMinutes: entry.plannedMinutes ?? undefined,
      technicianCount: entry.technicianCount ?? undefined,
      plannedDate: entry.plannedDate ?? undefined,
      expenseType: entry.expenseType ?? undefined,
      plannedAmount: entry.plannedAmount ?? undefined,
      currency: entry.currency ?? effectiveCurrency,
      description: entry.description ?? undefined,
    });
    setEditorOpen(true);
  };

  const save = saveGuard.guard(async () => {
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
  });

  const remove = (entry: PlannedLineEntry) => {
    setPendingDelete(entry);
  };

  const confirmRemove = deleteGuard.guard(async () => {
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
  });

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
            <Wallet className="h-3 w-3" /> {totalExpenses.toFixed(2)} {effectiveCurrency}
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
                  <span className="font-medium">{(e.plannedAmount ?? 0).toFixed(2)} {e.currency ?? effectiveCurrency}</span>
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
              <div>
                <Label className="text-xs">{t('planning.plannedDate', 'Planned day')}</Label>
                <PlannedDateField
                  value={draft.plannedDate ?? null}
                  onChange={(v) => setDraft({ ...draft, plannedDate: v })}
                />
              </div>
              <div>
                <Label className="text-xs">{t('planning.technicianCount', 'Technicians')}</Label>
                <Input type="number" min={1} value={draft.technicianCount ?? 1}
                  onChange={e => setDraft({ ...draft, technicianCount: Math.max(1, parseInt(e.target.value) || 1) })} />
              </div>
              <div>
                <Label className="text-xs">{t('planning.duration', 'Duration')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Input type="number" min={0}
                      value={Math.floor((draft.plannedMinutes ?? 0) / 60)}
                      onChange={e => {
                        const h = Math.max(0, parseInt(e.target.value) || 0);
                        const m = (draft.plannedMinutes ?? 0) % 60;
                        setDraft({ ...draft, plannedMinutes: h * 60 + m });
                      }} />
                    <span className="text-xs text-muted-foreground">{t('planning.hoursShort', 'h')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" min={0} max={59}
                      value={(draft.plannedMinutes ?? 0) % 60}
                      onChange={e => {
                        const m = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                        const h = Math.floor((draft.plannedMinutes ?? 0) / 60);
                        setDraft({ ...draft, plannedMinutes: h * 60 + m });
                      }} />
                    <span className="text-xs text-muted-foreground">{t('planning.minutesShort', 'min')}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">{t('planning.expenseType', 'Expense type')}</Label>
                <Select
                  value={draft.expenseType ?? expenseTypeOptions[0]?.value}
                  onValueChange={v => setDraft({ ...draft, expenseType: v as PlannedExpenseType })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {expenseTypeOptions.map(et => (
                      <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">
                  {t('planning.amount', 'Amount')}
                </Label>
                <Input type="number" step="0.01" min={0} value={draft.plannedAmount ?? 0}
                  onChange={e => setDraft({ ...draft, plannedAmount: parseFloat(e.target.value) || 0, currency: effectiveCurrency })} />
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs">{t('planning.description', 'Description (optional)')}</Label>
            <Textarea rows={2} value={draft.description ?? ''}
              onChange={e => setDraft({ ...draft, description: e.target.value })} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={saveGuard.pending}>{t('cancel', 'Cancel')}</Button>
            <Button onClick={save} disabled={saveGuard.pending}>
              {saveGuard.pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('save', 'Save')}
            </Button>
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
              onClick={(e) => { e.preventDefault(); void confirmRemove(); }}
              disabled={deleting || deleteGuard.pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {(deleting || deleteGuard.pending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {(deleting || deleteGuard.pending) ? t('deleting', 'Deleting…') : t('delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default PlannedEntriesEditor;
