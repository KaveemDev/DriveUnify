'use client';

import { usePathname } from 'next/navigation';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import store from '@/drive/store';
import { ThemeContextProvider } from '@/drive/theme';
import { ErrorBoundary } from '@/drive/components/common/ErrorBoundary';
import { useAuthInit } from '@/drive/hooks/useAuth';

function AuthBoot({ children }) {
  const pathname = usePathname() || '';
  useAuthInit(!pathname.startsWith('/oauth/callback'));
  return children;
}

export default function DriveLayout({ children }) {
  return (
    <AppRouterCacheProvider>
      <ErrorBoundary>
        <Provider store={store}>
          <ThemeContextProvider>
            <AuthBoot>{children}</AuthBoot>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1e293b',
                  color: '#f1f5f9',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  padding: '12px 16px',
                },
                success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
              }}
            />
          </ThemeContextProvider>
        </Provider>
      </ErrorBoundary>
    </AppRouterCacheProvider>
  );
}
