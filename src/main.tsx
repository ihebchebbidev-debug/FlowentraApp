import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker for offline support and smart caching (production only)
// In Lovable preview/sandbox iframes the SW cannot be served, which produces
// spurious 404s and registration retries. Skip in dev.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('Service Worker registered:', reg);
        
        // Check for updates periodically
        setInterval(() => {
          reg.update();
        }, 60000); // Check every minute
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });

  // Listen for controller change (new SW became active)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('New Service Worker activated');
  });
}

