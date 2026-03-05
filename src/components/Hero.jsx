import './Hero.css';
import config from '../config';

const Hero = () => {
    return (
        <section
            className="hero"
            id="home"
            style={{ backgroundImage: `url('${config.hero.backgroundImage}')` }}
        >
            <div className="hero-overlay"></div>
            <div className="hero-content">
                <h3 className="hero-subtitle">{config.hero.subtitle}</h3>
                <h1 className="hero-title">{config.couple.namesFormatted}</h1>
                <div className="hero-divider"></div>
                <p className="hero-date">{config.hero.dateText}</p>
                <p className="hero-location">{config.hero.locationText}</p>
            </div>
        </section>
    );
};

export default Hero;
