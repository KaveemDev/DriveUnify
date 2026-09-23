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
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontSize: '14px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: '#1e293b' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#1e293b' },
              },
            }}
          />
        </BrowserRouter>
        </ThemeContextProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
