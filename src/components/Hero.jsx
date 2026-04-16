import './Hero.css';
import { useConfig } from '../context/ConfigContext';
import BlurText from './animations/BlurText';
import ParticlesBackground from './ParticlesBackground';
import { CornerDecoration } from './TraditionalDecorations';
import { motion } from 'framer-motion';

const Hero = ({ isPreview = false }) => {
    const { config } = useConfig();
    return (
        <section
            className="hero"
            id="home"
            style={{
                backgroundImage: `url('${config.hero.backgroundImage}')`,
                backgroundPosition: config.hero.backgroundPosition || 'center',
                backgroundAttachment: isPreview ? 'scroll' : 'fixed'
            }}
        >
            <div className="hero-overlay" style={{ backgroundColor: config.hero.overlayColor || 'var(--color-overlay)' }}></div>

            {config.theme?.showParticles && <ParticlesBackground show={true} />}

            {config.theme?.traditionalMode && (
                <>
                    <CornerDecoration className="top-left" />
                    <CornerDecoration className="top-right" />
                    <CornerDecoration className="bottom-left" />
                    <CornerDecoration className="bottom-right" />
                </>
            )}

            <motion.div
                className="hero-content"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            >
                <h3 className="hero-subtitle" style={config.hero.subtitleStyle || {}}>{config.hero.subtitle}</h3>
                <h1 className="hero-title" style={config.couple.namesFormattedStyle || {}}>
                    <BlurText
                        text={config.couple.namesFormatted}
                        delay={50}
                        animateBy="chars"
                        direction="top"
                    />
                </h1>
                <div className="hero-divider"></div>
                <p className="hero-date" style={config.hero.dateStyle || {}}>
                    {config.hero.dateText} {config.hero.timeText && <span style={config.hero.timeStyle || {}}>at {config.hero.timeText}</span>}
                </p>
                <p className="hero-location" style={config.hero.locationStyle || {}}>{config.hero.locationText}</p>
            </motion.div>
        </section>
    );
};

export default Hero;
