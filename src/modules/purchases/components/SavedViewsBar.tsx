import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Star, X, Plus, Bookmark, Zap,
} from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

export interface SavedViewFilters {
  search?: string;
  statusFilter?: string;
  paymentFilter?: string;
  selectedStat?: string;
  /** Optional smart-filter id (see SMART_FILTERS below). */
  smart?: string | null;
}

export interface SavedView {
  id: string;
  name: string;
  filters: SavedViewFilters;
}

export interface SmartFilter {
  id: string;
  /** Translation key under purchases.smartFilters.<id> */
  i18nKey: string;
  /** Default English label, used as fallback. */
  defaultLabel: string;
  filters: SavedViewFilters;
}

/**
 * Built-in smart filters — one click answers the "what needs my attention?"
 * question without typing or remembering filter combinations.
 */
export const SMART_FILTERS: SmartFilter[] = [
  {
    id: "awaiting-receipt",
    i18nKey: "awaitingReceipt",
    defaultLabel: "Awaiting receipt > 7 days",
    // Status kept at "all" so both `ordered` and `partially_received` are fetched;
    // the >7-days age cut is applied client-side via the `smart` predicate.
    filters: { statusFilter: "all", selectedStat: "all", smart: "awaiting-receipt" },
  },
  {
    id: "unpaid-overdue",
    i18nKey: "unpaidOverdue",
    defaultLabel: "Unpaid past due",
    // Payment kept at "all"; the `smart` predicate keeps everything not fully paid
    // (both `pending` and `partial`), which the label intends.
    filters: { paymentFilter: "all", selectedStat: "all", smart: "unpaid-overdue" },
  },
  {
    id: "drafts",
    i18nKey: "myDrafts",
    defaultLabel: "Drafts",
    filters: { statusFilter: "draft", selectedStat: "all", smart: "drafts" },
  },
  {
    id: "partially-received",
    i18nKey: "partiallyReceived",
    defaultLabel: "Partially received",
    filters: { statusFilter: "partially_received", selectedStat: "all", smart: "partially-received" },
  },
  {
    id: "high-value",
    i18nKey: "highValue",
    defaultLabel: "High value (top 10%)",
    filters: { selectedStat: "value", smart: "high-value" },
  },
];

interface SavedViewsBarProps {
  storageKey: string;
  currentFilters: SavedViewFilters;
  activeSmartFilter: string | null;
  onApply: (filters: SavedViewFilters) => void;
}

/**
 * Pill-style row of saved views + smart filters. Saved views persist per-user
 * in localStorage (no backend table needed for the v1) and survive reloads.
 * Smart filters are built-in shortcuts described in SMART_FILTERS above.
 */
export function SavedViewsBar({
  storageKey,
  currentFilters,
  activeSmartFilter,
  onApply,
}: SavedViewsBarProps) {
  const { t } = useTranslation("purchases");
  const [views, setViews] = useState<SavedView[]>([]);
  const [savePopoverOpen, setSavePopoverOpen] = useState(false);
  const [newName, setNewName] = useState("");

  // Load on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setViews(JSON.parse(raw));
    } catch {
      /* corrupt JSON — ignore, will be overwritten on next save */
    }
  }, [storageKey]);

  const persist = (next: SavedView[]) => {
    setViews(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* quota or private mode — best-effort */
    }
  };

  const handleSave = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const next: SavedView = {
      id: `v-${Date.now()}`,
      name: trimmed,
      filters: { ...currentFilters },
    };
    persist([...views, next]);
    setNewName("");
    setSavePopoverOpen(false);
    toast.success(t("savedViews.saved", "View saved"));
  };

  const handleDelete = (id: string) => {
    persist(views.filter((v) => v.id !== id));
    toast.success(t("savedViews.removed", "View removed"));
  };

  // Detect if current filters match any saved view (mark it as active).
  const activeSavedViewId = useMemo(() => {
    return (
      views.find((v) => {
        const f = v.filters;
        return (
          (f.search || "") === (currentFilters.search || "") &&
          (f.statusFilter || "all") === (currentFilters.statusFilter || "all") &&
          (f.paymentFilter || "all") === (currentFilters.paymentFilter || "all") &&
          (f.selectedStat || "all") === (currentFilters.selectedStat || "all")
        );
      })?.id || null
    );
  }, [views, currentFilters]);

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-3 sm:px-4 py-2 border-y border-border/60 bg-muted/20">
      <div className="flex items-center gap-1.5 text-px-11 text-muted-foreground font-medium pe-1">
        <Zap className="h-3 w-3" />
        {t("savedViews.smartFilters", "Smart filters")}
      </div>
      {SMART_FILTERS.map((sf) => {
        const active = activeSmartFilter === sf.id;
        return (
          <button
            key={sf.id}
            onClick={() => onApply(sf.filters)}
            className={`h-6 px-2 rounded-full text-px-11 font-medium transition-colors border ${
              active
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card border-border text-foreground hover:bg-muted"
            }`}
          >
            {t(`smartFilters.${sf.i18nKey}`, sf.defaultLabel)}
          </button>
        );
      })}

      {views.length > 0 && (
        <div className="h-4 w-px bg-border mx-1" aria-hidden />
      )}

      <div className="flex items-center gap-1.5 text-px-11 text-muted-foreground font-medium pe-1">
        <Bookmark className="h-3 w-3" />
        {t("savedViews.title", "Saved views")}
      </div>
      {views.length === 0 && (
        <span className="text-px-11 text-muted-foreground italic">
          {t("savedViews.empty", "None yet — save your current filters")}
        </span>
      )}
      {views.map((v) => {
        const active = activeSavedViewId === v.id;
        return (
          <span
            key={v.id}
            className={`group inline-flex items-center gap-1 h-6 ps-2 pe-1 rounded-full text-px-11 font-medium border transition-colors ${
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-foreground hover:bg-muted"
            }`}
          >
            <button
              onClick={() => onApply(v.filters)}
              className="inline-flex items-center gap-1"
            >
              {active && <Star className="h-2.5 w-2.5 fill-current" />}
              {v.name}
            </button>
            <button
              onClick={() => handleDelete(v.id)}
              className="opacity-50 hover:opacity-100 hover:bg-background/30 rounded-full p-0.5"
              aria-label={t("savedViews.delete", "Delete view")}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        );
      })}

      <Popover open={savePopoverOpen} onOpenChange={setSavePopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-px-11 gap-1 ms-auto"
          >
            <Plus className="h-3 w-3" />
            {t("savedViews.save", "Save view")}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-3">
          <div className="space-y-2">
            <p className="text-xs font-medium">
              {t("savedViews.namePrompt", "Name this view")}
            </p>
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("savedViews.placeholder", "e.g. Awaiting GR — Acme")}
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
            <div className="flex items-center justify-between gap-1">
              <span className="text-px-10 text-muted-foreground">
                {t("savedViews.savesCurrentFilters", "Saves the current filters")}
              </span>
              <Button size="sm" className="h-6 text-px-11" onClick={handleSave}>
                {t("savedViews.save", "Save")}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
