import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCvKKUFUuLo0xkxP21tzp_6HI043bfcrDw',
  authDomain: 'drivehub-dddd8.firebaseapp.com',
  projectId: 'drivehub-dddd8',
  storageBucket: 'drivehub-dddd8.firebasestorage.app',
  messagingSenderId: '411364190299',
  appId: '1:411364190299:web:aa01dcd890bef2f242b77e',
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
};

export const isFirebaseConfigured = () => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_api_key' && !firebaseConfig.apiKey.startsWith('your_'));
};

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured()) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  console.warn('[DriveUnify] Firebase not initialized due to missing config. Running in demo mode.');
}

export { auth, db };
export default app;
