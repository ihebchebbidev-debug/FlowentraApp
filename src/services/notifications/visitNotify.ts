/**
 * Sends a push notification to ntfy.sh/flow whenever anyone opens the app.
 * Fires on every entry (page load), regardless of login state.
 */

const NTFY_URL = 'https://ntfy.sh/flow';

// Headers must be ASCII-only, otherwise fetch() throws and nothing is sent.
function ascii(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, '');
}

export function notifyAppVisit(): void {
  if (typeof window === 'undefined') return;

  const host = window.location.hostname.toLowerCase();
  const tenant = host.split('.')[0] || host;

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
      Title: ascii(`App visit - ${tenant}`),
      Priority: '3',
      Tags: 'bust_in_silhouette,globe_with_meridians',
      Click: ascii(window.location.href),
    },
    body,
    keepalive: true,
  }).catch(() => {
    /* best-effort - never block the app */
  });
}
