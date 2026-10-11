import { auth } from '../../config/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({ prompt: 'select_account' });

const formatUserData = (user) => {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: user.metadata.creationTime,
    lastSignIn: user.metadata.lastSignInTime,
  };
};

import {
  setCrossDomainSession,
  clearCrossDomainSession,
  getCrossDomainSession,
} from './authSync';

export const checkRedirectResult = async () => {
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    if (!result?.user) return null;
    const token = await result.user.getIdToken();
    const formatted = formatUserData(result.user);
    setCrossDomainSession(formatted, token);
    return formatted;
  } catch (error) {
    console.warn('[DriveUnify] getRedirectResult check:', error);
    return null;
  }
};

export const signInWithGoogle = async () => {
  if (!auth) throw new Error('Firebase auth is not initialized. Check your .env file.');
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    const formatted = formatUserData(result.user);
    setCrossDomainSession(formatted, token);
    return formatted;
  } catch (error) {
    if (error.code === 'auth/popup-blocked') {
      console.warn('Popup blocked by browser. Falling back to redirect...');
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
};

export const signOutUser = async () => {
  if (!auth) throw new Error('Firebase auth is not initialized.');
  clearCrossDomainSession();
  await signOut(auth);
};

export const onAuthStateChange = (callback) => {
  if (!auth) {
    const session = getCrossDomainSession();
    if (session) {
      callback(session);
    } else {
      callback(null);
    }
    return () => {};
  }
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const token = await user.getIdToken();
      const formatted = formatUserData(user);
      setCrossDomainSession(formatted, token);
      callback(user);
    } else {
      // Check if session cookie exists
      const session = getCrossDomainSession();
      if (!session) {
        callback(null);
      } else {
        // If session exists from landing, pass cached session info to initial state
        callback(null);
      }
    }
  });
};

export const getCurrentUser = () => {
  return auth?.currentUser ?? null;
};
