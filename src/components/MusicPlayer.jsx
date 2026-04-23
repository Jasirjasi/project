import { useState, useEffect, useRef } from 'react';
import { useConfig } from '../context/ConfigContext';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { motion, AnimatePresence } from 'framer-motion';
import { MandalaDecoration } from './TraditionalDecorations';
import './MusicPlayer.css';

const MusicPlayer = () => {
    const { config } = useConfig();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [showWelcome, setShowWelcome] = useState(true);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const audioRef = useRef(null);
    const playlist = config.playlist || [];

    useEffect(() => {
        if (playlist.length > 0 && !audioRef.current) {
            audioRef.current = new Audio(playlist[0]);
            audioRef.current.loop = false;
            audioRef.current.addEventListener('ended', () => {
                setCurrentTrackIndex(prev => (prev + 1) % playlist.length);
            });
        }
    }, [playlist]);

    useEffect(() => {
        if (audioRef.current && playlist[currentTrackIndex]) {
            audioRef.current.src = playlist[currentTrackIndex];
            audioRef.current.load();
            if (isPlaying) {
                audioRef.current.play().catch(e => console.log("Autoplay blocked:", e));
            }
        }
    }, [currentTrackIndex, isPlaying]);

    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.muted = isMuted;
        if (isPlaying) {
            audioRef.current.play().catch(e => {
                console.log("Waiting for interaction...");
            });
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, isMuted]);

    const startMusic = () => {
        setShowWelcome(false);
        setIsPlaying(true);
        setIsMuted(false);
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
    };

    if (playlist.length === 0) return null;

    // Variants for staggered animations
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.3, delayChildren: 0.5 }
        },
        exit: {
            opacity: 0,
            scale: 1.1,
            filter: 'blur(10px)',
            transition: { duration: 1, ease: 'easeInOut' }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
    };

    return (
        <>
            <AnimatePresence>
                {showWelcome && (
                    <motion.div 
                        className="welcome-overlay"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Dynamic Background Elements */}
                        <div className="welcome-bg-ornaments">
                            <MandalaDecoration className="welcome-mandala m-1" />
                            <MandalaDecoration className="welcome-mandala m-2" />
                        </div>
                        
                        <div className="welcome-glass-card">
                            <motion.div variants={itemVariants} className="welcome-header">
                                <span className="welcome-label">Welcome to the Wedding of</span>
                            </motion.div>
                            
                            <motion.h2 variants={itemVariants} className="welcome-names">
                                {config.couple?.namesFormatted}
                            </motion.h2>
                            
                            <motion.div variants={itemVariants} className="welcome-divider">
                                <span className="line"></span>
                                <span className="dot"></span>
                                <span className="line"></span>
                            </motion.div>
                            
                            <motion.p variants={itemVariants} className="welcome-text">
                                Your presence would mean the world to us.
                            </motion.p>
                            
                            <motion.button 
                                variants={itemVariants}
                                className="enter-site-btn" 
                                onClick={startMusic}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className="btn-text">Open Invitation</span>
                                <div className="btn-glow"></div>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div 
                className={`music-player-toggle ${isMuted ? 'muted' : 'playing'}`} 
                onClick={toggleMute}
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
            >
                {!isMuted && (
                    <div className="music-bars">
                        {[1,2,3,4].map(i => <span key={i}></span>)}
                    </div>
                )}
                <div className="icon-wrapper">
                    {isMuted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                </div>
                <div className="music-label">
                    {isMuted ? 'Muted' : 'Music On'}
                </div>
            </motion.div>
        </>
    );
};

export default MusicPlayer;
