export interface ImportContact {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  contactType?: 'Individual' | 'Company';
  position?: string;
  fullAddress?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
  [key: string]: any;
}

export interface ImportedRow {
  id: string;
  originalIndex?: number;
  data: ImportContact;
  status: 'valid' | 'invalid' | 'excluded' | 'duplicate' | 'empty';
  errors: string[];
  warnings: string[];
  selected: boolean;
  duplicateOf?: string; // ID of the row this is a duplicate of
  duplicateFields?: string[]; // Which fields are duplicated
}

export interface ColumnMapping {
  [sourceColumn: string]: string | null;
}

export interface ImportPreview {
  rows: ImportedRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  excludedRows: number;
  duplicateRows: number;
  emptyRows: number;
  isLargeDataset?: boolean;
  previewRows?: number;
}

export interface ImportResult {
  successCount: number;
  errorCount: number;
  errors: string[];
}

export const REQUIRED_FIELDS = ['fullName', 'companyName'] as const;
export const OPTIONAL_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'contactType', 'position', 'fullAddress', 'address', 'city', 'state', 'zipCode', 'country', 'notes'] as const;
export const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS] as const;

export const FIELD_LABELS: Record<string, string> = {
  fullName: 'Full Name',
  firstName: 'First Name',
  lastName: 'Last Name',
  companyName: 'Company Name',
  email: 'Email',
  phone: 'Phone',
  contactType: 'Contact Type',
  position: 'Position',
  fullAddress: 'Full Address',
  address: 'Street Address',
  city: 'City',
  state: 'State/Province',
  zipCode: 'ZIP Code',
  country: 'Country',
  notes: 'Notes'
};

export const FIELD_LABELS_FR: Record<string, string> = {
  fullName: 'Nom Complet',
  firstName: 'Prénom',
  lastName: 'Nom',
  companyName: 'Nom de l\'Entreprise',
  email: 'Email',
  phone: 'Téléphone',
  contactType: 'Type de Contact',
  position: 'Poste',
  fullAddress: 'Adresse Complète',
  address: 'Adresse',
  city: 'Ville',
  state: 'Région/Département',
  zipCode: 'Code Postal',
  country: 'Pays',
  notes: 'Notes'
};

export const EXAMPLE_DATA: ImportContact[] = [
  {
    fullName: 'John Doe',
    email: 'john@email.com',
    phone: '+123456789',
    contactType: 'Individual',
    position: 'CEO',
    fullAddress: '123 Main St, City, State 12345'
  },
  {
    companyName: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+987654321',
    contactType: 'Company',
    position: 'Sales Department',
    fullAddress: '456 Business Ave, City, State 67890'
  }
];

export const EXAMPLE_DATA_FR: ImportContact[] = [
  {
    fullName: 'Jean Dupont',
    email: 'jean@email.com',
    phone: '+33123456789',
    contactType: 'Individual',
    position: 'PDG',
    fullAddress: '123 Rue Principale, Paris, 75001'
  },
  {
    companyName: 'Société ABC',
    email: 'contact@abc.fr',
    phone: '+33987654321',
    contactType: 'Company',
    position: 'Service Commercial',
    fullAddress: '456 Avenue des Affaires, Lyon, 69001'
  }
];