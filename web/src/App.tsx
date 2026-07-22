// Route-verifiability contract (Colossus): every navigable UI state MUST be reachable
// from a URL alone (deep-linkable BrowserRouter routes; FastAPI serves the SPA catch-all
// fallback). Keep data-testid="app-ready" on the shell root — the mockup gate waits for it.
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import TasksPage from './pages/TasksPage';
import NewTaskPage from './pages/NewTaskPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import { useSession } from './lib/session';

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useSession();
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/new" element={<NewTaskPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/settings"
          element={
            <RequireAdmin>
              <AdminSettingsPage />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<Navigate to="/tasks" replace />} />
      </Route>
    </Routes>
  );
}
