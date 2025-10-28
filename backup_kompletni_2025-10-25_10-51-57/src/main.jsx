import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/design.css'
import App from './App.jsx'
import { WizardProvider } from './contexts/WizardContext'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Automatické odregistrovanie starých Service Workerov vo vývojovom prostredí
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => {
      r.unregister(); // Odregistruje starý SW v dev režime
      console.info('[SW] Development mode – service worker disabled');
    });
  });
  
  // Vyčisti cache
  caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <WizardProvider>
        <App />
      </WizardProvider>
    </ErrorBoundary>
  </StrictMode>,
)