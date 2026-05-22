// Retenue à la Source (RS) / Withholding Tax Types
// Aligned with DGI / RiTEJ cahier de charges v1.0

export type RSTypeCode = '10' | '05' | '03' | '20' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

export interface RSTransactionType {
  code: RSTypeCode;
  label: string;
  labelFr: string;
  rate: number; // percentage
  description: string;
}

export const RS_TRANSACTION_TYPES: RSTransactionType[] = [
  { code: '10', label: 'Professional Fees / Services',  labelFr: 'Honoraires / Services professionnels', rate: 10,  description: 'Standard withholding on professional services' },
  { code: '05', label: 'Exported Services',             labelFr: 'Services exportés',                    rate: 0.5, description: 'Reduced rate for exported services' },
  { code: '03', label: 'Certain Professional Fees',     labelFr: 'Certains honoraires professionnels',   rate: 3,   description: 'Specific professional fees category' },
  { code: '20', label: 'Royalties / Interest',          labelFr: 'Redevances / Intérêts',                rate: 20,  description: 'Royalties and interest payments' },
];

/** TEJ Acte (action on the certificat): Ajouter / Modifier / Annuler. */
export type TEJActe = 0 | 1 | 2;

export type RSStatus = 'pending' | 'exported' | 'error';

/** Entity types that can carry an RSRecord. Extended to include supplier_invoice for TEJ-purchases. */
export type RSEntityType = 'offer' | 'sale' | 'supplier_invoice';

/** TEJ TypeIdentifiant: 1=MF, 2=CIN, 3=Passeport, 4=CarteSejour, 5=Autre. */
export type TEJIdType = 1 | 2 | 3 | 4 | 5;

/** Categorie Contribuable (Personne Morale / Personne Physique). */
export type CategorieContribuable = 'PM' | 'PP';

export interface RSRecord {
  id: string;
  entityType: RSEntityType;
  entityId: string;
  entityNumber?: string;
  invoiceNumber: string;
  invoiceDate: string;        // YYYY-MM-DD (UI), serialized DD/MM/YYYY in XML
  invoiceAmount: number;
  paymentDate: string;
  amountPaid: number;
  rsAmount: number;
  rsTypeCode: RSTypeCode;
  supplierName: string;
  supplierTaxId: string;      // Matricule Fiscal
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

  // Compliance
  declarationDeadline?: string;
  isOverdue?: boolean;
  daysLate?: number;
  penaltyAmount?: number;
  supplierType?: 'individual' | 'company' | 'non_resident';
  isExemptByTreaty?: boolean;
  treatyCode?: string;
  tejAcceptanceNumber?: string;
  tejTransmissionStatus?: 'pending' | 'accepted' | 'rejected';

  // ── TEJ / RiTEJ (DGI cahier de charges v1.0) ──
  /** IdTypeOperation — e.g. "RS1_000001". */
  operationCode?: string;
  cnpc?: string;
  priseEnCharge?: boolean;
  anneeFacturation?: number;
  refCertifChezDeclarant?: string;
  rsTvaCode?: string;
  rsTvaTaux?: number;
  rsTvaAmount?: number;
  montantNetServi?: number;
  beneficiaireCategorie?: CategorieContribuable;
  beneficiaireIsResident?: boolean;
  beneficiaireIdType?: TEJIdType;
  beneficiaireDateNaissance?: string;
  beneficiairePaysCode?: string;
  acte?: TEJActe;
}

export interface CreateRSRecordData {
  entityType: RSEntityType;
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

  supplierType?: 'individual' | 'company' | 'non_resident';
  isExemptByTreaty?: boolean;
  treatyCode?: string;

  // TEJ / RiTEJ
  operationCode?: string;
  cnpc?: string;
  priseEnCharge?: boolean;
  anneeFacturation?: number;
  refCertifChezDeclarant?: string;
  rsTvaCode?: string;
  rsTvaTaux?: number;
  rsTvaAmount?: number;
  beneficiaireCategorie?: CategorieContribuable;
  beneficiaireIsResident?: boolean;
  beneficiaireIdType?: TEJIdType;
  beneficiaireDateNaissance?: string;
  beneficiairePaysCode?: string;
  acte?: TEJActe;
}

export interface TEJExportLog {
  id: string;
  fileName: string;
  exportDate: string;
  exportedBy: string;
  month: number;
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
  email?: string;
  phone?: string;
  /** Defaults to "PM". */
  categorieContribuable?: CategorieContribuable;
}

export interface RSFilters {
  entityType?: RSEntityType;
  month?: number;
  year?: number;
  status?: RSStatus;
  supplierTaxId?: string;
  search?: string;
}
