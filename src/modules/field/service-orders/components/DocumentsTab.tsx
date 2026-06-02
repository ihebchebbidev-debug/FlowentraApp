import { UnifiedDocumentsSection, DocumentEntityRef } from "@/modules/shared/components/documents/UnifiedDocumentsSection";

interface DocumentsTabProps {
  serviceOrderId: number;
  saleId?: number | string;
  offerId?: number | string;
  onRefresh?: () => void;
}

export function DocumentsTab({ serviceOrderId, saleId, offerId }: DocumentsTabProps) {
  const relatedEntities: DocumentEntityRef[] = [];

  // Propagate: show docs from parent sale and offer
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
      entityType="service_order"
      entityId={serviceOrderId}
      moduleType="services"
      relatedEntities={relatedEntities}
      showFileUpload={true}
    />
  );
}
