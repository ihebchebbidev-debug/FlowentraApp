import { useEffect, useMemo, useRef, useState } from 'react';
import { useSubmitGuard } from '@/shared/hooks/useSubmitGuard';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Clock, Wallet, Package, Plus, Pencil, Trash2, Users, Search, Loader2, ExternalLink, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import {
  plannedEntriesApi,
  formatPlannedMinutes,
  type CreatePlannedLineEntry,
  type PlannedEntryKind,
  type PlannedExpenseType,
  type PlannedLineEntry,
  type PlannedParentType,
} from '@/services/plannedEntriesService';
import { usePlannedEntries } from './usePlannedEntries';
import { articlesApi } from '@/services/api/articlesApi';
import type { Article } from '@/types/articles';
import { useExpenseTypes } from '@/modules/lookups/hooks/useLookups';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { PlannedDateField } from './PlannedDateField';
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

/**
 * Inline "Planned" section that appears at the top of the Time / Expenses /
 * Materials tabs on a Service Order or Dispatch. Renders planned rows visually
 * merged with the actual list style but tagged with a "Planned" badge, and
 * exposes an "Add" button that opens a small editor for the chosen kind.
 *
 * Parent context: `parentType` is 'service_order_job' and `parentIds` are the
 * ids of the jobs currently shown. When users add a planned row they pick
 * which job it belongs to (only when there is more than one).
 */
interface Props {
  parentType: PlannedParentType;
  parentIds: Array<number | string | null | undefined>;
  jobLabels?: Record<number, string>;
  kind: PlannedEntryKind;
  currency?: string;
  readOnly?: boolean;
  /**
   * When true, the whole section is not rendered if there are no planned
   * entries of this kind. Used in Dispatches, where users shouldn't see
   * an empty "Planned" section (planning happens on the job/service order).
   */
  hideWhenEmpty?: boolean;
  /**
   * Optional per-entry drilldown resolver. When it returns a value, a small
   * "open source" icon is rendered on the row that navigates to `to`. Used
   * from Dispatches to jump back to the originating Service Order job, and
   * from Service Orders to jump back to the source Offer/Sale item.
   */
  getEntryLink?: (entry: PlannedLineEntry) => { to: string; label?: string } | null;
  /**
   * Notify consumers of planned-entry mutations so they can write an audit
   * note on the surrounding entity (Offer/Sale/Service Order/Dispatch).
   * Called AFTER the API call succeeds. Errors are swallowed so a failing
   * note write never blocks the primary save.
   */
  onChanged?: (evt: {
    action: 'create' | 'update' | 'delete';
    entry: PlannedLineEntry;
  }) => void | Promise<void>;
}

const EXPENSE_TYPES: PlannedExpenseType[] = ['travel', 'per_diem', 'materials', 'subcontractor'];

export function PlannedInlineList({
  parentType,
  parentIds,
  jobLabels,
  kind,
  currency,
  readOnly = false,
  hideWhenEmpty = false,
  getEntryLink,
  onChanged,
}: Props) {
  const { t } = useTranslation();
  const { current: currencyInfo } = useCurrency();
  const effectiveCurrency = currency ?? currencyInfo.code;
  const { items: expenseTypeLookups } = useExpenseTypes();
  const expenseTypeOptions = useMemo(() => {
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
  const { entries, reload } = usePlannedEntries(parentType, parentIds);
  const saveGuard = useSubmitGuard();
  const removeGuard = useSubmitGuard();
  const removeAllGuard = useSubmitGuard();

  const normalizedIds = parentIds
    .map((v) => (v == null ? NaN : Number(v)))
    .filter((n) => Number.isFinite(n) && n > 0) as number[];

  const filtered = entries.filter((e) => e.kind === kind);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PlannedLineEntry | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(
    normalizedIds[0] ?? null
  );
  const [draft, setDraft] = useState<CreatePlannedLineEntry>(defaultDraft(kind, effectiveCurrency));
  const [deleteTarget, setDeleteTarget] = useState<PlannedLineEntry | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  if (hideWhenEmpty && filtered.length === 0) return null;

  const openAdd = () => {
    setEditing(null);
    setSelectedParentId(normalizedIds[0] ?? null);
    const base = defaultDraft(kind, effectiveCurrency);
    if (kind === 'expense' && expenseTypeOptions.length > 0) {
      base.expenseType = expenseTypeOptions[0].value as PlannedExpenseType;
    }
    setDraft(base);
    setEditorOpen(true);
  };

  const openEdit = (entry: PlannedLineEntry) => {
    setEditing(entry);
    setSelectedParentId(entry.parentId);
    setDraft({
      kind: entry.kind,
      plannedMinutes: entry.plannedMinutes ?? undefined,
      technicianCount: entry.technicianCount ?? undefined,
      plannedDate: entry.plannedDate ?? undefined,
      expenseType: entry.expenseType ?? undefined,
      plannedAmount: entry.plannedAmount ?? undefined,
      currency: entry.currency ?? effectiveCurrency,
      description: entry.description ?? undefined,
      articleId: entry.articleId ?? undefined,
      articleName: entry.articleName ?? undefined,
      quantity: entry.quantity ?? undefined,
      unitPrice: entry.unitPrice ?? undefined,
      unit: entry.unit ?? undefined,
    });
    setEditorOpen(true);
  };

  const validateDraft = (): string | null => {
    if (draft.kind === 'time') {
      const mins = Number(draft.plannedMinutes ?? 0);
      if (!Number.isFinite(mins) || mins <= 0) {
        return t('planning.durationRequired', 'Planned duration must be greater than 0 minutes.');
      }
    }
    if (draft.kind === 'expense') {
      const amt = Number(draft.plannedAmount ?? 0);
      if (!Number.isFinite(amt) || amt <= 0) {
        return t('planning.amountRequired', 'Amount must be greater than 0.');
      }
      if (!draft.expenseType) {
        return t('planning.expenseType', 'Expense type');
      }
    }
    if (draft.kind === 'material') {
      if (!draft.articleName || !draft.articleName.trim()) {
        return t('planning.materialNameRequired', 'Please pick or enter an article name.');
      }
      const qty = Number(draft.quantity ?? 0);
      if (!Number.isFinite(qty) || qty <= 0) {
        return t('planning.quantityRequired', 'Quantity must be greater than 0.');
      }
    }
    return null;
  };

  const fireChanged = async (
    action: 'create' | 'update' | 'delete',
    entry: PlannedLineEntry,
  ) => {
    if (!onChanged) return;
    try {
      await onChanged({ action, entry });
    } catch (e) {
      // Audit-note failures must never break the primary planning action.
      console.warn('[PlannedInlineList] onChanged callback failed:', e);
    }
  };

  const save = saveGuard.guard(async () => {
    const err = validateDraft();
    if (err) { toast.error(err); return; }
    try {
      let saved: PlannedLineEntry;
      let action: 'create' | 'update';
      if (editing) {
        saved = await plannedEntriesApi.update(editing.id, draft);
        action = 'update';
      } else {
        const pid = selectedParentId ?? normalizedIds[0];
        if (!pid) {
          toast.error(t('planning.noParent', 'Cannot plan without a linked job'));
          return;
        }
        saved = await plannedEntriesApi.create(parentType, pid, draft);
        action = 'create';
      }
      toast.success(t('planning.savedToast', 'Plan saved'));
      setEditorOpen(false);
      await reload();
      void fireChanged(action, saved);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save');
    }
  });

  const confirmRemove = removeGuard.guard(async () => {
    if (!deleteTarget) return;
    const removed = deleteTarget;
    try {
      await plannedEntriesApi.remove(removed.id);
      toast.success(t('planning.deletedToast', 'Planned entry deleted'));
      setDeleteTarget(null);
      await reload();
      void fireChanged('delete', removed);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete');
    }
  });

  const confirmRemoveAll = removeAllGuard.guard(async () => {
    const snapshot = filtered.slice();
    try {
      await Promise.all(snapshot.map((e) => plannedEntriesApi.remove(e.id)));
      toast.success(t('planning.deletedAllToast', 'All planned entries deleted'));
      setDeleteAllOpen(false);
      await reload();
      // Emit one delete event per entry so consumers can bulk-audit.
      for (const e of snapshot) void fireChanged('delete', e);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete');
    }
  });


  const kindMeta = getKindMeta(kind, t);
  const canAdd = !readOnly && normalizedIds.length > 0;
  const multiJob = normalizedIds.length > 1;

  return (
    <div className="rounded-lg border bg-muted/20">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <kindMeta.Icon className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">
            {kindMeta.sectionLabel}
          </h4>
          {filtered.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {filtered.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!readOnly && filtered.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-destructive hover:text-destructive"
              onClick={() => setDeleteAllOpen(true)}
            >
              <Trash2 className="h-3 w-3" />
              {t('planning.deleteAll', 'Delete all')}
            </Button>
          )}
          {canAdd && (
            <Button size="sm" variant="outline" className="h-7 gap-1" onClick={openAdd}>
              <Plus className="h-3 w-3" />
              {kindMeta.addLabel}
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="px-3 py-3 text-xs italic text-muted-foreground">
          {kindMeta.emptyLabel}
        </p>
      ) : (
        <ul className="divide-y">
          {filtered.map((e) => (
            <li
              key={`planned-${e.id}`}
              className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  {t('planning.plannedBadge', 'Planned')}
                </Badge>
                {renderRow(e, effectiveCurrency, t)}
                {multiJob && jobLabels?.[e.parentId] && (
                  <Badge variant="outline" className="text-[10px]">
                    📋 {jobLabels[e.parentId]}
                  </Badge>
                )}
                {e.originOfferItemId && parentType !== 'offer_item' && (
                  <Badge
                    variant="outline"
                    className="border-sky-300 bg-sky-50 text-[10px] text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
                    title={t('planning.originOfferTooltip', 'Inherited from the source offer item')}
                  >
                    {t('planning.fromOffer', 'from Offer')}
                  </Badge>
                )}
                {parentType === 'service_order_job' && !e.originOfferItemId && (
                  <Badge
                    variant="outline"
                    className="border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    title={t('planning.originJobTooltip', 'Added directly on this service order job')}
                  >
                    {t('planning.onJob', 'on Job')}
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                {(() => {
                  const link = getEntryLink?.(e);
                  if (!link) return null;
                  return (
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      title={link.label ?? t('planning.openSource', 'Open source')}
                    >
                      <Link to={link.to} aria-label={link.label ?? t('planning.openSource', 'Open source')}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  );
                })()}
                {!readOnly && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => openEdit(e)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive"
                      onClick={() => setDeleteTarget(e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('planning.editEntry', 'Edit planned entry') : kindMeta.addLabel}
            </DialogTitle>
          </DialogHeader>

          {!editing && multiJob && (
            <div>
              <Label className="text-xs">{t('planning.jobLabel', 'Job')}</Label>
              <Select
                value={String(selectedParentId ?? normalizedIds[0] ?? '')}
                onValueChange={(v) => setSelectedParentId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {normalizedIds.map((id) => (
                    <SelectItem key={id} value={String(id)}>
                      {jobLabels?.[id] ?? `#${id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {kind === 'time' && (
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
                <Input
                  type="number"
                  min={1}
                  value={draft.technicianCount ?? 1}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      technicianCount: Math.max(1, parseInt(e.target.value) || 1),
                    })
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
            </div>
          )}

          {kind === 'expense' && (
            <div className="space-y-3">
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
                      <SelectItem key={et.value} value={et.value}>
                        {et.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">
                  {t('planning.amount', 'Amount')}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={draft.plannedAmount ?? 0}
                  onChange={(e) =>
                    setDraft({ ...draft, plannedAmount: parseFloat(e.target.value) || 0, currency: effectiveCurrency })
                  }
                />
              </div>
            </div>
          )}

          {kind === 'material' && (
            <div className="space-y-3">
              <ArticleSearchPicker
                onSelect={(article) =>
                  setDraft((prev) => ({
                    ...prev,
                    articleId: Number(article.id) || null,
                    articleName: article.name,
                    unit: article.unit ?? prev.unit ?? '',
                    unitPrice:
                      article.sellPrice ?? article.costPrice ?? prev.unitPrice ?? 0,
                  }))
                }
              />
              <div>
                <Label className="text-xs">{t('planning.materialName', 'Material / article name')}</Label>
                <Input
                  value={draft.articleName ?? ''}
                  onChange={(e) => setDraft({ ...draft, articleName: e.target.value })}
                  placeholder={t('planning.materialNamePh', 'e.g. Solar panel 450W')}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">{t('planning.quantity', 'Quantity')}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={draft.quantity ?? 0}
                    onChange={(e) =>
                      setDraft({ ...draft, quantity: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">{t('planning.unit', 'Unit')}</Label>
                  <Input
                    value={draft.unit ?? ''}
                    maxLength={20}
                    onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                    placeholder="pcs"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t('planning.unitPrice', 'Unit price')}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={draft.unitPrice ?? 0}
                    onChange={(e) =>
                      setDraft({ ...draft, unitPrice: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs">{t('planning.description', 'Description (optional)')}</Label>
            <Textarea
              rows={2}
              value={draft.description ?? ''}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={saveGuard.pending}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button onClick={save} disabled={saveGuard.pending}>
              {saveGuard.pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('planning.confirmDeleteTitle', 'Delete planned entry?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('planning.confirmDelete', 'Delete this planned entry?')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeGuard.pending}>{t('cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void confirmRemove(); }}
              disabled={removeGuard.pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeGuard.pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('planning.confirmDeleteAllTitle', 'Delete all planned entries?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('planning.confirmDeleteAll', 'This will remove all {{count}} planned entries in this section.', { count: filtered.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeAllGuard.pending}>{t('cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void confirmRemoveAll(); }}
              disabled={removeAllGuard.pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeAllGuard.pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('planning.deleteAll', 'Delete all')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function defaultDraft(kind: PlannedEntryKind, currency: string): CreatePlannedLineEntry {
  if (kind === 'time') return { kind, technicianCount: 1, plannedMinutes: 60 };
  if (kind === 'expense') return { kind, expenseType: 'travel', plannedAmount: 0, currency };
  return { kind: 'material', quantity: 1, unitPrice: 0, articleName: '' };
}

function getKindMeta(kind: PlannedEntryKind, t: (k: string, d?: any) => string) {
  if (kind === 'time') {
    return {
      Icon: Clock,
      sectionLabel: t('planning.plannedTimeSection', 'Planned time'),
      addLabel: t('planning.planTime', 'Plan Time'),
      emptyLabel: t('planning.noTime', 'No planned time'),
    };
  }
  if (kind === 'expense') {
    return {
      Icon: Wallet,
      sectionLabel: t('planning.plannedExpensesSection', 'Planned expenses'),
      addLabel: t('planning.planExpense', 'Plan Expense'),
      emptyLabel: t('planning.noExpenses', 'No planned expenses'),
    };
  }
  return {
    Icon: Package,
    sectionLabel: t('planning.plannedMaterialsSection', 'Planned materials'),
    addLabel: t('planning.planMaterial', 'Plan Material'),
    emptyLabel: t('planning.noMaterials', 'No planned materials'),
  };
}

function renderRow(
  e: PlannedLineEntry,
  currency: string,
  t: (k: string, d?: any) => string
) {
  if (e.kind === 'time') {
    return (
      <span className="flex min-w-0 items-center gap-2">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium">
          {e.technicianCount ?? 1} × {formatPlannedMinutes(e.plannedMinutes ?? 0)}
        </span>
        {e.plannedDate && (
          <Badge variant="outline" className="text-[10px]">
            {new Date(e.plannedDate).toLocaleDateString()}
          </Badge>
        )}
        {e.description && (
          <span className="truncate text-xs text-muted-foreground">— {e.description}</span>
        )}
      </span>
    );
  }
  if (e.kind === 'expense') {
    return (
      <span className="flex min-w-0 items-center gap-2">
        <Badge variant="outline" className="text-[10px]">
          {t(`planning.expenseTypes.${e.expenseType}`, e.expenseType ?? '')}
        </Badge>
        <span className="font-medium">
          {(e.plannedAmount ?? 0).toFixed(2)} {e.currency ?? currency}
        </span>
        {e.description && (
          <span className="truncate text-xs text-muted-foreground">— {e.description}</span>
        )}
      </span>
    );
  }
  // material
  const total = (e.quantity ?? 0) * (e.unitPrice ?? 0);
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="font-medium truncate">{e.articleName ?? `Article #${e.articleId ?? ''}`}</span>
      <span className="text-xs text-muted-foreground">
        {e.quantity ?? 0}{e.unit ? ` ${e.unit}` : ''} × {(e.unitPrice ?? 0).toFixed(2)} = {total.toFixed(2)} {currency}
      </span>
      {e.description && (
        <span className="truncate text-xs text-muted-foreground">— {e.description}</span>
      )}
    </span>
  );
}

export default PlannedInlineList;

/**
 * Global article search used inside the Planned Material dialog. Debounced
 * server-side search over articlesApi so users can pick materials by name /
 * SKU / category and have the article id, unit and unit price pre-filled.
 */
function ArticleSearchPicker({ onSelect }: { onSelect: (a: Article) => void }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Article | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await articlesApi.getAll({ search: q, limit: 15, page: 1 });
        setResults((res?.data ?? []) as Article[]);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const choose = (a: Article) => {
    setPicked(a);
    setQuery('');
    setResults([]);
    setOpen(false);
    onSelect(a);
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs">
        {t('planning.searchArticle', 'Search article (global)')}
      </Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={t('planning.searchArticlePh', 'Name, SKU, category…')}
          className="pl-7"
        />
        {loading && (
          <Loader2 className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}

        {open && results.length > 0 && (
          <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
            {results.map((a) => (
              <button
                key={String(a.id)}
                type="button"
                onClick={() => choose(a)}
                className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <span className="font-medium">{a.name}</span>
                <span className="text-xs text-muted-foreground">
                  {a.sku ? `SKU ${a.sku} · ` : ''}
                  {a.category ?? ''}
                  {a.unit ? ` · ${a.unit}` : ''}
                  {typeof a.sellPrice === 'number'
                    ? ` · ${a.sellPrice.toFixed(2)}`
                    : typeof a.costPrice === 'number'
                      ? ` · ${a.costPrice.toFixed(2)}`
                      : ''}
                </span>
              </button>
            ))}
          </div>
        )}

        {open && !loading && query.trim().length >= 2 && results.length === 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover px-3 py-2 text-xs text-muted-foreground shadow-md">
            {t('planning.noArticles', 'No articles match your search.')}
          </div>
        )}
      </div>

      {picked && (
        <p className="text-[11px] text-muted-foreground">
          {t('planning.pickedArticle', 'Selected')}: <span className="font-medium">{picked.name}</span>
          {picked.sku ? ` (${picked.sku})` : ''}
        </p>
      )}
    </div>
  );
}