import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Job } from "../types";

interface OverlapConfirmDialogProps {
  open: boolean;
  overlappingJobs: Job[];
  proposedStart: Date;
  proposedEnd: Date;
  suggestedShiftTo?: Date | null;
  onForce: () => void;
  onAutoShift: () => void;
  onCancel: () => void;
}

export function OverlapConfirmDialog({
  open,
  overlappingJobs,
  proposedStart,
  proposedEnd,
  suggestedShiftTo,
  onForce,
  onAutoShift,
  onCancel,
}: OverlapConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            {t('dispatcher.overlap_detected')}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                {t('dispatcher.overlap_slot', {
                  start: format(proposedStart, "HH:mm"),
                  end: format(proposedEnd, "HH:mm"),
                  count: overlappingJobs.length,
                })}
              </p>
              <ul className="text-sm list-disc pl-5 space-y-1 max-h-32 overflow-y-auto">
                {overlappingJobs.slice(0, 5).map((j) => (
                  <li key={j.id}>
                    <span className="font-medium">{j.title || t('dispatcher.job_number', { id: j.id })}</span>
                    {j.scheduledStart && j.scheduledEnd && (
                      <span className="text-muted-foreground">
                        {" "}— {format(new Date(j.scheduledStart), "HH:mm")}–
                        {format(new Date(j.scheduledEnd), "HH:mm")}
                      </span>
                    )}
                  </li>
                ))}
                {overlappingJobs.length > 5 && (
                  <li className="text-muted-foreground">
                    {t('dispatcher.overlap_more', { count: overlappingJobs.length - 5 })}
                  </li>
                )}
              </ul>
              {suggestedShiftTo && (
                <p className="text-sm text-muted-foreground">
                  {t('dispatcher.overlap_suggested', { time: format(suggestedShiftTo, "HH:mm") })}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t('dispatcher.overlap_stacks')}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onCancel}>{t('dispatcher.cancel')}</AlertDialogCancel>
          {suggestedShiftTo && (
            <Button variant="secondary" onClick={onAutoShift}>
              {t('dispatcher.overlap_auto_shift', { time: format(suggestedShiftTo, "HH:mm") })}
            </Button>
          )}
          <AlertDialogAction onClick={onForce} className="bg-warning text-warning-foreground hover:bg-warning/90">
            {t('dispatcher.overlap_keep')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
