import { Buffer } from 'buffer'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { applyTypography } from './config/typography.runtime'
import App from './App.tsx'
import { restoreDashboardPrefix } from './components/HiddenDashboardPrefix'

// @react-pdf/renderer decodes fetched images through Node's Buffer. Vite does
// not polyfill Node globals, so PDF rendering crashed with "Buffer is not
// defined" as soon as a document embedded a logo.
if (typeof globalThis.Buffer === 'undefined') {
  ;(globalThis as any).Buffer = Buffer
}

// Inject the shared typography system as CSS custom properties on :root
// BEFORE the first paint so Tailwind semantic tokens (text-body, text-h1,
// font-heading, …) resolve consistently across every page.
applyTypography()

// Map bare URLs (/settings/system-config) back to their internal /dashboard/...
// form before the router mounts. The prefix is hidden again after navigation.
restoreDashboardPrefix()


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service Worker intentionally disabled. The previous /sw.js cache layer was a
// major source of stale-bundle bugs in production (users seeing a UI from a
// previous deploy with new backend contracts) and produced spurious update
// errors in preview iframes. We aggressively unregister any SW that a
// returning user might still have installed, and purge its caches.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((regs) => Promise.all(regs.map((r) => r.unregister())))
    .catch(() => { /* ignore */ });
  if (typeof caches !== 'undefined') {
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .catch(() => { /* ignore */ });
  }
}
