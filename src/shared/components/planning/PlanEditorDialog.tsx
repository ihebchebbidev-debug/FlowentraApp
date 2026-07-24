import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  plannedEntriesApi,
  type CreatePlannedLineEntry,
  type PlannedEntryKind,
  type PlannedExpenseType,
  type PlannedLineEntry,
  type PlannedParentType,
} from '@/services/plannedEntriesService';
import { useExpenseTypes } from '@/modules/lookups/hooks/useLookups';
import { PlannedDateField } from './PlannedDateField';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentType: PlannedParentType;
  parentIds: number[];
  jobLabels?: Record<number, string>;
  kind: PlannedEntryKind;
  currency: string;
  editing?: PlannedLineEntry | null;
  onSaved: () => void;
}

const EXPENSE_TYPES: PlannedExpenseType[] = ['travel', 'per_diem', 'materials', 'subcontractor'];

function defaultDraft(kind: PlannedEntryKind, currency: string): CreatePlannedLineEntry {
  if (kind === 'time') return { kind, technicianCount: 1, plannedMinutes: 60 };
  if (kind === 'expense') return { kind, expenseType: 'travel', plannedAmount: 0, currency };
  return { kind: 'material', quantity: 1, unitPrice: 0, articleName: '' };
}

export function PlanEditorDialog({
  open,
  onOpenChange,
  parentType,
  parentIds,
  jobLabels,
  kind,
  currency,
  editing,
  onSaved,
}: Props) {
  const { t } = useTranslation();
  const { items: expenseTypeLookups } = useExpenseTypes();

  const expenseTypeOptions = (() => {
    const active = expenseTypeLookups
      .filter((i: any) => i.isActive)
      .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((i: any) => ({
        value: i.value || i.name.toLowerCase().replace(/\s+/g, '_'),
        label: i.name,
      }));
    if (active.length > 0) return active;
    return EXPENSE_TYPES.map((et) => ({ value: et, label: t(`planning.expenseTypes.${et}`, et) }));
  })();

  const multiJob = parentIds.length > 1;

  const [draft, setDraft] = useState<CreatePlannedLineEntry>(defaultDraft(kind, currency));
  const [selectedParentId, setSelectedParentId] = useState<number | null>(parentIds[0] ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setSelectedParentId(editing.parentId);
      setDraft({
        kind: editing.kind,
        plannedMinutes: editing.plannedMinutes ?? undefined,
        technicianCount: editing.technicianCount ?? undefined,
        plannedDate: editing.plannedDate ?? undefined,
        expenseType: editing.expenseType ?? undefined,
        plannedAmount: editing.plannedAmount ?? undefined,
        currency: editing.currency ?? currency,
        description: editing.description ?? undefined,
      });
    } else {
      setSelectedParentId(parentIds[0] ?? null);
      const base = defaultDraft(kind, currency);
      if (kind === 'expense' && expenseTypeOptions.length > 0) {
        base.expenseType = expenseTypeOptions[0].value as PlannedExpenseType;
      }
      setDraft(base);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?.id]);

  const validate = (): string | null => {
    if (kind === 'time') {
      const mins = Number(draft.plannedMinutes ?? 0);
      if (!Number.isFinite(mins) || mins <= 0) {
        return t('planning.durationRequired', 'Planned duration must be greater than 0 minutes.');
      }
    }
    if (kind === 'expense') {
      const amt = Number(draft.plannedAmount ?? 0);
      if (!Number.isFinite(amt) || amt <= 0) {
        return t('planning.amountRequired', 'Amount must be greater than 0.');
      }
      if (!draft.expenseType) return t('planning.expenseType', 'Expense type');
    }
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      if (editing) {
        await plannedEntriesApi.update(editing.id, draft);
      } else {
        const pid = selectedParentId ?? parentIds[0];
        if (!pid) {
          toast.error(t('planning.noParent', 'Cannot plan without a linked job'));
          setSaving(false);
          return;
        }
        await plannedEntriesApi.create(parentType, pid, draft);
      }
      toast.success(t('planning.savedToast', 'Plan saved'));
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const title = editing
    ? t('planning.editEntry', 'Edit planned entry')
    : kind === 'time'
      ? t('planning.planTime', 'Plan Time')
      : t('planning.planExpense', 'Plan Expense');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {!editing && multiJob && (
            <div>
              <Label className="text-xs">{t('planning.jobLabel', 'Job')}</Label>
              <Select
                value={String(selectedParentId ?? parentIds[0] ?? '')}
                onValueChange={(v) => setSelectedParentId(Number(v))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {parentIds.map((id) => (
                    <SelectItem key={id} value={String(id)}>
                      {jobLabels?.[id] ?? `#${id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {kind === 'time' && (
            <>
              <div>
                <Label className="text-xs">{t('planning.plannedDate', 'Planned day')}</Label>
                <PlannedDateField
                  value={draft.plannedDate ?? null}
                  onChange={(v) => setDraft({ ...draft, plannedDate: v })}
                />
              </div>
              <div>
                <Label className="text-xs">{t('planning.technicianCount', 'Technicians')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={draft.technicianCount ?? 1}
                  onChange={(e) =>
                    setDraft({ ...draft, technicianCount: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">{t('planning.duration', 'Duration')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={Math.floor((draft.plannedMinutes ?? 0) / 60)}
                      onChange={(e) => {
                        const h = Math.max(0, parseInt(e.target.value) || 0);
                        const m = (draft.plannedMinutes ?? 0) % 60;
                        setDraft({ ...draft, plannedMinutes: h * 60 + m });
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{t('planning.hoursShort', 'h')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={(draft.plannedMinutes ?? 0) % 60}
                      onChange={(e) => {
                        const m = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                        const h = Math.floor((draft.plannedMinutes ?? 0) / 60);
                        setDraft({ ...draft, plannedMinutes: h * 60 + m });
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{t('planning.minutesShort', 'min')}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {kind === 'expense' && (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t('planning.expenseType', 'Expense type')}</Label>
                  <Link
                    to={`/dashboard/lookups?tab=expenseTypes&returnUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '')}`}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <Settings2 className="h-3 w-3" />
                    {t('planning.manageLookup', 'Manage')}
                  </Link>
                </div>
                <Select
                  value={draft.expenseType ?? expenseTypeOptions[0]?.value}
                  onValueChange={(v) => setDraft({ ...draft, expenseType: v as PlannedExpenseType })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {expenseTypeOptions.map((et) => (
                      <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{t('planning.amount', 'Amount')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={draft.plannedAmount ?? 0}
                  onChange={(e) =>
                    setDraft({ ...draft, plannedAmount: parseFloat(e.target.value) || 0, currency })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">{t('planning.plannedDate', 'Planned day')}</Label>
                <PlannedDateField
                  value={draft.plannedDate ?? null}
                  onChange={(v) => setDraft({ ...draft, plannedDate: v })}
                />
              </div>
            </>
          )}

          <div>
            <Label className="text-xs">{t('planning.description', 'Description (optional)')}</Label>
            <Textarea
              rows={2}
              value={draft.description ?? ''}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('save', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PlanEditorDialog;
