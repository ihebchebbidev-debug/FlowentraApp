import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CalendarRange, Undo2 } from "lucide-react";
import { prefetchDispatcherOnHover } from "@/shared/prefetch";
import { DispatcherService } from "../services/dispatcher.service";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DispatcherHeaderProps {
  onDispatchJobs: () => void;
  hasCreateAccess?: boolean;
}

export function DispatcherHeader({ onDispatchJobs, hasCreateAccess = true }: DispatcherHeaderProps) {
  const { t } = useTranslation();
  const [undoing, setUndoing] = useState(false);
  const [undoVersion, setUndoVersion] = useState(0);

  const hasUndo = !!DispatcherService.getLastUndoAction();

  const handleUndo = async () => {
    const lastAction = DispatcherService.getLastUndoAction();
    if (!lastAction) {
      toast.info(t('dispatcher.nothing_to_undo'));
      return;
    }

    setUndoing(true);
    try {
      const success = await DispatcherService.undoLastAction();
      if (success) {
        toast.success(t('dispatcher.undo_success', { description: lastAction.description }));
      } else {
        toast.error(t('dispatcher.undo_failed'));
      }
    } catch {
      toast.error(t('dispatcher.undo_failed'));
    } finally {
      setUndoing(false);
      setUndoVersion(v => v + 1);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <CalendarRange className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('dispatcher.title')}</h1>
          <p className="text-[11px] text-muted-foreground">{t('dispatcher.description')}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleUndo}
              disabled={undoing || !hasUndo}
              className="text-muted-foreground hover:text-foreground"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('dispatcher.undo')}</TooltipContent>
        </Tooltip>

        {hasCreateAccess && (
          <Button 
            className="hidden sm:flex"
            onClick={onDispatchJobs}
            onMouseEnter={prefetchDispatcherOnHover}
            onFocus={prefetchDispatcherOnHover}
          >
            <CalendarRange className="mr-2 h-4 w-4" />
            {t('dispatcher.dispatch_jobs')}
          </Button>
        )}
      </div>
    </div>
  );
}
