const STORAGE_KEY = 'flowentra-incident-breadcrumbs';
const MAX_CRUMBS = 25;

export interface IncidentBreadcrumb {
  ts: string;
  type: 'navigation' | 'action' | 'api' | 'error';
  label: string;
}

export function pushBreadcrumb(crumb: Omit<IncidentBreadcrumb, 'ts'>): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const list: IncidentBreadcrumb[] = raw ? JSON.parse(raw) : [];
    list.push({ ...crumb, ts: new Date().toISOString() });
    while (list.length > MAX_CRUMBS) list.shift();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // quota / private mode
  }
}

export function getBreadcrumbsSummary(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const list = JSON.parse(raw) as IncidentBreadcrumb[];
    if (!list.length) return undefined;
    return list
      .slice(-12)
      .map((c) => `[${c.ts}] ${c.type}: ${c.label}`)
      .join('\n');
  } catch {
    return undefined;
  }
}

export function installNavigationBreadcrumbs(): void {
  if (typeof window === 'undefined') return;
  pushBreadcrumb({ type: 'navigation', label: window.location.pathname + window.location.search });

  window.addEventListener('popstate', () => {
    pushBreadcrumb({ type: 'navigation', label: window.location.pathname + window.location.search });
  });

  const origPush = history.pushState.bind(history);
  const origReplace = history.replaceState.bind(history);

  history.pushState = (...args) => {
    origPush(...args);
    pushBreadcrumb({ type: 'navigation', label: window.location.pathname + window.location.search });
  };
  history.replaceState = (...args) => {
    origReplace(...args);
    pushBreadcrumb({ type: 'navigation', label: window.location.pathname + window.location.search });
  };
}
