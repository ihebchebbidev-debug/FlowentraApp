import { Sale } from "../../types";
import { UnifiedDocumentsSection } from "@/modules/shared/components/documents";

interface AttachmentsTabProps {
  sale: Sale;
}

export function AttachmentsTab({ sale }: AttachmentsTabProps) {
  return (
    <UnifiedDocumentsSection
      entityType="sale"
      entityId={sale.id}
      moduleType="sales"
      moduleName={sale.title}
      showFileUpload={true}
    />
  );
}
