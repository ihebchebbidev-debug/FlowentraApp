import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMutationActionGuard } from "@/hooks/useCreateActionGuard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BulkActionBarProps {
  selectedCount: number;
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: (checked: boolean) => void;
  onClear: () => void;
  onDelete: () => void;
}

export function BulkActionBar({
  selectedCount,
  allSelected,
  someSelected,
  onToggleAll,
  onClear,
  onDelete,
}: BulkActionBarProps) {
  const { t } = useTranslation('purchases');
  const guard = useMutationActionGuard();
  const isBlocked = guard.disabled;
  if (selectedCount === 0) return null;
  return (
    <div className="sticky top-0 z-30 bg-destructive/10 border border-destructive/20 rounded-md p-2.5 flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={(c) => onToggleAll(!!c)}
          aria-label="Select all"
        />
        <span className="text-sm font-medium">
          {t('bulk.selectedCount', '{{count}} selected', { count: selectedCount })}
        </span>
        <Button variant="ghost" size="sm" onClick={onClear} className="h-7 text-muted-foreground">
          <X className="h-3.5 w-3.5 mr-1" /> {t('bulk.deselectAll', 'Clear')}
        </Button>
      </div>
      {isBlocked ? (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="inline-flex">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled
                  aria-disabled
                  className="h-7"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> {t('bulk.deleteSelected', 'Delete selected')}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-center">
              {guard.reason}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Button variant="destructive" size="sm" onClick={onDelete} className="h-7">
          <Trash2 className="h-3.5 w-3.5 mr-1" /> {t('bulk.deleteSelected', 'Delete selected')}
        </Button>
      )}
    </div>
  );
}
