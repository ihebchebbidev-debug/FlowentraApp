import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { applyTypography } from './config/typography.runtime'
import App from './App.tsx'

// Inject the shared typography system as CSS custom properties on :root
// BEFORE the first paint so Tailwind semantic tokens (text-body, text-h1,
// font-heading, …) resolve consistently across every page.
applyTypography()


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
