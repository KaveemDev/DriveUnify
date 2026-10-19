import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
  </svg>
);

const Login = () => {
  const { signIn, loading, error, user } = useAuth();
  const router = useRouter();
  const [localError, setLocalError] = useState('');
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const handleSignIn = async (useRedirect = false) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLocalError('');
    setIsPopupBlocked(false);
    setIsSubmitting(true);

    try {
      await signIn(useRedirect);
    } catch (err) {
      if (err.code === 'auth/popup-blocked' || err.message?.includes('popup-blocked')) {
        setIsPopupBlocked(true);
        setLocalError('Your browser blocked the sign-in popup. Please click the popup icon in your address bar to allow popups, or try the redirect option below.');
      } else if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
        setLocalError(`This domain (${currentDomain}) is not authorized in Firebase Console.\n\nPlease add "${currentDomain}" to Firebase Console > Authentication > Settings > Authorized Domains.`);
      } else if (!err.message?.includes('popup-closed-by-user')) {
        setLocalError(err.message || 'Sign in failed. Please try again.');
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const displayError = localError || error;

  const busy = isSubmitting || loading;

  return (
    <main className="min-h-dvh bg-page text-ink grid lg:grid-cols-2">
      {/* What you get, on the brand-tinted half (desktop only) */}
      <section className="hidden lg:flex flex-col justify-between bg-brand-soft p-12 xl:p-16">
        <NextLink href="/" className="flex items-center gap-2.5 text-[1.1875rem] font-black tracking-[-0.03em]">
          <span aria-hidden="true" className="size-[22px] rounded-full bg-brand" />
          DriveUnify
        </NextLink>
        <div>
          <p className="max-w-[14ch] text-[clamp(2.5rem,1.2rem+3vw,4rem)] font-bold leading-[1.02] tracking-[-0.035em]">
            All your Drives, one place
          </p>
          <ul className="mt-8 grid gap-3 text-lg">
            {['One file explorer for every account', 'Upload to any connected Drive', 'Search and filter across everything'].map((feat) => (
              <li key={feat} className="flex items-center gap-3">
                <Check size={20} className="flex-none text-brand" />
                {feat}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-muted">We never store your Drive files on our servers.</p>
      </section>

      {/* Sign-in */}
      <section className="flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-[400px]">
          <NextLink href="/" className="mb-12 flex items-center gap-2.5 text-[1.1875rem] font-black tracking-[-0.03em] lg:hidden">
            <span aria-hidden="true" className="size-[22px] rounded-full bg-brand" />
            DriveUnify
          </NextLink>

          <h1 className="text-[2.5rem] font-bold leading-[1.05] tracking-[-0.035em]">Sign in</h1>
          <p className="mt-3 text-[1.0625rem] text-muted">Use the Google account you open most days. You can add the others once you are in.</p>

          {displayError && (
            <div role="alert" className="mt-8 flex gap-3 whitespace-pre-line rounded-xl bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
              <AlertCircle size={18} className="mt-0.5 flex-none" />
              <span>{displayError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleSignIn(false)}
            disabled={busy}
            className="mt-8 flex h-[52px] w-full items-center justify-center gap-3 rounded-full border border-line bg-surface font-bold text-ink transition-transform hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 cursor-pointer"
          >
            {!busy && <GoogleIcon />}
            {busy ? 'Signing in…' : 'Continue with Google'}
          </button>

          {isPopupBlocked && (
            <button
              type="button"
              onClick={() => handleSignIn(true)}
              className="mt-4 w-full text-center text-sm font-medium text-brand underline underline-offset-4 cursor-pointer"
            >
              Sign in with page redirect instead
            </button>
          )}

          <p className="mt-8 text-sm text-muted">
            By signing in, you agree to our{' '}
            <NextLink href="/legal" className="text-ink underline underline-offset-4">terms and privacy policy</NextLink>.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Login;
