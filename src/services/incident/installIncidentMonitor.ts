import { reportIncident } from './incidentService';
import { installNavigationBreadcrumbs } from './incidentBreadcrumbs';
import { isIgnorableIncidentMessage } from './incidentFilters';
import { API_URL } from '@/config/api';

let installed = false;

export function installIncidentMonitor(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  installNavigationBreadcrumbs();

  window.addEventListener('offline:sync-cycle-finished', (ev) => {
    const detail = (ev as CustomEvent<{ lastError?: string; lastSyncDetail?: string }>).detail;
    const err = detail?.lastError?.trim();
    if (!err || isIgnorableIncidentMessage(err)) return;
    void reportIncident({
      incidentType: 'sync_failure',
      message: err,
      module: 'offline-sync',
      details: detail?.lastSyncDetail,
      severity: 'high',
    });
  });

  window.addEventListener('securitypolicyviolation', (ev) => {
    const e = ev as SecurityPolicyViolationEvent;
    void reportIncident({
      incidentType: 'security_violation',
      message: `CSP blocked ${e.violatedDirective}: ${e.blockedURI || e.sourceFile || 'unknown'}`,
      module: 'security',
      severity: 'medium',
      details: JSON.stringify({
        directive: e.violatedDirective,
        blockedURI: e.blockedURI,
        sourceFile: e.sourceFile,
        lineNumber: e.lineNumber,
      }),
    });
  });

  // Backend health: ticket after 3 consecutive failures (once per session)
  let healthFailStreak = 0;
  let healthTicketSent = false;

  const checkHealth = async () => {
    try {
      const controller = new AbortController();
      const t = window.setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(`${API_URL}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache', 'X-Bypass-Offline-Queue': 'true' },
      });
      window.clearTimeout(t);
      if (res.ok) {
        healthFailStreak = 0;
        return;
      }
      // 404 = endpoint doesn't exist on this backend — backend IS reachable, not a health failure
      if (res.status === 404) return;
      healthFailStreak += 1;
      if (healthFailStreak >= 3 && !healthTicketSent) {
        healthTicketSent = true;
        void reportIncident({
          incidentType: 'backend_health',
          message: `Backend health check failed (${res.status})`,
          httpStatus: res.status,
          endpoint: '/api/health',
          httpMethod: 'GET',
          module: 'infrastructure',
          severity: res.status >= 500 ? 'critical' : 'high',
        });
      }
    } catch (err) {
      healthFailStreak += 1;
      if (healthFailStreak >= 3 && !healthTicketSent) {
        healthTicketSent = true;
        void reportIncident({
          incidentType: 'backend_health',
          message: err instanceof Error ? err.message : 'Backend health check unreachable',
          endpoint: '/api/health',
          httpMethod: 'GET',
          module: 'infrastructure',
          severity: 'critical',
        });
      }
    }
  };

  void checkHealth();
  window.setInterval(checkHealth, 60_000);
}
