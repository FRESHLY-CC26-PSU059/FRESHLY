import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, type Auth } from 'firebase/auth';
import { getMessaging, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
};

export const FIREBASE_ENABLED = isFirebaseConfigured();

// Initialize Firebase only if configured
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let microsoftProvider: OAuthProvider | null = null;
let messaging: Messaging | null = null;

if (FIREBASE_ENABLED) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    microsoftProvider = new OAuthProvider('microsoft.com');
    
    // Initialize Cloud Messaging
    try {
      messaging = getMessaging(app);
    } catch (messagingError) {
      // Messaging init failed — SW may not be registered; FCM will be unavailable
    }
  } catch (error) {
    // Firebase init failed — app will run without Firebase features
  }
}

export { auth, googleProvider, microsoftProvider, messaging };
