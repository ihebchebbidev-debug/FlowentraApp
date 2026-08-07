import { useState } from "react";
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
 * Supplier-invoice lifecycle (status + paymentStatus collapsed for the UI):
 *   draft → validated → partially_paid → paid
 * Branch (terminal): cancelled
 *
 * Note: `partially_paid` and `paid` are derived from amountPaid vs grandTotal
 * on the backend; the stepper just visualises that progression.
 */
const STEPS = ["draft", "validated", "partially_paid", "paid"] as const;

const BRANCHES: Record<string, string[]> = {
  draft: ["cancelled"],
  validated: ["cancelled"],
};

const TERMINAL = new Set(["paid", "cancelled"]);
const NEGATIVE = new Set(["cancelled"]);

interface Props {
  currentStatus: string;
  onStatusChange: (next: string) => void;
  disabled?: boolean;
  isUpdating?: boolean;
}

export function SupplierInvoiceStatusFlow({
  currentStatus,
  onStatusChange,
  disabled,
  isUpdating,
}: Props) {
  const { t } = useTranslation("purchases");
  const [confirm, setConfirm] = useState<{ open: boolean; action: string | null }>(
    { open: false, action: null },
  );

  // Normalise: backend uses `pending` and `partially_paid` on paymentStatus —
  // map the most useful one onto the stepper so users always see progress.
  const normalised = STEPS.includes(currentStatus as any)
    ? currentStatus
    : currentStatus === "pending"
      ? "validated"
      : "draft";

  const branches = BRANCHES[normalised] ?? [];
  const idx = STEPS.indexOf(normalised as any);
  const prev = idx > 0 ? STEPS[idx - 1] : null;
  const next = idx >= 0 && idx < STEPS.length - 1 ? STEPS[idx + 1] : null;

  const getStepDef = (id: string): StatusStepDef => ({
    id,
    label: t(`invoiceStatus.${id}`, { defaultValue: t(`status.${id}`) }),
    isNegative: NEGATIVE.has(id),
    isTerminal: TERMINAL.has(id),
  });

  const handleAdvance = (id: string) => {
    if (branches.includes(id)) setConfirm({ open: true, action: id });
    else onStatusChange(id);
  };

  const action = confirm.action;
  const isNeg = action ? NEGATIVE.has(action) : false;

  return (
    <>
      <StatusFlowStepper
        steps={[...STEPS]}
        currentStatus={normalised}
        getStepDef={getStepDef}
        onAdvance={handleAdvance}
        onBack={onStatusChange}
        branches={branches}
        prevStepId={prev}
        nextStepId={next}
        disabled={disabled}
        isUpdating={isUpdating}
        updatingLabel={t("updating", { defaultValue: "Updating..." })}
        layoutIdPrefix="invoice"
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
                    status: t(`invoiceStatus.${action}`, {
                      defaultValue: t(`status.${action}`),
                    }),
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

export default SupplierInvoiceStatusFlow;
