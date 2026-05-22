import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud } from 'lucide-react';
import { Box, Typography, Button, Alert, Paper } from '@mui/material';
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
  const navigate = useNavigate();
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const handleSignIn = async () => {
    setLocalError('');
    try {
      await signIn();
    } catch (err) {
      if (!err.message?.includes('popup')) {
        setLocalError(err.message || 'Sign in failed. Please try again.');
      }
    }
  };

  const displayError = localError || error;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, position: 'relative', overflow: 'hidden' }}>
      {/* Animated gradient mesh background */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: '-25%', left: '-25%', width: '75%', height: '75%', borderRadius: '50%', opacity: 0.2, background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
        <Box sx={{ position: 'absolute', bottom: '-25%', right: '-25%', width: '75%', height: '75%', borderRadius: '50%', opacity: 0.15, background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '50%', height: '50%', borderRadius: '50%', opacity: 0.1, background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }} />
      </Box>

      {/* Login card */}
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 400, zIndex: 1 }}>
        <Paper elevation={24} sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper', backdropFilter: 'blur(20px)' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 4 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: 3, background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)' }}>
              <Cloud size={32} color="#fff" />
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="bold">DriveUnify</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>Manage all your Google Drives in one place</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
            {['🗂️ Unified file explorer across all accounts', '⚡ Upload to any connected Drive account', '🔍 Search and filter across everything'].map(feat => (
              <Typography key={feat} variant="body2" color="text.secondary">{feat}</Typography>
            ))}
          </Box>

          {displayError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {displayError}
            </Alert>
          )}

          <Button
            fullWidth
            size="large"
            variant="contained"
            onClick={handleSignIn}
            disabled={loading}
            startIcon={loading ? null : <GoogleIcon />}
            sx={{ py: 1.5, bgcolor: '#fff', color: '#333', '&:hover': { bgcolor: '#f5f5f5' }, '&:active': { bgcolor: '#e5e5e5' } }}
          >
            {loading ? 'Signing in…' : 'Continue with Google'}
          </Button>

          <Typography variant="caption" color="text.secondary" display="block" align="center" mt={3}>
            By signing in, you agree to our Terms and Privacy Policy.
            <br />We never store your Drive files on our servers.
          </Typography>
        </Paper>

        <Typography variant="caption" color="text.disabled" display="block" align="center" mt={2}>
          DriveUnify v2.0
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;
