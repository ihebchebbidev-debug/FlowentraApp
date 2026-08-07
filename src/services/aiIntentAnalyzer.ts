// AI Intent Analyzer - Uses lightweight model to analyze user intent and language
import { callWithFallback } from '@/services/aiKeyManager';

export interface IntentAnalysis {
  language: 'en' | 'fr' | 'ar' | 'unknown';
  intent: 'question' | 'command' | 'planning' | 'lookup' | 'general';
  subject: 'dispatch' | 'service_order' | 'technician' | 'job' | 'contact' | 'offer' | 'sale' | 'schedule' | 'general';
  entities: string[];
  confidence: number;
}

export async function analyzeUserIntent(userMessage: string): Promise<IntentAnalysis> {
  // Use local fallback to avoid burning an API call on intent detection.
  // Free-tier OpenRouter has strict rate limits; save budget for the actual response.
  return fallbackIntentDetection(userMessage);
}

// Fallback detection when AI is unavailable
function fallbackIntentDetection(message: string): IntentAnalysis {
  const lower = message.toLowerCase();
  
  return {
    language: detectLanguageFallback(message),
    intent: detectIntentFallback(lower),
    subject: detectSubjectFallback(lower),
    entities: extractEntitiesFallback(message),
    confidence: 0.6,
  };
}

function detectLanguageFallback(text: string): 'en' | 'fr' | 'ar' | 'unknown' {
  // Arabic characters
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  
  // French indicators
  const frenchWords = ['bonjour', 'merci', 'comment', 'où', 'quoi', 'qui', 'pourquoi', 'travaille', 'technicien', 'dispatch', 'commande', 'planification', 'afficher', 'montrer'];
  const frenchCount = frenchWords.filter(w => text.toLowerCase().includes(w)).length;
  
  // English indicators
  const englishWords = ['hello', 'thanks', 'what', 'who', 'where', 'why', 'show', 'display', 'schedule', 'working', 'assigned'];
  const englishCount = englishWords.filter(w => text.toLowerCase().includes(w)).length;
  
  if (frenchCount > englishCount && frenchCount >= 1) return 'fr';
  if (englishCount > 0 || /[a-zA-Z]/.test(text)) return 'en';
  
  return 'unknown';
}

function detectIntentFallback(lower: string): IntentAnalysis['intent'] {
  if (/\?|what|who|where|when|how|quoi|qui|où|comment/.test(lower)) return 'question';
  if (/plan|assign|schedule|planifier|assigner/.test(lower)) return 'planning';
  if (/show|get|find|display|status|afficher|montrer|statut/.test(lower)) return 'lookup';
  if (/create|add|update|delete|créer|ajouter|modifier|supprimer/.test(lower)) return 'command';
  return 'general';
}

function detectSubjectFallback(lower: string): IntentAnalysis['subject'] {
  if (/dispatch|disp-?\d+/i.test(lower)) return 'dispatch';
  if (/service.?order|so-?\d+/i.test(lower)) return 'service_order';
  if (/technician|tech|@\w+/i.test(lower)) return 'technician';
  if (/job|task|travail|tâche/i.test(lower)) return 'job';
  if (/contact|client|customer/i.test(lower)) return 'contact';
  if (/offer|offre|off-?\d+/i.test(lower)) return 'offer';
  if (/sale|vente|sal-?\d+/i.test(lower)) return 'sale';
  if (/schedule|planning|calendar|agenda/i.test(lower)) return 'schedule';
  return 'general';
}

function extractEntitiesFallback(text: string): string[] {
  const entities: string[] = [];
  
  // Extract dispatch numbers
  const dispatchMatch = text.match(/DISP-?\d+/gi);
  if (dispatchMatch) entities.push(...dispatchMatch);
  
  // Extract service order numbers
  const soMatch = text.match(/SO-?\d+/gi);
  if (soMatch) entities.push(...soMatch);
  
  // Extract @mentions
  const mentionMatch = text.match(/@\w+/g);
  if (mentionMatch) entities.push(...mentionMatch);
  
  // Extract dates
  const dateMatch = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\btomorrow\b|\btoday\b|\bdemain\b|\baujourd'hui\b/gi);
  if (dateMatch) entities.push(...dateMatch);
  
  return entities;
}
