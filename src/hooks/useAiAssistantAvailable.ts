import { useOffline } from "@/contexts/OfflineContext";

/**
 * AI/LLM features need network and must not run in explicit offline mode.
 * Mirrors {@link isOfflineLike} for React (re-renders on connectivity + offline toggle).
 */
export function useAiAssistantAvailable(): boolean {
  const { online, enabled: offlineModeEnabled } = useOffline();
  return online && !offlineModeEnabled;
}
