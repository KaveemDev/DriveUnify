import { db } from '../../config/firebase';
import {
  doc, setDoc, getDoc, collection,
  getDocs, deleteDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';

const sanitizeEmail = (email) => email.replace(/[@.]/g, '_');

// ── Timeout Wrapper for Firestore ─────────────────────────────
const FIRESTORE_TIMEOUT_MS = 8000; // 8 seconds

const withTimeout = (promise, operationName) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Firebase ${operationName} timed out. Please ensure you have created and enabled the "Firestore Database" in your Firebase Console (and selected the correct project).`)),
        FIRESTORE_TIMEOUT_MS
      )
    ),
  ]);
};

// Helper to serialize Firestore Timestamps for Redux compatibility
const serializeTimestamps = (data) => {
  if (!data) return data;
  const serialized = { ...data };
  for (const key of Object.keys(serialized)) {
    const val = serialized[key];
    if (val && typeof val === 'object' && typeof val.toDate === 'function') {
      serialized[key] = val.toDate().toISOString();
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      serialized[key] = serializeTimestamps(val);
    }
  }
  return serialized;
};

// ── User Documents ────────────────────────────────────────────

export const createUserDocument = async (uid, data) => {
  if (!db) throw new Error('Firestore not initialized.');
  const userRef = doc(db, 'users', uid);
  await withTimeout(
    setDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true }),
    'createUserDocument'
  );
};

export const getUserDocument = async (uid) => {
  if (!db) return null;
  const userRef = doc(db, 'users', uid);
  const snap = await withTimeout(getDoc(userRef), 'getUserDocument');
  return snap.exists() ? serializeTimestamps({ id: snap.id, ...snap.data() }) : null;
};

// ── Connected Accounts ────────────────────────────────────────

export const addConnectedAccount = async (uid, accountData) => {
  if (!db) throw new Error('Firestore not initialized.');
  const accountId = sanitizeEmail(accountData.email);
  const accountRef = doc(db, 'users', uid, 'connected_accounts', accountId);

  // IMPORTANT: Never store the access token in Firestore.
  // Tokens expire in ~1 hour and reading a stale token causes 401s on reload.
  // The live token is always re-acquired silently from GIS on app load.
  // eslint-disable-next-line no-unused-vars
  const { accessToken, ...safeData } = accountData;

  await withTimeout(
    setDoc(accountRef, {
      ...safeData,
      connectedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true }),
    'addConnectedAccount'
  );
};

export const getConnectedAccounts = async (uid) => {
  if (!db) return [];
  const colRef = collection(db, 'users', uid, 'connected_accounts');
  const snap = await withTimeout(getDocs(colRef), 'getConnectedAccounts');
  return snap.docs.map(d => serializeTimestamps({ id: d.id, ...d.data() }));
};

export const removeConnectedAccount = async (uid, accountEmail) => {
  if (!db) throw new Error('Firestore not initialized.');
  const accountId = sanitizeEmail(accountEmail);
  const accountRef = doc(db, 'users', uid, 'connected_accounts', accountId);
  await withTimeout(deleteDoc(accountRef), 'removeConnectedAccount');
};

export const updateAccountTokens = async (uid, accountEmail, tokens) => {
  if (!db) throw new Error('Firestore not initialized.');
  const accountId = sanitizeEmail(accountEmail);
  const accountRef = doc(db, 'users', uid, 'connected_accounts', accountId);

  // Only persist safe metadata — never the access token
  // eslint-disable-next-line no-unused-vars
  const { accessToken, ...safeTokens } = tokens;

  await withTimeout(
    updateDoc(accountRef, {
      ...safeTokens,
      updatedAt: serverTimestamp(),
    }),
    'updateAccountTokens'
  );
};

