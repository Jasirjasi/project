import { useState, useRef } from 'react';
import './MusicPlayer.css';
import config from '../config';

const MusicPlayer = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="music-player-container">
            <button
                className={`music-btn ${isPlaying ? 'playing' : ''}`}
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause music" : "Play music"}
            >
                {isPlaying ? (
                    <span className="icon">🎶 ⏸</span>
                ) : (
                    <span className="icon">🎵 ▶</span>
                )}
            </button>

            <audio
                ref={audioRef}
                src={config.music.url}
                loop
                preload="auto"
            />
        </div>
    );
};

export default MusicPlayer;
