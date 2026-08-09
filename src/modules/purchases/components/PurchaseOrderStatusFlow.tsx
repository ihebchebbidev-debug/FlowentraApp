import { useState } from "react";
import { toast } from "sonner";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  StatusFlowStepper,
  type StatusStepDef,
} from "@/components/shared/StatusFlowStepper";

/**
 * Purchase-order lifecycle (mirrors backend state machine):
 *   draft → validated → ordered → partially_received → received → closed
 * Branch (terminal): cancelled
 */
const STEPS = [
  "draft",
  "validated",
  "ordered",
  "partially_received",
  "received",
  "closed",
] as const;

const BRANCHES: Record<string, string[]> = {
  draft: ["cancelled"],
  validated: ["cancelled"],
  ordered: ["cancelled"],
};

const TERMINAL = new Set(["closed", "cancelled"]);
const NEGATIVE = new Set(["cancelled"]);

/**
 * Statuses the backend DERIVES from goods receipts (PurchaseOrderService
 * rejects a manual move with HTTP 400 unless line ReceivedQty values agree).
 * Clicking them here must not fire a doomed PATCH — we hand the click back to
 * the page so it can route the user to the "Receive goods" flow instead.
 */
const RECEIPT_DERIVED = new Set(["partially_received", "received"]);

/** Mirror of PurchaseOrderService.AllowedStatusTransitions (backend). */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["validated", "ordered", "cancelled"],
  validated: ["ordered", "draft", "cancelled"],
  ordered: ["partially_received", "received", "cancelled"],
  partially_received: ["received", "cancelled"],
  received: ["closed"],
  cancelled: [],
  closed: [],
};


interface Props {
  currentStatus: string;
  onStatusChange: (next: string) => void;
  /** Called instead of onStatusChange for receipt-derived statuses. */
  onReceiptDerivedAttempt?: (next: string) => void;
  disabled?: boolean;
  isUpdating?: boolean;
}

export function PurchaseOrderStatusFlow({
  currentStatus,
  onStatusChange,
  onReceiptDerivedAttempt,
  disabled,
  isUpdating,
}: Props) {
  const { t } = useTranslation("purchases");
  const [confirm, setConfirm] = useState<{ open: boolean; action: string | null }>(
    { open: false, action: null },
  );

  const current = STEPS.includes(currentStatus as any) ? currentStatus : "draft";
  const branches = BRANCHES[current] ?? [];

  const idx = STEPS.indexOf(current as any);
  const prev = idx > 0 ? STEPS[idx - 1] : null;
  const next = idx >= 0 && idx < STEPS.length - 1 ? STEPS[idx + 1] : null;

  const getStepDef = (id: string): StatusStepDef => ({
    id,
    label: t(`status.${id}`),
    isNegative: NEGATIVE.has(id),
    isTerminal: TERMINAL.has(id),
  });

  const handleAdvance = (id: string) => {
    if (RECEIPT_DERIVED.has(id) && onReceiptDerivedAttempt) {
      onReceiptDerivedAttempt(id);
      return;
    }
    // Mirror of the backend state machine — never fire a PATCH the server will
    // reject (e.g. stepping BACK from received → partially_received).
    if (!(ALLOWED_TRANSITIONS[current] ?? []).includes(id)) {
      toast.error(
        t("statusFlow.notAllowed", {
          defaultValue: "You can't move this order from {{from}} back to {{to}}.",
          from: t(`status.${current}`),
          to: t(`status.${id}`),
        }),
      );
      return;
    }
    if (branches.includes(id)) setConfirm({ open: true, action: id });
    else onStatusChange(id);
  };



  const action = confirm.action;
  const isNeg = action ? NEGATIVE.has(action) : false;

  return (
    <>
      <StatusFlowStepper
        steps={[...STEPS]}
        currentStatus={current}
        getStepDef={getStepDef}
        onAdvance={handleAdvance}
        onBack={handleAdvance}
        branches={branches}
        prevStepId={prev}
        nextStepId={next}
        disabled={disabled}
        isUpdating={isUpdating}
        updatingLabel={t("updating", { defaultValue: "Updating..." })}
        layoutIdPrefix="po"
      />

      <Dialog
        open={confirm.open}
        onOpenChange={(o) => !o && setConfirm({ open: false, action: null })}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full",
                  isNeg ? "bg-destructive/10" : "bg-success/10",
                )}
              >
                {isNeg ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                ) : (
                  <Check className="h-3.5 w-3.5 text-success" />
                )}
              </div>
              {t("statusFlow.confirmTitle", {
                defaultValue: "Confirm status change",
              })}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {action
                ? t("statusFlow.confirmDescription", {
                    defaultValue: "Change status to {{status}}?",
                    status: t(`status.${action}`),
                  })
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirm({ open: false, action: null })}
            >
              {t("actions.cancel", "Cancel")}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (action) onStatusChange(action);
                setConfirm({ open: false, action: null });
              }}
              className={cn(
                isNeg &&
                  "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
              )}
            >
              {t("actions.confirm", "Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PurchaseOrderStatusFlow;
