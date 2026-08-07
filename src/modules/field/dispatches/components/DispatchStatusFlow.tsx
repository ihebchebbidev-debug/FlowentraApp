import { useTranslation } from "react-i18next";
import {
  dispatchStatusConfig,
  getStatusById,
} from "@/config/entity-statuses";
import { StatusFlowStepper, type StatusStepDef } from "@/components/shared/StatusFlowStepper";

export type DispatchStatus =
  | "pending"
  | "planned"
  | "assigned"
  | "confirmed"
  | "rejected"
  | "in_progress"
  | "completed"
  | "cancelled";

const WORKFLOW_STEPS = dispatchStatusConfig.workflow.steps as DispatchStatus[];
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
  isUpdating = false,
}: DispatchStatusFlowProps) {
  const { t } = useTranslation('dispatches');

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
      onAdvance={(s) => onStatusChange(s as DispatchStatus)}
      onBack={(s) => onStatusChange(s as DispatchStatus)}
      branches={branches}
      disabled={disabled}
      isUpdating={isUpdating}
      updatingLabel={t('updating', { defaultValue: 'Updating...' })}
    />
  );
}

