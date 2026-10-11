/**
 * OAuthCallback — /oauth/callback
 *
 * This page is the redirect target for Google's Authorization Code flow.
 * It opens as a popup window. When Google redirects here with `?code=xxx`,
 * we post the code to the parent window and close ourselves.
 *
 * The parent window (ConnectDriveModal) picks up the code and sends it
 * to the Cloud Function for secure token exchange.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Cloud, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
      setStatus('error');
      const msg = error === 'access_denied'
        ? 'Access was denied. Please try again.'
        : `OAuth error: ${error}`;
      setMessage(msg);

      // Notify parent and close
      if (window.opener) {
        window.opener.postMessage(
          { type: 'OAUTH_ERROR', error: msg },
          window.location.origin
        );
      }
      setTimeout(() => window.close(), 2000);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('No authorization code received.');
      setTimeout(() => window.close(), 2000);
      return;
    }

    setStatus('success');
    setMessage('Authorization successful! Closing…');

    // Send code to parent window
    if (window.opener) {
      window.opener.postMessage(
        { type: 'OAUTH_CODE', code, state },
        window.location.origin
      );
    }

    // Close popup after short delay so user sees the success state
    setTimeout(() => window.close(), 1200);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4 p-8">
        {/* Logo */}
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-glow">
          <Cloud size={22} className="text-white" />
        </div>

        {status === 'processing' && (
          <>
            <Loader2 size={36} className="text-blue-400 animate-spin mx-auto" />
            <p className="text-slate-300 text-sm font-medium">Connecting your Drive…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={36} className="text-emerald-400 mx-auto" />
            <p className="text-slate-300 text-sm font-medium">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={36} className="text-red-400 mx-auto" />
            <p className="text-red-300 text-sm font-medium">{message}</p>
            <p className="text-slate-600 text-xs">This window will close automatically.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
