import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Wallet, Package, Plus, Pencil, Trash2, Users, Search, Loader2 } from 'lucide-react';
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
}

const EXPENSE_TYPES: PlannedExpenseType[] = ['travel', 'per_diem', 'materials', 'subcontractor'];

export function PlannedInlineList({
  parentType,
  parentIds,
  jobLabels,
  kind,
  currency = 'TND',
  readOnly = false,
}: Props) {
  const { t } = useTranslation();
  const { entries, reload } = usePlannedEntries(parentType, parentIds);

  const normalizedIds = parentIds
    .map((v) => (v == null ? NaN : Number(v)))
    .filter((n) => Number.isFinite(n) && n > 0) as number[];

  const filtered = entries.filter((e) => e.kind === kind);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PlannedLineEntry | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(
    normalizedIds[0] ?? null
  );
  const [draft, setDraft] = useState<CreatePlannedLineEntry>(defaultDraft(kind, currency));

  const openAdd = () => {
    setEditing(null);
    setSelectedParentId(normalizedIds[0] ?? null);
    setDraft(defaultDraft(kind, currency));
    setEditorOpen(true);
  };

  const openEdit = (entry: PlannedLineEntry) => {
    setEditing(entry);
    setSelectedParentId(entry.parentId);
    setDraft({
      kind: entry.kind,
      plannedMinutes: entry.plannedMinutes ?? undefined,
      technicianCount: entry.technicianCount ?? undefined,
      hourlyRate: entry.hourlyRate ?? undefined,
      expenseType: entry.expenseType ?? undefined,
      plannedAmount: entry.plannedAmount ?? undefined,
      currency: entry.currency ?? currency,
      description: entry.description ?? undefined,
      articleId: entry.articleId ?? undefined,
      articleName: entry.articleName ?? undefined,
      quantity: entry.quantity ?? undefined,
      unitPrice: entry.unitPrice ?? undefined,
      unit: entry.unit ?? undefined,
    });
    setEditorOpen(true);
  };

  const save = async () => {
    try {
      if (editing) {
        await plannedEntriesApi.update(editing.id, draft);
      } else {
        const pid = selectedParentId ?? normalizedIds[0];
        if (!pid) {
          toast.error(t('planning.noParent', 'Cannot plan without a linked job'));
          return;
        }
        await plannedEntriesApi.create(parentType, pid, draft);
      }
      toast.success(t('planning.savedToast', 'Plan saved'));
      setEditorOpen(false);
      await reload();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save');
    }
  };

  const remove = async (entry: PlannedLineEntry) => {
    if (!confirm(t('planning.confirmDelete', 'Delete this planned entry?'))) return;
    try {
      await plannedEntriesApi.remove(entry.id);
      await reload();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete');
    }
  };

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
        {canAdd && (
          <Button size="sm" variant="outline" className="h-7 gap-1" onClick={openAdd}>
            <Plus className="h-3 w-3" />
            {kindMeta.addLabel}
          </Button>
        )}
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
                {renderRow(e, currency, t)}
                {multiJob && jobLabels?.[e.parentId] && (
                  <Badge variant="outline" className="text-[10px]">
                    📋 {jobLabels[e.parentId]}
                  </Badge>
                )}
              </div>
              {!readOnly && (
                <div className="flex gap-1">
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
                    onClick={() => remove(e)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
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
              <div className="grid grid-cols-2 gap-2">
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
                  <Label className="text-xs">{t('planning.durationMinutes', 'Duration (min)')}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={draft.plannedMinutes ?? 0}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        plannedMinutes: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">{t('planning.hourlyRate', 'Hourly rate (optional)')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={draft.hourlyRate ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      hourlyRate: e.target.value === '' ? null : parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          )}

          {kind === 'expense' && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">{t('planning.expenseType', 'Expense type')}</Label>
                <Select
                  value={draft.expenseType ?? 'travel'}
                  onValueChange={(v) => setDraft({ ...draft, expenseType: v as PlannedExpenseType })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_TYPES.map((et) => (
                      <SelectItem key={et} value={et}>
                        {t(`planning.expenseTypes.${et}`, et)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">{t('planning.amount', 'Amount')}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={draft.plannedAmount ?? 0}
                    onChange={(e) =>
                      setDraft({ ...draft, plannedAmount: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">{t('planning.currency', 'Currency')}</Label>
                  <Input
                    value={draft.currency ?? currency}
                    maxLength={3}
                    onChange={(e) =>
                      setDraft({ ...draft, currency: e.target.value.toUpperCase() })
                    }
                  />
                </div>
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
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button onClick={save}>{t('save', 'Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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