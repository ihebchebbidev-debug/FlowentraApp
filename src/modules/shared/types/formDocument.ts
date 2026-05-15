// Entity Form Document Types - For attaching dynamic forms to Offers/Sales/ServiceOrders/Dispatches

export type EntityType = 'offer' | 'sale' | 'service_order' | 'dispatch' | 'installation' | 'project' | 'user';
export type FormDocumentStatus = 'draft' | 'completed';

export interface EntityFormDocument {
  id: number;
  entity_type: EntityType;
  entity_id: number;
  form_id: number;
  form_version: number;
  form_name_en: string;
  form_name_fr: string;
  title?: string;
  status: FormDocumentStatus;
  responses: Record<string, any>;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at?: string;
  is_deleted: boolean;
}

export interface CreateEntityFormDocumentDto {
  entity_type: EntityType;
  entity_id: number;
  form_id: number;
  title?: string;
  status?: FormDocumentStatus;
  responses?: Record<string, any>;
}

export interface UpdateEntityFormDocumentDto {
  id: number;
  title?: string;
  status?: FormDocumentStatus;
  responses?: Record<string, any>;
}

// Copy documents request DTO
export interface CopyDocumentsDto {
  source_entity_type: EntityType;
  source_entity_id: number;
  target_entity_type: EntityType;
  target_entity_id: number;
}

// Status badge colors
export const FORM_DOCUMENT_STATUS_COLORS: Record<FormDocumentStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400',
};

// Entity type display names for UI
export const ENTITY_TYPE_LABELS: Record<EntityType, { en: string; fr: string }> = {
  offer: { en: 'Offer', fr: 'Offre' },
  sale: { en: 'Sale', fr: 'Vente' },
  service_order: { en: 'Service Order', fr: 'Ordre de Service' },
  dispatch: { en: 'Dispatch', fr: 'Intervention' },
  installation: { en: 'Installation', fr: 'Installation' },
  project: { en: 'Project', fr: 'Projet' },
  user: { en: 'User', fr: 'Utilisateur' },
};

// Workflow order for document propagation
export const WORKFLOW_ORDER: EntityType[] = ['offer', 'sale', 'service_order', 'dispatch', 'installation'];
