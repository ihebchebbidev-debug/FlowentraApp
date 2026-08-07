import { Offer } from "../../types";
import { UnifiedDocumentsSection } from "@/modules/shared/components/documents";

interface AttachmentsTabProps {
  offer: Offer;
}

export function AttachmentsTab({ offer }: AttachmentsTabProps) {
  return (
    <UnifiedDocumentsSection
      entityType="offer"
      entityId={offer.id}
      moduleType="offers"
      moduleName={offer.title}
      showFileUpload={true}
    />
  );
}
