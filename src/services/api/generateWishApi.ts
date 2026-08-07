/**
 * GenerateWish API — calls the backend /api/GenerateWish endpoint
 * which proxies to the local Ollama LLM server.
 * Supports both non-streaming and SSE streaming modes.
 * Includes in-flight request deduplication for non-streaming calls.
 */
import { apiFetch } from './apiClient';
import { API_CONFIG } from '@/config/api.config';
import { getAuthHeaders, getMutationHeaders, getMutationHeadersNoContentType } from '@/utils/apiHeaders';

// ─── Types ───

export interface ChatMessage {
  role: string;   // 'system' | 'user' | 'assistant'
  content: string;
}

export interface GenerateWishRequest {
  prompt?: string;
  messages?: ChatMessage[];
  model?: string;
  conversationId?: number;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface GenerateWishResponse {
  success: boolean;
  response: string;
  model: string;
  totalDurationNs: number;
  conversationId?: number;
  error?: string;
}

// ─── In-flight dedup for non-streaming requests ───

const inflightGenerateRequests = new Map<string, Promise<GenerateWishResponse>>();

function buildGenerateKey(request: GenerateWishRequest): string {
  const msgs = request.messages?.slice(-3).map(m => `${m.role}:${m.content.slice(0, 100)}`).join('|') || '';
  const prompt = request.prompt?.slice(0, 100) || '';
  return `${request.model || 'default'}|${prompt}|${msgs}|t${request.temperature ?? ''}|m${request.maxTokens ?? ''}`;
}

// ─── API ───

export const generateWishApi = {
  /**
   * Send a prompt or messages to the local LLM via backend proxy (non-streaming).
   * Deduplicates identical in-flight requests automatically.
   */
  async generate(request: GenerateWishRequest): Promise<GenerateWishResponse> {
    const dedupKey = buildGenerateKey(request);

    // Reuse in-flight request if identical
    const inflight = inflightGenerateRequests.get(dedupKey);
    if (inflight) {
      console.log('[GenerateWish] ♻️ Reusing in-flight request');
      return inflight;
    }

    const promise = this._doGenerate(request);
    inflightGenerateRequests.set(dedupKey, promise);

    try {
      return await promise;
    } finally {
      inflightGenerateRequests.delete(dedupKey);
    }
  },

  /** @internal */
  async _doGenerate(request: GenerateWishRequest): Promise<GenerateWishResponse> {
    const res = await apiFetch<GenerateWishResponse>('/api/GenerateWish', {
      method: 'POST',
    });

    if (res.error || !res.data) {
      return {
        success: false,
        response: '',
        model: request.model || 'mistral',
        totalDurationNs: 0,
        error: res.error || 'Unknown error',
      };
    }

    return res.data;
  },

  /**
   * Stream a chat response via SSE from POST /api/GenerateWish/stream.
   * Streaming requests are NOT deduplicated (each needs its own event stream).
   */
  async stream(
    request: GenerateWishRequest,
    onDelta: (deltaText: string) => void,
    onDone: () => void,
    onError?: (error: string) => void,
  ): Promise<{ success: boolean; content: string; model?: string; error?: string }> {
    const url = `${API_CONFIG.baseURL}/api/GenerateWish/stream`;
    let fullContent = '';

    // 3-minute abort controller (reduced from 5min — backend has its own 5min timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180_000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getMutationHeaders(),
        body: JSON.stringify({ ...request, stream: true }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const error = `Backend error ${response.status}: ${errorText}`;
        onError?.(error);
        onDone();
        return { success: false, content: '', error };
      }

      if (!response.body) {
        onError?.('No response body');
        onDone();
        return { success: false, content: '', error: 'No response body' };
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            onDone();
            return { success: true, content: fullContent };
          }

          try {
            const parsed = JSON.parse(jsonStr);

            if (parsed.error) {
              onError?.(parsed.error);
              onDone();
              return { success: false, content: fullContent, error: parsed.error };
            }

            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              onDelta(content);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              onDelta(content);
            }
          } catch { /* ignore */ }
        }
      }

      onDone();
      clearTimeout(timeoutId);
      return { success: true, content: fullContent };
    } catch (err) {
      clearTimeout(timeoutId);
      const error = err instanceof Error
        ? (err.name === 'AbortError' ? 'Request timed out (5 min)' : err.message)
        : 'Network error';
      onError?.(error);
      onDone();
      return { success: false, content: fullContent || '', error };
    }
  },
};

export default generateWishApi;
