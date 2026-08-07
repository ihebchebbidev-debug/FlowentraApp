import { DocumentsService } from '@/modules/documents/services/documents.service';
import type { EntityType, CreatePaymentProofData } from '@/modules/payments/types';

export const PROOF_MAX_BYTES = 20 * 1024 * 1024;
export const PROOF_ACCEPT = '.pdf,image/*,.doc,.docx,.xls,.xlsx';

/**
 * Uploads proof-of-payment files through the same Documents pipeline used by
 * sales/offers, so they also show up in the parent record's Documents tab.
 * Files are renamed `<entityType>_<entityNumber>_payment_<ref>_<original>`.
 */
export async function uploadPaymentProofs(
  files: File[],
  opts: { entityType: EntityType; entityId: string; entityNumber?: string; reference?: string },
): Promise<CreatePaymentProofData[]> {
  if (!files.length) return [];
  const { entityType, entityId, entityNumber, reference } = opts;
  const moduleType = entityType === 'offer' ? 'offers' : entityType === 'invoice' ? 'invoices' : 'sales';
  const label = entityNumber || entityId;

  const renamed = files.map((file) => new File(
    [file],
    `${entityType}_${label}_payment_${reference || ''}_${file.name}`.replace(/\s+/g, '_').replace(/_+/g, '_'),
    { type: file.type },
  ));

  const uploaded = await DocumentsService.uploadDocuments({
    files: renamed,
    moduleType,
    moduleId: String(entityId),
    moduleName: label,
    description: `Payment proof — ${reference || label}`,
    tags: ['payment-proof'],
  } as any);

  if (!uploaded?.length) throw new Error('Upload returned no document');

  return uploaded.map((doc: any) => ({
    documentId: String(doc.id),
    documentName: doc.originalName || doc.fileName,
    documentUrl: doc.filePath,
  }));
}
