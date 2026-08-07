import { UnifiedDocumentsSection, DocumentEntityRef } from '@/modules/shared/components/documents/UnifiedDocumentsSection';

interface InvoiceDocumentsTabProps {
  invoiceId: number;
  invoiceNumber?: string;
  /** Linked sale — its documents are surfaced here too (read-only lineage). */
  saleId?: number;
}

/**
 * Documents attached to an invoice. Uses the same pipeline as sales/offers,
 * so payment proofs uploaded from the Payments tab appear here automatically.
 */
export function InvoiceDocumentsTab({ invoiceId, invoiceNumber, saleId }: InvoiceDocumentsTabProps) {
  const relatedEntities: DocumentEntityRef[] = saleId
    ? [{ moduleType: 'sales', moduleId: String(saleId) }]
    : [];

  return (
    <UnifiedDocumentsSection
      entityType="invoice"
      entityId={invoiceId}
      moduleType="invoices"
      moduleName={invoiceNumber || `#${invoiceId}`}
      relatedEntities={relatedEntities}
      showFileUpload={true}
    />
  );
}
