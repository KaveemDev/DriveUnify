import { db } from '../../config/firebase';
import {
  doc, setDoc, getDoc, collection,
  getDocs, deleteDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';

const sanitizeEmail = (email) => email.replace(/[@.]/g, '_');

// ── Local Storage Cache Helpers (Instant Refresh Resilience) ──
const ACCOUNTS_CACHE_PREFIX = 'driveunify_connected_accounts_';

export const getLocalConnectedAccounts = (uid) => {
  if (typeof window === 'undefined' || !uid) return [];
  try {
    const raw = localStorage.getItem(`${ACCOUNTS_CACHE_PREFIX}${uid}`);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('[DriveUnify] Could not read local accounts cache:', err);
    return [];
  }
};

export const setLocalConnectedAccounts = (uid, accounts) => {
  if (typeof window === 'undefined' || !uid) return;
  try {
    // Never cache live access tokens in localStorage
    // eslint-disable-next-line no-unused-vars
    const safeAccounts = (accounts || []).map(({ accessToken, ...safe }) => safe);
    localStorage.setItem(`${ACCOUNTS_CACHE_PREFIX}${uid}`, JSON.stringify(safeAccounts));
  } catch (err) {
    console.warn('[DriveUnify] Could not save to local accounts cache:', err);
  }
};

export const saveLocalConnectedAccount = (uid, accountData) => {
  if (typeof window === 'undefined' || !uid) return;
  try {
    const current = getLocalConnectedAccounts(uid);
    // eslint-disable-next-line no-unused-vars
    const { accessToken, ...safeData } = accountData;
    const existsIdx = current.findIndex(a => a.email === safeData.email);
    let updated;
    if (existsIdx >= 0) {
      updated = [...current];
      updated[existsIdx] = { ...updated[existsIdx], ...safeData };
    } else {
      updated = [...current, safeData];
    }
    setLocalConnectedAccounts(uid, updated);
  } catch (err) {
    console.warn('[DriveUnify] Could not cache account to localStorage:', err);
  }
};

export const removeLocalConnectedAccount = (uid, accountEmail) => {
  if (typeof window === 'undefined' || !uid) return;
  try {
    const current = getLocalConnectedAccounts(uid);
    const updated = current.filter(a => a.email !== accountEmail);
    setLocalConnectedAccounts(uid, updated);
  } catch (err) {
    console.warn('[DriveUnify] Could not remove account from local cache:', err);
  }
};

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
  // Always update local cache first for instant resilience
  saveLocalConnectedAccount(uid, accountData);

  if (!db) return;
  const accountId = sanitizeEmail(accountData.email);
  const accountRef = doc(db, 'users', uid, 'connected_accounts', accountId);

  // IMPORTANT: Never store the access token in Firestore.
  // Tokens expire in ~1 hour and reading a stale token causes 401s on reload.
  // The live token is always re-acquired silently from Cloud Functions on app load.
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
  const localAccounts = getLocalConnectedAccounts(uid);

  if (!db) return localAccounts;

  try {
    const colRef = collection(db, 'users', uid, 'connected_accounts');
    const snap = await withTimeout(getDocs(colRef), 'getConnectedAccounts');
    const firestoreAccounts = snap.docs.map(d => serializeTimestamps({ id: d.id, ...d.data() }));

    if (firestoreAccounts.length > 0) {
      setLocalConnectedAccounts(uid, firestoreAccounts);
      return firestoreAccounts;
    }

    // If Firestore returned empty array but local cache has accounts, keep local
    return localAccounts.length > 0 ? localAccounts : firestoreAccounts;
  } catch (err) {
    console.warn('[DriveUnify] Firestore getConnectedAccounts failed:', err.message);
    if (localAccounts.length > 0) {
      console.info('[DriveUnify] Retaining accounts from local storage cache.');
      return localAccounts;
    }
    throw err;
  }
};

export const removeConnectedAccount = async (uid, accountEmail) => {
  removeLocalConnectedAccount(uid, accountEmail);

  if (!db) return;
  const accountId = sanitizeEmail(accountEmail);
  const accountRef = doc(db, 'users', uid, 'connected_accounts', accountId);
  await withTimeout(deleteDoc(accountRef), 'removeConnectedAccount');
};

export const updateAccountTokens = async (uid, accountEmail, tokens) => {
  if (!db) return;
  const accountId = sanitizeEmail(accountEmail);
  const accountRef = doc(db, 'users', uid, 'connected_accounts', accountId);

  // Only persist safe metadata — never the access token, and strip undefined fields
  // eslint-disable-next-line no-unused-vars
  const { accessToken, ...safeTokens } = tokens;
  const cleanTokens = {};
  for (const [k, v] of Object.entries(safeTokens)) {
    if (v !== undefined) cleanTokens[k] = v;
  }
  if (Object.keys(cleanTokens).length === 0) return;

  await withTimeout(
    updateDoc(accountRef, {
      ...cleanTokens,
      updatedAt: serverTimestamp(),
    }),
    'updateAccountTokens'
  );
};

