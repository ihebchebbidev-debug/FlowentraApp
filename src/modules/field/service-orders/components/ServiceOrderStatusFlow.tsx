import { useTranslation } from "react-i18next";
import {
  serviceOrderStatusConfig,
  getStatusById,
  getAllowedTransitions,
} from "@/config/entity-statuses";
import { StatusFlowStepper, type StatusStepDef } from "@/components/shared/StatusFlowStepper";

// Every status the backend can put a service order into. Keep this in sync with
// serviceOrderStatusConfig — the UI must display the real status, never a
// lossy approximation of it.
export type ServiceOrderStatus =
  | "draft"
  | "pending"
  | "planned"
  | "ready_for_planning"
  | "scheduled"
  | "in_progress"
  | "on_hold"
  | "partially_completed"
  | "technically_completed"
  | "ready_for_invoice"
  | "completed"
  | "invoiced"
  | "closed"
  | "cancelled";

const WORKFLOW_STEPS = serviceOrderStatusConfig.workflow.steps as ServiceOrderStatus[];
const BRANCH_STATUSES = serviceOrderStatusConfig.workflow.branchStatuses ?? {};

interface ServiceOrderStatusFlowProps {
  currentStatus: ServiceOrderStatus;
  onStatusChange: (newStatus: ServiceOrderStatus) => void;
  disabled?: boolean;
  isUpdating?: boolean;
}

export function ServiceOrderStatusFlow({ 
  currentStatus, 
  onStatusChange, 
  disabled = false,
  isUpdating = false
}: ServiceOrderStatusFlowProps) {
  const { t } = useTranslation('serviceOrders');

  // On the happy path the stepper handles forward/backward moves itself, so we
  // only feed it the declared branch options. Off the happy path (on_hold,
  // partially_completed, cancelled...) the stepper has no neighbours to offer,
  // so surface every legal transition in the dropdown instead.
  const isOnHappyPath = WORKFLOW_STEPS.includes(currentStatus);
  const branches = isOnHappyPath
    ? BRANCH_STATUSES[currentStatus] ?? []
    : getAllowedTransitions('service_order', currentStatus);


  const getStepDef = (id: string): StatusStepDef => {
    const def = getStatusById(serviceOrderStatusConfig, id);
    return {
      id,
      label: t(`statuses.${id}`),
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
      onBack={onStatusChange}
      branches={branches as ServiceOrderStatus[]}
      disabled={disabled}
      isUpdating={isUpdating}
      updatingLabel={t('updating', { defaultValue: 'Updating...' })}
      maxPastVisible={3}
      maxFutureVisible={3}
    />
  );
}
