import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  offerStatusConfig,
  normalizeStatus,
  getStatusById,
} from "@/config/entity-statuses";
import { StatusFlowStepper, type StatusStepDef } from "@/components/shared/StatusFlowStepper";

export type OfferStatus = string;

interface OfferStatusFlowProps {
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  disabled?: boolean;
  isUpdating?: boolean;
}

const WORKFLOW_STEPS = offerStatusConfig.workflow.steps;
const BRANCH_STATUSES = offerStatusConfig.workflow.branchStatuses ?? {};

export function OfferStatusFlow({
  currentStatus,
  onStatusChange,
  disabled = false,
  isUpdating = false,
}: OfferStatusFlowProps) {
  const { t } = useTranslation("offers");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: string | null;
  }>({ open: false, action: null });

  // Normalize raw backend status to canonical config ID (uses aliases)
  const currentNormalized = normalizeStatus(offerStatusConfig, currentStatus);

  // Get branches for current status
  const branches = BRANCH_STATUSES[currentNormalized] ?? [];

  // Compute explicit prev and next steps
  // Normal steps: draft -> sent -> accepted
  // Note: offer.config.ts might not have sent in its steps array, so we override here manually to ensure visibility
  let prevStepId: string | null = null;
  let nextStepId: string | null = null;

  if (currentNormalized === "draft") {
    nextStepId = "sent";
  } else if (currentNormalized === "sent") {
    prevStepId = "draft";
    // Next step could be accepted or we just show branches
  } else if (currentNormalized === "accepted" || currentNormalized === "declined" || currentNormalized === "cancelled") {
    prevStepId = "sent";
  } else {
    // Modify based on the workflow steps array if it has valid ordered elements
    const currentIndex = WORKFLOW_STEPS.indexOf(currentNormalized);
    if (currentIndex > 0) {
      prevStepId = WORKFLOW_STEPS[currentIndex - 1];
    }
    if (currentIndex >= 0 && currentIndex < WORKFLOW_STEPS.length - 1) {
      nextStepId = WORKFLOW_STEPS[currentIndex + 1];
    }
  }

  const handleNext = (statusId: string) => {
    // If it's a branch, open confirmation dialogue
    if (branches.includes(statusId)) {
      setConfirmDialog({ open: true, action: statusId });
    } else {
      onStatusChange(statusId);
    }
  };

  const handleBack = (statusId: string) => {
      onStatusChange(statusId);
  };

  const handleConfirm = () => {
    if (confirmDialog.action) onStatusChange(confirmDialog.action);
    setConfirmDialog({ open: false, action: null });
  };

  const handleCancel = () => setConfirmDialog({ open: false, action: null });

  const getStepDef = (id: string): StatusStepDef => {
    const def = getStatusById(offerStatusConfig, id);
    return {
      id,
      label: t(`status.${id}`),
      isNegative: def?.isNegative,
      isTerminal: def?.isTerminal,
    };
  };

  const actionDef = confirmDialog.action
    ? getStatusById(offerStatusConfig, confirmDialog.action)
    : null;
  const isNegativeAction = actionDef?.isNegative;

  return (
    <>
      <StatusFlowStepper
        steps={WORKFLOW_STEPS}
        currentStatus={currentNormalized}
        getStepDef={getStepDef}
        onAdvance={handleNext}
        onBack={handleBack}
        branches={currentNormalized === 'sent' ? branches : []} // Show branches dynamically if on 'sent'. (If draft, next is sent so we can hide direct accept/decline or show them, but user wants 'previous and next')
        prevStepId={prevStepId}
        nextStepId={nextStepId}
        disabled={disabled}
        isUpdating={isUpdating}
        updatingLabel={t("updating", { defaultValue: "Updating..." })}
      />

      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && handleCancel()}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full",
                  isNegativeAction ? "bg-destructive/10" : "bg-success/10"
                )}
              >
                {isNegativeAction ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                ) : (
                  <Check className="h-3.5 w-3.5 text-success" />
                )}
              </div>
              {isNegativeAction
                ? t("statusFlow.confirmDeclineTitle")
                : t("statusFlow.confirmAcceptTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {isNegativeAction
                ? t("statusFlow.confirmDeclineDescription")
                : t("statusFlow.confirmAcceptDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              {t("cancel")}
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              className={cn(
                isNegativeAction
                  ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  : "bg-success hover:bg-success/90 text-success-foreground"
              )}
            >
              {isNegativeAction
                ? t("statusFlow.confirmDecline")
                : t("statusFlow.confirmAccept")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
