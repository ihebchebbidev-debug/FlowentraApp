import { Offer } from "../../types";
import { ChecklistsSection } from "@/modules/shared/components/documents";

interface ChecklistsTabProps {
  offer: Offer;
}

export function ChecklistsTab({ offer }: ChecklistsTabProps) {
  return (
    <ChecklistsSection
      entityType="offer"
      entityId={offer.id}
      linkedEntityType={offer.convertedToSaleId ? "sale" : undefined}
      linkedEntityId={offer.convertedToSaleId}
    />
  );
}
