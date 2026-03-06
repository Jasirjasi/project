import { useEffect } from 'react';
import './App.css';
import Hero from './components/Hero';
import Details from './components/Details';
import Gallery from './components/Gallery';
import Countdown from './components/Countdown';
import RSVP from './components/RSVP';
import MusicPlayer from './components/MusicPlayer';
import { useConfig } from './context/ConfigContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
function App() {
  const { config } = useConfig();

  useEffect(() => {
    // Simple intersection observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('.scroll-animate');
    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const MainSite = () => (
    <div className="app-container">
      <MusicPlayer />
      <Hero />
      <main>
        <div className="scroll-animate">
          <Details />
        </div>
        <div className="scroll-animate">
          <Countdown />
        </div>
        <div className="scroll-animate">
          <Gallery />
        </div>
        <div className="scroll-animate">
          <RSVP />
        </div>
      </main>
      <footer>
        <p>&copy; {new Date().getFullYear()} {config.couple.namesFormatted}. We can't wait to celebrate with you!</p>
      </footer>
    </div>
  );

  return (
    <Router>
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
