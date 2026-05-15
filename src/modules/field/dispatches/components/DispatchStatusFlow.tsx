import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import {
  dispatchStatusConfig,
  getStatusById,
} from "@/config/entity-statuses";
import { StatusFlowStepper, type StatusStepDef } from "@/components/shared/StatusFlowStepper";

export type DispatchStatus = 
  | "pending"
  | "planned"
  | "confirmed"
  | "rejected"
  | "in_progress" 
  | "completed"
  | "cancelled";

const WORKFLOW_STEPS = dispatchStatusConfig.workflow.steps as DispatchStatus[];
const TERMINAL_STATUSES = dispatchStatusConfig.workflow.terminalStatuses;
const BRANCH_STATUSES = dispatchStatusConfig.workflow.branchStatuses ?? {};

interface DispatchStatusFlowProps {
  currentStatus: DispatchStatus;
  onStatusChange: (newStatus: DispatchStatus) => void;
  disabled?: boolean;
  isUpdating?: boolean;
}

export function DispatchStatusFlow({ 
  currentStatus, 
  onStatusChange, 
  disabled = false,
  isUpdating = false
}: DispatchStatusFlowProps) {
  const { t } = useTranslation('dispatches');

  // Cancelled/rejected renders as standalone destructive badge
  if (TERMINAL_STATUSES.includes(currentStatus) && currentStatus !== 'completed') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/15 border border-destructive/30">
        <X className="h-3 w-3 text-destructive" />
        <span className="text-xs font-medium text-destructive">
          {t('dispatches.statuses.cancelled')}
        </span>
      </div>
    );
  }

  const branches = BRANCH_STATUSES[currentStatus] ?? [];

  const getStepDef = (id: string): StatusStepDef => {
    const def = getStatusById(dispatchStatusConfig, id);
    return {
      id,
      label: t(`dispatches.statuses.${id}`),
      isNegative: def?.isNegative,
      isTerminal: def?.isTerminal,
    };
  };

  return (
    <StatusFlowStepper
      steps={WORKFLOW_STEPS}
      currentStatus={currentStatus}
      getStepDef={getStepDef}
      onAdvance={onStatusChange}
      branches={branches}
      disabled={disabled}
      isUpdating={isUpdating}
      updatingLabel={t('updating', { defaultValue: 'Updating...' })}
    />
  );
}
