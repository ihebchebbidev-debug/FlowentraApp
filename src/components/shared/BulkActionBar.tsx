import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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
  totalCount: number;
  onSelectAll: (checked: boolean) => void;
  onDeselectAll: () => void;
  onDelete: () => void;
  allSelected?: boolean;
  entityName?: string;
}

/**
 * Styled bulk action bar that appears when items are selected.
 * Matches the dispatcher bulk action bar style with red/destructive theme.
 */
export function BulkActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onDelete,
  allSelected = false,
  entityName = "item"
}: BulkActionBarProps) {
  const { t } = useTranslation();
  const guard = useMutationActionGuard();
  const isBlocked = guard.disabled;

  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-30 bg-destructive/10 border-b border-destructive/20 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
          />
          <span className="text-sm font-medium text-foreground">
            {t('bulk.selectedCount', '{{count}} {{entity}}(s) selected', { count: selectedCount, entity: entityName })}
          </span>
          <Button variant="ghost" size="sm" onClick={onDeselectAll} className="text-muted-foreground">
            {t('bulk.deselectAll', 'Deselect All')}
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
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('bulk.deleteSelected', 'Delete Selected')}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-center">
                {guard.reason}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('bulk.deleteSelected', 'Delete Selected')}
          </Button>
        )}
      </div>
    </div>
  );
}

export default BulkActionBar;
