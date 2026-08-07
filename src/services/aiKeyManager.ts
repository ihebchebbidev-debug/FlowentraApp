/**
 * AI Key Manager — Routes AI calls through OpenRouter first (fast cloud),
 * then falls back to the backend /api/GenerateWish (local Ollama).
 *
 * Includes: caching, robust JSON extraction, dual-path fallback.
 */

import modelsConfig from '@/config/models.json';
import { generateWishApi, type ChatMessage } from './api/generateWishApi';
import { AI_ERROR_OFFLINE, isAiAssistantBlockedByOffline } from '@/services/ai/aiNetworkGate';

// ─── OpenRouter Config ───────────────────────────────────────────────────────

const PRIMARY_MODEL = modelsConfig.models.find(m => m.id === 'primary');
const OPENROUTER_KEY = PRIMARY_MODEL?.apiKey || '';
const OPENROUTER_MODEL = PRIMARY_MODEL?.model || 'mistralai/mistral-small-3.1-24b-instruct:free';
const OPENROUTER_URL = PRIMARY_MODEL?.apiUrl || 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_TIMEOUT = modelsConfig.timeout || 15000;

// ─── Response Cache ──────────────────────────────────────────────────────────

interface CachedResponse {
  content: string;
  modelUsed: string;
  timestamp: number;
}

const responseCache = new Map<string, CachedResponse>();
const CACHE_TTL_MS = 30_000;

function getCacheKey(system: string, messages: Array<{ role: string; content: string }>): string {
  const last3 = messages.slice(-3);
  return `${system.slice(0, 50)}|${JSON.stringify(last3).slice(0, 200)}`;
}

function getCachedResponse(key: string): CachedResponse | null {
  const entry = responseCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) return entry;
  if (entry) responseCache.delete(key);
  return null;
}

// ─── Public Interface ────────────────────────────────────────────────────────

export interface AiCallOptions {
  system: string;
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  onChunk?: (delta: string) => void;
  stream?: boolean;
}

export interface AiCallResult {
  success: boolean;
  content: string;
  modelUsed?: string;
  keyUsed?: string;
  error?: string;
}

export const AI_MODELS: string[] = [
  'arcee-ai/trinity-large-preview:free',
  'mistral',
];

// ─── OpenRouter Direct Call (streaming SSE) ──────────────────────────────────

async function callOpenRouterStream(
  fullMessages: Array<{ role: string; content: string }>,
  temperature: number,
  maxTokens: number,
  onChunk: (delta: string) => void,
): Promise<AiCallResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT);

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: fullMessages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`OpenRouter ${response.status}: ${errText.slice(0, 200)}`);
    }

    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6).trim();
        if (json === '[DONE]') {
          return { success: true, content: fullContent, modelUsed: OPENROUTER_MODEL };
        }
        try {
          const parsed = JSON.parse(json);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) { fullContent += delta; onChunk(delta); }
        } catch {
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    return { success: true, content: fullContent, modelUsed: OPENROUTER_MODEL };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function callOpenRouterNonStream(
  fullMessages: Array<{ role: string; content: string }>,
  temperature: number,
  maxTokens: number,
): Promise<AiCallResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT);

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: fullMessages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`OpenRouter ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    return { success: true, content, modelUsed: OPENROUTER_MODEL };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ─── Main Entry: OpenRouter → Backend Fallback ───────────────────────────────

export async function callWithFallback(options: AiCallOptions): Promise<AiCallResult> {
  const {
    system,
    messages,
    model,
    temperature = 0.7,
    maxTokens = 1024,
    onChunk,
    stream = !!onChunk,
  } = options;

  if (isAiAssistantBlockedByOffline()) {
    return { success: false, content: '', error: AI_ERROR_OFFLINE };
  }

  // Cache check (non-streaming only)
  if (!stream) {
    const cKey = getCacheKey(system, messages);
    const cached = getCachedResponse(cKey);
    if (cached) {
      console.log(`[AI] 📦 Cache hit (${cached.modelUsed})`);
      return { success: true, content: cached.content, modelUsed: cached.modelUsed };
    }
  }

  const fullMessages = [
    { role: 'system', content: system },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  // ── 1. Try OpenRouter (fast cloud) ──
  if (OPENROUTER_KEY && OPENROUTER_KEY !== 'YOUR_API_KEY') {
    try {
      console.log(`[AI] ⚡ OpenRouter (${OPENROUTER_MODEL})...`);
      let result: AiCallResult;

      if (stream && onChunk) {
        result = await callOpenRouterStream(fullMessages, temperature, maxTokens, onChunk);
      } else {
        result = await callOpenRouterNonStream(fullMessages, temperature, maxTokens);
      }

      if (result.success) {
        console.log(`[AI] ✅ OpenRouter OK`);
        if (!stream) {
          const cKey = getCacheKey(system, messages);
          responseCache.set(cKey, { content: result.content, modelUsed: result.modelUsed || OPENROUTER_MODEL, timestamp: Date.now() });
        }
        return result;
      }
    } catch (err) {
      console.warn('[AI] ⚠️ OpenRouter failed, falling back to backend:', err instanceof Error ? err.message : err);
    }
  }

  // ── 2. Fallback: Backend /api/GenerateWish (local Ollama) ──
  const backendMessages: ChatMessage[] = fullMessages.map(m => ({ role: m.role, content: m.content }));
  const request = { messages: backendMessages, model: model || 'mistral', temperature, maxTokens };

  try {
    if (stream && onChunk) {
      console.log(`[AI] 🔄 Fallback → backend streaming...`);
      let accumulated = '';
      const result = await generateWishApi.stream(
        request,
        (delta) => { accumulated += delta; onChunk(delta); },
        () => {},
        (error) => console.error('[AI] Stream error:', error),
      );
      return { success: result.success, content: result.content || accumulated, modelUsed: result.model, error: result.error };
    } else {
      console.log(`[AI] 🔄 Fallback → backend non-streaming...`);
      const result = await generateWishApi.generate(request);
      if (result.success) {
        const cKey = getCacheKey(system, messages);
        responseCache.set(cKey, { content: result.response, modelUsed: result.model, timestamp: Date.now() });
      }
      return { success: result.success, content: result.response, modelUsed: result.model, error: result.error };
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    console.error('[AI] ❌ Both OpenRouter & backend failed:', error);
    return { success: false, content: '', error };
  }
}

// ─── Robust JSON Extraction ──────────────────────────────────────────────────

function extractJsonFromMixedResponse(content: string): unknown {
  try { return JSON.parse(content); } catch { /* continue */ }

  let cleaned = content.trim()
    .replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  try { return JSON.parse(cleaned); } catch { /* continue */ }

  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch { /* continue */ }
  }

  const jsonMatch = cleaned.match(/(\{[\s\S]*"[^"]+"\s*:[\s\S]*\})/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1]); } catch { return repairAndParse(jsonMatch[1]); }
  }

  const arrayMatch = cleaned.match(/(\[[\s\S]*\])/);
  if (arrayMatch) {
    try { return JSON.parse(arrayMatch[1]); } catch { return repairAndParse(arrayMatch[1]); }
  }

  throw new Error('No valid JSON found in response');
}

function repairAndParse(json: string): unknown {
  let repaired = json
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    .replace(/[\x00-\x1F\x7F]/g, '');

  let braces = 0, brackets = 0;
  for (const char of repaired) {
    if (char === '{') braces++;
    if (char === '}') braces--;
    if (char === '[') brackets++;
    if (char === ']') brackets--;
  }
  while (brackets > 0) { repaired += ']'; brackets--; }
  while (braces > 0) { repaired += '}'; braces--; }

  return JSON.parse(repaired);
}

// ─── JSON Helper ─────────────────────────────────────────────────────────────

export async function callForJson<T = unknown>(options: AiCallOptions): Promise<{ success: boolean; data?: T; error?: string }> {
  const jsonOptions = {
    ...options,
    system: options.system + '\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown, no explanation, no code blocks. Just raw JSON.',
    stream: false,
  };
  const result = await callWithFallback(jsonOptions);
  if (!result.success) return { success: false, error: result.error };

  try {
    const data = extractJsonFromMixedResponse(result.content) as T;
    return { success: true, data };
  } catch {
    console.warn('[AI] Failed to parse JSON from response:', result.content.substring(0, 200));
    return { success: false, error: 'Failed to parse JSON response' };
  }
}

// ─── Compatibility exports ───────────────────────────────────────────────────

export function getOrderedKeys(): string[] { return ['openrouter', 'backend-proxy']; }
export function getHealthyKeys(): string[] { return ['openrouter', 'backend-proxy']; }
export function getKeyPoolStatus() {
  return [
    { key: 'openrouter', status: 'healthy' as const, failures: 0, avgMs: 0 },
    { key: 'backend-proxy', status: 'healthy' as const, failures: 0, avgMs: 0 },
  ];
}
