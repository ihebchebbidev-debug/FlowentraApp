import { Offer } from "../../types";
import { UnifiedDocumentsSection, DocumentEntityRef } from "@/modules/shared/components/documents/UnifiedDocumentsSection";

interface DocumentsTabProps {
  offer: Offer;
}

export function DocumentsTab({ offer }: DocumentsTabProps) {
  // Offer is the top-level entity - no related entities to propagate from
  // But child entities (sales, service orders, dispatches) propagate UP to here
  // We'd need child entity IDs to fetch their docs - these come from conversion tracking
  const relatedEntities: DocumentEntityRef[] = [];

  if (offer.convertedToSaleId) {
    relatedEntities.push({
      moduleType: 'sales',
      moduleId: offer.convertedToSaleId,
    });
  }
  if (offer.convertedToServiceOrderId) {
    relatedEntities.push({
      moduleType: 'services',
      moduleId: offer.convertedToServiceOrderId,
    });
  }

  return (
    <UnifiedDocumentsSection
      entityType="offer"
      entityId={offer.id}
      moduleType="offers"
      moduleName={offer.title}
      relatedEntities={relatedEntities}
      showFileUpload={true}
    />
  );
}
