import { UnifiedDocumentsSection, DocumentEntityRef } from "@/modules/shared/components/documents/UnifiedDocumentsSection";

interface DocumentsTabProps {
  dispatchId: number;
  serviceOrderId?: number | string;
  saleId?: number | string;
  offerId?: number | string;
  onRefresh?: () => void;
}

export function DocumentsTab({ dispatchId, serviceOrderId, saleId, offerId }: DocumentsTabProps) {
  const relatedEntities: DocumentEntityRef[] = [];

  // Propagate: show docs from parent service order, sale, and offer
  if (serviceOrderId) {
    relatedEntities.push({
      moduleType: 'services',
      moduleId: String(serviceOrderId),
    });
  }
  if (saleId) {
    relatedEntities.push({
      moduleType: 'sales',
      moduleId: String(saleId),
    });
  }
  if (offerId) {
    relatedEntities.push({
      moduleType: 'offers',
      moduleId: String(offerId),
    });
  }

  return (
    <UnifiedDocumentsSection
      entityType="dispatch"
      entityId={dispatchId}
      moduleType="field"
      relatedEntities={relatedEntities}
      showFileUpload={true}
    />
  );
}
