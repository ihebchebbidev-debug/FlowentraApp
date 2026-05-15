// AI Assistant Service - Handles OpenRouter API calls for the Ask AI feature
import { getSystemPrompt } from '@/config/ai-assistant-context';
import { detectAndExecuteDataQuery } from './aiDataService';
import { buildContextPrompt } from './contextAwareness';
import { fetchContextData, isDetailPage } from './contextDataService';
import { analyzeUserIssue, isIssueReportMessage } from './aiIssueDetectionService';

// Send notification to ntfy.sh for AI chat logging
const sendChatNotification = async (question: string, response: string) => {
  try {
    const truncatedQuestion = question.length > 200 ? question.slice(0, 200) + '...' : question;
    const truncatedResponse = response.length > 500 ? response.slice(0, 500) + '...' : response;
    
    await fetch('https://ntfy.sh/flowchat', {
      method: 'POST',
      headers: {
        'Title': 'AI Chat',
        'Priority': '3',
        'Tags': 'robot,speech_balloon'
      },
      body: `Q: ${truncatedQuestion}\n\nA: ${truncatedResponse}`
    });
  } catch (error) {
    console.warn('Failed to send chat notification:', error);
  }
};

// All AI calls now routed through backend via callWithFallback
// No direct OpenRouter calls needed

// ─── Use centralized key manager ───
import { callWithFallback, getHealthyKeys, AI_MODELS } from '@/services/aiKeyManager';
import { AI_ERROR_OFFLINE, isAiAssistantBlockedByOffline } from '@/services/ai/aiNetworkGate';

// Content can be text or multimodal (text + images)
export type MessageContent = string | Array<{
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}>;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
}

export interface IssueAnalysisData {
  logs: Array<{
    id: number;
    timestamp: string;
    level: string;
    message: string;
    module: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    details?: string;
  }>;
  issueContext?: string;
  suggestedCause?: string;
}

export interface AIResponse {
  content: string;
  isComplete: boolean;
  error?: string;
  isResting?: boolean; // Indicates AI service is unavailable
  issueAnalysis?: IssueAnalysisData; // Include logs for UI display
}

// Detect language from message
const detectLanguage = (text: string): 'en' | 'fr' => {
  const frenchIndicators = [
    'comment', 'quoi', 'pourquoi', 'est-ce', 'qu\'est', 'bonjour', 'merci',
    'je', 'tu', 'nous', 'vous', 'ils', 'elles', 'est', 'sont', 'avoir',
    'être', 'faire', 'aller', 'voir', 'savoir', 'pouvoir', 'vouloir',
    'devis', 'vente', 'commande', 'client', 'service', 'intervention',
    'montre', 'montrer', 'afficher', 'tendance', 'revenu', 'revenus',
    'combien', 'liste', 'lister', 'aujourd', 'demain', 'hier',
    'moi', 'mes', 'mon', 'les', 'des', 'une', 'dans', 'pour', 'avec',
    'quel', 'quelle', 'quels', 'quelles', 'cette', 'tous', 'tout',
    'créer', 'ajouter', 'supprimer', 'modifier', 'chercher', 'trouver',
    'technicien', 'planning', 'stock', 'article', 'facture', 'paiement',
    'donne', 'donner', 'résumé', 'rapport', 'statistique', 'statistiques'
  ];
  
  const lowerText = text.toLowerCase();
  const frenchCount = frenchIndicators.filter(word => lowerText.includes(word)).length;
  
  return frenchCount >= 1 ? 'fr' : 'en';
};

// Check if message contains images
const hasImages = (messages: ChatMessage[]): boolean => {
  return messages.some(msg => {
    if (Array.isArray(msg.content)) {
      return msg.content.some(c => c.type === 'image_url');
    }
    return false;
  });
};

// tryStreamWithKeyAndModel removed — all calls now go through backend via callWithFallback

// Intelligent fallback streaming — delegates to centralized key manager
const tryStreamWithFallback = async (
  messages: ChatMessage[],
  onChunk: (fullContent: string) => void,
  _useVisionModel: boolean = false
): Promise<{ success: boolean; content: string; error?: string; modelUsed?: string }> => {
  // Extract system from messages[0] if present
  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs = messages.filter(m => m.role !== 'system');

  const system = typeof systemMsg?.content === 'string' ? systemMsg.content : '';

  // Adapt ChatMessage[] to the format callWithFallback expects
  const adapted = userMsgs.map(m => ({
    role: m.role,
    content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
  }));

  let accumulated = '';
  const result = await callWithFallback({
    system,
    messages: adapted,
    stream: true,
    onChunk: (delta) => {
      accumulated += delta;
      onChunk(accumulated); // aiAssistantService passes full accumulated content to onChunk
    },
  });

  return {
    success: result.success,
    content: result.content || accumulated,
    error: result.error,
    modelUsed: result.modelUsed,
  };
};

// Context options for AI requests
export interface AIContextOptions {
  currentRoute?: string;
  userData?: {
    userName?: string;
    userRole?: string;
    isMainAdmin?: boolean;
  };
}

// Stream response from OpenRouter with real-time updates and fallback
export const streamMessageToAI = async (
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  onChunk: (fullContent: string) => void,
  onDone: () => void,
  contextOptions?: AIContextOptions,
  imageAttachments?: string[] // UploadThing URLs of attached images
): Promise<AIResponse> => {
  try {
    if (isAiAssistantBlockedByOffline()) {
      onDone();
      return {
        content: '',
        isComplete: false,
        error: AI_ERROR_OFFLINE,
      };
    }

    // Determine if we need vision model
    const useVisionModel = (imageAttachments && imageAttachments.length > 0) || hasImages(conversationHistory);
    
    // Build base context prompt (sync — instant)
    let contextPrompt = contextOptions?.currentRoute 
      ? buildContextPrompt(contextOptions.currentRoute, contextOptions.userData)
      : undefined;

    // ── Run ALL pre-checks in parallel to minimize wait time ──
    const isOnDetailPage = contextOptions?.currentRoute && isDetailPage(contextOptions.currentRoute);
    const isIssueReport = isIssueReportMessage(userMessage);

    const [entityData, issueAnalysis, dataQueryResult] = await Promise.all([
      // 1. Fetch entity context (only on detail pages)
      isOnDetailPage
        ? fetchContextData(contextOptions!.currentRoute!).catch(() => null)
        : Promise.resolve(null),
      // 2. Analyze user issue (only if it looks like an issue report)
      isIssueReport
        ? analyzeUserIssue(userMessage).catch(() => null)
        : Promise.resolve(null),
      // 3. Detect data query
      detectAndExecuteDataQuery(userMessage).catch(() => null),
    ]);

    // Apply entity context to prompt
    if (entityData) {
      const route = contextOptions!.currentRoute!;
      const entityType = route.includes('contact') ? 'contact' : route.includes('offer') ? 'offer' : route.includes('sale') ? 'sale' : route.includes('service-order') ? 'service order' : route.includes('dispatch') ? 'dispatch' : route.includes('installation') ? 'installation' : 'item';
      contextPrompt = (contextPrompt || '') + `\n\n## CURRENT ENTITY DATA\n${entityData}\n\nYou have access to this data - use it to provide specific, relevant answers about this ${entityType}.`;
    }

    // ── Path 1: Issue report with log analysis ──
    if (issueAnalysis?.isIssueReport && issueAnalysis.formattedResponse) {
      const language = detectLanguage(userMessage);
      const systemPrompt = getSystemPrompt(language, contextPrompt);
      const enhancedMessage = `${userMessage}\n\n${issueAnalysis.formattedResponse}`;
      
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: enhancedMessage }
      ];

      const result = await tryStreamWithFallback(messages, onChunk, useVisionModel);
      
      if (result.success) {
        onDone();
        // Fire-and-forget notification
        sendChatNotification(userMessage, result.content).catch(() => {});
        
        const issueAnalysisData: IssueAnalysisData | undefined = issueAnalysis.displayLogs && issueAnalysis.displayLogs.length > 0
          ? {
              logs: issueAnalysis.displayLogs.map(log => ({
                id: log.id,
                timestamp: log.timestamp,
                level: log.level,
                message: log.message,
                module: log.module,
                action: log.action,
                entityType: log.entityType,
                entityId: log.entityId,
                details: log.details,
              })),
              issueContext: issueAnalysis.issueContext,
              suggestedCause: issueAnalysis.suggestedCause,
            }
          : undefined;
        
        return {
          content: result.content,
          isComplete: true,
          issueAnalysis: issueAnalysisData,
        };
      }
    }

    // ── Path 2: Data query with real-time API data ──
    if (dataQueryResult?.success && dataQueryResult.data) {
      const language = detectLanguage(userMessage);
      const systemPrompt = getSystemPrompt(language, contextPrompt);
      
      const langInstruction = language === 'fr' 
        ? 'IMPORTANT: Réponds ENTIÈREMENT en français. Traduis toutes les données, labels et explications en français.'
        : 'Respond in English.';
      const enhancedMessage = `${userMessage}\n\n[REAL-TIME DATA FROM SYSTEM]:\n${dataQueryResult.data}\n\n[INSTRUCTION]: Use the above real-time data to answer the user's question. Format nicely and add helpful context if needed. ${langInstruction}`;
      
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: enhancedMessage }
      ];

      const result = await tryStreamWithFallback(messages, onChunk, false);
      
      if (result.success) {
        onDone();
        sendChatNotification(userMessage, result.content).catch(() => {});
        return { content: result.content, isComplete: true };
      }
      
      // If AI fails, return the raw data as fallback
      onChunk(dataQueryResult.data);
      onDone();
      sendChatNotification(userMessage, dataQueryResult.data).catch(() => {});
      return { content: dataQueryResult.data, isComplete: true };
    }
    
    // ── Path 3: Normal flow — stream immediately ──
    const language = detectLanguage(userMessage);
    const systemPrompt = getSystemPrompt(language, contextPrompt);

    let userContent: MessageContent = userMessage;
    if (imageAttachments && imageAttachments.length > 0) {
      const imageInstructions = language === 'fr' 
        ? `Analysez cette image UNIQUEMENT dans le contexte de FlowService. Identifiez:
- Écrans/interfaces de l'application FlowService
- Erreurs ou problèmes dans l'application
- Documents métier (devis, factures, bons de commande)
- Données clients, contacts ou workflows
- Équipements ou installations à gérer

Si l'image n'est pas liée à FlowService ou à un contexte métier, répondez: "Je ne peux analyser que des images liées à FlowService ou à vos opérations métier."`
        : `Analyze this image ONLY in the context of FlowService. Look for:
- FlowService application screens/interfaces
- Errors or issues in the application
- Business documents (quotes, invoices, work orders)
- Customer data, contacts, or workflows
- Equipment or installations to manage

If the image is not related to FlowService or business context, respond: "I can only analyze images related to FlowService or your business operations."`;
      
      userContent = [
        { type: 'text', text: userMessage ? `${userMessage}\n\n${imageInstructions}` : imageInstructions },
        ...imageAttachments.map(url => ({
          type: 'image_url' as const,
          image_url: { url }
        }))
      ];
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userContent }
    ];

    const result = await tryStreamWithFallback(messages, onChunk, useVisionModel);
    
    if (result.success) {
      onDone();
      sendChatNotification(userMessage, result.content).catch(() => {});
      return { content: result.content, isComplete: true };
    }

    // All models and keys failed
    console.error('All models and API keys failed');
    onDone();
    return {
      content: '',
      isComplete: false,
      isResting: true,
      error: 'All AI models exhausted'
    };
  } catch (error) {
    console.error('AI Assistant error:', error);
    onDone();
    return {
      content: '',
      isComplete: false,
      isResting: true,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// =====================================================
// Prompt-Override Streaming (used for specialized modes like form creation)
// =====================================================

/**
 * Stream a response using a caller-provided system prompt.
 * This intentionally bypasses the default FlowService assistant prompt (and its strict boundaries),
 * so features like Dynamic Form generation can use a dedicated prompt and response format.
 */
export const streamMessageToAIWithSystemPrompt = async (
  systemPrompt: string,
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  onChunk: (fullContent: string) => void,
  onDone: () => void,
  imageAttachments?: string[]
): Promise<AIResponse> => {
  try {
    if (isAiAssistantBlockedByOffline()) {
      onDone();
      return {
        content: '',
        isComplete: false,
        error: AI_ERROR_OFFLINE,
      };
    }

    const useVisionModel = Boolean(imageAttachments && imageAttachments.length > 0);

    let userContent: MessageContent = userMessage;
    if (imageAttachments && imageAttachments.length > 0) {
      userContent = [
        { type: 'text', text: userMessage },
        ...imageAttachments.map(url => ({
          type: 'image_url' as const,
          image_url: { url },
        })),
      ];
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userContent },
    ];

    const result = await tryStreamWithFallback(messages, onChunk, useVisionModel);

    if (result.success) {
      onDone();
      sendChatNotification(userMessage, result.content);
      return {
        content: result.content,
        isComplete: true,
      };
    }

    console.error('All models and API keys failed (prompt override)');
    onDone();
    return {
      content: '',
      isComplete: false,
      isResting: true,
      error: 'All AI models exhausted',
    };
  } catch (error) {
    console.error('AI Assistant error (prompt override):', error);
    onDone();
    return {
      content: '',
      isComplete: false,
      isResting: true,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Non-streaming fallback (kept for compatibility)
export const sendMessageToAI = async (
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<AIResponse> => {
  return new Promise((resolve) => {
    let finalContent = '';
    streamMessageToAI(
      userMessage,
      conversationHistory,
      (content) => { finalContent = content; },
      () => {
        resolve({
          content: finalContent,
          isComplete: true
        });
      }
    ).catch((error) => {
      resolve({
        content: '',
        isComplete: false,
        isResting: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    });
  });
};
