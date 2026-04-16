import React from 'react';
import { motion } from 'framer-motion';
import Hero from './Hero';
import Details from './Details';
import Gallery from './Gallery';
import Countdown from './Countdown';
import RSVP from './RSVP';
import MusicPlayer from './MusicPlayer';
import { MandalaDecoration } from './TraditionalDecorations';
import { useConfig } from '../context/ConfigContext';

// Section wrapper for scroll reveal
const FadeInWhenVisible = ({ children, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, delay }}
        className="scroll-animate"
    >
        {children}
    </motion.div>
);

const MainSite = ({ isPreview = false }) => {
    const { config } = useConfig();

    return (
        <div className="app-container" style={{ position: 'relative', overflowX: 'hidden' }}>
            {!isPreview && <MusicPlayer />}
            <Hero isPreview={isPreview} />
            <main style={{ position: 'relative' }}>
                {config.theme?.traditionalMode && (
                    <>
                        <MandalaDecoration className="mandala-bg mandala-1" style={{ top: '10%', left: '-50px' }} />
                        <MandalaDecoration className="mandala-bg mandala-2" style={{ top: '40%', right: '-50px' }} />
                        <MandalaDecoration className="mandala-bg mandala-3" style={{ bottom: '10%', left: '-50px' }} />
                    </>
                )}

                <FadeInWhenVisible>
                    <Details />
                </FadeInWhenVisible>

                <FadeInWhenVisible>
                    <Countdown />
                </FadeInWhenVisible>

                <FadeInWhenVisible>
                    <Gallery />
                </FadeInWhenVisible>

                <FadeInWhenVisible>
                    <RSVP />
                </FadeInWhenVisible>
            </main>
            <footer>
                <p>&copy; {new Date().getFullYear()} {config.couple?.namesFormatted}. We can't wait to celebrate with you!</p>
            </footer>
        </div>
    );
};

export default MainSite;
