import { auth, functions } from '../../config/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

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

export const signInWithGoogle = async (useRedirect = false) => {
  if (!auth) throw new Error('Firebase auth is not initialized. Check your .env file.');
  if (useRedirect) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    const formatted = formatUserData(result.user);
    setCrossDomainSession(formatted, token);
    return formatted;
  } catch (error) {
    if (error.code === 'auth/popup-blocked') {
      console.warn('[DriveUnify] Sign-in popup was blocked by browser.');
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
  let isInitial = true;
  let ssoAttempted = false;
  return onAuthStateChanged(auth, async (user) => {
    const firstEvent = isInitial;
    isInitial = false;
    const session = getCrossDomainSession();

    if (user) {
      // Cookie gone or for another user → signed out / switched account on the landing site.
      if (firstEvent && session?.uid !== user.uid) {
        await signOut(auth); // listener fires again with null and picks up the cookie user, if any
        return;
      }
      try {
        setCrossDomainSession(formatUserData(user), await user.getIdToken());
      } catch (err) {
        console.warn('[DriveUnify] Could not refresh shared session cookie:', err);
      }
      callback(user);
      return;
    }

    // Signed in on the landing site (separate origin) → trade its ID token for a session here.
    if (session?.token && !ssoAttempted) {
      ssoAttempted = true;
      try {
        const createSsoToken = httpsCallable(functions, 'createSsoToken', { timeout: 10000 });
        const { data } = await createSsoToken({ idToken: session.token });
        await signInWithCustomToken(auth, data.customToken);
        return; // listener fires again with the user
      } catch (err) {
        console.warn('[DriveUnify] Cross-domain sign-in failed, showing login:', err);
      }
    }
    callback(null);
  });
};

export const getCurrentUser = () => {
  return auth?.currentUser ?? null;
};
