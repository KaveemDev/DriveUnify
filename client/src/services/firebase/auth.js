import { auth } from '../../config/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export const signInWithGoogle = async () => {
  if (!auth) throw new Error('Firebase auth is not initialized. Check your .env file.');
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: user.metadata.creationTime,
    lastSignIn: user.metadata.lastSignInTime,
  };
};

export const signOutUser = async () => {
  if (!auth) throw new Error('Firebase auth is not initialized.');
  await signOut(auth);
};

export const onAuthStateChange = (callback) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = () => {
  return auth?.currentUser ?? null;
};
