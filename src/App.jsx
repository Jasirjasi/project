import { useEffect } from 'react';
import './App.css';
import { useConfig } from './context/ConfigContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import MainSite from './components/MainSite';

function App() {
  const { config } = useConfig();

  return (
    <Router>
      {config.theme && (
        <style>
          {`
            :root {
              --color-primary: ${config.theme.primaryColor};
              --color-text: ${config.theme.textColor};
              --font-heading: '${config.theme.headingFont}', serif;
              --font-body: '${config.theme.bodyFont}', sans-serif;
              --font-accent: '${config.theme.accentFont}', cursive;
            }
            body {
              font-size: ${config.theme.baseFontSize};
            }
          `}
        </style>
      )}
      <Routes>
        <Route path="/" element={<MainSite />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
