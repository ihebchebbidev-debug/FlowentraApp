import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, X, CheckCircle2, Send, Lock, Download } from "lucide-react";
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
  /** Optional bulk lifecycle actions. When provided, render the pill. */
  onApprove?: () => void;
  onSend?: () => void;
  onClose?: () => void;
  onExport?: () => void;
  /** Disable lifecycle actions while one of them is running. */
  busyAction?: "approve" | "send" | "close" | "export" | "delete" | null;
}

export function BulkActionBar({
  selectedCount,
  allSelected,
  someSelected,
  onToggleAll,
  onClear,
  onDelete,
  onApprove,
  onSend,
  onClose,
  onExport,
  busyAction,
}: BulkActionBarProps) {
  const { t } = useTranslation('purchases');
  const guard = useMutationActionGuard();
  const isBlocked = guard.disabled;
  if (selectedCount === 0) return null;
  const anyBusy = !!busyAction;

  return (
    <div className="sticky top-0 z-30 bg-primary/5 border border-primary/20 rounded-md p-2.5 flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center gap-3 mr-auto">
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

      {/* Lifecycle actions — only render the ones the parent wires up */}
      {onApprove && (
        <Button variant="outline" size="sm" onClick={onApprove} disabled={anyBusy || isBlocked} className="h-7">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
          {busyAction === 'approve' ? t('bulk.approving', 'Approving…') : t('bulk.approveSelected', 'Approve')}
        </Button>
      )}
      {onSend && (
        <Button variant="outline" size="sm" onClick={onSend} disabled={anyBusy || isBlocked} className="h-7">
          <Send className="h-3.5 w-3.5 mr-1 text-purple-600" />
          {busyAction === 'send' ? t('bulk.sending', 'Sending…') : t('bulk.sendSelected', 'Send to supplier')}
        </Button>
      )}
      {onClose && (
        <Button variant="outline" size="sm" onClick={onClose} disabled={anyBusy || isBlocked} className="h-7">
          <Lock className="h-3.5 w-3.5 mr-1 text-slate-600" />
          {busyAction === 'close' ? t('bulk.closing', 'Closing…') : t('bulk.closeSelected', 'Close')}
        </Button>
      )}
      {onExport && (
        <Button variant="outline" size="sm" onClick={onExport} disabled={anyBusy} className="h-7">
          <Download className="h-3.5 w-3.5 mr-1" />
          {t('bulk.exportSelected', 'Export')}
        </Button>
      )}

      {isBlocked ? (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="inline-flex">
                <Button variant="destructive" size="sm" disabled aria-disabled className="h-7"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> {t('bulk.deleteSelected', 'Delete')}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-center">{guard.reason}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Button variant="destructive" size="sm" onClick={onDelete} disabled={anyBusy} className="h-7">
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          {busyAction === 'delete' ? t('bulk.deleting', 'Deleting…') : t('bulk.deleteSelected', 'Delete')}
        </Button>
      )}
    </div>
  );
}
