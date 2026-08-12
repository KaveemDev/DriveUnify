import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FullscreenSpinner } from '../components/common/Spinner';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { MarketingLayout } from '../layouts/MarketingLayout';

// ── Lazy-loaded Private Pages ─────────────────────────────────
const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Settings = lazy(() => import('../pages/Settings'));
const Support = lazy(() => import('../pages/Support'));
const OAuthCallback = lazy(() => import('../pages/OAuthCallback'));

// ── Lazy-loaded Public Pages ──────────────────────────────────
const Landing = lazy(() => import('../pages/public/Landing'));
const Features = lazy(() => import('../pages/public/Features'));
const Integrations = lazy(() => import('../pages/public/Integrations'));
const About = lazy(() => import('../pages/public/About'));
const Contact = lazy(() => import('../pages/public/Contact'));
const Documentation = lazy(() => import('../pages/public/Documentation'));
const HelpCenter = lazy(() => import('../pages/public/HelpCenter'));
const Blog = lazy(() => import('../pages/public/Blog'));
const Legal = lazy(() => import('../pages/public/Legal'));
const NotFound = lazy(() => import('../pages/public/NotFound'));

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
      {/* ── Public Marketing Routes ── */}
      <Route path="/" element={<MarketingLayout><Landing /></MarketingLayout>} />
      <Route path="/features" element={<MarketingLayout><Features /></MarketingLayout>} />
      <Route path="/integrations" element={<MarketingLayout><Integrations /></MarketingLayout>} />
      <Route path="/about" element={<MarketingLayout><About /></MarketingLayout>} />
      <Route path="/contact" element={<MarketingLayout><Contact /></MarketingLayout>} />
      <Route path="/docs" element={<MarketingLayout><Documentation /></MarketingLayout>} />
      <Route path="/help" element={<MarketingLayout><HelpCenter /></MarketingLayout>} />
      <Route path="/blog" element={<MarketingLayout><Blog /></MarketingLayout>} />
      <Route path="/legal" element={<MarketingLayout><Legal /></MarketingLayout>} />

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
        path="/support"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Support />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* ── Fallback ── */}
      <Route path="*" element={<MarketingLayout><NotFound /></MarketingLayout>} />
    </Routes>
  </Suspense>
);
