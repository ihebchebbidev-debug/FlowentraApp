// AI Form Creation Service - Creates dynamic forms from natural language descriptions
import { dynamicFormsService } from '@/modules/dynamic-forms/services/dynamicFormsService';
import { QueryClient } from '@tanstack/react-query';
import {
  DynamicForm,
  CreateDynamicFormDto,
  FormField,
  FieldType,
  FieldOption,
  FIELD_TYPES,
  DynamicDataSource,
  FieldDependency,
} from '@/modules/dynamic-forms/types';
import { DEFAULT_DATA_SOURCES } from '@/modules/dynamic-forms/types/dynamicDataTypes';
import { detectFormIntentSmart } from './aiSmartIntentRecognizer';

// Global query client reference for cache invalidation
let queryClientRef: QueryClient | null = null;

export function setQueryClientForFormCreation(client: QueryClient) {
  queryClientRef = client;
}

// =====================================================
// Types
// =====================================================

export interface ParsedFormData {
  name_en: string;
  name_fr: string;
  description_en?: string;
  description_fr?: string;
  category?: string;
  fields: ParsedFieldData[];
}

export interface ParsedFieldData {
  type: FieldType;
  label_en: string;
  label_fr: string;
  description_en?: string;
  description_fr?: string;
  required?: boolean;
  options?: { label_en: string; label_fr: string; value: string }[];
  maxStars?: number;
  // Dynamic data source support
  use_dynamic_data?: boolean;
  data_source?: {
    entity_type: string;
    display_field: string;
    value_field: string;
    display_template?: string;
    filters?: { field: string; operator: string; value?: any }[];
    sort_field?: string;
    sort_order?: string;
    limit?: number;
  };
  // Cascading dependency support
  dependency?: {
    parent_field_id: string;
    parent_value_field: string;
    filter_field: string;
    clear_on_parent_change?: boolean;
  };
}

export interface FormCreationResult {
  success: boolean;
  form?: DynamicForm;
  message: string;
  editUrl?: string;
  error?: string;
}

// =====================================================
// Intent Detection - Smarter pattern matching
// =====================================================

/**
 * Detect if user wants to create a dynamic form
 * Uses intelligent pattern matching to understand various ways users might ask
 */
export function detectFormCreationIntent(message: string): {
  hasIntent: boolean;
  language: 'en' | 'fr';
  confidence: number;
  extractedContext: {
    formType?: string;
    mentionedFields?: string[];
    purpose?: string;
  };
} {
  const lowerMessage = message.toLowerCase();
  const originalMessage = message;

  console.log('[FormIntent] Detecting intent for:', lowerMessage.substring(0, 100));

  // Detect language with better accuracy
  const frenchIndicators = ['créer', 'formulaire', 'nouveau', 'nouvelle', 'checklist', 'ajouter', 'besoin', 'avec', 'pour', 'client', 'technicien', 'service', 'inspection'];
  const frenchScore = frenchIndicators.filter(p => lowerMessage.includes(p)).length;
  const language = frenchScore >= 2 ? 'fr' : 'en';

  // Check for /form command trigger (highest priority)
  const hasFormCommand = /^create\s+a\s+form\s+for\s+/i.test(lowerMessage) ||
    /^créer\s+un\s+formulaire\s+pour\s+/i.test(lowerMessage);

  // Form creation patterns - English (with confidence weights)
  const englishPatterns: Array<{ pattern: RegExp; weight: number }> = [
    // High confidence - "can you" + form creation (conversational)
    { pattern: /can\s+you\s+(?:please\s+)?(?:create|make|build|generate)\s+(?:a\s+)?(?:new\s+)?(?:dynamic\s+)?form/i, weight: 1.0 },
    { pattern: /could\s+you\s+(?:please\s+)?(?:create|make|build)\s+(?:a\s+)?form/i, weight: 1.0 },
    { pattern: /would\s+you\s+(?:please\s+)?(?:create|make|build)\s+(?:a\s+)?form/i, weight: 1.0 },

    // High confidence - explicit form creation with "please" or other polite prefixes
    { pattern: /(?:please\s+)?create\s+(a\s+)?(new\s+)?(dynamic\s+)?form/i, weight: 1.0 },
    { pattern: /(?:please\s+)?build\s+(a\s+)?(new\s+)?form/i, weight: 1.0 },
    { pattern: /(?:please\s+)?make\s+(a\s+)?(new\s+)?form/i, weight: 1.0 },
    { pattern: /(?:please\s+)?generate\s+(a\s+)?form/i, weight: 1.0 },
    { pattern: /(?:please\s+)?design\s+(a\s+)?(new\s+)?form/i, weight: 0.9 },
    { pattern: /(?:please\s+)?set\s+up\s+(a\s+)?form/i, weight: 0.9 },

    // Medium-high: "I need a form" variations (more flexible)
    { pattern: /i\s+need\s+(?:a\s+)?(?:new\s+)?form/i, weight: 0.95 },
    { pattern: /i\s+need\s+(?:a\s+)?(?:new\s+)?.*?form/i, weight: 0.9 },
    { pattern: /need\s+(?:a\s+)?form\s+(?:for|to|that|with)/i, weight: 0.9 },
    { pattern: /i\s+want\s+(?:a\s+)?(?:new\s+)?form/i, weight: 0.9 },
    { pattern: /i\s+want\s+to\s+create\s+(?:a\s+)?form/i, weight: 0.95 },
    { pattern: /i'd\s+like\s+(?:a\s+)?form/i, weight: 0.9 },

    // Comma-separated requests: "create a form, I need a form for..."
    { pattern: /create\s+(?:a\s+)?form[,.]?\s*i\s+need/i, weight: 1.0 },
    { pattern: /form[,.]?\s*i\s+need\s+(?:it\s+)?for/i, weight: 0.95 },

    // "form for X" patterns - very common
    { pattern: /form\s+for\s+\w+/i, weight: 0.95 },
    { pattern: /form\s+for\s+satisfaction/i, weight: 1.0 },

    // Satisfaction patterns - high priority
    { pattern: /satisfaction\s+form/i, weight: 1.0 },
    { pattern: /\bsatisfaction\b.*\bform\b/i, weight: 0.95 },
    { pattern: /\bform\b.*\bsatisfaction\b/i, weight: 0.95 },

    // Form with context keywords
    { pattern: /\bform\b.*\b(client|customer|website|development|project|car|vehicle|service)\b/i, weight: 0.9 },
    { pattern: /\b(client|customer|website|development|project|car|vehicle|service)\b.*\bform\b/i, weight: 0.9 },
    { pattern: /form\s+with\s+(?:text|signature|radio|checkbox|rating|dropdown)/i, weight: 0.85 },

    // Survey/checklist patterns
    { pattern: /customer\s+(?:form|checklist|survey|feedback)/i, weight: 0.85 },
    { pattern: /service\s+(?:form|checklist|report)/i, weight: 0.85 },
    { pattern: /inspection\s+(?:form|checklist|report)/i, weight: 0.85 },
    { pattern: /(?:please\s+)?create\s+(a\s+)?(new\s+)?checklist/i, weight: 0.9 },
    { pattern: /(?:please\s+)?build\s+(a\s+)?checklist/i, weight: 0.9 },

    // Lower confidence - contextual hints
    { pattern: /need\s+to\s+collect\s+(information|data|feedback)/i, weight: 0.6 },
    { pattern: /quick(ly)?\s+(form|checklist)/i, weight: 0.8 },
    { pattern: /(signature|radio\s*button|checkbox|rating)\s+(field|input)/i, weight: 0.7 },
  ];

  // Form creation patterns - French
  const frenchPatterns: Array<{ pattern: RegExp; weight: number }> = [
    { pattern: /(?:s'il\s+vous\s+pla[iî]t\s+)?créer\s+(un\s+)?(nouveau\s+)?formulaire/i, weight: 1.0 },
    { pattern: /construire\s+(un\s+)?formulaire/i, weight: 1.0 },
    { pattern: /générer\s+(un\s+)?formulaire/i, weight: 1.0 },
    { pattern: /faire\s+(un\s+)?formulaire/i, weight: 0.9 },
    { pattern: /j'ai\s+besoin\s+d'un\s+formulaire/i, weight: 0.95 },
    { pattern: /besoin\s+d'un\s+formulaire/i, weight: 0.9 },
    { pattern: /je\s+veux\s+(un\s+)?formulaire/i, weight: 0.9 },
    { pattern: /créer\s+(une\s+)?(nouvelle\s+)?checklist/i, weight: 0.9 },
    { pattern: /formulaire\s+pour\s+/i, weight: 0.95 },
    { pattern: /formulaire\s+de\s+satisfaction/i, weight: 1.0 },
    { pattern: /formulaire\s+satisfaction/i, weight: 0.95 },
    { pattern: /\bsatisfaction\b.*\bformulaire\b/i, weight: 0.95 },
    { pattern: /formulaire\s+avec\s+(?:texte|signature|radio|case)/i, weight: 0.85 },
    { pattern: /formulaire\s+de\s+(?:service|inspection)/i, weight: 0.9 },
    { pattern: /fiche\s+(?:client|intervention|inspection)/i, weight: 0.8 },
  ];

  // Calculate best confidence
  let bestEnglishScore = 0;
  let bestFrenchScore = 0;
  let matchedPattern = '';

  for (const { pattern, weight } of englishPatterns) {
    if (pattern.test(lowerMessage)) {
      if (weight > bestEnglishScore) {
        bestEnglishScore = weight;
        matchedPattern = pattern.source;
      }
    }
  }

  for (const { pattern, weight } of frenchPatterns) {
    if (pattern.test(lowerMessage)) {
      if (weight > bestFrenchScore) {
        bestFrenchScore = weight;
        matchedPattern = pattern.source;
      }
    }
  }

  const confidence = Math.max(bestEnglishScore, bestFrenchScore);
  const hasIntent = confidence >= 0.6 || hasFormCommand;

  console.log('[FormIntent] Detection result:', { hasIntent, confidence, matchedPattern, hasFormCommand });

  // Extract context from the message
  const extractedContext: {
    formType?: string;
    mentionedFields?: string[];
    purpose?: string;
  } = {};

  // Detect form type/purpose
  const typePatterns = [
    { pattern: /satisfaction|satisf/i, type: 'satisfaction' }, // Catch "satisfaction" and typos like "statisfaction"
    { pattern: /inspection|inspect/i, type: 'inspection' },
    { pattern: /service|intervention/i, type: 'service' },
    { pattern: /customer|client|feedback/i, type: 'customer' },
    { pattern: /checklist|check-?list/i, type: 'checklist' },
    { pattern: /survey|enquête|sondage/i, type: 'survey' },
    { pattern: /assessment|évaluation/i, type: 'assessment' },
    { pattern: /maintenance|entretien/i, type: 'maintenance' },
    { pattern: /installation/i, type: 'installation' },
  ];

  for (const { pattern, type } of typePatterns) {
    if (pattern.test(lowerMessage)) {
      extractedContext.formType = type;
      break;
    }
  }

  // Detect mentioned field types
  const fieldPatterns = [
    { pattern: /signature/i, field: 'signature' },
    { pattern: /text\s*(input|field)?/i, field: 'text' },
    { pattern: /radio\s*(button)?/i, field: 'radio' },
    { pattern: /checkbox|case\s*à\s*cocher/i, field: 'checkbox' },
    { pattern: /dropdown|select|liste\s*déroulante/i, field: 'select' },
    { pattern: /rating|star|étoile|note/i, field: 'rating' },
    { pattern: /date/i, field: 'date' },
    { pattern: /email|courriel/i, field: 'email' },
    { pattern: /phone|téléphone/i, field: 'phone' },
    { pattern: /description|textarea|zone\s*de\s*texte/i, field: 'textarea' },
  ];

  const mentionedFields: string[] = [];
  for (const { pattern, field } of fieldPatterns) {
    if (pattern.test(lowerMessage)) {
      mentionedFields.push(field);
    }
  }
  if (mentionedFields.length > 0) {
    extractedContext.mentionedFields = mentionedFields;
  }

  // Extract purpose phrase
  const purposeMatch = originalMessage.match(/(?:for|pour)\s+(.+?)(?:\s+with|\s+avec|\s+that|\s+qui|$)/i);
  if (purposeMatch) {
    extractedContext.purpose = purposeMatch[1].trim();
  }

  return {
    hasIntent,
    language: bestFrenchScore > bestEnglishScore ? 'fr' : language,
    confidence,
    extractedContext,
  };
}

/**
 * Async version of detectFormCreationIntent that uses LLM fallback for better recognition
 * Use this when you can await - it's smarter but slower
 */
export async function detectFormCreationIntentSmart(message: string): Promise<{
  hasIntent: boolean;
  language: 'en' | 'fr';
  confidence: number;
  source: 'regex' | 'llm' | 'combined';
  extractedContext: {
    formType?: string;
    mentionedFields?: string[];
    purpose?: string;
  };
}> {
  // First run regex detection
  const regexResult = detectFormCreationIntent(message);

  // If regex is confident enough, use it
  if (regexResult.confidence >= 0.8) {
    console.log('[FormIntent] Regex confident, using regex result');
    return {
      ...regexResult,
      source: 'regex',
    };
  }

  // Use smart LLM-based recognition for fuzzy matching
  console.log('[FormIntent] Low regex confidence, using smart recognizer');
  const smartResult = await detectFormIntentSmart(message, regexResult.confidence);

  // Merge the results
  return {
    hasIntent: smartResult.hasIntent,
    language: regexResult.language,
    confidence: smartResult.confidence,
    source: smartResult.source,
    extractedContext: {
      ...regexResult.extractedContext,
      formType: smartResult.topic || regexResult.extractedContext.formType,
      mentionedFields: smartResult.suggestedFields?.length
        ? smartResult.suggestedFields
        : regexResult.extractedContext.mentionedFields,
    },
  };
}

// =====================================================
// Form Parsing from AI Response
// =====================================================

/**
 * Parse form data from AI response
 */
export function parseFormFromResponse(content: string): ParsedFormData | null {
  try {
    console.log('[FormParser] Attempting to parse form from response, length:', content.length);

    // First try the new hidden format
    const hiddenMatch = content.match(/<!--FORM_JSON_START-->\s*([\s\S]*?)\s*<!--FORM_JSON_END-->/);
    if (hiddenMatch) {
      console.log('[FormParser] Found hidden JSON format');
      const data = JSON.parse(hiddenMatch[1].trim());
      if (data.name_en || data.nameEn || data.name) {
        console.log('[FormParser] Parsed form:', data.name_en || data.nameEn || data.name);
        return normalizeFormData(data);
      }
    }

    // Fallback: Look for JSON block in response
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      console.log('[FormParser] Found JSON code block');
      const data = JSON.parse(jsonMatch[1]);
      if (data.name_en || data.nameEn || data.name) {
        console.log('[FormParser] Parsed form:', data.name_en || data.nameEn || data.name);
        return normalizeFormData(data);
      }
    }

    // Try to find inline JSON object with form structure
    const inlineMatch = content.match(/\{\s*"(?:name_en|nameEn|name)"[\s\S]*?"fields"[\s\S]*?\}/);
    if (inlineMatch) {
      try {
        console.log('[FormParser] Found inline JSON');
        const data = JSON.parse(inlineMatch[0]);
        console.log('[FormParser] Parsed form:', data.name_en || data.nameEn || data.name);
        return normalizeFormData(data);
      } catch {
        // May be part of a larger structure
      }
    }

    console.log('[FormParser] No form structure found in response');
    return null;
  } catch (error) {
    console.error('[FormParser] Failed to parse form from response:', error);
    return null;
  }
}

/**
 * Normalize form data from various AI output formats
 */
function normalizeFormData(data: any): ParsedFormData | null {
  if (!data) return null;

  const name_en = data.name_en || data.nameEn || data.name || '';
  const name_fr = data.name_fr || data.nameFr || data.name || '';

  if (!name_en) return null;

  const fields: ParsedFieldData[] = [];
  const rawFields = data.fields || data.Fields || [];

  for (const f of rawFields) {
    const fieldType = normalizeFieldType(f.type || f.Type);
    if (!fieldType) continue;

    const field: ParsedFieldData = {
      type: fieldType,
      label_en: f.label_en || f.labelEn || f.label || '',
      label_fr: f.label_fr || f.labelFr || f.label || '',
      description_en: f.description_en || f.descriptionEn || f.description,
      description_fr: f.description_fr || f.descriptionFr || f.description,
      required: f.required ?? f.Required ?? false,
    };

    // Handle options for radio/checkbox/select (static options)
    if (['radio', 'checkbox', 'select'].includes(fieldType) && (f.options || f.Options)) {
      field.options = (f.options || f.Options).map((opt: any, idx: number) => ({
        label_en: opt.label_en || opt.labelEn || opt.label || opt.value || `Option ${idx + 1}`,
        label_fr: opt.label_fr || opt.labelFr || opt.label || opt.value || `Option ${idx + 1}`,
        value: opt.value || opt.Value || `option_${idx + 1}`,
      }));
    }

    // Handle dynamic data source for select/radio/checkbox
    const useDynamic = f.use_dynamic_data ?? f.useDynamicData ?? f.UseDynamicData ?? false;
    const rawDataSource = f.data_source || f.dataSource || f.DataSource;
    if (useDynamic && rawDataSource) {
      field.use_dynamic_data = true;
      field.data_source = {
        entity_type: rawDataSource.entity_type || rawDataSource.entityType || rawDataSource.EntityType || '',
        display_field: rawDataSource.display_field || rawDataSource.displayField || rawDataSource.DisplayField || 'name',
        value_field: rawDataSource.value_field || rawDataSource.valueField || rawDataSource.ValueField || 'id',
        display_template: rawDataSource.display_template || rawDataSource.displayTemplate || rawDataSource.DisplayTemplate,
        filters: (rawDataSource.filters || rawDataSource.Filters)?.map((fl: any) => ({
          field: fl.field || fl.Field || '',
          operator: fl.operator || fl.Operator || 'equals',
          value: fl.value ?? fl.Value,
        })),
        sort_field: rawDataSource.sort_field || rawDataSource.sortField || rawDataSource.SortField,
        sort_order: rawDataSource.sort_order || rawDataSource.sortOrder || rawDataSource.SortOrder,
        limit: rawDataSource.limit || rawDataSource.Limit,
      };
    }

    // Handle cascading dependency
    const rawDep = f.dependency || f.Dependency;
    if (rawDep) {
      field.dependency = {
        parent_field_id: rawDep.parent_field_id || rawDep.parentFieldId || rawDep.ParentFieldId || '',
        parent_value_field: rawDep.parent_value_field || rawDep.parentValueField || rawDep.ParentValueField || '',
        filter_field: rawDep.filter_field || rawDep.filterField || rawDep.FilterField || '',
        clear_on_parent_change: rawDep.clear_on_parent_change ?? rawDep.clearOnParentChange ?? rawDep.ClearOnParentChange ?? true,
      };
    }

    // Handle rating max stars
    if (fieldType === 'rating') {
      field.maxStars = f.maxStars || f.max_stars || 5;
    }

    fields.push(field);
  }

  return {
    name_en,
    name_fr,
    description_en: data.description_en || data.descriptionEn || data.description,
    description_fr: data.description_fr || data.descriptionFr || data.description,
    category: data.category || data.Category,
    fields,
  };
}

/**
 * Normalize field type string to valid FieldType
 */
function normalizeFieldType(type: string): FieldType | null {
  if (!type) return null;

  const typeMap: Record<string, FieldType> = {
    'text': 'text',
    'textinput': 'text',
    'text_input': 'text',
    'string': 'text',
    'textarea': 'textarea',
    'text_area': 'textarea',
    'multiline': 'textarea',
    'number': 'number',
    'numeric': 'number',
    'integer': 'number',
    'email': 'email',
    'mail': 'email',
    'phone': 'phone',
    'telephone': 'phone',
    'tel': 'phone',
    'date': 'date',
    'datepicker': 'date',
    'date_picker': 'date',
    'checkbox': 'checkbox',
    'check': 'checkbox',
    'checkboxes': 'checkbox',
    'radio': 'radio',
    'radiobutton': 'radio',
    'radio_button': 'radio',
    'radiobuttons': 'radio',
    'select': 'select',
    'dropdown': 'select',
    'selectlist': 'select',
    'section': 'section',
    'header': 'section',
    'sectionheader': 'section',
    'signature': 'signature',
    'sign': 'signature',
    'digital_signature': 'signature',
    'rating': 'rating',
    'stars': 'rating',
    'star_rating': 'rating',
    'page_break': 'page_break',
    'pagebreak': 'page_break',
    'page': 'page_break',
  };

  const normalized = type.toLowerCase().replace(/[-\s]/g, '_');
  return typeMap[normalized] || null;
}

// =====================================================
// Form Creation
// =====================================================

/**
 * Create a dynamic form from parsed data
 */
export async function createFormFromParsedData(data: ParsedFormData): Promise<FormCreationResult> {
  try {
    // Convert parsed fields to FormField format
    const fields: FormField[] = data.fields.map((f, index) => {
      const field: FormField = {
        id: `field_${Date.now()}_${index}`,
        type: f.type,
        label_en: f.label_en,
        label_fr: f.label_fr,
        description_en: f.description_en,
        description_fr: f.description_fr,
        required: f.required || false,
        order: index,
      };

      // Add options for choice fields (static)
      if (f.options && f.options.length > 0) {
        field.options = f.options.map((opt, optIdx) => ({
          id: `opt_${Date.now()}_${optIdx}`,
          value: opt.value,
          label_en: opt.label_en,
          label_fr: opt.label_fr,
        }));
      }

      // Add dynamic data source configuration
      if (f.use_dynamic_data && f.data_source) {
        field.use_dynamic_data = true;
        // Apply defaults from DEFAULT_DATA_SOURCES if available
        const entityType = f.data_source.entity_type as any;
        const defaults = DEFAULT_DATA_SOURCES[entityType as keyof typeof DEFAULT_DATA_SOURCES];
        field.data_source = {
          entity_type: f.data_source.entity_type as any,
          display_field: f.data_source.display_field || defaults?.display_field || 'name',
          value_field: f.data_source.value_field || defaults?.value_field || 'id',
          display_template: f.data_source.display_template,
          filters: f.data_source.filters?.map(fl => ({
            field: fl.field,
            operator: fl.operator as any,
            value: fl.value,
          })),
          sort_field: f.data_source.sort_field || defaults?.sort_field,
          sort_order: (f.data_source.sort_order || defaults?.sort_order) as 'asc' | 'desc' | undefined,
          limit: f.data_source.limit,
        };
      }

      // Add cascading dependency
      if (f.dependency) {
        field.dependency = {
          parent_field_id: f.dependency.parent_field_id,
          parent_value_field: f.dependency.parent_value_field,
          filter_field: f.dependency.filter_field,
          clear_on_parent_change: f.dependency.clear_on_parent_change ?? true,
        };
      }

      // Add rating config
      if (f.type === 'rating') {
        field.maxStars = f.maxStars || 5;
      }

      return field;
    });

    const dto: CreateDynamicFormDto = {
      name_en: data.name_en,
      name_fr: data.name_fr,
      description_en: data.description_en,
      description_fr: data.description_fr,
      category: data.category,
      fields,
    };

    console.log('[FormCreation] Creating form via API:', dto.name_en);
    const form = await dynamicFormsService.create(dto);
    console.log('[FormCreation] Form created successfully, ID:', form.id);

    // Invalidate the dynamic forms cache to refresh the list
    if (queryClientRef) {
      console.log('[FormCreation] Invalidating dynamic-forms cache');
      queryClientRef.invalidateQueries({ queryKey: ['dynamic-forms'] });
    }

    return {
      success: true,
      form,
      message: `Form "${form.name_en}" created successfully with ${fields.length} fields!`,
      editUrl: `/dashboard/settings/dynamic-forms/${form.id}/edit`,
    };
  } catch (error) {
    console.error('[FormCreation] Failed to create form:', error);
    return {
      success: false,
      message: 'Failed to create form',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =====================================================
// System Prompt for AI - Enhanced Intelligence
// =====================================================

/**
 * Get the system prompt instructions for form creation
 * Enhanced to be smarter about understanding user requests
 */
export function getFormCreationPrompt(language: 'en' | 'fr', extractedContext?: {
  formType?: string;
  mentionedFields?: string[];
  purpose?: string;
}): string {
  const availableTypes = FIELD_TYPES.map(f => f.type).join(', ');

  // Build context hints for the AI
  const contextHints = extractedContext ? `
### USER CONTEXT (use this to generate appropriate fields):
${extractedContext.formType ? `- Form Type: ${extractedContext.formType}` : ''}
${extractedContext.purpose ? `- Purpose: "${extractedContext.purpose}"` : ''}
${extractedContext.mentionedFields?.length ? `- Mentioned fields: ${extractedContext.mentionedFields.join(', ')}` : ''}
` : '';

  if (language === 'fr') {
    return `
## CRÉATION DE FORMULAIRES

Vous créez des formulaires dynamiques. Répondez de façon CONCISE.

${contextHints}

### TYPES DISPONIBLES: ${availableTypes}

### RÈGLES DE RÉPONSE:
1. **JAMAIS afficher de JSON à l'utilisateur** - Le JSON doit être caché dans un bloc spécial
2. **Réponse courte** - Max 2-3 phrases d'explication
3. **Générer immédiatement** si la demande est claire

### FORMAT DE RÉPONSE OBLIGATOIRE:

Écrivez une brève description (2-3 phrases max), puis le JSON dans ce format EXACT:

<!--FORM_JSON_START-->
{"name_en":"...","name_fr":"...","description_en":"...","description_fr":"...","category":"...","fields":[...]}
<!--FORM_JSON_END-->

### EXEMPLE DE BONNE RÉPONSE:

"J'ai préparé un formulaire d'inspection avec les champs essentiels: identification véhicule, vérifications techniques et signature du technicien.

<!--FORM_JSON_START-->
{"name_en":"Vehicle Inspection","name_fr":"Inspection Véhicule","fields":[{"type":"text","label_en":"Make/Model","label_fr":"Marque/Modèle","required":true}]}
<!--FORM_JSON_END-->"

### RÈGLES POUR LES CHAMPS:
- Labels en anglais ET français
- Champs essentiels = "required": true
- Grouper éléments similaires dans UN checkbox
- Ordre: identification → vérifications → notes → signature

### DONNÉES DYNAMIQUES (pour select/radio/checkbox):
Si l'utilisateur mentionne des données dynamiques (contacts, articles, matériaux, services, utilisateurs, offres, ventes, installations, ordres de service), utilisez:
- "use_dynamic_data": true
- "data_source": {"entity_type": "articles", "display_field": "name", "value_field": "id"}

Types d'entités disponibles: contacts, articles, materials, services, offers, sales, installations, users, service_orders

Exemple de champ dynamique:
{"type":"select","label_en":"Select Article","label_fr":"Sélectionner Article","required":true,"use_dynamic_data":true,"data_source":{"entity_type":"articles","display_field":"name","value_field":"id","sort_field":"name","sort_order":"asc"}}

### DÉPENDANCES EN CASCADE:
Pour les listes déroulantes dépendantes, ajoutez:
"dependency": {"parent_field_id": "field_id_parent", "parent_value_field": "id", "filter_field": "contactId", "clear_on_parent_change": true}
`;
  }

  return `
## FORM CREATION

You create dynamic forms. Respond CONCISELY.

${contextHints}

### AVAILABLE TYPES: ${availableTypes}

### RESPONSE RULES:
1. **NEVER show JSON to user** - JSON must be hidden in a special block
2. **Short response** - Max 2-3 sentences of explanation
3. **Generate immediately** if request is clear

### REQUIRED RESPONSE FORMAT:

Write a brief description (2-3 sentences max), then JSON in this EXACT format:

<!--FORM_JSON_START-->
{"name_en":"...","name_fr":"...","description_en":"...","description_fr":"...","category":"...","fields":[...]}
<!--FORM_JSON_END-->

### EXAMPLE GOOD RESPONSE:

"I've prepared an inspection form with essential fields: vehicle identification, technical checks, and technician signature.

<!--FORM_JSON_START-->
{"name_en":"Vehicle Inspection","name_fr":"Inspection Véhicule","fields":[{"type":"text","label_en":"Make/Model","label_fr":"Marque/Modèle","required":true}]}
<!--FORM_JSON_END-->"

### FIELD RULES:
- Labels in English AND French
- Essential fields = "required": true  
- Group similar items in ONE checkbox
- Order: identification → checks → notes → signature

### DYNAMIC DATA (for select/radio/checkbox):
If the user mentions dynamic data (contacts, articles, materials, services, users, offers, sales, installations, service orders), use:
- "use_dynamic_data": true
- "data_source": {"entity_type": "articles", "display_field": "name", "value_field": "id"}

Available entity types: contacts, articles, materials, services, offers, sales, installations, users, service_orders

Example dynamic field:
{"type":"select","label_en":"Select Article","label_fr":"Sélectionner Article","required":true,"use_dynamic_data":true,"data_source":{"entity_type":"articles","display_field":"name","value_field":"id","sort_field":"name","sort_order":"asc"}}

### CASCADING DEPENDENCIES:
For dependent dropdowns, add:
"dependency": {"parent_field_id": "field_id_parent", "parent_value_field": "id", "filter_field": "contactId", "clear_on_parent_change": true}
`;
}

/**
 * Format the creation result for display in chat
 */
export function formatFormCreationMessage(result: FormCreationResult, language: 'en' | 'fr'): string {
  if (!result.success) {
    return language === 'fr'
      ? `❌ Échec de la création du formulaire: ${result.error || 'Erreur inconnue'}`
      : `❌ Failed to create form: ${result.error || 'Unknown error'}`;
  }

  const form = result.form!;
  const fieldCount = form.fields.length;

  if (language === 'fr') {
    return `✅ **Formulaire créé avec succès!**

📋 **${form.name_fr || form.name_en}**
${form.description_fr ? `_${form.description_fr}_\n` : ''}
- **Champs:** ${fieldCount}
- **Statut:** Brouillon
- **Version:** ${form.version}

🔗 [Modifier le formulaire](${result.editUrl})
🔗 [Prévisualiser](${result.editUrl?.replace('/edit', '/preview')})

Vous pouvez maintenant modifier le formulaire ou le publier quand vous êtes prêt.`;
  }

  return `✅ **Form created successfully!**

📋 **${form.name_en}**
${form.description_en ? `_${form.description_en}_\n` : ''}
- **Fields:** ${fieldCount}
- **Status:** Created
- **Version:** ${form.version}

🔗 [Edit form](${result.editUrl})
🔗 [Preview](${result.editUrl?.replace('/edit', '/preview')})

You can now edit the form or publish it when ready.`;
}

// =====================================================
// Fallback Form Generation
// =====================================================

/**
 * Generate a form based on user request when AI doesn't provide JSON
 * This is the fallback that ensures forms always get created
 */
export function generateFormFromRequest(userMessage: string, extractedContext?: {
  formType?: string;
  mentionedFields?: string[];
  purpose?: string;
}): ParsedFormData {
  const lowerMessage = userMessage.toLowerCase();

  // Detect language
  const frenchWords = ['formulaire', 'créer', 'satisfaction', 'client', 'service', 'pour', 'avec'];
  const isFrench = frenchWords.filter(w => lowerMessage.includes(w)).length >= 2;

  // Extract form purpose/name from message
  let formNameEn = 'Custom Form';
  let formNameFr = 'Formulaire Personnalisé';
  let category = 'general';

  // Detect form type and set appropriate name
  // Check combined conditions first (more specific matches)
  // Also catch common typos like "statisfaction"
  const isSatisfaction = lowerMessage.includes('satisfaction') || lowerMessage.includes('satisf') || lowerMessage.includes('feedback') || extractedContext?.formType === 'satisfaction';
  const isCarRelated = lowerMessage.includes('car') || lowerMessage.includes('vehicle') || lowerMessage.includes('voiture') || lowerMessage.includes('véhicule') || lowerMessage.includes('auto') || lowerMessage.includes('repair');
  const isWebsiteRelated = lowerMessage.includes('website') || lowerMessage.includes('site web') || lowerMessage.includes('web site') || lowerMessage.includes('development') || lowerMessage.includes('développement');
  const isProjectRelated = lowerMessage.includes('project') || lowerMessage.includes('projet');
  const isClientRelated = lowerMessage.includes('client') || lowerMessage.includes('customer');

  console.log('[FormGen] Keywords detected:', { isSatisfaction, isCarRelated, isWebsiteRelated, isProjectRelated, isClientRelated, extractedContext });

  if (isSatisfaction && isCarRelated) {
    // Car repair satisfaction form - most specific match
    formNameEn = 'Car Repair Satisfaction Form';
    formNameFr = 'Formulaire de Satisfaction Réparation Auto';
    category = 'automotive';
  } else if (isSatisfaction && isWebsiteRelated) {
    // Website development satisfaction form
    formNameEn = 'Website Development Satisfaction Form';
    formNameFr = 'Formulaire de Satisfaction Développement Web';
    category = 'web_development';
  } else if (isSatisfaction && isProjectRelated) {
    // Project satisfaction form
    formNameEn = 'Project Satisfaction Form';
    formNameFr = 'Formulaire de Satisfaction Projet';
    category = 'project';
  } else if (isSatisfaction && isClientRelated) {
    // Client satisfaction form
    formNameEn = 'Client Satisfaction Form';
    formNameFr = 'Formulaire de Satisfaction Client';
    category = 'customer';
  } else if (isCarRelated) {
    if (lowerMessage.includes('inspection')) {
      formNameEn = 'Vehicle Inspection Checklist';
      formNameFr = 'Checklist d\'Inspection Véhicule';
    } else {
      formNameEn = 'Vehicle Service Form';
      formNameFr = 'Formulaire Service Véhicule';
    }
    category = 'automotive';
  } else if (isWebsiteRelated) {
    if (isSatisfaction) {
      formNameEn = 'Website Development Satisfaction Form';
      formNameFr = 'Formulaire de Satisfaction Développement Web';
    } else {
      formNameEn = 'Website Project Form';
      formNameFr = 'Formulaire Projet Web';
    }
    category = 'web_development';
  } else if (isSatisfaction) {
    formNameEn = 'Customer Satisfaction Survey';
    formNameFr = 'Enquête de Satisfaction Client';
    category = 'survey';
  } else if (lowerMessage.includes('inspection')) {
    formNameEn = 'Inspection Checklist';
    formNameFr = 'Checklist d\'Inspection';
    category = 'inspection';
  } else if (lowerMessage.includes('service')) {
    formNameEn = 'Service Report Form';
    formNameFr = 'Formulaire de Rapport de Service';
    category = 'service';
  } else if (isClientRelated) {
    formNameEn = 'Customer Information Form';
    formNameFr = 'Formulaire d\'Information Client';
    category = 'customer';
  } else if (extractedContext?.purpose) {
    formNameEn = `${extractedContext.purpose.charAt(0).toUpperCase() + extractedContext.purpose.slice(1)} Form`;
    formNameFr = `Formulaire ${extractedContext.purpose}`;
  }

  console.log('[FormGen] Generated form name:', formNameEn, 'category:', category);

  // Generate appropriate fields based on form type
  const fields: ParsedFieldData[] = [];

  // Add section header
  fields.push({
    type: 'section',
    label_en: 'General Information',
    label_fr: 'Informations Générales',
    required: false,
  });

  // Common identification fields based on category
  if (category === 'automotive' || lowerMessage.includes('car') || lowerMessage.includes('vehicle')) {
    fields.push(
      { type: 'text', label_en: 'Customer Name', label_fr: 'Nom du Client', required: true },
      { type: 'phone', label_en: 'Phone Number', label_fr: 'Numéro de Téléphone', required: false },
      { type: 'text', label_en: 'Vehicle Make/Model', label_fr: 'Marque/Modèle du Véhicule', required: true },
      { type: 'text', label_en: 'License Plate', label_fr: 'Plaque d\'Immatriculation', required: true },
      { type: 'date', label_en: 'Service Date', label_fr: 'Date de Service', required: true }
    );

    // Add section for service details
    fields.push({
      type: 'section',
      label_en: 'Service Details',
      label_fr: 'Détails du Service',
      required: false,
    });

    fields.push({
      type: 'checkbox',
      label_en: 'Services Performed',
      label_fr: 'Services Effectués',
      required: true,
      options: [
        { label_en: 'Oil Change', label_fr: 'Vidange', value: 'oil_change' },
        { label_en: 'Brake Service', label_fr: 'Service Freins', value: 'brakes' },
        { label_en: 'Tire Service', label_fr: 'Service Pneus', value: 'tires' },
        { label_en: 'Engine Repair', label_fr: 'Réparation Moteur', value: 'engine' },
        { label_en: 'Electrical', label_fr: 'Électrique', value: 'electrical' },
        { label_en: 'Air Conditioning', label_fr: 'Climatisation', value: 'ac' },
        { label_en: 'Other', label_fr: 'Autre', value: 'other' },
      ],
    });
  } else if (category === 'web_development' || isWebsiteRelated) {
    fields.push(
      { type: 'text', label_en: 'Client Name', label_fr: 'Nom du Client', required: true },
      { type: 'text', label_en: 'Company', label_fr: 'Société', required: false },
      { type: 'email', label_en: 'Email Address', label_fr: 'Adresse Email', required: true },
      { type: 'text', label_en: 'Project/Website Name', label_fr: 'Nom du Projet/Site', required: true },
      { type: 'date', label_en: 'Completion Date', label_fr: 'Date de Livraison', required: true }
    );

    // Add section for project details
    fields.push({
      type: 'section',
      label_en: 'Project Details',
      label_fr: 'Détails du Projet',
      required: false,
    });

    fields.push({
      type: 'checkbox',
      label_en: 'Features Delivered',
      label_fr: 'Fonctionnalités Livrées',
      required: false,
      options: [
        { label_en: 'Design & UI', label_fr: 'Design & Interface', value: 'design' },
        { label_en: 'Responsive Layout', label_fr: 'Mise en Page Responsive', value: 'responsive' },
        { label_en: 'Content Management', label_fr: 'Gestion de Contenu', value: 'cms' },
        { label_en: 'E-commerce', label_fr: 'E-commerce', value: 'ecommerce' },
        { label_en: 'SEO Optimization', label_fr: 'Optimisation SEO', value: 'seo' },
        { label_en: 'Hosting & Deployment', label_fr: 'Hébergement & Déploiement', value: 'hosting' },
      ],
    });
  } else {
    fields.push(
      { type: 'text', label_en: 'Full Name', label_fr: 'Nom Complet', required: true },
      { type: 'email', label_en: 'Email Address', label_fr: 'Adresse Email', required: false },
      { type: 'phone', label_en: 'Phone Number', label_fr: 'Numéro de Téléphone', required: false },
      { type: 'date', label_en: 'Date', label_fr: 'Date', required: true }
    );
  }

  // Add satisfaction/rating section for satisfaction forms
  if (category === 'survey' || isSatisfaction) {
    fields.push({
      type: 'section',
      label_en: 'Satisfaction Assessment',
      label_fr: 'Évaluation de la Satisfaction',
      required: false,
    });

    fields.push(
      { type: 'rating', label_en: 'Overall Satisfaction', label_fr: 'Satisfaction Globale', required: true, maxStars: 5 },
      { type: 'rating', label_en: 'Quality of Work', label_fr: 'Qualité du Travail', required: true, maxStars: 5 },
      { type: 'rating', label_en: 'Customer Service', label_fr: 'Service Client', required: true, maxStars: 5 },
      { type: 'rating', label_en: 'Value for Money', label_fr: 'Rapport Qualité/Prix', required: true, maxStars: 5 }
    );

    fields.push({
      type: 'radio',
      label_en: 'Would you recommend us?',
      label_fr: 'Nous recommanderiez-vous ?',
      required: true,
      options: [
        { label_en: 'Definitely Yes', label_fr: 'Certainement Oui', value: 'definitely' },
        { label_en: 'Probably Yes', label_fr: 'Probablement Oui', value: 'probably' },
        { label_en: 'Not Sure', label_fr: 'Pas Sûr', value: 'not_sure' },
        { label_en: 'Probably No', label_fr: 'Probablement Non', value: 'probably_no' },
        { label_en: 'Definitely No', label_fr: 'Certainement Non', value: 'definitely_no' },
      ],
    });
  }

  // Add comments/feedback section
  fields.push({
    type: 'section',
    label_en: 'Additional Feedback',
    label_fr: 'Commentaires Supplémentaires',
    required: false,
  });

  fields.push(
    { type: 'textarea', label_en: 'Comments or Suggestions', label_fr: 'Commentaires ou Suggestions', required: false },
    { type: 'signature', label_en: 'Customer Signature', label_fr: 'Signature du Client', required: false }
  );

  return {
    name_en: formNameEn,
    name_fr: formNameFr,
    description_en: `Auto-generated ${formNameEn.toLowerCase()} based on your request.`,
    description_fr: `${formNameFr} généré automatiquement selon votre demande.`,
    category,
    fields,
  };
}

// =====================================================
// Combined Handler for AI Assistant
// =====================================================

export interface PendingFormCreation {
  data: ParsedFormData;
  displayText: string;
}

/**
 * Parse form creation from AI response and return pending creation data
 * Falls back to generating a form from the original request if parsing fails
 */
export function parseFormCreationFromResponse(
  content: string,
  originalRequest?: string,
  extractedContext?: {
    formType?: string;
    mentionedFields?: string[];
    purpose?: string;
  }
): PendingFormCreation | null {
  console.log('[FormParser] Starting parseFormCreationFromResponse');
  console.log('[FormParser] Content length:', content?.length || 0);
  console.log('[FormParser] Original request:', originalRequest?.substring(0, 100));

  // First try to parse from AI response
  let formData = parseFormFromResponse(content || '');
  console.log('[FormParser] Parsed from response:', formData ? `${formData.name_en} (${formData.fields.length} fields)` : 'null');

  // If parsing failed or no fields, but we have the original request, generate a form from it
  if ((!formData || formData.fields.length === 0) && originalRequest) {
    console.log('[FormParser] AI response parsing failed or empty, generating form from request');
    formData = generateFormFromRequest(originalRequest, extractedContext);
    console.log('[FormParser] Generated form:', formData ? `${formData.name_en} (${formData.fields.length} fields)` : 'null');
  }

  if (!formData || formData.fields.length === 0) {
    console.log('[FormParser] Final result: null (no valid form data)');
    return null;
  }

  console.log('[FormParser] Final result:', formData.name_en, 'with', formData.fields.length, 'fields');
  return {
    data: formData,
    displayText: `${formData.name_en} (${formData.fields.length} fields)`,
  };
}

/**
 * Create form from pending creation data
 */
export async function executeFormCreation(
  data: ParsedFormData,
  language: 'en' | 'fr'
): Promise<{ result: FormCreationResult; formattedMessage: string }> {
  const result = await createFormFromParsedData(data);
  const formattedMessage = formatFormCreationMessage(result, language);
  return { result, formattedMessage };
}
