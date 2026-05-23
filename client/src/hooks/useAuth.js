import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setLoading, setInitialized, setError, logout } from '../store/slices/authSlice';
import { setConnectedAccounts, updateAccount, setLoading as setDriveLoading } from '../store/slices/driveSlice';
import { signInWithGoogle, signOutUser, onAuthStateChange } from '../services/firebase/auth';
import { createUserDocument, getConnectedAccounts } from '../services/firebase/firestore';
import { silentRefreshAccount } from '../services/google-drive/auth';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, loading, initialized, error } = useSelector(s => s.auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };

        dispatch(setUser(userData));

        // Ensure user document exists (important for redirect sign-ins)
        createUserDocument(userData.uid, userData).catch(err => 
          console.warn('[DriveUnify] Failed to update user document:', err)
        );

        try {
          dispatch(setDriveLoading(true));
          // Load connected account metadata from Firestore (no live token stored there)
          const accounts = await getConnectedAccounts(firebaseUser.uid);

          // Immediately populate the store so the UI can render placeholders
          dispatch(setConnectedAccounts(accounts));

          if (accounts.length === 0) {
            dispatch(setDriveLoading(false));
          }

          // Silently refresh tokens for all connected accounts via Cloud Functions.
          // This replaces missing/expired tokens with fresh ones — no popup, no 401.
          if (accounts.length > 0) {
            const refreshed = await Promise.allSettled(
              accounts.map(account => silentRefreshAccount(account))
            );

            refreshed.forEach((result) => {
              if (result.status === 'fulfilled') {
                const acct = result.value;
                dispatch(updateAccount({
                  email: acct.email,
                  accessToken: acct.accessToken,
                  expiryDate: acct.expiryDate,
                  needsReconnect: acct.needsReconnect ?? false,
                  expired: acct.expired ?? false,
                }));
              }
            });
          }
        } catch (err) {
          console.warn('[DriveUnify] Could not load connected accounts:', err);
          dispatch(setDriveLoading(false));
        }
      } else {
        // User signed out — clear everything immediately to prevent cross-user data leakage
        dispatch(logout());
        dispatch(setConnectedAccounts([]));
        dispatch(setDriveLoading(false));
      }

      dispatch(setInitialized(true));
    });

    return unsubscribe;
  }, [dispatch]);

  const signIn = async () => {
    dispatch(setLoading(true));
    dispatch(setDriveLoading(true));
    try {
      const userData = await signInWithGoogle();
      if (!userData) return; // User is being redirected
      await createUserDocument(userData.uid, {
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
      });
      dispatch(setUser(userData));
    } catch (err) {
      dispatch(setError(err.message));
      dispatch(setDriveLoading(false));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const signOut = async () => {
    dispatch(setLoading(true));
    try {
      await signOutUser();
      dispatch(logout());
      dispatch(setConnectedAccounts([]));
      dispatch(setDriveLoading(false));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { user, loading, initialized, error, signIn, signOut };
};
