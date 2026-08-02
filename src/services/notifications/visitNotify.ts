/**
 * Sends a push notification to ntfy.sh/flow whenever a user enters the app
 * on one of the tracked tenant subdomains. Fires once per browser session.
 */

const NTFY_URL = 'https://ntfy.sh/flow';
const SESSION_KEY = 'ntfy_visit_notified';

const TRACKED_HOSTS = [
  'test.flowentra.app',
  'dev.flowentra.app',
  'demo.flowentra.app',
  'dubai.flowentra.app',
  'kr.flowentra.app',
];

export function notifyAppVisit(): void {
  if (typeof window === 'undefined') return;

  const host = window.location.hostname.toLowerCase();
  if (!TRACKED_HOSTS.includes(host)) return;

  try {
    if (sessionStorage.getItem(SESSION_KEY) === host) return;
    sessionStorage.setItem(SESSION_KEY, host);
  } catch {
    /* ignore storage errors */
  }

  const tenant = host.split('.')[0];

  let user = '';
  try {
    const raw = localStorage.getItem('user_data');
    if (raw) {
      const data = JSON.parse(raw);
      user = data?.email || data?.userName || data?.name || '';
    }
  } catch {
    /* ignore */
  }

  const body = [
    `Tenant: ${tenant}`,
    `Host: ${host}`,
    user ? `User: ${user}` : 'User: (not signed in)',
    `Page: ${window.location.pathname}`,
    `Time: ${new Date().toLocaleString()}`,
  ].join('\n');

  fetch(NTFY_URL, {
    method: 'POST',
    headers: {
      Title: `App visit — ${tenant}`,
      Priority: '3',
      Tags: 'bust_in_silhouette,globe_with_meridians',
      Click: window.location.href,
    },
    body,
    keepalive: true,
  }).catch(() => {
    /* best-effort — never block the app */
  });
}
