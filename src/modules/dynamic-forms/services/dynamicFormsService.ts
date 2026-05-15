import { apiFetch } from '@/services/api/apiClient';
import { 
  DynamicForm, 
  DynamicFormResponse, 
  CreateDynamicFormDto, 
  UpdateDynamicFormDto, 
  SubmitFormResponseDto, 
  PublicSubmitFormResponseDto,
  FormStatus,
  FormField,
  FieldOption
} from '../types';

const BASE_URL = '/api/DynamicForms';
const PUBLIC_BASE_URL = '/api/public/forms';

// Helper functions to transform between frontend (snake_case) and backend (PascalCase)
const transformFieldToBackend = (field: FormField): any => ({
  Id: field.id,
  Type: field.type,
  LabelEn: field.label_en,
  LabelFr: field.label_fr,
  DescriptionEn: field.description_en,
  DescriptionFr: field.description_fr,
  PlaceholderEn: field.placeholder_en,
  PlaceholderFr: field.placeholder_fr,
  HintEn: field.hint_en,
  HintFr: field.hint_fr,
  LinkUrl: field.link_url,
  LinkTextEn: field.link_text_en,
  LinkTextFr: field.link_text_fr,
  LinkStyle: field.link_style,
  LinkNewTab: field.link_new_tab,
  Required: field.required,
  Order: field.order,
  Width: field.width,
  Options: field.options?.map((opt: FieldOption) => ({
    Id: opt.id,
    Value: opt.value,
    LabelEn: opt.label_en,
    LabelFr: opt.label_fr,
  })),
  // Dynamic data source configuration
  UseDynamicData: field.use_dynamic_data ?? false,
  DataSource: field.data_source ? {
    EntityType: field.data_source.entity_type,
    DisplayField: field.data_source.display_field,
    ValueField: field.data_source.value_field,
    DisplayTemplate: field.data_source.display_template,
    Filters: field.data_source.filters?.map(f => ({
      Field: f.field,
      Operator: f.operator,
      Value: f.value,
    })),
    SortField: field.data_source.sort_field,
    SortOrder: field.data_source.sort_order,
    Limit: field.data_source.limit,
  } : undefined,
  MinLength: field.minLength,
  MaxLength: field.maxLength,
  Min: field.min,
  Max: field.max,
  Collapsible: field.collapsible,
  MaxStars: field.maxStars,
  Condition: field.condition ? {
    FieldId: field.condition.field_id,
    Operator: field.condition.operator,
    Value: field.condition.value,
  } : undefined,
  ConditionAction: field.condition_action,
  // Cascading dependency configuration
  Dependency: field.dependency ? {
    ParentFieldId: field.dependency.parent_field_id,
    ParentValueField: field.dependency.parent_value_field,
    FilterField: field.dependency.filter_field,
    ClearOnParentChange: field.dependency.clear_on_parent_change ?? true,
  } : undefined,
});

// Transform thank you settings to backend format
const transformThankYouSettingsToBackend = (settings: any): any => {
  if (!settings) return undefined;
  
  return {
    DefaultMessage: settings.default_message ? {
      TitleEn: settings.default_message.title_en,
      TitleFr: settings.default_message.title_fr,
      MessageEn: settings.default_message.message_en,
      MessageFr: settings.default_message.message_fr,
      EnableRedirect: settings.default_message.enable_redirect,
      RedirectUrl: settings.default_message.redirect_url,
      RedirectDelay: settings.default_message.redirect_delay,
    } : undefined,
    Rules: settings.rules?.map((rule: any) => ({
      Id: rule.id,
      Name: rule.name,
      Condition: rule.condition ? {
        FieldId: rule.condition.field_id,
        Operator: rule.condition.operator,
        Value: rule.condition.value,
      } : undefined,
      TitleEn: rule.title_en,
      TitleFr: rule.title_fr,
      MessageEn: rule.message_en,
      MessageFr: rule.message_fr,
      RedirectUrl: rule.redirect_url,
      RedirectDelay: rule.redirect_delay,
      Priority: rule.priority,
    })),
  };
};

const transformFieldFromBackend = (field: any): FormField => ({
  id: field.id || field.Id,
  type: field.type || field.Type,
  label_en: field.labelEn || field.LabelEn || '',
  label_fr: field.labelFr || field.LabelFr || '',
  description_en: field.descriptionEn || field.DescriptionEn,
  description_fr: field.descriptionFr || field.DescriptionFr,
  placeholder_en: field.placeholderEn || field.PlaceholderEn,
  placeholder_fr: field.placeholderFr || field.PlaceholderFr,
  hint_en: field.hintEn || field.HintEn,
  hint_fr: field.hintFr || field.HintFr,
  link_url: field.linkUrl || field.LinkUrl,
  link_text_en: field.linkTextEn || field.LinkTextEn,
  link_text_fr: field.linkTextFr || field.LinkTextFr,
  link_style: field.linkStyle || field.LinkStyle,
  link_new_tab: field.linkNewTab ?? field.LinkNewTab,
  required: field.required ?? field.Required ?? false,
  order: field.order ?? field.Order ?? 0,
  width: field.width || field.Width,
  options: field.options?.map((opt: any) => ({
    id: opt.id || opt.Id,
    value: opt.value || opt.Value,
    label_en: opt.labelEn || opt.LabelEn || '',
    label_fr: opt.labelFr || opt.LabelFr || '',
  })) || field.Options?.map((opt: any) => ({
    id: opt.id || opt.Id,
    value: opt.value || opt.Value,
    label_en: opt.labelEn || opt.LabelEn || '',
    label_fr: opt.labelFr || opt.LabelFr || '',
  })),
  // Dynamic data source configuration
  use_dynamic_data: field.useDynamicData ?? field.UseDynamicData ?? false,
  data_source: (field.dataSource || field.DataSource) ? {
    entity_type: (field.dataSource || field.DataSource)?.entityType || (field.dataSource || field.DataSource)?.EntityType || '',
    display_field: (field.dataSource || field.DataSource)?.displayField || (field.dataSource || field.DataSource)?.DisplayField || '',
    value_field: (field.dataSource || field.DataSource)?.valueField || (field.dataSource || field.DataSource)?.ValueField || '',
    display_template: (field.dataSource || field.DataSource)?.displayTemplate || (field.dataSource || field.DataSource)?.DisplayTemplate,
    filters: ((field.dataSource || field.DataSource)?.filters || (field.dataSource || field.DataSource)?.Filters)?.map((f: any) => ({
      field: f.field || f.Field || '',
      operator: f.operator || f.Operator || 'equals',
      value: f.value ?? f.Value,
    })),
    sort_field: (field.dataSource || field.DataSource)?.sortField || (field.dataSource || field.DataSource)?.SortField,
    sort_order: (field.dataSource || field.DataSource)?.sortOrder || (field.dataSource || field.DataSource)?.SortOrder,
    limit: (field.dataSource || field.DataSource)?.limit || (field.dataSource || field.DataSource)?.Limit,
  } : undefined,
  minLength: field.minLength || field.MinLength,
  maxLength: field.maxLength || field.MaxLength,
  min: field.min || field.Min,
  max: field.max || field.Max,
  collapsible: field.collapsible ?? field.Collapsible,
  maxStars: field.maxStars || field.MaxStars,
  condition: field.condition || field.Condition ? {
    field_id: field.condition?.fieldId || field.condition?.field_id || field.Condition?.FieldId || '',
    operator: field.condition?.operator || field.Condition?.Operator || 'equals',
    value: field.condition?.value ?? field.Condition?.Value,
  } : undefined,
  condition_action: field.conditionAction || field.condition_action || field.ConditionAction,
  // Cascading dependency configuration
  dependency: (field.dependency || field.Dependency) ? {
    parent_field_id: (field.dependency || field.Dependency)?.parentFieldId || (field.dependency || field.Dependency)?.ParentFieldId || (field.dependency || field.Dependency)?.parent_field_id || '',
    parent_value_field: (field.dependency || field.Dependency)?.parentValueField || (field.dependency || field.Dependency)?.ParentValueField || (field.dependency || field.Dependency)?.parent_value_field || '',
    filter_field: (field.dependency || field.Dependency)?.filterField || (field.dependency || field.Dependency)?.FilterField || (field.dependency || field.Dependency)?.filter_field || '',
    clear_on_parent_change: (field.dependency || field.Dependency)?.clearOnParentChange ?? (field.dependency || field.Dependency)?.ClearOnParentChange ?? (field.dependency || field.Dependency)?.clear_on_parent_change ?? true,
  } : undefined,
});

const transformFormFromBackend = (data: any): DynamicForm => ({
  id: data.id || data.Id,
  name_en: data.nameEn || data.NameEn || '',
  name_fr: data.nameFr || data.NameFr || '',
  description_en: data.descriptionEn || data.DescriptionEn,
  description_fr: data.descriptionFr || data.DescriptionFr,
  status: (data.status || data.Status || 'draft').toLowerCase() as FormStatus,
  version: data.version || data.Version || 1,
  fields: (data.fields || data.Fields || []).map(transformFieldFromBackend),
  category: data.category || data.Category,
  is_public: data.isPublic ?? data.IsPublic ?? false,
  public_slug: data.publicSlug || data.PublicSlug,
  public_url: data.publicUrl || data.PublicUrl,
  created_by: data.createdBy || data.CreatedBy || '',
  modified_by: data.modifiedBy || data.ModifiedBy,
  created_at: data.createdAt || data.CreatedAt || new Date().toISOString(),
  updated_at: data.updatedAt || data.UpdatedAt,
  is_deleted: data.isDeleted ?? data.IsDeleted ?? false,
});

export const dynamicFormsService = {
  // Get all forms with optional filters
  async getAll(filters?: { status?: FormStatus; category?: string; search?: string }): Promise<DynamicForm[]> {
    const params = new URLSearchParams();
    
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.category) {
      params.append('category', filters.category);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;
    
    const { data, error } = await apiFetch<any[]>(endpoint);
    
    if (error) {
      console.error('Failed to fetch dynamic forms:', error);
      return [];
    }
    
    return (data || []).map(transformFormFromBackend);
  },
  
  // Get a single form by ID
  async getById(id: number): Promise<DynamicForm | null> {
    const { data, error } = await apiFetch<any>(`${BASE_URL}/${id}`);
    
    if (error) {
      console.error(`Failed to fetch dynamic form ${id}:`, error);
      return null;
    }
    
    return data ? transformFormFromBackend(data) : null;
  },
  
  // Create a new form
  async create(dto: CreateDynamicFormDto): Promise<DynamicForm> {
    // Transform snake_case to PascalCase for backend
    const backendDto = {
      NameEn: dto.name_en,
      NameFr: dto.name_fr,
      DescriptionEn: dto.description_en,
      DescriptionFr: dto.description_fr,
      Category: dto.category,
      Fields: dto.fields.map(transformFieldToBackend),
    };
    
    const { data, error } = await apiFetch<any>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(backendDto),
    });
    
    if (error || !data) {
      throw new Error(error || 'Failed to create form');
    }
    
    return transformFormFromBackend(data);
  },
  
  // Update an existing form
  async update(dto: UpdateDynamicFormDto): Promise<DynamicForm> {
    // Transform snake_case to PascalCase for backend
    const backendDto: any = { Id: dto.id };
    if (dto.name_en !== undefined) backendDto.NameEn = dto.name_en;
    if (dto.name_fr !== undefined) backendDto.NameFr = dto.name_fr;
    if (dto.description_en !== undefined) backendDto.DescriptionEn = dto.description_en;
    if (dto.description_fr !== undefined) backendDto.DescriptionFr = dto.description_fr;
    if (dto.status !== undefined) backendDto.Status = dto.status;
    if (dto.category !== undefined) backendDto.Category = dto.category;
    if (dto.fields !== undefined) backendDto.Fields = dto.fields.map(transformFieldToBackend);
    // Transform thank you settings if provided
    if (dto.thank_you_settings !== undefined) {
      backendDto.ThankYouSettings = transformThankYouSettingsToBackend(dto.thank_you_settings);
    }
    
    const { data, error } = await apiFetch<any>(`${BASE_URL}/${dto.id}`, {
      method: 'PUT',
      body: JSON.stringify(backendDto),
    });
    
    if (error || !data) {
      throw new Error(error || 'Failed to update form');
    }
    
    return transformFormFromBackend(data);
  },
  
  // Delete a form (soft delete)
  async delete(id: number): Promise<void> {
    const { error } = await apiFetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    
    if (error) {
      throw new Error(error || 'Failed to delete form');
    }
  },
  
  // Duplicate a form
  async duplicate(id: number): Promise<DynamicForm> {
    const { data, error } = await apiFetch<any>(`${BASE_URL}/${id}/duplicate`, {
      method: 'POST',
    });
    
    if (error || !data) {
      throw new Error(error || 'Failed to duplicate form');
    }
    
    return transformFormFromBackend(data);
  },
  
  // Change form status
  async changeStatus(id: number, status: FormStatus): Promise<DynamicForm> {
    const { data, error } = await apiFetch<any>(`${BASE_URL}/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ Status: status }),
    });
    
    if (error || !data) {
      throw new Error(error || 'Failed to change form status');
    }
    
    return transformFormFromBackend(data);
  },
  
  // Get responses for a form
  async getResponses(formId: number): Promise<DynamicFormResponse[]> {
    const { data, error } = await apiFetch<any[]>(`${BASE_URL}/${formId}/responses`);
    
    if (error) {
      console.error(`Failed to fetch responses for form ${formId}:`, error);
      return [];
    }
    
    return (data || []).map((r: any) => ({
      id: r.id || r.Id,
      form_id: r.formId || r.FormId,
      form_version: r.formVersion || r.FormVersion,
      entity_type: r.entityType || r.EntityType,
      entity_id: r.entityId || r.EntityId,
      responses: r.responses || r.Responses || {},
      submitted_by: r.submittedBy || r.SubmittedBy || '',
      submitted_at: r.submittedAt || r.SubmittedAt || new Date().toISOString(),
      notes: r.notes || r.Notes,
      submitter_name: r.submitterName || r.SubmitterName,
      submitter_email: r.submitterEmail || r.SubmitterEmail,
      is_public_submission: r.isPublicSubmission ?? r.IsPublicSubmission ?? false,
    }));
  },
  
  // Submit a form response
  async submitResponse(dto: SubmitFormResponseDto): Promise<DynamicFormResponse> {
    const backendDto = {
      FormId: dto.form_id,
      EntityType: dto.entity_type,
      EntityId: dto.entity_id,
      Responses: dto.responses,
      Notes: dto.notes,
    };
    
    const { data, error } = await apiFetch<any>(`${BASE_URL}/${dto.form_id}/responses`, {
      method: 'POST',
      body: JSON.stringify(backendDto),
    });
    
    if (error || !data) {
      throw new Error(error || 'Failed to submit response');
    }
    
    return {
      id: data.id || data.Id,
      form_id: data.formId || data.FormId,
      form_version: data.formVersion || data.FormVersion,
      entity_type: data.entityType || data.EntityType,
      entity_id: data.entityId || data.EntityId,
      responses: data.responses || data.Responses || {},
      submitted_by: data.submittedBy || data.SubmittedBy || '',
      submitted_at: data.submittedAt || data.SubmittedAt || new Date().toISOString(),
      notes: data.notes || data.Notes,
      submitter_name: data.submitterName || data.SubmitterName,
      submitter_email: data.submitterEmail || data.SubmitterEmail,
      is_public_submission: data.isPublicSubmission ?? data.IsPublicSubmission ?? false,
    };
  },
  
  // Get response count for a form
  async getResponseCount(formId: number): Promise<number> {
    const { data, error } = await apiFetch<{ count: number }>(`${BASE_URL}/${formId}/responses/count`);
    
    if (error) {
      console.error(`Failed to get response count for form ${formId}:`, error);
      return 0;
    }
    
    return data?.count || 0;
  },

  // Update public sharing settings
  async updatePublicSharing(id: number, isPublic: boolean, publicSlug?: string): Promise<DynamicForm> {
    const backendDto: any = { IsPublic: isPublic };
    if (publicSlug) {
      backendDto.PublicSlug = publicSlug;
    }
    
    const { data, error } = await apiFetch<any>(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendDto),
    });
    
    if (error || !data) {
      throw new Error(error || 'Failed to update sharing settings');
    }
    
    return transformFormFromBackend(data);
  },
};

// Public form service (for unauthenticated access)
export const publicFormsService = {
  // Get a public form by slug
  async getBySlug(slug: string): Promise<DynamicForm | null> {
    const { data, error } = await apiFetch<any>(`${PUBLIC_BASE_URL}/${slug}`);
    
    if (error) {
      console.error(`Failed to fetch public form ${slug}:`, error);
      return null;
    }
    
    return data ? transformFormFromBackend(data) : null;
  },
  
  // Submit a response to a public form
  async submitResponse(slug: string, dto: PublicSubmitFormResponseDto): Promise<DynamicFormResponse> {
    // Ensure responses is a valid non-empty object
    const responses = dto.responses || {};
    
    // Ensure at least one response is provided (backend requires non-empty Responses)
    if (Object.keys(responses).length === 0) {
      throw new Error('At least one response is required');
    }
    
    // Clean up undefined/null values and ensure proper serialization
    const cleanedResponses: Record<string, any> = {};
    for (const [key, value] of Object.entries(responses)) {
      if (value !== undefined && value !== null && value !== '') {
        cleanedResponses[key] = value;
      }
    }
    
    // If after cleanup there are no responses, throw error
    if (Object.keys(cleanedResponses).length === 0) {
      throw new Error('At least one non-empty response is required');
    }
    
    // Only include optional fields if they have valid values (backend validates email format)
    const backendDto: Record<string, any> = {
      Responses: cleanedResponses,
    };
    
    // Only add optional fields if they exist and are non-empty
    if (dto.submitter_name && dto.submitter_name.trim()) {
      backendDto.SubmitterName = dto.submitter_name.trim();
    }
    if (dto.submitter_email && dto.submitter_email.trim()) {
      backendDto.SubmitterEmail = dto.submitter_email.trim();
    }
    if (dto.notes && dto.notes.trim()) {
      backendDto.Notes = dto.notes.trim();
    }
    
    console.log('Submitting public form response:', { slug, payload: backendDto });
    
    const { data, error } = await apiFetch<any>(`${PUBLIC_BASE_URL}/${slug}/responses`, {
      method: 'POST',
      body: JSON.stringify(backendDto),
    });
    
    if (error || !data) {
      throw new Error(error || 'Failed to submit response');
    }
    
    return {
      id: data.id || data.Id,
      form_id: data.formId || data.FormId,
      form_version: data.formVersion || data.FormVersion,
      entity_type: data.entityType || data.EntityType,
      entity_id: data.entityId || data.EntityId,
      responses: data.responses || data.Responses || {},
      submitted_by: data.submittedBy || data.SubmittedBy || '',
      submitted_at: data.submittedAt || data.SubmittedAt || new Date().toISOString(),
      notes: data.notes || data.Notes,
      submitter_name: data.submitterName || data.SubmitterName,
      submitter_email: data.submitterEmail || data.SubmitterEmail,
      is_public_submission: true,
    };
  },
};
