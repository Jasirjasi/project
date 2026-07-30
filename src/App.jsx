import { useEffect } from 'react';
import './App.css';
import { useConfig } from './context/ConfigContext';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import MainSite from './components/MainSite';

function ClientRouteWrapper({ children }) {
  const { clientSlug: urlSlug } = useParams();
  const { setClientSlug } = useConfig();

  useEffect(() => {
    if (urlSlug) {
      setClientSlug(urlSlug);
    }
  }, [urlSlug, setClientSlug]);

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/config/:clientSlug"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/:clientSlug"
          element={
            <ClientRouteWrapper>
              <MainSite />
            </ClientRouteWrapper>
          }
        />
        <Route
          path="/:clientSlug/admin"
          element={
            <ClientRouteWrapper>
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            </ClientRouteWrapper>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
