import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {I18nProvider} from './utils/I18nContext';
import './index.css';

if (import.meta.env.DEV && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      for (const reg of registrations) {
        void reg.unregister();
      }
    })
    .catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <I18nProvider>
    <App />
  </I18nProvider>
);

