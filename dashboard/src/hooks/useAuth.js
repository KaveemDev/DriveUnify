import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { setUser, setLoading, setInitialized, setError, logout } from '../store/slices/authSlice';
import { setConnectedAccounts, updateAccount, setLoading as setDriveLoading } from '../store/slices/driveSlice';
import { signInWithGoogle, signOutUser, onAuthStateChange, checkRedirectResult } from '../services/firebase/auth';
import { createUserDocument, getConnectedAccounts, getLocalConnectedAccounts } from '../services/firebase/firestore';
import { silentRefreshAccount } from '../services/google-drive/auth';
import { silentRefreshDropboxAccount } from '../services/dropbox/auth';

/**
 * Global auth initialization hook — MUST ONLY BE RUN ONCE at the app root (App.jsx).
 * Does NOT run inside OAuth callback popups.
 */
export const useAuthInit = (enabled = true) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    let unsubscribe = () => {};

    const initialize = async () => {
      // 1. Process redirect result first if returning from OAuth redirect
      try {
        const redirectUser = await checkRedirectResult();
        if (redirectUser && isMounted) {
          dispatch(setUser(redirectUser));
          createUserDocument(redirectUser.uid, redirectUser).catch((err) =>
            console.warn('[DriveUnify] Failed to update user document after redirect:', err)
          );
        }
      } catch (err) {
        console.warn('[DriveUnify] checkRedirectResult error:', err);
      }

      if (!isMounted) return;

      // 2. Attach global Firebase auth state listener
      unsubscribe = onAuthStateChange(async (firebaseUser) => {
        if (!isMounted) return;
        if (firebaseUser) {
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          };

          dispatch(setUser(userData));
          // Don't hold the app behind a spinner while accounts/tokens load
          dispatch(setInitialized(true));

          // Ensure user document exists (non-blocking)
          createUserDocument(userData.uid, userData).catch((err) =>
            console.warn('[DriveUnify] Failed to update user document:', err)
          );

          // Instantly hydrate accounts from localStorage cache (ensures zero empty-state flash on refresh)
          const cachedAccounts = getLocalConnectedAccounts(firebaseUser.uid);
          if (cachedAccounts.length > 0) {
            dispatch(setConnectedAccounts(cachedAccounts));
          }

          try {
            dispatch(setDriveLoading(true));

            // Load connected account metadata from Firestore (or fallback to local cache)
            const accounts = await getConnectedAccounts(firebaseUser.uid);

            // Update store with latest accounts
            dispatch(setConnectedAccounts(accounts));

            // Silently refresh tokens for all connected accounts via Cloud Functions.
            if (accounts.length > 0) {
              const refreshed = await Promise.allSettled(
                accounts.map((account) => {
                  const isDbx = (account.provider || '').toLowerCase().includes('dropbox');
                  return isDbx ? silentRefreshDropboxAccount(account) : silentRefreshAccount(account);
                })
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
            if (err.message?.includes('permission') || err.code === 'permission-denied') {
              toast.error(
                'Firestore permission denied. Please publish security rules in Firebase Console for cross-device sync.',
                { id: 'firestore-rules-warning', duration: 8000 }
              );
            }
          } finally {
            if (isMounted) dispatch(setDriveLoading(false));
          }
        } else {
          // User signed out — clear everything immediately to prevent cross-user data leakage
          dispatch(logout());
          dispatch(setConnectedAccounts([]));
          dispatch(setDriveLoading(false));
        }

        if (isMounted) dispatch(setInitialized(true));
      });
    };

    initialize();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [dispatch, enabled]);
};

/**
 * Consumer hook for components to access auth state and methods.
 * Does NOT register duplicate onAuthStateChange listeners!
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, loading, initialized, error } = useSelector((s) => s.auth);

  const signIn = async (useRedirect = false) => {
    dispatch(setError(null));
    try {
      // Note: Do not dispatch setLoading(true) before signInWithGoogle.
      // Disabling the button or modifying DOM before window.open causes browsers
      // (Chrome, Safari, Firefox) to revoke the user activation gesture, causing popup-blocked.
      const userData = await signInWithGoogle(useRedirect);
      if (!userData) return; // User is being redirected

      dispatch(setLoading(true));
      dispatch(setDriveLoading(true));

      // Set user immediately in Redux
      dispatch(setUser(userData));

      // Asynchronously create or update user doc without blocking authentication
      createUserDocument(userData.uid, {
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
      }).catch((err) =>
        console.warn('[DriveUnify] Non-fatal: Failed to update user document:', err)
      );
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
