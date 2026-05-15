import { useTranslation } from "react-i18next";
import {
  serviceOrderStatusConfig,
  getStatusById,
} from "@/config/entity-statuses";
import { StatusFlowStepper, type StatusStepDef } from "@/components/shared/StatusFlowStepper";

export type ServiceOrderStatus = 
  | "pending" 
  | "planned"
  | "ready_for_planning" 
  | "scheduled" 
  | "in_progress"
  | "technically_completed" 
  | "ready_for_invoice"
  | "invoiced" 
  | "closed";

const WORKFLOW_STEPS = serviceOrderStatusConfig.workflow.steps as ServiceOrderStatus[];

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
      disabled={disabled}
      isUpdating={isUpdating}
      updatingLabel={t('updating', { defaultValue: 'Updating...' })}
    />
  );
}
