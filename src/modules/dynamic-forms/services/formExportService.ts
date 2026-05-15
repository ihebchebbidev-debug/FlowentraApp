// Form Export Service - Export form responses to other entities
import { articlesApi } from '@/services/api/articlesApi';
import { contactsApi } from '@/services/api/contactsApi';
import { installationsApi } from '@/services/api/installationsApi';
import { DynamicFormResponse, FormField } from '../types';
import {
  ExportEntityType,
  ExportFieldMapping,
  ExportTransform,
  ExportResult,
  BatchExportResult,
  FormExportConfig,
} from '../types/exportTypes';

// =====================================================
// Transform Functions
// =====================================================

function applyTransform(value: any, transform: ExportTransform = 'none'): any {
  if (value === null || value === undefined) return value;
  
  switch (transform) {
    case 'uppercase':
      return typeof value === 'string' ? value.toUpperCase() : value;
    case 'lowercase':
      return typeof value === 'string' ? value.toLowerCase() : value;
    case 'trim':
      return typeof value === 'string' ? value.trim() : value;
    case 'number':
      const num = parseFloat(String(value));
      return isNaN(num) ? 0 : num;
    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes' || value.toLowerCase() === 'oui';
      }
      return Boolean(value);
    case 'date':
      try {
        const date = new Date(value);
        return date.toISOString();
      } catch {
        return value;
      }
    case 'join_comma':
      return Array.isArray(value) ? value.join(', ') : String(value);
    case 'first_item':
      return Array.isArray(value) ? value[0] : value;
    case 'none':
    default:
      return value;
  }
}

// =====================================================
// Build Entity Payload
// =====================================================

function buildEntityPayload(
  response: DynamicFormResponse,
  mappings: ExportFieldMapping[],
  defaultValues?: Record<string, any>
): Record<string, any> {
  const payload: Record<string, any> = { ...defaultValues };
  
  for (const mapping of mappings) {
    const value = response.responses[mapping.form_field_id];
    if (value !== undefined && value !== null && value !== '') {
      payload[mapping.entity_field] = applyTransform(value, mapping.transform);
    }
  }
  
  return payload;
}

// =====================================================
// Export Functions
// =====================================================

async function exportToContact(payload: Record<string, any>): Promise<ExportResult> {
  try {
    // Ensure required fields - firstName and lastName are required by the API
    const firstName = payload.firstName || (payload.name ? payload.name.split(' ')[0] : '');
    const lastName = payload.lastName || (payload.name ? payload.name.split(' ').slice(1).join(' ') : '');
    
    if (!firstName && !lastName) {
      return {
        success: false,
        entity_type: 'contact',
        message_en: 'First name or last name is required',
        message_fr: 'Le prénom ou le nom est requis',
        error: 'Missing required fields',
      };
    }
    
    if (!payload.email) {
      return {
        success: false,
        entity_type: 'contact',
        message_en: 'Email is required',
        message_fr: 'Le courriel est requis',
        error: 'Missing email',
      };
    }
    
    // Build contact request - matches CreateContactRequest interface exactly
    const request = {
      firstName: firstName,
      lastName: lastName || firstName, // Backend may require both
      email: payload.email,
      phone: payload.phone,
      company: payload.company,
      position: payload.position,
      address: payload.address,
      status: payload.status || 'lead',
      type: payload.type || 'individual',
      cin: payload.cin,
      matriculeFiscale: payload.matriculeFiscale,
    };
    
    const contact = await contactsApi.create(request);
    
    return {
      success: true,
      entity_id: contact.id,
      entity_type: 'contact',
      message_en: `Contact "${contact.name}" created successfully`,
      message_fr: `Contact "${contact.name}" créé avec succès`,
    };
  } catch (error: any) {
    return {
      success: false,
      entity_type: 'contact',
      message_en: 'Failed to create contact',
      message_fr: 'Échec de création du contact',
      error: error.message,
    };
  }
}

async function exportToArticle(payload: Record<string, any>): Promise<ExportResult> {
  try {
    // Ensure required fields
    if (!payload.name) {
      return {
        success: false,
        entity_type: 'article',
        message_en: 'Article name is required',
        message_fr: 'Le nom de l\'article est requis',
        error: 'Missing name',
      };
    }
    
    // Build article request - matches CreateArticleRequest interface
    // Note: Backend uses different field names (purchasePrice, salesPrice, stockQuantity)
    // but the articlesApi.create() handles the mapping internally
    const request = {
      name: payload.name,
      description: payload.description,
      type: (payload.type || 'material') as 'material' | 'service',
      sku: payload.sku,
      category: payload.category || 'general',
      status: 'active' as const,
      // Map frontend field names to what articlesApi expects
      costPrice: payload.costPrice, // API maps to purchasePrice
      sellPrice: payload.sellPrice, // API maps to salesPrice
      stock: payload.stock, // API maps to stockQuantity
      minStock: payload.minStock, // API maps to minStockLevel
      supplier: payload.supplier,
      basePrice: payload.basePrice, // For services
      duration: payload.duration, // For services
      notes: payload.notes,
    };
    
    const article = await articlesApi.create(request);
    
    return {
      success: true,
      entity_id: article.id,
      entity_type: 'article',
      message_en: `Article "${article.name}" created successfully`,
      message_fr: `Article "${article.name}" créé avec succès`,
    };
  } catch (error: any) {
    return {
      success: false,
      entity_type: 'article',
      message_en: 'Failed to create article',
      message_fr: 'Échec de création de l\'article',
      error: error.message,
    };
  }
}

async function exportToInstallation(payload: Record<string, any>): Promise<ExportResult> {
  try {
    // Ensure required fields
    if (!payload.contactId) {
      return {
        success: false,
        entity_type: 'installation',
        message_en: 'Contact ID is required',
        message_fr: 'L\'ID du contact est requis',
        error: 'Missing contactId',
      };
    }
    
    // Build installation request - matches CreateInstallationDto interface
    // The installationsApi.create() expects camelCase and handles PascalCase conversion
    const request = {
      contactId: Number(payload.contactId),
      name: payload.name,
      siteAddress: payload.siteAddress || payload.address || payload.name || 'Default Site',
      installationType: payload.installationType || payload.type || 'general',
      model: payload.model,
      manufacturer: payload.manufacturer,
      serialNumber: payload.serialNumber,
      category: payload.category,
      type: payload.type,
      status: payload.status || 'active',
      notes: payload.notes,
      // Warranty is optional
      warranty: payload.warrantyTo ? {
        hasWarranty: true,
        warrantyFrom: payload.warrantyFrom,
        warrantyTo: payload.warrantyTo,
      } : undefined,
    };
    
    const installation = await installationsApi.create(request);
    
    return {
      success: true,
      entity_id: installation.id,
      entity_type: 'installation',
      message_en: `Installation "${installation.name || installation.installationNumber}" created successfully`,
      message_fr: `Installation "${installation.name || installation.installationNumber}" créée avec succès`,
    };
  } catch (error: any) {
    return {
      success: false,
      entity_type: 'installation',
      message_en: 'Failed to create installation',
      message_fr: 'Échec de création de l\'installation',
      error: error.message,
    };
  }
}

// =====================================================
// Main Export Service
// =====================================================

export const formExportService = {
  /**
   * Export a single form response to an entity
   */
  async exportResponse(
    response: DynamicFormResponse,
    entityType: ExportEntityType,
    mappings: ExportFieldMapping[],
    defaultValues?: Record<string, any>
  ): Promise<ExportResult> {
    const payload = buildEntityPayload(response, mappings, defaultValues);
    
    switch (entityType) {
      case 'contact':
        return exportToContact(payload);
      case 'article':
        return exportToArticle(payload);
      case 'installation':
        return exportToInstallation(payload);
      default:
        return {
          success: false,
          entity_type: entityType,
          message_en: `Unknown entity type: ${entityType}`,
          message_fr: `Type d'entité inconnu: ${entityType}`,
          error: 'Unknown entity type',
        };
    }
  },

  /**
   * Export multiple form responses to entities (batch)
   */
  async exportResponses(
    responses: DynamicFormResponse[],
    entityType: ExportEntityType,
    mappings: ExportFieldMapping[],
    defaultValues?: Record<string, any>
  ): Promise<BatchExportResult> {
    const results: ExportResult[] = [];
    let successful = 0;
    let failed = 0;
    
    for (const response of responses) {
      const result = await this.exportResponse(response, entityType, mappings, defaultValues);
      results.push(result);
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }
    
    return {
      total: responses.length,
      successful,
      failed,
      results,
    };
  },

  /**
   * Export using a saved export configuration
   */
  async exportWithConfig(
    responses: DynamicFormResponse[],
    config: FormExportConfig
  ): Promise<BatchExportResult> {
    return this.exportResponses(
      responses,
      config.entity_type,
      config.mappings,
      config.default_values
    );
  },

  /**
   * Validate mappings before export
   */
  validateMappings(
    mappings: ExportFieldMapping[],
    entityType: ExportEntityType,
    formFields: FormField[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check that mapped form fields exist
    for (const mapping of mappings) {
      const fieldExists = formFields.some(f => f.id === mapping.form_field_id);
      if (!fieldExists) {
        errors.push(`Form field "${mapping.form_field_id}" does not exist`);
      }
    }
    
    // Check required fields based on entity type
    const mappedEntityFields = mappings.map(m => m.entity_field);
    
    if (entityType === 'contact') {
      if (!mappedEntityFields.includes('email')) {
        errors.push('Email field mapping is required for contacts');
      }
      // Accept name OR firstName/lastName
      if (!mappedEntityFields.includes('firstName') && !mappedEntityFields.includes('lastName') && !mappedEntityFields.includes('name')) {
        errors.push('First name, last name, or full name mapping is required for contacts');
      }
    } else if (entityType === 'article') {
      if (!mappedEntityFields.includes('name')) {
        errors.push('Name field mapping is required for articles');
      }
    } else if (entityType === 'installation') {
      if (!mappedEntityFields.includes('contactId')) {
        errors.push('Contact ID field mapping is required for installations');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Suggest field mappings based on field labels (AI-like matching)
   */
  suggestMappings(
    formFields: FormField[],
    entityType: ExportEntityType,
    language: 'en' | 'fr' = 'en'
  ): ExportFieldMapping[] {
    const suggestions: ExportFieldMapping[] = [];
    
    // Keywords to match
    const keywordMap: Record<ExportEntityType, Record<string, string[]>> = {
      contact: {
        name: ['name', 'nom', 'full name', 'nom complet', 'your name', 'votre nom'],
        firstName: ['first name', 'prénom', 'firstname', 'prenom', 'given name'],
        lastName: ['last name', 'nom de famille', 'lastname', 'family name', 'surname'],
        email: ['email', 'courriel', 'e-mail', 'mail'],
        phone: ['phone', 'téléphone', 'telephone', 'tel', 'mobile', 'cellulaire'],
        company: ['company', 'entreprise', 'société', 'organization', 'organisation'],
        position: ['position', 'poste', 'job', 'title', 'titre', 'role', 'fonction'],
        address: ['address', 'adresse', 'location', 'lieu'],
      },
      article: {
        name: ['name', 'nom', 'article name', 'product name', 'title', 'titre'],
        description: ['description', 'details', 'détails'],
        type: ['type', 'kind', 'genre'],
        sku: ['sku', 'code', 'numéro', 'number', 'ref', 'reference'],
        category: ['category', 'catégorie', 'categorie'],
        costPrice: ['cost', 'coût', 'price', 'prix', 'purchase'],
        sellPrice: ['sell', 'vente', 'sale', 'price', 'prix'],
        supplier: ['supplier', 'fournisseur', 'vendor'],
      },
      installation: {
        contactId: ['contact', 'client', 'customer'],
        name: ['name', 'nom', 'installation name', 'equipment name'],
        siteAddress: ['site', 'address', 'adresse', 'location', 'emplacement'],
        installationType: ['type', 'installation type'],
        model: ['model', 'modèle', 'modele'],
        manufacturer: ['manufacturer', 'fabricant', 'brand', 'marque'],
        serialNumber: ['serial', 'numéro de série', 'sn', 'serial number'],
        category: ['category', 'catégorie'],
      },
    };
    
    const keywords = keywordMap[entityType];
    if (!keywords) return suggestions;
    
    for (const field of formFields) {
      // Skip non-input fields
      if (['section', 'page_break', 'content'].includes(field.type)) continue;
      
      const label = (language === 'fr' ? field.label_fr : field.label_en).toLowerCase();
      
      for (const [entityField, fieldKeywords] of Object.entries(keywords)) {
        if (fieldKeywords.some(kw => label.includes(kw))) {
          // Don't add duplicate mappings
          if (!suggestions.some(s => s.entity_field === entityField)) {
            suggestions.push({
              form_field_id: field.id,
              entity_field: entityField,
              transform: 'none',
            });
          }
          break;
        }
      }
    }
    
    return suggestions;
  },
};
