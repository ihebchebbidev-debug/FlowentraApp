// Dynamic Data Source Types for Form Fields
// Allows select/radio/checkbox fields to fetch options dynamically from entities

// Supported entity types for dynamic data sources
export type DynamicDataEntityType = 
  | 'contacts'
  | 'articles'
  | 'materials'    // articles of type 'material'
  | 'services'     // articles of type 'service'
  | 'offers'
  | 'sales'
  | 'installations'
  | 'users'
  | 'service_orders';

// Filter operators for dynamic data queries
export type DataFilterOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty';

// Single filter condition
export interface DataFilter {
  field: string;
  operator: DataFilterOperator;
  value?: string | number | boolean;
}

// Configuration for dynamic data source
export interface DynamicDataSource {
  entity_type: DynamicDataEntityType;
  display_field: string;       // Field to show as option label (e.g., 'name', 'email')
  value_field: string;         // Field to store as value (e.g., 'id', 'email')
  display_template?: string;   // Template for display (e.g., '{name} - {email}')
  filters?: DataFilter[];      // Optional filters to narrow data
  sort_field?: string;         // Field to sort by
  sort_order?: 'asc' | 'desc';
  limit?: number;              // Maximum number of options
}

// Available fields for each entity type
export interface EntityFieldDefinition {
  field: string;
  label_en: string;
  label_fr: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'email';
}

// =====================================================
// Entity Field Definitions for Dynamic Data
// =====================================================

export const CONTACT_DATA_FIELDS: EntityFieldDefinition[] = [
  { field: 'id', label_en: 'ID', label_fr: 'ID', type: 'number' },
  { field: 'name', label_en: 'Full Name', label_fr: 'Nom Complet', type: 'string' },
  { field: 'email', label_en: 'Email', label_fr: 'Courriel', type: 'email' },
  { field: 'phone', label_en: 'Phone', label_fr: 'Téléphone', type: 'string' },
  { field: 'company', label_en: 'Company', label_fr: 'Entreprise', type: 'string' },
  { field: 'status', label_en: 'Status', label_fr: 'Statut', type: 'string' },
  { field: 'type', label_en: 'Type', label_fr: 'Type', type: 'string' },
];

export const ARTICLE_DATA_FIELDS: EntityFieldDefinition[] = [
  { field: 'id', label_en: 'ID', label_fr: 'ID', type: 'number' },
  { field: 'name', label_en: 'Name', label_fr: 'Nom', type: 'string' },
  { field: 'sku', label_en: 'SKU', label_fr: 'SKU', type: 'string' },
  { field: 'description', label_en: 'Description', label_fr: 'Description', type: 'string' },
  { field: 'category', label_en: 'Category', label_fr: 'Catégorie', type: 'string' },
  { field: 'type', label_en: 'Type', label_fr: 'Type', type: 'string' },
  { field: 'sellPrice', label_en: 'Sell Price', label_fr: 'Prix de Vente', type: 'number' },
  { field: 'costPrice', label_en: 'Cost Price', label_fr: 'Prix d\'Achat', type: 'number' },
  { field: 'stock', label_en: 'Stock', label_fr: 'Stock', type: 'number' },
];

export const OFFER_DATA_FIELDS: EntityFieldDefinition[] = [
  { field: 'id', label_en: 'ID', label_fr: 'ID', type: 'number' },
  { field: 'offerNumber', label_en: 'Offer Number', label_fr: 'Numéro d\'Offre', type: 'string' },
  { field: 'title', label_en: 'Title', label_fr: 'Titre', type: 'string' },
  { field: 'status', label_en: 'Status', label_fr: 'Statut', type: 'string' },
  { field: 'totalAmount', label_en: 'Total Amount', label_fr: 'Montant Total', type: 'number' },
  { field: 'createdAt', label_en: 'Created Date', label_fr: 'Date de Création', type: 'date' },
];

export const SALE_DATA_FIELDS: EntityFieldDefinition[] = [
  { field: 'id', label_en: 'ID', label_fr: 'ID', type: 'number' },
  { field: 'saleNumber', label_en: 'Sale Number', label_fr: 'Numéro de Vente', type: 'string' },
  { field: 'status', label_en: 'Status', label_fr: 'Statut', type: 'string' },
  { field: 'totalAmount', label_en: 'Total Amount', label_fr: 'Montant Total', type: 'number' },
  { field: 'createdAt', label_en: 'Created Date', label_fr: 'Date de Création', type: 'date' },
];

export const SERVICE_ORDER_DATA_FIELDS: EntityFieldDefinition[] = [
  { field: 'id', label_en: 'ID', label_fr: 'ID', type: 'string' },
  { field: 'orderNumber', label_en: 'Order Number', label_fr: 'Numéro de Commande', type: 'string' },
  { field: 'title', label_en: 'Title', label_fr: 'Titre', type: 'string' },
  { field: 'status', label_en: 'Status', label_fr: 'Statut', type: 'string' },
  { field: 'priority', label_en: 'Priority', label_fr: 'Priorité', type: 'string' },
  { field: 'serviceType', label_en: 'Service Type', label_fr: 'Type de Service', type: 'string' },
  { field: 'customerName', label_en: 'Customer Name', label_fr: 'Nom du Client', type: 'string' },
  { field: 'scheduledAt', label_en: 'Scheduled Date', label_fr: 'Date Prévue', type: 'date' },
  { field: 'createdAt', label_en: 'Created Date', label_fr: 'Date de Création', type: 'date' },
];

export const INSTALLATION_DATA_FIELDS: EntityFieldDefinition[] = [
  { field: 'id', label_en: 'ID', label_fr: 'ID', type: 'number' },
  { field: 'installationNumber', label_en: 'Installation Number', label_fr: 'Numéro d\'Installation', type: 'string' },
  { field: 'name', label_en: 'Name', label_fr: 'Nom', type: 'string' },
  { field: 'siteAddress', label_en: 'Site Address', label_fr: 'Adresse du Site', type: 'string' },
  { field: 'model', label_en: 'Model', label_fr: 'Modèle', type: 'string' },
  { field: 'manufacturer', label_en: 'Manufacturer', label_fr: 'Fabricant', type: 'string' },
  { field: 'status', label_en: 'Status', label_fr: 'Statut', type: 'string' },
];

export const USER_DATA_FIELDS: EntityFieldDefinition[] = [
  { field: 'id', label_en: 'ID', label_fr: 'ID', type: 'number' },
  { field: 'name', label_en: 'Name', label_fr: 'Nom', type: 'string' },
  { field: 'email', label_en: 'Email', label_fr: 'Courriel', type: 'email' },
  { field: 'role', label_en: 'Role', label_fr: 'Rôle', type: 'string' },
];

// Get fields for entity type
export function getDataSourceFields(entityType: DynamicDataEntityType): EntityFieldDefinition[] {
  switch (entityType) {
    case 'contacts':
      return CONTACT_DATA_FIELDS;
    case 'articles':
    case 'materials':
    case 'services':
      return ARTICLE_DATA_FIELDS;
    case 'offers':
      return OFFER_DATA_FIELDS;
    case 'sales':
      return SALE_DATA_FIELDS;
    case 'installations':
      return INSTALLATION_DATA_FIELDS;
    case 'users':
      return USER_DATA_FIELDS;
    case 'service_orders':
      return SERVICE_ORDER_DATA_FIELDS;
    default:
      return [];
  }
}

// Entity type labels
export const DYNAMIC_DATA_ENTITY_LABELS: Record<DynamicDataEntityType, { en: string; fr: string; icon: string }> = {
  contacts: { en: 'Contacts', fr: 'Contacts', icon: 'Users' },
  articles: { en: 'All Articles', fr: 'Tous les Articles', icon: 'Package' },
  materials: { en: 'Materials', fr: 'Matériaux', icon: 'Box' },
  services: { en: 'Services', fr: 'Services', icon: 'Wrench' },
  offers: { en: 'Offers', fr: 'Offres', icon: 'FileText' },
  sales: { en: 'Sales', fr: 'Ventes', icon: 'Receipt' },
  installations: { en: 'Installations', fr: 'Installations', icon: 'Settings' },
  users: { en: 'Users', fr: 'Utilisateurs', icon: 'UserCircle' },
  service_orders: { en: 'Service Orders', fr: 'Ordres de Service', icon: 'ClipboardList' },
};

// Filter operator labels
export const DATA_FILTER_OPERATOR_LABELS: Record<DataFilterOperator, { en: string; fr: string }> = {
  equals: { en: 'Equals', fr: 'Égal à' },
  not_equals: { en: 'Not Equals', fr: 'Différent de' },
  contains: { en: 'Contains', fr: 'Contient' },
  starts_with: { en: 'Starts With', fr: 'Commence par' },
  ends_with: { en: 'Ends With', fr: 'Termine par' },
  greater_than: { en: 'Greater Than', fr: 'Supérieur à' },
  less_than: { en: 'Less Than', fr: 'Inférieur à' },
  is_empty: { en: 'Is Empty', fr: 'Est Vide' },
  is_not_empty: { en: 'Is Not Empty', fr: 'N\'est pas Vide' },
};

// Default data source configurations
export const DEFAULT_DATA_SOURCES: Record<DynamicDataEntityType, Partial<DynamicDataSource>> = {
  contacts: { display_field: 'name', value_field: 'id', sort_field: 'name', sort_order: 'asc' },
  articles: { display_field: 'name', value_field: 'id', sort_field: 'name', sort_order: 'asc' },
  materials: { display_field: 'name', value_field: 'id', sort_field: 'name', sort_order: 'asc' },
  services: { display_field: 'name', value_field: 'id', sort_field: 'name', sort_order: 'asc' },
  offers: { display_field: 'offerNumber', value_field: 'id', sort_field: 'createdAt', sort_order: 'desc' },
  sales: { display_field: 'saleNumber', value_field: 'id', sort_field: 'createdAt', sort_order: 'desc' },
  installations: { display_field: 'name', value_field: 'id', sort_field: 'name', sort_order: 'asc' },
  users: { display_field: 'name', value_field: 'id', sort_field: 'name', sort_order: 'asc' },
  service_orders: { display_field: 'orderNumber', value_field: 'id', sort_field: 'createdAt', sort_order: 'desc' },
};
