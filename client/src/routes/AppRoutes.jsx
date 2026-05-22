import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FullscreenSpinner } from '../components/common/Spinner';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Lazy-loaded pages
const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Settings = lazy(() => import('../pages/Settings'));
const OAuthCallback = lazy(() => import('../pages/OAuthCallback'));

// ── Protected route ───────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, initialized } = useSelector(s => s.auth);

  if (!initialized) return <FullscreenSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// ── Public route (redirect away if logged in) ─────────────────
const PublicRoute = ({ children }) => {
  const { user, initialized } = useSelector(s => s.auth);

  if (!initialized) return <FullscreenSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

export const AppRoutes = () => (
  <Suspense fallback={<FullscreenSpinner />}>
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* OAuth callback — popup redirect target, no auth guard needed */}
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Suspense>
);
