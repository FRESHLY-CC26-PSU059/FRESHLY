import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './redux/store'
import './i18n'
import './index.css'
import App from './App.tsx'
import { AppThemeProvider } from './theme/AppThemeProvider'

// Register FCM service worker with Firebase config as query params
if ('serviceWorker' in navigator) {
  const swConfig = new URLSearchParams();
  const env = import.meta.env;
  if (env.VITE_FIREBASE_API_KEY) swConfig.set('apiKey', env.VITE_FIREBASE_API_KEY);
  if (env.VITE_FIREBASE_AUTH_DOMAIN) swConfig.set('authDomain', env.VITE_FIREBASE_AUTH_DOMAIN);
  if (env.VITE_FIREBASE_PROJECT_ID) swConfig.set('projectId', env.VITE_FIREBASE_PROJECT_ID);
  if (env.VITE_FIREBASE_STORAGE_BUCKET) swConfig.set('storageBucket', env.VITE_FIREBASE_STORAGE_BUCKET);
  if (env.VITE_FIREBASE_MESSAGING_SENDER_ID) swConfig.set('messagingSenderId', env.VITE_FIREBASE_MESSAGING_SENDER_ID);
  if (env.VITE_FIREBASE_APP_ID) swConfig.set('appId', env.VITE_FIREBASE_APP_ID);

  const swUrl = swConfig.toString()
    ? `/firebase-messaging-sw.js?${swConfig.toString()}`
    : '/firebase-messaging-sw.js';

  navigator.serviceWorker.register(swUrl).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppThemeProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </AppThemeProvider>
  </StrictMode>,
)
