import { useEffect } from 'react';
import './App.css';
import Hero from './components/Hero';
import Details from './components/Details';
import Gallery from './components/Gallery';
import Countdown from './components/Countdown';
import RSVP from './components/RSVP';
import MusicPlayer from './components/MusicPlayer';
import config from './config';

function App() {
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

  return (
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
}

export default App;
