import { useAuth } from './hooks/useAuth';
import { AppRoutes } from './routes/AppRoutes';

const App = () => {
  // Initialize auth listener globally
  useAuth();
  return <AppRoutes />;
};

export default App;
