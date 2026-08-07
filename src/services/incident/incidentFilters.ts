/** Patterns that are never user-facing bugs — skip incident tickets. */
const IGNORE_PATTERNS: RegExp[] = [
  /systemlogs/i,
  /failed to log/i,
  /logger:/i,
  /incidents\/auto/i,
  /download the react devtools/i,
  /react devtools/i,
  /\[vite\]/i,
  /hmr/i,
  /hot updated/i,
  /resizeobserver loop/i,
  /non-passive event listener/i,
  /aria-hidden/i,
  /manifest\.json/i,
  /favicon\.ico/i,
  /chunk-reload/i,
  /session expired/i,
  /401 unauthorized/i,
  /403 forbidden/i,
  /aborted/i,
  /cancelled/i,
  /canceled/i,
  /signal is aborted/i,
  /network error when attempting to fetch resource/i, // transient during navigation
  // Backend DI/config errors — server-side issue, not a frontend bug
  /unable to resolve service for type/i,
  /iPluginService/i,
  /PluginsController/i,
  // Workflow not configured — expected when no workflow is set up for an entity
  /workflow \d+ not found/i,
  /no workflow configured/i,
  // Plugin API unavailable — backend config issue, gracefully handled in UI
  /plugins api is unavailable/i,
];

/** Benign 4xx — user/input errors, not bugs. */
const BENIGN_HTTP_STATUSES = new Set([400, 401, 403, 404, 409, 422]);

/** Actionable console/API error signals. */
const ACTIONABLE_PATTERNS: RegExp[] = [
  /typeerror/i,
  /referenceerror/i,
  /syntaxerror/i,
  /rangeerror/i,
  /cannot read propert/i,
  /is not a function/i,
  /is not defined/i,
  /undefined is not/i,
  /null is not/i,
  /failed to fetch/i,
  /network error/i,
  /500/i,
  /502/i,
  /503/i,
  /504/i,
  /internal server error/i,
  /unexpected token/i,
  /chunk/i,
  /dynamically imported module/i,
  /loading chunk/i,
  /crashed/i,
  /unhandled/i,
  /exception/i,
  /stack/i,
];

export function isIgnorableIncidentMessage(message: string): boolean {
  const m = message.trim();
  if (!m || m.length < 3) return true;
  return IGNORE_PATTERNS.some((p) => p.test(m));
}

export function isActionableErrorMessage(message: string): boolean {
  if (isIgnorableIncidentMessage(message)) return false;
  const m = message.trim();
  if (m.length >= 20 && /error|failed|exception|crash|cannot|undefined|null/i.test(m)) {
    return true;
  }
  return ACTIONABLE_PATTERNS.some((p) => p.test(m));
}

export function isBenignHttpStatus(status: number): boolean {
  return BENIGN_HTTP_STATUSES.has(status);
}

export function isChunkLoadMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('dynamically imported module') ||
    m.includes('loading chunk') ||
    m.includes('error loading') ||
    m.includes('importing a module script failed') ||
    m.includes('chunkloaderror')
  );
}

export function shouldTicketHttpStatus(status: number, clientOccurrenceCount: number): boolean {
  if (status >= 500) return true;
  if (status === 0) return clientOccurrenceCount >= 1; // network
  if (status >= 400 && status < 500) return clientOccurrenceCount >= 3;
  return false;
}
