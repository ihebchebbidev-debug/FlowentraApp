// Export Types for Dynamic Forms - Export responses to other entities
// Allows mapping form field responses to Articles, Contacts, Installations

// Supported entity types for export
export type ExportEntityType = 'contact' | 'article' | 'installation';

// Field mapping for export
export interface ExportFieldMapping {
  form_field_id: string;     // ID of the form field
  entity_field: string;       // Target field in the entity (e.g., 'name', 'email')
  transform?: ExportTransform; // Optional transformation
}

// Transformation types for field values
export type ExportTransform = 
  | 'none'           // Use value as-is
  | 'uppercase'      // Convert to uppercase
  | 'lowercase'      // Convert to lowercase
  | 'trim'           // Trim whitespace
  | 'number'         // Convert to number
  | 'boolean'        // Convert to boolean
  | 'date'           // Convert to ISO date string
  | 'join_comma'     // Join array with comma
  | 'first_item';    // Take first item from array

// Export configuration for a form
export interface FormExportConfig {
  id: string;
  form_id: number;
  entity_type: ExportEntityType;
  name_en: string;
  name_fr: string;
  description_en?: string;
  description_fr?: string;
  mappings: ExportFieldMapping[];
  default_values?: Record<string, any>; // Default values for unmapped fields
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// Export result
export interface ExportResult {
  success: boolean;
  entity_id?: string | number;
  entity_type: ExportEntityType;
  message_en: string;
  message_fr: string;
  error?: string;
}

// Batch export result
export interface BatchExportResult {
  total: number;
  successful: number;
  failed: number;
  results: ExportResult[];
}

// Entity field definitions for UI
export interface EntityFieldDefinition {
  field: string;
  label_en: string;
  label_fr: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'array';
  required: boolean;
  description_en?: string;
  description_fr?: string;
}

// =====================================================
// Entity Field Definitions (for mapping UI)
// =====================================================

export const CONTACT_FIELDS: EntityFieldDefinition[] = [
  { field: 'name', label_en: 'Full Name', label_fr: 'Nom Complet', type: 'string', required: false, description_en: 'Will be split into first/last name', description_fr: 'Sera divisé en prénom/nom' },
  { field: 'firstName', label_en: 'First Name', label_fr: 'Prénom', type: 'string', required: true },
  { field: 'lastName', label_en: 'Last Name', label_fr: 'Nom', type: 'string', required: true },
  { field: 'email', label_en: 'Email', label_fr: 'Courriel', type: 'email', required: true },
  { field: 'phone', label_en: 'Phone', label_fr: 'Téléphone', type: 'phone', required: false },
  { field: 'company', label_en: 'Company', label_fr: 'Entreprise', type: 'string', required: false },
  { field: 'position', label_en: 'Position', label_fr: 'Poste', type: 'string', required: false },
  { field: 'address', label_en: 'Address', label_fr: 'Adresse', type: 'string', required: false },
  { field: 'status', label_en: 'Status', label_fr: 'Statut', type: 'string', required: false, description_en: 'active, inactive, lead, customer, partner', description_fr: 'actif, inactif, prospect, client, partenaire' },
  { field: 'type', label_en: 'Type', label_fr: 'Type', type: 'string', required: false, description_en: 'individual, company, partner', description_fr: 'individu, entreprise, partenaire' },
  { field: 'cin', label_en: 'CIN', label_fr: 'CIN', type: 'string', required: false },
  { field: 'matriculeFiscale', label_en: 'Tax ID', label_fr: 'Matricule Fiscale', type: 'string', required: false },
];

export const ARTICLE_FIELDS: EntityFieldDefinition[] = [
  { field: 'name', label_en: 'Name', label_fr: 'Nom', type: 'string', required: true },
  { field: 'description', label_en: 'Description', label_fr: 'Description', type: 'string', required: false },
  { field: 'type', label_en: 'Type (Material/Service)', label_fr: 'Type (Matériel/Service)', type: 'string', required: true, description_en: 'Must be "material" or "service"', description_fr: 'Doit être "material" ou "service"' },
  { field: 'sku', label_en: 'SKU / Article Number', label_fr: 'SKU / Numéro Article', type: 'string', required: false },
  { field: 'category', label_en: 'Category', label_fr: 'Catégorie', type: 'string', required: false },
  { field: 'costPrice', label_en: 'Cost Price', label_fr: 'Prix d\'Achat', type: 'number', required: false },
  { field: 'sellPrice', label_en: 'Sell Price', label_fr: 'Prix de Vente', type: 'number', required: false },
  { field: 'stock', label_en: 'Stock Quantity', label_fr: 'Quantité en Stock', type: 'number', required: false },
  { field: 'minStock', label_en: 'Minimum Stock', label_fr: 'Stock Minimum', type: 'number', required: false },
  { field: 'supplier', label_en: 'Supplier', label_fr: 'Fournisseur', type: 'string', required: false },
  { field: 'basePrice', label_en: 'Base Price (Service)', label_fr: 'Prix de Base (Service)', type: 'number', required: false },
  { field: 'duration', label_en: 'Duration (minutes)', label_fr: 'Durée (minutes)', type: 'number', required: false },
  { field: 'notes', label_en: 'Notes', label_fr: 'Notes', type: 'string', required: false },
];

export const INSTALLATION_FIELDS: EntityFieldDefinition[] = [
  { field: 'contactId', label_en: 'Contact ID', label_fr: 'ID Contact', type: 'number', required: true, description_en: 'Must be a valid contact ID', description_fr: 'Doit être un ID de contact valide' },
  { field: 'name', label_en: 'Name', label_fr: 'Nom', type: 'string', required: false },
  { field: 'siteAddress', label_en: 'Site Address', label_fr: 'Adresse du Site', type: 'string', required: false },
  { field: 'installationType', label_en: 'Installation Type', label_fr: 'Type d\'Installation', type: 'string', required: false },
  { field: 'model', label_en: 'Model', label_fr: 'Modèle', type: 'string', required: false },
  { field: 'manufacturer', label_en: 'Manufacturer', label_fr: 'Fabricant', type: 'string', required: false },
  { field: 'serialNumber', label_en: 'Serial Number', label_fr: 'Numéro de Série', type: 'string', required: false },
  { field: 'category', label_en: 'Category', label_fr: 'Catégorie', type: 'string', required: false },
  { field: 'type', label_en: 'Type', label_fr: 'Type', type: 'string', required: false },
  { field: 'status', label_en: 'Status', label_fr: 'Statut', type: 'string', required: false, description_en: 'active, inactive, maintenance', description_fr: 'actif, inactif, maintenance' },
  { field: 'notes', label_en: 'Notes', label_fr: 'Notes', type: 'string', required: false },
];

// Get fields for entity type
export function getEntityFields(entityType: ExportEntityType): EntityFieldDefinition[] {
  switch (entityType) {
    case 'contact':
      return CONTACT_FIELDS;
    case 'article':
      return ARTICLE_FIELDS;
    case 'installation':
      return INSTALLATION_FIELDS;
    default:
      return [];
  }
}

// Entity type labels
export const EXPORT_ENTITY_LABELS: Record<ExportEntityType, { en: string; fr: string; icon: string }> = {
  contact: { en: 'Contact', fr: 'Contact', icon: 'Users' },
  article: { en: 'Article', fr: 'Article', icon: 'Package' },
  installation: { en: 'Installation', fr: 'Installation', icon: 'Settings' },
};

// Transform labels
export const TRANSFORM_LABELS: Record<ExportTransform, { en: string; fr: string }> = {
  none: { en: 'None', fr: 'Aucune' },
  uppercase: { en: 'Uppercase', fr: 'Majuscules' },
  lowercase: { en: 'Lowercase', fr: 'Minuscules' },
  trim: { en: 'Trim Whitespace', fr: 'Supprimer Espaces' },
  number: { en: 'Convert to Number', fr: 'Convertir en Nombre' },
  boolean: { en: 'Convert to Boolean', fr: 'Convertir en Booléen' },
  date: { en: 'Convert to Date', fr: 'Convertir en Date' },
  join_comma: { en: 'Join with Comma', fr: 'Joindre par Virgule' },
  first_item: { en: 'Take First Item', fr: 'Prendre Premier Élément' },
};
