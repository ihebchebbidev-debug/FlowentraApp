// Retenue à la Source (RS) / Withholding Tax Types

export type RSTypeCode = '10' | '05' | '03' | '20';

export interface RSTransactionType {
  code: RSTypeCode;
  label: string;
  labelFr: string;
  rate: number; // percentage
  description: string;
}

export const RS_TRANSACTION_TYPES: RSTransactionType[] = [
  { code: '10', label: 'Professional Fees / Services', labelFr: 'Honoraires / Services professionnels', rate: 10, description: 'Standard withholding on professional services' },
  { code: '05', label: 'Exported Services', labelFr: 'Services exportés', rate: 0.5, description: 'Reduced rate for exported services' },
  { code: '03', label: 'Certain Professional Fees', labelFr: 'Certains honoraires professionnels', rate: 3, description: 'Specific professional fees category' },
  { code: '20', label: 'Royalties / Interest', labelFr: 'Redevances / Intérêts', rate: 20, description: 'Royalties and interest payments' },
];

export type RSStatus = 'pending' | 'exported' | 'error';

export interface RSRecord {
  id: string;
  entityType: 'offer' | 'sale';
  entityId: string;
  entityNumber?: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  invoiceAmount: number;
  paymentDate: string; // YYYY-MM-DD
  amountPaid: number;
  rsAmount: number;
  rsTypeCode: RSTypeCode;
  supplierName: string;
  supplierTaxId: string; // Matricule Fiscal
  supplierAddress?: string;
  payerName: string;
  payerTaxId: string;
  payerAddress?: string;
  status: RSStatus;
  tejExported: boolean;
  tejFileName?: string;
  createdAt: string;
  createdBy: string;
  modifiedAt?: string;
  modifiedBy?: string;
  notes?: string;
  
  // 🔴 CRITICAL COMPLIANCE FIELDS
  declarationDeadline?: string; // YYYY-MM-DD
  isOverdue?: boolean;
  daysLate?: number;
  penaltyAmount?: number;
  
  // 🟡 MEDIUM PRIORITY COMPLIANCE FIELDS
  supplierType?: 'individual' | 'company' | 'non_resident';
  isExemptByTreaty?: boolean;
  treatyCode?: string; // EU-TN, AGTC, etc.
  tejAcceptanceNumber?: string;
  tejTransmissionStatus?: 'pending' | 'accepted' | 'rejected';
}

export interface CreateRSRecordData {
  entityType: 'offer' | 'sale';
  entityId: string;
  entityNumber?: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceAmount: number;
  paymentDate: string;
  amountPaid: number;
  rsTypeCode: RSTypeCode;
  supplierName: string;
  supplierTaxId: string;
  supplierAddress?: string;
  payerName: string;
  payerTaxId: string;
  payerAddress?: string;
  notes?: string;
  
  // 🟡 MEDIUM PRIORITY COMPLIANCE FIELDS
  supplierType?: 'individual' | 'company' | 'non_resident';
  isExemptByTreaty?: boolean;
  treatyCode?: string;
}

export interface TEJExportLog {
  id: string;
  fileName: string;
  exportDate: string;
  exportedBy: string;
  month: number; // 1-12
  year: number;
  recordCount: number;
  totalRSAmount: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

export interface TEJDeclarant {
  name: string;
  taxId: string;
  address: string;
}

export interface RSFilters {
  entityType?: 'offer' | 'sale';
  month?: number;
  year?: number;
  status?: RSStatus;
  supplierTaxId?: string;
  search?: string;
}
