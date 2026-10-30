import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FullscreenSpinner } from '../components/common/Spinner';
import { DashboardLayout } from '../layouts/DashboardLayout';

// ── Lazy-loaded Dashboard Pages ─────────────────────────────────
const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Settings = lazy(() => import('../pages/Settings'));
const Support = lazy(() => import('../pages/Support'));
const UnifiedStorage = lazy(() => import('../pages/UnifiedStorage'));
const Transfer = lazy(() => import('../pages/Transfer'));
const OAuthCallback = lazy(() => import('../pages/OAuthCallback'));

// ── Protected route ───────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, initialized } = useSelector((s) => s.auth);

  if (!initialized) return <FullscreenSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// ── Public route (redirect to dashboard if already authenticated) ──
const PublicRoute = ({ children }) => {
  const { user, initialized } = useSelector((s) => s.auth);

  if (!initialized) return <FullscreenSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

export const AppRoutes = () => (
  <Suspense fallback={<FullscreenSpinner />}>
    <Routes>
      {/* ── Root redirects to /dashboard ── */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />

      {/* ── Auth Routes ── */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      {/* ── Protected Dashboard Routes ── */}
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
      <Route
        path="/unified"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <UnifiedStorage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/support"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Support />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/transfer"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Transfer />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* ── Fallback ── */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Suspense>
);
