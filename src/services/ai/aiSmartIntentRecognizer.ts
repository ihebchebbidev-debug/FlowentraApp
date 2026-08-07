// AI Smart Intent Recognizer - Uses backend LLM for fuzzy pattern matching
// Routes through backend /api/GenerateWish instead of calling OpenRouter directly
// Includes in-flight deduplication to prevent duplicate calls for same input

import { callForJson } from '@/services/aiKeyManager';

// =====================================================
// Types
// =====================================================

export type ActionType = 
  | 'form_creation'
  | 'task_creation'
  | 'dispatch_assignment'
  | 'stock_modification'
  | 'contact_lookup'
  | 'offer_creation'
  | 'schedule_query'
  | 'analytics_query'
  | 'general_query'
  | 'none';

export interface SmartIntentResult {
  action: ActionType;
  confidence: number;
  extractedEntities: {
    topic?: string;
    targetName?: string;
    quantity?: number;
    date?: string;
    time?: string;
    dispatchId?: string;
    technicianName?: string;
  };
  suggestedFields?: string[];
  reasoning?: string;
}

export interface FormIntentResult {
  isFormCreation: boolean;
  confidence: number;
  extractedTopic?: string;
  suggestedFields?: string[];
  reasoning?: string;
}

// =====================================================
// In-flight deduplication cache
// =====================================================

const inflightRequests = new Map<string, Promise<SmartIntentResult>>();
const resultCache = new Map<string, { result: SmartIntentResult; timestamp: number }>();
const RESULT_CACHE_TTL_MS = 30_000; // 30 seconds

function getIntentCacheKey(message: string): string {
  return message.trim().toLowerCase().slice(0, 200);
}

// =====================================================
// Main Smart Recognizer
// =====================================================

const INTENT_SYSTEM_PROMPT = `You are an intent classifier for FlowService, a field service management app. Classify user messages into action types.

RESPOND WITH JSON ONLY. No explanation, no markdown.

ACTION TYPES:
1. "form_creation" - User wants to CREATE a new form, checklist, survey, or questionnaire
2. "task_creation" - User wants to CREATE personal tasks, todos, or reminders
3. "dispatch_assignment" - User wants to ASSIGN a dispatch/job to a technician, or ask who to assign
4. "stock_modification" - User wants to ADD or REMOVE stock from inventory
5. "contact_lookup" - User wants to FIND or VIEW contact/customer information
6. "offer_creation" - User wants to CREATE a new quote/offer for a customer
7. "schedule_query" - User asks about schedules, availability, who is working when
8. "analytics_query" - User asks for reports, statistics, performance metrics
9. "general_query" - User asks general questions about the system or data
10. "none" - Not a recognizable action (greeting, off-topic, etc.)

Response format (JSON only):
{
  "action": "form_creation",
  "confidence": 0.95,
  "extractedEntities": {
    "topic": "customer satisfaction",
    "targetName": null,
    "dispatchId": null,
    "technicianName": null
  },
  "suggestedFields": ["rating", "text", "signature"],
  "reasoning": "user wants satisfaction form"
}`;

// Fast-path: skip LLM for greetings, very short messages, and obvious non-intents
const GREETING_PATTERNS = /^(hi|hello|hey|bonjour|salut|bonsoir|coucou|yo|sup|hola|ça va|comment ça va|how are you|what's up|good morning|good evening|good night|bonne nuit|merci|thanks|thank you|ok|okay|oui|non|yes|no|bye|au revoir|à bientôt)[\s!?.]*$/i;

function isTrivialMessage(message: string): boolean {
  const trimmed = message.trim();
  // Very short messages (≤4 chars) or greetings
  if (trimmed.length <= 4) return true;
  if (GREETING_PATTERNS.test(trimmed)) return true;
  return false;
}

const TRIVIAL_RESULT: SmartIntentResult = {
  action: 'general_query',
  confidence: 1,
  extractedEntities: {},
  reasoning: 'trivial/greeting message — skipped LLM',
};

export async function recognizeIntent(message: string): Promise<SmartIntentResult> {
  // Fast-path: skip expensive LLM call for trivial messages
  if (isTrivialMessage(message)) {
    console.log('[SmartRecognizer] ⚡ Fast-path (trivial message):', message.substring(0, 40));
    return TRIVIAL_RESULT;
  }

  const cacheKey = getIntentCacheKey(message);

  // 1. Check result cache
  const cached = resultCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < RESULT_CACHE_TTL_MS) {
    console.log('[SmartRecognizer] 📦 Cache hit for:', message.substring(0, 40));
    return cached.result;
  }

  // 2. Check if an identical request is already in-flight → reuse it
  const inflight = inflightRequests.get(cacheKey);
  if (inflight) {
    console.log('[SmartRecognizer] ♻️ Reusing in-flight request for:', message.substring(0, 40));
    return inflight;
  }

  // 3. Create the actual request and store it
  const requestPromise = doRecognizeIntent(message);
  inflightRequests.set(cacheKey, requestPromise);

  try {
    const result = await requestPromise;
    // Store in result cache
    resultCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  } finally {
    inflightRequests.delete(cacheKey);
  }
}

async function doRecognizeIntent(message: string): Promise<SmartIntentResult> {
  try {
    console.log('[SmartRecognizer] Analyzing:', message.substring(0, 80));

    const result = await callForJson<SmartIntentResult>({
      system: INTENT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: message }],
      temperature: 0.1,
      maxTokens: 100, // Keep small — intent JSON is tiny
    });

    if (result.success && result.data) {
      const parsed = result.data;
      const intentResult: SmartIntentResult = {
        action: isValidActionType(parsed.action) ? parsed.action : 'none',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        extractedEntities: {
          topic: parsed.extractedEntities?.topic || undefined,
          targetName: parsed.extractedEntities?.targetName || undefined,
          quantity: parsed.extractedEntities?.quantity || undefined,
          date: parsed.extractedEntities?.date || undefined,
          time: parsed.extractedEntities?.time || undefined,
          dispatchId: parsed.extractedEntities?.dispatchId || undefined,
          technicianName: parsed.extractedEntities?.technicianName || undefined,
        },
        suggestedFields: Array.isArray(parsed.suggestedFields) ? parsed.suggestedFields : [],
        reasoning: parsed.reasoning,
      };

      console.log('[SmartRecognizer] Result:', intentResult.action, 'confidence:', intentResult.confidence);
      return intentResult;
    }

    console.warn('[SmartRecognizer] Backend call failed:', result.error);
    return { action: 'none', confidence: 0, extractedEntities: {} };
  } catch (error) {
    console.error('[SmartRecognizer] Error:', error);
    return { action: 'none', confidence: 0, extractedEntities: {} };
  }
}

function isValidActionType(action: string): action is ActionType {
  const validTypes: ActionType[] = [
    'form_creation', 'task_creation', 'dispatch_assignment', 
    'stock_modification', 'contact_lookup', 'offer_creation',
    'schedule_query', 'analytics_query', 'general_query', 'none'
  ];
  return validTypes.includes(action as ActionType);
}

// =====================================================
// Form-Specific Recognition (backward compatible)
// =====================================================

export async function recognizeFormIntent(message: string): Promise<FormIntentResult> {
  const result = await recognizeIntent(message);
  return {
    isFormCreation: result.action === 'form_creation',
    confidence: result.confidence,
    extractedTopic: result.extractedEntities.topic,
    suggestedFields: result.suggestedFields,
    reasoning: result.reasoning,
  };
}

export async function detectFormIntentSmart(
  message: string,
  regexConfidence: number
): Promise<{
  hasIntent: boolean;
  confidence: number;
  source: 'regex' | 'llm' | 'combined';
  topic?: string;
  suggestedFields?: string[];
}> {
  if (regexConfidence >= 0.8) {
    return { hasIntent: true, confidence: regexConfidence, source: 'regex' };
  }
  
  if (regexConfidence >= 0.4) {
    const llmResult = await recognizeFormIntent(message);
    if (llmResult.isFormCreation && llmResult.confidence >= 0.7) {
      return {
        hasIntent: true,
        confidence: Math.max(regexConfidence, llmResult.confidence),
        source: 'combined',
        topic: llmResult.extractedTopic,
        suggestedFields: llmResult.suggestedFields,
      };
    }
    if (!llmResult.isFormCreation && llmResult.confidence >= 0.9) {
      return { hasIntent: false, confidence: llmResult.confidence, source: 'llm' };
    }
    return {
      hasIntent: regexConfidence >= 0.5 || llmResult.isFormCreation,
      confidence: (regexConfidence + llmResult.confidence) / 2,
      source: 'combined',
      topic: llmResult.extractedTopic,
    };
  }
  
  const llmResult = await recognizeFormIntent(message);
  return {
    hasIntent: llmResult.isFormCreation && llmResult.confidence >= 0.7,
    confidence: llmResult.confidence,
    source: 'llm',
    topic: llmResult.extractedTopic,
    suggestedFields: llmResult.suggestedFields,
  };
}

// =====================================================
// Task-Specific Recognition
// =====================================================

export async function detectTaskIntentSmart(
  message: string,
  regexMatched: boolean
): Promise<{ hasIntent: boolean; confidence: number; source: 'regex' | 'llm' | 'combined' }> {
  if (regexMatched) {
    return { hasIntent: true, confidence: 0.9, source: 'regex' };
  }
  const result = await recognizeIntent(message);
  return {
    hasIntent: result.action === 'task_creation' && result.confidence >= 0.7,
    confidence: result.confidence,
    source: 'llm',
  };
}

// =====================================================
// Dispatch Assignment Recognition
// =====================================================

export async function detectDispatchAssignmentIntent(
  message: string,
  regexConfidence: number = 0
): Promise<{
  hasIntent: boolean;
  confidence: number;
  source: 'regex' | 'llm' | 'combined';
  dispatchId?: string;
  technicianName?: string;
  time?: string;
}> {
  if (regexConfidence >= 0.8) {
    return { hasIntent: true, confidence: regexConfidence, source: 'regex' };
  }
  
  const result = await recognizeIntent(message);
  if (result.action === 'dispatch_assignment' && result.confidence >= 0.7) {
    return {
      hasIntent: true,
      confidence: result.confidence,
      source: regexConfidence > 0 ? 'combined' : 'llm',
      dispatchId: result.extractedEntities.dispatchId,
      technicianName: result.extractedEntities.technicianName,
      time: result.extractedEntities.time,
    };
  }
  return { hasIntent: false, confidence: result.confidence, source: 'llm' };
}

// =====================================================
// Stock Modification Recognition
// =====================================================

export async function detectStockModificationIntent(
  message: string
): Promise<{
  hasIntent: boolean;
  confidence: number;
  action?: 'add' | 'remove';
  quantity?: number;
  itemName?: string;
}> {
  const result = await recognizeIntent(message);
  if (result.action === 'stock_modification' && result.confidence >= 0.7) {
    const lowerMessage = message.toLowerCase();
    const isRemove = /remove|subtract|take|reduce|retirer|enlever/i.test(lowerMessage);
    const isAdd = /add|increase|restock|ajouter|augmenter/i.test(lowerMessage);
    return {
      hasIntent: true,
      confidence: result.confidence,
      action: isRemove ? 'remove' : isAdd ? 'add' : undefined,
      quantity: result.extractedEntities.quantity,
      itemName: result.extractedEntities.targetName || result.extractedEntities.topic,
    };
  }
  return { hasIntent: false, confidence: result.confidence };
}

// =====================================================
// General Smart Detection
// =====================================================

export interface SmartDetectionResult {
  primaryAction: ActionType;
  confidence: number;
  source: 'regex' | 'llm' | 'combined';
  entities: SmartIntentResult['extractedEntities'];
  suggestedFields?: string[];
}

export async function detectIntentUniversal(
  message: string,
  regexResults?: {
    formConfidence?: number;
    taskMatched?: boolean;
    dispatchConfidence?: number;
  }
): Promise<SmartDetectionResult> {
  const regex = regexResults || {};
  
  if ((regex.formConfidence || 0) >= 0.8) {
    return { primaryAction: 'form_creation', confidence: regex.formConfidence!, source: 'regex', entities: {} };
  }
  if (regex.taskMatched) {
    return { primaryAction: 'task_creation', confidence: 0.9, source: 'regex', entities: {} };
  }
  if ((regex.dispatchConfidence || 0) >= 0.8) {
    return { primaryAction: 'dispatch_assignment', confidence: regex.dispatchConfidence!, source: 'regex', entities: {} };
  }
  
  const result = await recognizeIntent(message);
  return {
    primaryAction: result.action,
    confidence: result.confidence,
    source: 'llm',
    entities: result.extractedEntities,
    suggestedFields: result.suggestedFields,
  };
}
