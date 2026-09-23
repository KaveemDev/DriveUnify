import { useAuthInit } from './hooks/useAuth';
import { AppRoutes } from './routes/AppRoutes';

const App = () => {
  const isOAuthCallback = typeof window !== 'undefined' && window.location.pathname.startsWith('/oauth/callback');

  // Initialize auth listener globally ONLY for app routes, NEVER inside OAuth popup callback!
  useAuthInit(!isOAuthCallback);

  return <AppRoutes />;
};

export default App;
