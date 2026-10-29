import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import store from './store';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { initAnalytics } from './utils/analytics';
import './styles/globals.css';
import { ThemeContextProvider } from './theme';

// Initialize analytics (no-op if VITE_GA_MEASUREMENT_ID not set)
initAnalytics();

if (import.meta.env.DEV) {
  window.__store = store;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeContextProvider>
          <BrowserRouter>
            <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--color-bg-surface, #ffffff)',
                color: 'var(--color-text-primary, #0f172a)',
                border: '1px solid var(--color-border, rgba(0,0,0,0.08))',
                boxShadow: 'var(--shadow-popup, 0 10px 30px rgba(0,0,0,0.12))',
                borderRadius: '12px',
                fontSize: '14px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: 'var(--color-bg-surface, #ffffff)' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: 'var(--color-bg-surface, #ffffff)' },
              },
            }}
          />
        </BrowserRouter>
        </ThemeContextProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
