import React, { useState, useEffect } from 'react';
import './Hero.css';
import { useConfig } from '../context/ConfigContext';
import BlurText from './animations/BlurText';
import ParticlesBackground from './ParticlesBackground';
import { CornerDecoration } from './TraditionalDecorations';
import { motion, AnimatePresence } from 'framer-motion';

const Hero = ({ isPreview = false }) => {
    const { config } = useConfig();
    const bgType = config.hero?.backgroundType || 'image';
    const bgUrl = config.hero?.backgroundImage || '';
    
    const [showScrollHint, setShowScrollHint] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 150) {
                setShowScrollHint(false);
            } else {
                setShowScrollHint(true);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <section className="hero" id="home">
            {bgType === 'video' && bgUrl ? (
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="hero-video-bg"
                    key={bgUrl}
                >
                    <source src={bgUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            ) : (
                <div
                    className={`hero-image-bg ${config.hero?.useKenBurns !== false ? 'ken-burns' : ''}`}
                    style={{
                        backgroundImage: `url('${bgUrl}')`,
                        backgroundPosition: config.hero?.backgroundPosition || 'center',
                    }}
                ></div>
            )}

            <div className="hero-overlay" style={{ backgroundColor: config.hero?.overlayColor || 'var(--color-overlay)' }}></div>

            <ParticlesBackground show={config.hero?.showParticles !== false} />

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
                        text={`${config.couple.name1} & ${config.couple.name2}`}
                        delay={50}
                        animateBy="words"
                        direction="top"
                    />
                </h1>
                <div className="hero-divider"></div>
                <p className="hero-date" style={config.hero.dateStyle || {}}>
                    {config.hero.dateText} {config.hero.timeText && <span style={config.hero.timeStyle || {}}>{config.hero.timeText}</span>}
                </p>
                <p className="hero-location" style={config.hero.locationStyle || {}}>{config.hero.locationText}</p>
            </motion.div>

            <AnimatePresence>
                {showScrollHint && (
                    <motion.div
                        className="scroll-indicator"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.5 }}
                        onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                    >
                        <div className="mouse">
                            <div className="wheel"></div>
                        </div>
                        <span className="scroll-text">Scroll</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default Hero;
