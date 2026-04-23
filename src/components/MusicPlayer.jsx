import { useState, useEffect, useRef } from 'react';
import { useConfig } from '../context/ConfigContext';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import './MusicPlayer.css';

const MusicPlayer = () => {
    const { config } = useConfig();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const audioRef = useRef(null);
    const playlist = config.playlist || [];

    // Initialize audio
    useEffect(() => {
        if (playlist.length > 0 && !audioRef.current) {
            audioRef.current = new Audio(playlist[0]);
            audioRef.current.loop = false;
            
            audioRef.current.addEventListener('ended', () => {
                setCurrentTrackIndex(prev => {
                    const nextIndex = (prev + 1) % playlist.length;
                    return nextIndex;
                });
            });
        }
    }, [playlist]);

    // Handle track changes
    useEffect(() => {
        if (audioRef.current && playlist[currentTrackIndex]) {
            audioRef.current.src = playlist[currentTrackIndex];
            audioRef.current.load(); // Ensure the new source is loaded
            if (isPlaying) {
                audioRef.current.play().catch(e => console.log("Autoplay blocked:", e));
            }
        }
    }, [currentTrackIndex, isPlaying]);

    // Handle Play/Pause & Mute
    useEffect(() => {
        if (!audioRef.current) return;
        
        audioRef.current.muted = isMuted;
        
        if (isPlaying) {
            audioRef.current.play().catch(e => {
                console.log("Autoplay blocked, waiting for interaction");
                // Fallback: wait for any click on document
                const startOnInteraction = () => {
                    setIsPlaying(true);
                    audioRef.current.play();
                    window.removeEventListener('click', startOnInteraction);
                    window.removeEventListener('scroll', startOnInteraction);
                };
                window.addEventListener('click', startOnInteraction);
                window.addEventListener('scroll', startOnInteraction);
            });
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, isMuted]);

    // Initial trigger
    useEffect(() => {
        if (playlist.length > 0) {
            setIsPlaying(true);
            setIsMuted(false);
        }
    }, [playlist]);

    const toggleMute = (e) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
    };

    if (playlist.length === 0) return null;

    return (
        <div className={`music-player-toggle ${isMuted ? 'muted' : 'playing'}`} onClick={toggleMute}>
            {!isMuted && (
                <div className="music-bars">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            )}
            <div className="icon-wrapper">
                {isMuted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
            </div>
            <div className="music-label">
                {isMuted ? 'Muted' : 'Music On'}
            </div>
        </div>
    );
};

export default MusicPlayer;
