import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCvKKUFUuLo0xkxP21tzp_6HI043bfcrDw',
  authDomain: 'drivehub-dddd8.firebaseapp.com',
  projectId: 'drivehub-dddd8',
  storageBucket: 'drivehub-dddd8.firebasestorage.app',
  messagingSenderId: '411364190299',
  appId: '1:411364190299:web:aa01dcd890bef2f242b77e',
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
};

export const isFirebaseConfigured = () => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_api_key' && !firebaseConfig.apiKey.startsWith('your_'));
};

let app, auth, db, functions;

if (isFirebaseConfigured()) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app, 'us-central1');

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
