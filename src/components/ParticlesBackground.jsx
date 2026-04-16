import { useEffect, useState, useMemo } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

const ParticlesBackground = ({ show }) => {
    const [init, setInit] = useState(false);

    useEffect(() => {
        if (!window.particlesEngineInitialized) {
            initParticlesEngine(async (engine) => {
                await loadSlim(engine);
            }).then(() => {
                window.particlesEngineInitialized = true;
                setInit(true);
            });
        } else {
            setInit(true);
        }
    }, []);

    const options = useMemo(
        () => ({
            fpsLimit: 60,
            interactivity: {
                events: {
                    onHover: {
                        enable: true,
                        mode: "bubble",
                    },
                },
                modes: {
                    bubble: {
                        distance: 200,
                        duration: 2,
                        opacity: 0.8,
                        size: 10,
                    },
                },
            },
            particles: {
                color: {
                    value: "#FFD700", // Bright Gold
                },
                links: {
                    enable: false,
                },
                move: {
                    direction: "none",
                    enable: true,
                    outModes: {
                        default: "out",
                    },
                    random: true,
                    speed: 1.5,
                    straight: false,
                },
                number: {
                    density: {
                        enable: true,
                        area: 800,
                    },
                    value: 80, // Increased count
                },
                opacity: {
                    value: { min: 0.3, max: 0.8 }, // Increased opacity
                    animation: {
                        enable: true,
                        speed: 1,
                        minimumValue: 0.3,
                    }
                },
                shape: {
                    type: "circle",
                },
                size: {
                    value: { min: 1, max: 4 },
                    animation: {
                        enable: true,
                        speed: 3,
                        minimumValue: 1,
                    }
                },
            },
            detectRetina: true,
            fullScreen: {
                enable: false,
                zIndex: 2
            }
        }),
        [],
    );

    if (!show || !init) return null;

    return (
        <Particles
            id="tsparticles"
            options={options}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 2
            }}
        />
    );
};

export default ParticlesBackground;
