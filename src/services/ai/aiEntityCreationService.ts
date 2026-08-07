// AI Entity Creation Service
// Handles creating contacts, installations, articles directly from chat
import { contactsApi } from '@/services/api/contactsApi';
import { installationsApi } from '@/services/api/installationsApi';
import { articlesApi } from '@/services/api/articlesApi';
import type { CreateContactRequest, Contact } from '@/types/contacts';
import type { CreateInstallationDto, InstallationDto } from '@/modules/field/installations/types';
import type { CreateArticleRequest, Article } from '@/types/articles';

// =====================================================
// Entity Detection & Parsing
// =====================================================

export interface ParsedContactData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  type?: string;
  status?: string;
}

export interface ParsedInstallationData {
  contactId: number;
  name?: string;
  model?: string;
  manufacturer?: string;
  category?: string;
  type?: string;
  siteAddress?: string;
  status?: string;
  serialNumber?: string;
  notes?: string;
}

export interface ParsedArticleData {
  name: string;
  description?: string;
  type: 'material' | 'service';
  category?: string;
  stock?: number;
  costPrice?: number;
  sellPrice?: number;
  basePrice?: number;
  duration?: number;
}

export type EntityType = 'contact' | 'installation' | 'article';

export interface EntityCreationResult {
  success: boolean;
  entity?: Contact | InstallationDto | Article;
  entityType: EntityType;
  message: string;
  error?: string;
}

// =====================================================
// Intent Detection
// =====================================================

/**
 * Detect if user wants to create an entity from their message
 */
export function detectEntityCreationIntent(message: string): { 
  hasIntent: boolean; 
  entityType?: EntityType;
  language: 'en' | 'fr';
} {
  const lowerMessage = message.toLowerCase();
  
  // Detect language
  const frenchPatterns = ['créer', 'ajouter', 'nouveau', 'nouvelle', 'enregistrer'];
  const language = frenchPatterns.some(p => lowerMessage.includes(p)) ? 'fr' : 'en';
  
  // Contact creation patterns
  const contactPatterns = [
    /create\s+(a\s+)?(new\s+)?contact/i,
    /add\s+(a\s+)?(new\s+)?contact/i,
    /new\s+contact/i,
    /créer\s+(un\s+)?(nouveau\s+)?contact/i,
    /ajouter\s+(un\s+)?(nouveau\s+)?contact/i,
    /nouveau\s+contact/i,
  ];
  
  // Installation creation patterns
  const installationPatterns = [
    /create\s+(a\s+)?(new\s+)?installation/i,
    /add\s+(a\s+)?(new\s+)?installation/i,
    /new\s+installation/i,
    /créer\s+(une\s+)?(nouvelle\s+)?installation/i,
    /ajouter\s+(une\s+)?(nouvelle\s+)?installation/i,
    /nouvelle\s+installation/i,
  ];
  
  // Article creation patterns
  const articlePatterns = [
    /create\s+(a\s+)?(new\s+)?article/i,
    /create\s+(a\s+)?(new\s+)?material/i,
    /create\s+(a\s+)?(new\s+)?service/i,
    /add\s+(a\s+)?(new\s+)?article/i,
    /add\s+(a\s+)?(new\s+)?material/i,
    /add\s+(a\s+)?(new\s+)?service/i,
    /créer\s+(un\s+)?(nouvel?\s+)?article/i,
    /créer\s+(un\s+)?(nouveau\s+)?matériel/i,
    /créer\s+(un\s+)?(nouveau\s+)?service/i,
    /ajouter\s+(un\s+)?(nouvel?\s+)?article/i,
  ];
  
  if (contactPatterns.some(p => p.test(lowerMessage))) {
    return { hasIntent: true, entityType: 'contact', language };
  }
  
  if (installationPatterns.some(p => p.test(lowerMessage))) {
    return { hasIntent: true, entityType: 'installation', language };
  }
  
  if (articlePatterns.some(p => p.test(lowerMessage))) {
    return { hasIntent: true, entityType: 'article', language };
  }
  
  return { hasIntent: false, language };
}

// =====================================================
// Entity Parsing from AI Response
// =====================================================

/**
 * Parse contact data from AI response
 */
export function parseContactFromResponse(content: string): ParsedContactData | null {
  try {
    // Look for JSON block in response
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[1]);
      if (data.firstName || data.lastName || data.name) {
        // Handle full name if firstName/lastName not provided
        if (data.name && !data.firstName && !data.lastName) {
          const parts = data.name.split(' ');
          data.firstName = parts[0] || '';
          data.lastName = parts.slice(1).join(' ') || '';
        }
        return data as ParsedContactData;
      }
    }
    
    // Try to find inline JSON object
    const inlineMatch = content.match(/\{[\s\S]*?"(?:firstName|lastName|name)"[\s\S]*?\}/);
    if (inlineMatch) {
      const data = JSON.parse(inlineMatch[0]);
      if (data.name && !data.firstName && !data.lastName) {
        const parts = data.name.split(' ');
        data.firstName = parts[0] || '';
        data.lastName = parts.slice(1).join(' ') || '';
      }
      return data as ParsedContactData;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse installation data from AI response
 */
export function parseInstallationFromResponse(content: string): ParsedInstallationData | null {
  try {
    // Look for JSON block in response
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[1]);
      if (data.contactId && (data.name || data.siteAddress)) {
        return data as ParsedInstallationData;
      }
    }
    
    // Try to find inline JSON object
    const inlineMatch = content.match(/\{[\s\S]*?"(?:contactId|name|siteAddress)"[\s\S]*?\}/);
    if (inlineMatch) {
      const data = JSON.parse(inlineMatch[0]);
      if (data.contactId) {
        return data as ParsedInstallationData;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse article data from AI response
 */
export function parseArticleFromResponse(content: string): ParsedArticleData | null {
  try {
    // Look for JSON block in response
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[1]);
      if (data.name) {
        return {
          ...data,
          type: data.type || 'material'
        } as ParsedArticleData;
      }
    }
    
    // Try to find inline JSON object
    const inlineMatch = content.match(/\{[\s\S]*?"name"[\s\S]*?\}/);
    if (inlineMatch) {
      const data = JSON.parse(inlineMatch[0]);
      if (data.name) {
        return {
          ...data,
          type: data.type || 'material'
        } as ParsedArticleData;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

// =====================================================
// Entity Creation via API
// =====================================================

/**
 * Create a contact via API
 */
export async function createContactFromChat(data: ParsedContactData): Promise<EntityCreationResult> {
  try {
    const request: CreateContactRequest = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || '',
      phone: data.phone,
      company: data.company,
      position: data.position,
      type: (data.type as 'individual' | 'company' | 'partner') || 'individual',
      status: (data.status as 'active' | 'inactive' | 'lead' | 'customer' | 'partner') || 'active',
    };
    
    const contact = await contactsApi.create(request);
    
    return {
      success: true,
      entity: contact,
      entityType: 'contact',
      message: `Contact "${contact.name}" created successfully!`
    };
  } catch (error) {
    return {
      success: false,
      entityType: 'contact',
      message: 'Failed to create contact',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create an installation via API
 */
export async function createInstallationFromChat(data: ParsedInstallationData): Promise<EntityCreationResult> {
  try {
    const request: CreateInstallationDto = {
      contactId: data.contactId,
      name: data.name,
      model: data.model,
      manufacturer: data.manufacturer,
      category: data.category,
      type: data.type,
      siteAddress: data.siteAddress,
      status: data.status || 'active',
      serialNumber: data.serialNumber,
      notes: data.notes,
    };
    
    const installation = await installationsApi.create(request);
    
    return {
      success: true,
      entity: installation,
      entityType: 'installation',
      message: `Installation "${installation.name || installation.installationNumber}" created successfully!`
    };
  } catch (error) {
    return {
      success: false,
      entityType: 'installation',
      message: 'Failed to create installation',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create an article via API
 */
export async function createArticleFromChat(data: ParsedArticleData): Promise<EntityCreationResult> {
  try {
    const request: CreateArticleRequest = {
      name: data.name,
      description: data.description,
      type: data.type,
      category: data.category || 'general',
      status: 'available',
      stock: data.stock,
      costPrice: data.costPrice,
      sellPrice: data.sellPrice,
      basePrice: data.basePrice,
      duration: data.duration,
    };
    
    const article = await articlesApi.create(request);
    
    return {
      success: true,
      entity: article,
      entityType: 'article',
      message: `Article "${article.name}" created successfully!`
    };
  } catch (error) {
    return {
      success: false,
      entityType: 'article',
      message: 'Failed to create article',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// =====================================================
// Combined Entity Creation Handler
// =====================================================

export interface PendingEntityCreation {
  entityType: EntityType;
  data: ParsedContactData | ParsedInstallationData | ParsedArticleData;
  displayText: string;
}

/**
 * Parse any entity from AI response
 */
export function parseEntityFromResponse(
  content: string, 
  expectedType?: EntityType
): PendingEntityCreation | null {
  if (expectedType === 'contact' || !expectedType) {
    const contactData = parseContactFromResponse(content);
    if (contactData) {
      return {
        entityType: 'contact',
        data: contactData,
        displayText: `${contactData.firstName} ${contactData.lastName}${contactData.email ? ` (${contactData.email})` : ''}`
      };
    }
  }
  
  if (expectedType === 'installation' || !expectedType) {
    const installationData = parseInstallationFromResponse(content);
    if (installationData) {
      return {
        entityType: 'installation',
        data: installationData,
        displayText: installationData.name || `Installation for contact #${installationData.contactId}`
      };
    }
  }
  
  if (expectedType === 'article' || !expectedType) {
    const articleData = parseArticleFromResponse(content);
    if (articleData) {
      return {
        entityType: 'article',
        data: articleData,
        displayText: `${articleData.name} (${articleData.type})`
      };
    }
  }
  
  return null;
}

/**
 * Create entity based on type
 */
export async function createEntityFromChat(
  entityType: EntityType,
  data: ParsedContactData | ParsedInstallationData | ParsedArticleData
): Promise<EntityCreationResult> {
  switch (entityType) {
    case 'contact':
      return createContactFromChat(data as ParsedContactData);
    case 'installation':
      return createInstallationFromChat(data as ParsedInstallationData);
    case 'article':
      return createArticleFromChat(data as ParsedArticleData);
    default:
      return {
        success: false,
        entityType,
        message: 'Unknown entity type',
        error: 'Invalid entity type provided'
      };
  }
}

// =====================================================
// System Prompts for Entity Creation
// =====================================================

export function getEntityCreationPrompt(entityType: EntityType, language: 'en' | 'fr'): string {
  const prompts = {
    contact: {
      en: `When creating a contact, extract the following information and format it as JSON:
- firstName (required)
- lastName (required)  
- email (optional)
- phone (optional)
- company (optional)
- position (optional)
- type: "individual", "company", or "partner" (default: individual)
- status: "active", "inactive", "lead", "customer", or "partner" (default: active)

Return the data in this exact JSON format within a code block:
\`\`\`json
{
  "firstName": "...",
  "lastName": "...",
  "email": "...",
  ...
}
\`\`\``,
      fr: `Pour créer un contact, extraire les informations suivantes au format JSON:
- firstName (obligatoire) - prénom
- lastName (obligatoire) - nom
- email (optionnel)
- phone (optionnel)
- company (optionnel) - société
- position (optionnel) - poste
- type: "individual", "company" ou "partner" (défaut: individual)
- status: "active", "inactive", "lead", "customer" ou "partner" (défaut: active)

Retourner les données dans ce format JSON exact:
\`\`\`json
{
  "firstName": "...",
  "lastName": "...",
  ...
}
\`\`\``
    },
    installation: {
      en: `When creating an installation, extract the following information and format it as JSON:
- contactId (required) - the ID of the associated contact
- name (optional) - installation name
- model (optional)
- manufacturer (optional)
- category (optional)
- type (optional) - installation type
- siteAddress (optional)
- serialNumber (optional)
- notes (optional)
- status (default: "active")

Return the data in this exact JSON format:
\`\`\`json
{
  "contactId": 123,
  "name": "...",
  ...
}
\`\`\``,
      fr: `Pour créer une installation, extraire les informations au format JSON:
- contactId (obligatoire) - ID du contact associé
- name (optionnel) - nom de l'installation
- model (optionnel)
- manufacturer (optionnel) - fabricant
- category (optionnel) - catégorie
- type (optionnel) - type d'installation
- siteAddress (optionnel) - adresse du site
- serialNumber (optionnel) - numéro de série
- notes (optionnel)
- status (défaut: "active")

Retourner au format JSON:
\`\`\`json
{
  "contactId": 123,
  "name": "...",
  ...
}
\`\`\``
    },
    article: {
      en: `When creating an article/material/service, extract the following information:
- name (required)
- description (optional)
- type: "material" or "service" (required)
- stock (optional, for materials)
- costPrice (optional)
- sellPrice (optional)
- basePrice (optional, for services)
- duration (optional, for services, in minutes)

Return the data in JSON format:
\`\`\`json
{
  "name": "...",
  "type": "material",
  ...
}
\`\`\``,
      fr: `Pour créer un article/matériel/service, extraire les informations:
- name (obligatoire) - nom
- description (optionnel)
- type: "material" ou "service" (obligatoire)
- stock (optionnel, pour matériaux)
- costPrice (optionnel) - prix d'achat
- sellPrice (optionnel) - prix de vente
- basePrice (optionnel, pour services) - prix de base
- duration (optionnel, pour services, en minutes)

Retourner au format JSON:
\`\`\`json
{
  "name": "...",
  "type": "material",
  ...
}
\`\`\``
    }
  };
  
  return prompts[entityType][language];
}
