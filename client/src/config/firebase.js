import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

export const isFirebaseConfigured = () => {
  return REQUIRED_ENV_VARS.every((key) => {
    const val = import.meta.env[key];
    return val && val !== 'your_value' && val.trim() !== '';
  });
};

const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => {
    const val = import.meta.env[key];
    return !val || val === 'your_value' || val.trim() === '';
  });

  if (missing.length > 0) {
    console.error(
      `[DriveUnify] Missing Firebase environment variables:\n${missing.join('\n')}\n\nPlease add them to your .env file.`
    );
    return false;
  }
  return true;
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app, auth, db, functions;

if (validateEnv()) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app, 'us-central1');

  // Explicitly set localStorage persistence so the session survives page reloads
  // and isn't cleared by browser session expiry (fixes "logged out after a day" bug)
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('[DriveUnify] Could not set auth persistence:', err);
  });

  // Connect to local emulator in development
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === 'true') {
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    console.info('[DriveUnify] Connected to Firebase Functions emulator');
  }
} else {
  console.warn('[DriveUnify] Firebase not initialized due to missing config. Running in demo mode.');
  auth = null;
  db = null;
  functions = null;
}

export { auth, db, functions };
export default app;
