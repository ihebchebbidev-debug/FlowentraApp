/**
 * Shared AI / LLM availability when the app is in browser-offline or explicit offline mode.
 */
import { isOfflineLike } from "@/services/offline/offlineRequestPolicy";

/** Returned by AI services when calls are blocked (maps to i18n in UI). */
export const AI_ERROR_OFFLINE = "AI_OFFLINE" as const;

export function isAiAssistantBlockedByOffline(): boolean {
  return isOfflineLike();
}
