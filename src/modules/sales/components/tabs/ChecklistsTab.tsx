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
      additionalSources={(sale.items ?? [])
        .map((it: any) => ({ type: 'sale_item' as const, id: Number(it.id) }))
        .filter(s => !isNaN(s.id))}
    />
  );
}
