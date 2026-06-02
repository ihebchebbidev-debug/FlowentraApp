import { Sale } from "../../types";
import { UnifiedDocumentsSection, DocumentEntityRef } from "@/modules/shared/components/documents/UnifiedDocumentsSection";

interface DocumentsTabProps {
  sale: Sale;
}

export function DocumentsTab({ sale }: DocumentsTabProps) {
  const relatedEntities: DocumentEntityRef[] = [];

  // Propagate UP: show docs from child service orders and dispatches
  if (sale.convertedToServiceOrderId) {
    relatedEntities.push({
      moduleType: 'services',
      moduleId: sale.convertedToServiceOrderId,
    });
  }

  // Also show docs from the parent offer
  if (sale.offerId) {
    relatedEntities.push({
      moduleType: 'offers',
      moduleId: sale.offerId,
    });
  }

  return (
    <UnifiedDocumentsSection
      entityType="sale"
      entityId={sale.id}
      moduleType="sales"
      moduleName={sale.title}
      relatedEntities={relatedEntities}
      showFileUpload={true}
    />
  );
}
