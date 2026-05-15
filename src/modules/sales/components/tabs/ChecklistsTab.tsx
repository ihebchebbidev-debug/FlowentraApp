import { Sale } from "../../types";
import { ChecklistsSection } from "@/modules/shared/components/documents";

interface ChecklistsTabProps {
  sale: Sale;
}

export function ChecklistsTab({ sale }: ChecklistsTabProps) {
  return (
    <ChecklistsSection
      entityType="sale"
      entityId={sale.id}
      linkedEntityType={sale.offerId ? "offer" : undefined}
      linkedEntityId={sale.offerId}
    />
  );
}
