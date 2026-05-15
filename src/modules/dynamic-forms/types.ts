// Dynamic Forms Module Types
import type { DynamicDataSource } from './types/dynamicDataTypes';

// Re-export dynamic data types for convenience
export type { DynamicDataSource, DynamicDataEntityType } from './types/dynamicDataTypes';

// Field types available in the form builder
export type FieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'date'
  | 'section'
  | 'email'
  | 'phone'
  | 'signature'
  | 'rating'
  | 'page_break' // For multi-page forms
  | 'content'; // Rich content block (titles, text, links, buttons)

// Status workflow for forms
export type FormStatus = 'draft' | 'released' | 'archived';

// Option for radio/select/checkbox fields
export interface FieldOption {
  id: string;
  value: string;
  label_en: string;
  label_fr: string;
}

// Condition operators for conditional logic
export type ConditionOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty';

// Condition definition for conditional visibility
export interface FieldCondition {
  field_id: string; // The field to check
  operator: ConditionOperator;
  value?: string | number | boolean; // The value to compare against
}

// Field width options
export type FieldWidth = 'full' | 'half' | 'third';

// Link style options
export type LinkStyle = 'link' | 'button';

// Cascading/Dependent field configuration
export interface FieldDependency {
  parent_field_id: string;           // The field this one depends on
  parent_value_field: string;        // Which field from parent's selected option to use (e.g., 'id', 'value')
  filter_field: string;              // Which field in this field's data source to filter by
  clear_on_parent_change?: boolean;  // Clear this field when parent changes (default: true)
}

// Field definition
export interface FormField {
  id: string;
  type: FieldType;
  label_en: string;
  label_fr: string;
  description_en?: string;
  description_fr?: string;
  placeholder_en?: string;
  placeholder_fr?: string;
  // Hint text - additional helper text shown below the field
  hint_en?: string;
  hint_fr?: string;
  // Link/button configuration
  link_url?: string;
  link_text_en?: string;
  link_text_fr?: string;
  link_style?: LinkStyle;
  link_new_tab?: boolean;
  required: boolean;
  order: number;
  width?: FieldWidth; // Layout width: full, half, or third
  options?: FieldOption[];
  // Validation options
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  // For section type
  collapsible?: boolean;
  // For rating type
  maxStars?: number;
  // Conditional logic
  condition?: FieldCondition;
  condition_action?: 'show' | 'hide'; // What to do when condition is met
  // Dynamic data source for select/radio/checkbox
  data_source?: DynamicDataSource;
  use_dynamic_data?: boolean; // Flag to indicate dynamic vs static options
  // Cascading/Dependent dropdown configuration
  dependency?: FieldDependency;
}

// Thank You Page Rule - conditional thank you message
export interface ThankYouRule {
  id: string;
  name: string;
  condition: FieldCondition;
  message_en: string;
  message_fr: string;
  title_en?: string;
  title_fr?: string;
  redirect_url?: string;
  redirect_delay?: number; // seconds before redirect
  priority: number; // lower = higher priority
}

// Thank You Page Settings
export interface ThankYouSettings {
  default_message: {
    title_en?: string;
    title_fr?: string;
    message_en?: string;
    message_fr?: string;
    enable_redirect?: boolean;
    redirect_url?: string;
    redirect_delay?: number;
  };
  rules?: ThankYouRule[];
}

// Dynamic Form entity
export interface DynamicForm {
  id: number;
  name_en: string;
  name_fr: string;
  description_en?: string;
  description_fr?: string;
  status: FormStatus;
  version: number;
  fields: FormField[];
  category?: string;
  is_public: boolean;
  public_slug?: string;
  public_url?: string;
  thank_you_settings?: ThankYouSettings;
  created_by: string;
  modified_by?: string;
  created_at: string;
  updated_at?: string;
  is_deleted: boolean;
}

// Form response/submission
export interface DynamicFormResponse {
  id: number;
  form_id: number;
  form_version: number;
  entity_type?: string; // e.g., 'service_order', 'installation', 'contact'
  entity_id?: string;
  responses: Record<string, any>; // field_id -> value
  submitted_by: string;
  submitted_at: string;
  notes?: string;
  submitter_name?: string;
  submitter_email?: string;
  is_public_submission: boolean;
}

// DTO for public form submission
export interface PublicSubmitFormResponseDto {
  responses: Record<string, any>;
  submitter_name?: string;
  submitter_email?: string;
  notes?: string;
}

// DTOs for API communication
export interface CreateDynamicFormDto {
  name_en: string;
  name_fr: string;
  description_en?: string;
  description_fr?: string;
  category?: string;
  fields: FormField[];
}

export interface UpdateDynamicFormDto {
  id: number;
  name_en?: string;
  name_fr?: string;
  description_en?: string;
  description_fr?: string;
  status?: FormStatus;
  category?: string;
  fields?: FormField[];
  thank_you_settings?: ThankYouSettings;
}

export interface SubmitFormResponseDto {
  form_id: number;
  entity_type?: string;
  entity_id?: string;
  responses: Record<string, any>;
  notes?: string;
}

// Field type metadata for the palette
export interface FieldTypeConfig {
  type: FieldType;
  label_en: string;
  label_fr: string;
  icon: string;
  hasOptions: boolean;
  defaultProps: Partial<FormField>;
}

// All available field types configuration
export const FIELD_TYPES: FieldTypeConfig[] = [
  { 
    type: 'text', 
    label_en: 'Text Input', 
    label_fr: 'Champ Texte', 
    icon: 'Type',
    hasOptions: false,
    defaultProps: { required: false }
  },
  { 
    type: 'textarea', 
    label_en: 'Text Area', 
    label_fr: 'Zone de Texte', 
    icon: 'AlignLeft',
    hasOptions: false,
    defaultProps: { required: false }
  },
  { 
    type: 'number', 
    label_en: 'Number', 
    label_fr: 'Nombre', 
    icon: 'Hash',
    hasOptions: false,
    defaultProps: { required: false }
  },
  { 
    type: 'checkbox', 
    label_en: 'Checkbox', 
    label_fr: 'Case à cocher', 
    icon: 'CheckSquare',
    hasOptions: true,
    defaultProps: { required: false, options: [] }
  },
  { 
    type: 'radio', 
    label_en: 'Radio Buttons', 
    label_fr: 'Boutons Radio', 
    icon: 'Circle',
    hasOptions: true,
    defaultProps: { required: false, options: [] }
  },
  { 
    type: 'select', 
    label_en: 'Dropdown Select', 
    label_fr: 'Liste Déroulante', 
    icon: 'ChevronDown',
    hasOptions: true,
    defaultProps: { required: false, options: [] }
  },
  { 
    type: 'date', 
    label_en: 'Date Picker', 
    label_fr: 'Sélecteur de Date', 
    icon: 'Calendar',
    hasOptions: false,
    defaultProps: { required: false }
  },
  { 
    type: 'email', 
    label_en: 'Email', 
    label_fr: 'Courriel', 
    icon: 'Mail',
    hasOptions: false,
    defaultProps: { required: false }
  },
  { 
    type: 'phone', 
    label_en: 'Phone', 
    label_fr: 'Téléphone', 
    icon: 'Phone',
    hasOptions: false,
    defaultProps: { required: false }
  },
  { 
    type: 'section', 
    label_en: 'Section Header', 
    label_fr: 'En-tête de Section', 
    icon: 'LayoutList',
    hasOptions: false,
    defaultProps: { required: false, collapsible: false }
  },
  { 
    type: 'signature', 
    label_en: 'Signature', 
    label_fr: 'Signature', 
    icon: 'PenTool',
    hasOptions: false,
    defaultProps: { required: false }
  },
  { 
    type: 'rating', 
    label_en: 'Star Rating', 
    label_fr: 'Évaluation Étoiles', 
    icon: 'Star',
    hasOptions: false,
    defaultProps: { required: false, maxStars: 5 }
  },
  { 
    type: 'page_break', 
    label_en: 'Page Break', 
    label_fr: 'Saut de Page', 
    icon: 'FileStack',
    hasOptions: false,
    defaultProps: { required: false }
  },
  { 
    type: 'content', 
    label_en: 'Content Block', 
    label_fr: 'Bloc de Contenu', 
    icon: 'FileText',
    hasOptions: false,
    defaultProps: { required: false }
  },
];

// Status badge colors
export const STATUS_COLORS: Record<FormStatus, string> = {
  draft: 'bg-warning/10 text-warning',
  released: 'bg-success/10 text-success',
  archived: 'bg-muted text-muted-foreground',
};
