// OpenRouter AI Service — now routes through backend via centralized key manager
import { callWithFallback } from '@/services/aiKeyManager';
import { analyzeUserIntent, IntentAnalysis } from './aiIntentAnalyzer';

interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (error: string) => void;
  onIntentAnalyzed?: (intent: IntentAnalysis) => void;
}

function getSystemPrompt(language: 'en' | 'fr' | 'ar' | 'unknown', intent: IntentAnalysis): string {
  const baseContext = `You are a helpful AI assistant for Flow Service, a business management platform.
You help users with managing contacts, tasks, offers, jobs, dispatches, service orders, and technician schedules.
Keep responses concise and actionable.`;

  const contextInfo = intent.entities.length > 0 
    ? `\nDetected entities: ${intent.entities.join(', ')}`
    : '';

  if (language === 'fr') {
    return `${baseContext}${contextInfo}\nIMPORTANT: Réponds TOUJOURS en français. Sois professionnel mais amical.`;
  }
  if (language === 'ar') {
    return `${baseContext}${contextInfo}\nIMPORTANT: Respond in Arabic when possible, or in English if Arabic is not supported.`;
  }
  return `${baseContext}${contextInfo}\nRespond in English. Be professional but friendly.`;
}

export async function streamChatCompletion(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  callbacks: StreamCallbacks
): Promise<void> {
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  
  let intent: IntentAnalysis;
  try {
    intent = await analyzeUserIntent(lastUserMessage);
    callbacks.onIntentAnalyzed?.(intent);
  } catch {
    intent = { language: 'en', intent: 'general', subject: 'general', entities: [], confidence: 0.5 };
  }

  const systemPrompt = getSystemPrompt(intent.language, intent);

  try {
    const result = await callWithFallback({
      system: systemPrompt,
      messages: messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
      stream: true,
      maxTokens: 1000,
      onChunk: (delta) => callbacks.onToken(delta),
    });

    if (result.success) {
      callbacks.onComplete();
    } else {
      callbacks.onError(result.error || 'AI call failed');
    }
  } catch (error) {
    callbacks.onError(error instanceof Error ? error.message : 'All AI models failed');
  }
}

export async function getChatCompletion(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<string> {
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  const intent = await analyzeUserIntent(lastUserMessage);
  const systemPrompt = getSystemPrompt(intent.language, intent);

  const result = await callWithFallback({
    system: systemPrompt,
    messages: messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
    stream: false,
    maxTokens: 1000,
  });

  if (result.success) return result.content;
  throw new Error(result.error || 'AI call failed');
}

export { analyzeUserIntent, type IntentAnalysis } from './aiIntentAnalyzer';
