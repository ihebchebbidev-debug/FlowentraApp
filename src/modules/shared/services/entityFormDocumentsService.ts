import { apiFetch } from '@/services/api/apiClient';
import { 
  EntityFormDocument, 
  CreateEntityFormDocumentDto, 
  UpdateEntityFormDocumentDto,
  EntityType,
  FormDocumentStatus,
  CopyDocumentsDto
} from '../types/formDocument';

// Transform from backend PascalCase to frontend snake_case
const transformFromBackend = (data: any): EntityFormDocument => ({
  id: data.id || data.Id,
  entity_type: (data.entityType || data.EntityType || '').toLowerCase().replace('serviceorder', 'service_order') as EntityType,
  entity_id: data.entityId || data.EntityId,
  form_id: data.formId || data.FormId,
  form_version: data.formVersion || data.FormVersion || 1,
  form_name_en: data.formNameEn || data.FormNameEn || '',
  form_name_fr: data.formNameFr || data.FormNameFr || '',
  title: data.title || data.Title,
  status: (data.status || data.Status || 'draft').toLowerCase() as FormDocumentStatus,
  responses: data.responses || data.Responses || {},
  created_by: data.createdBy || data.CreatedBy || '',
  created_by_name: data.createdByName || data.CreatedByName,
  created_at: data.createdAt || data.CreatedAt || new Date().toISOString(),
  updated_at: data.updatedAt || data.UpdatedAt,
  is_deleted: data.isDeleted ?? data.IsDeleted ?? false,
});

// Transform entity type for backend (service_order -> ServiceOrder)
const transformEntityTypeToBackend = (entityType: EntityType): string => {
  if (entityType === 'service_order') return 'ServiceOrder';
  return entityType.charAt(0).toUpperCase() + entityType.slice(1);
};

// Transform to backend PascalCase (but keep status lowercase for DB constraint)
const transformCreateToBackend = (dto: CreateEntityFormDocumentDto): any => ({
  EntityType: transformEntityTypeToBackend(dto.entity_type),
  EntityId: dto.entity_id,
  FormId: dto.form_id,
  Title: dto.title,
  // Keep status lowercase - database check constraint expects 'draft' or 'completed'
  Status: dto.status || 'draft',
  Responses: dto.responses || {},
});

const transformUpdateToBackend = (dto: UpdateEntityFormDocumentDto): any => ({
  Id: dto.id,
  Title: dto.title,
  // Keep status lowercase - database check constraint expects 'draft' or 'completed'
  Status: dto.status,
  Responses: dto.responses,
});

export const entityFormDocumentsService = {
  // Get all form documents for an entity
  async getByEntity(entityType: EntityType, entityId: number): Promise<EntityFormDocument[]> {
    const backendEntityType = transformEntityTypeToBackend(entityType);
    const { data, error } = await apiFetch<any[]>(
      `/api/EntityFormDocuments/${backendEntityType}/${entityId}`
    );
    
    if (error) {
      console.error(`Failed to fetch form documents for ${entityType} ${entityId}:`, error);
      return [];
    }
    
    return (data || []).map(transformFromBackend);
  },
  
  // Get a single form document by ID
  async getById(id: number): Promise<EntityFormDocument | null> {
    const { data, error } = await apiFetch<any>(`/api/EntityFormDocuments/${id}`);
    
    if (error) {
      console.error(`Failed to fetch form document ${id}:`, error);
      return null;
    }
    
    return data ? transformFromBackend(data) : null;
  },
  
  // Create a new form document
  async create(dto: CreateEntityFormDocumentDto): Promise<EntityFormDocument> {
    const backendDto = transformCreateToBackend(dto);
    
    const { data, error } = await apiFetch<any>('/api/EntityFormDocuments', {
      method: 'POST',
      body: JSON.stringify(backendDto),
    });
    
    if (error || !data) {
      throw new Error(error || 'Failed to create form document');
    }
    
    return transformFromBackend(data);
  },
  
  // Update an existing form document
  async update(dto: UpdateEntityFormDocumentDto): Promise<EntityFormDocument> {
    const backendDto = transformUpdateToBackend(dto);
    
    const { data, error } = await apiFetch<any>(`/api/EntityFormDocuments/${dto.id}`, {
      method: 'PUT',
      body: JSON.stringify(backendDto),
    });
    
    if (error || !data) {
      throw new Error(error || 'Failed to update form document');
    }
    
    return transformFromBackend(data);
  },
  
  // Delete a form document (soft delete)
  async delete(id: number): Promise<void> {
    const { error } = await apiFetch(`/api/EntityFormDocuments/${id}`, {
      method: 'DELETE',
    });
    
    if (error) {
      throw new Error(error || 'Failed to delete form document');
    }
  },
  
  // Mark a form document as completed
  async markCompleted(id: number): Promise<EntityFormDocument> {
    return this.update({ id, status: 'completed' });
  },
  
  // Copy all form documents from one entity to another (e.g., offer to sale during conversion)
  async copyToEntity(
    sourceEntityType: EntityType, 
    sourceEntityId: number, 
    targetEntityType: EntityType, 
    targetEntityId: number
  ): Promise<{ copiedCount: number }> {
    const { data, error } = await apiFetch<{ copiedCount: number }>(
      '/api/EntityFormDocuments/copy',
      {
        method: 'POST',
        body: JSON.stringify({
          SourceEntityType: transformEntityTypeToBackend(sourceEntityType),
          SourceEntityId: sourceEntityId,
          TargetEntityType: transformEntityTypeToBackend(targetEntityType),
          TargetEntityId: targetEntityId,
        }),
      }
    );
    
    if (error || !data) {
      throw new Error(error || 'Failed to copy form documents');
    }
    
    return data;
  },

  // Copy documents along the workflow chain (from any related parent entities)
  async copyFromWorkflowChain(
    targetEntityType: EntityType,
    targetEntityId: number,
    relatedEntities: { type: EntityType; id: number }[]
  ): Promise<{ totalCopied: number }> {
    let totalCopied = 0;
    
    for (const entity of relatedEntities) {
      try {
        const result = await this.copyToEntity(
          entity.type,
          entity.id,
          targetEntityType,
          targetEntityId
        );
        totalCopied += result.copiedCount;
      } catch (err) {
        console.warn(`Failed to copy documents from ${entity.type} ${entity.id}:`, err);
      }
    }
    
    return { totalCopied };
  },
};
