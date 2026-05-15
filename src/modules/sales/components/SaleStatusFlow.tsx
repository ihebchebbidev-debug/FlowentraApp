import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sale } from "../types";
import { ServiceOrderConfigModal, ServiceOrderConfig } from "./ServiceOrderConfigModal";
import { useWorkflowStatus } from "@/modules/workflow/hooks/useWorkflowStatus";
import { Receipt } from "lucide-react";
import {
  saleStatusConfig,
  normalizeStatus,
  getStatusById,
} from "@/config/entity-statuses";
import { StatusFlowStepper, type StatusStepDef } from "@/components/shared/StatusFlowStepper";

export type SaleStatus =
  | "created"
  | "in_progress"
  | "invoiced"
  | "partially_invoiced"
  | "closed"
  | "cancelled";

interface SaleStatusFlowProps {
  currentStatus: string;
  onStatusChange: (newStatus: SaleStatus, serviceOrderConfig?: ServiceOrderConfig) => void;
  disabled?: boolean;
  sale?: Sale;
  isUpdating?: boolean;
}

const WORKFLOW_STEPS = saleStatusConfig.workflow.steps as SaleStatus[];
const BRANCH_STATUSES = saleStatusConfig.workflow.branchStatuses ?? {};

export function SaleStatusFlow({
  currentStatus,
  onStatusChange,
  disabled = false,
  sale,
  isUpdating = false,
}: SaleStatusFlowProps) {
  const { t } = useTranslation("sales");
  const workflowStatus = useWorkflowStatus();
  const [showServiceOrderConfig, setShowServiceOrderConfig] = useState(false);

  const hasServiceItems = sale?.items?.some((item) => item.type === "service") || false;
  const isAlreadyConverted = !!sale?.convertedToServiceOrderId;

  const currentNormalized = normalizeStatus(saleStatusConfig, currentStatus) as SaleStatus;

  // For branches, get branches for the current normalized status.
  const branches = BRANCH_STATUSES[currentNormalized] ?? [];

  const handleAdvance = (statusId: string) => {
    // Special: created → in_progress may need service order config
    if (currentNormalized === 'created' && statusId === 'in_progress') {
      if (workflowStatus.isActive && hasServiceItems && !isAlreadyConverted) {
        setShowServiceOrderConfig(true);
        return;
      }
    }
    
    onStatusChange(statusId as SaleStatus);
  };

  const handleServiceOrderConfigConfirm = (config: ServiceOrderConfig) => {
    setShowServiceOrderConfig(false);
    onStatusChange('in_progress', config);
  };

  const handleServiceOrderConfigCancel = () => {
    setShowServiceOrderConfig(false);
  };

  const getStepDef = (id: string): StatusStepDef => {
    const def = getStatusById(saleStatusConfig, id);
    return {
      id,
      label: t(def?.translationKey || `statusFlow.${id}`),
      isNegative: def?.isNegative,
      isTerminal: def?.isTerminal,
      // Custom icon: Receipt for partially_invoiced
      icon: id === 'partially_invoiced' ? <Receipt /> : undefined,
    };
  };

  return (
    <>
      <StatusFlowStepper
        steps={WORKFLOW_STEPS}
        currentStatus={currentNormalized}
        getStepDef={getStepDef}
        onAdvance={handleAdvance}
        branches={branches}
        disabled={disabled}
        isUpdating={isUpdating}
        updatingLabel={t("statusFlow.updating", { defaultValue: "Updating..." })}
      />

      {sale && (
        <ServiceOrderConfigModal
          open={showServiceOrderConfig}
          onOpenChange={setShowServiceOrderConfig}
          sale={sale}
          onConfirm={handleServiceOrderConfigConfirm}
          onCancel={handleServiceOrderConfigCancel}
        />
      )}
    </>
  );
}
