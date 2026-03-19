import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import DashboardPage from './pages/DashboardPage';
import MatchesPage from './pages/MatchesPage';
import MatchDetailPage from './pages/MatchDetailPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import RankingPage from './pages/RankingPage';
import AdminPage from './pages/AdminPage';
import RulesPage from './pages/RulesPage';
import JoinGroupPage from './pages/JoinGroupPage';

// --- Route guards ---

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  return <>{children}</>;
};

const RequireProfileComplete: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (user && !user.display_name) {
    return (
      <Navigate
        to={`/profile/setup?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  return <>{children}</>;
};

const RequireSuperAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user?.is_superadmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// --- App routes ---

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/join/:token" element={<JoinGroupPage />} />

      {/* Auth required — no layout for profile setup */}
      <Route
        path="/profile/setup"
        element={
          <RequireAuth>
            <ProfileSetupPage />
          </RequireAuth>
        }
      />

      {/* Auth + profile required — with layout */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <RequireProfileComplete>
              <Layout>
                <DashboardPage />
              </Layout>
            </RequireProfileComplete>
          </RequireAuth>
        }
      />
      <Route
        path="/partidas"
        element={
          <RequireAuth>
            <RequireProfileComplete>
              <Layout>
                <MatchesPage />
              </Layout>
            </RequireProfileComplete>
          </RequireAuth>
        }
      />
      <Route
        path="/partidas/:id"
        element={
          <RequireAuth>
            <RequireProfileComplete>
              <Layout>
                <MatchDetailPage />
              </Layout>
            </RequireProfileComplete>
          </RequireAuth>
        }
      />
      <Route
        path="/grupos"
        element={
          <RequireAuth>
            <RequireProfileComplete>
              <Layout>
                <GroupsPage />
              </Layout>
            </RequireProfileComplete>
          </RequireAuth>
        }
      />
      <Route
        path="/grupos/:id"
        element={
          <RequireAuth>
            <RequireProfileComplete>
              <Layout>
                <GroupDetailPage />
              </Layout>
            </RequireProfileComplete>
          </RequireAuth>
        }
      />
      <Route
        path="/ranking"
        element={
          <RequireAuth>
            <RequireProfileComplete>
              <Layout>
                <RankingPage />
              </Layout>
            </RequireProfileComplete>
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <RequireSuperAdmin>
              <Layout>
                <AdminPage />
              </Layout>
            </RequireSuperAdmin>
          </RequireAuth>
        }
      />

      <Route
        path="/regulamento"
        element={
          <RequireAuth>
            <RequireProfileComplete>
              <Layout>
                <RulesPage />
              </Layout>
            </RequireProfileComplete>
          </RequireAuth>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
