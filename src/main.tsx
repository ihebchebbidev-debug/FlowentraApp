import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker for offline support and smart cachingq
if ('serviceWorker' in navigator) {
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

