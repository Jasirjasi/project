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
            fpsLimit: 120,
            interactivity: {
                events: {
                    onHover: {
                        enable: true,
                        mode: "bubble",
                    },
                    resize: true,
                },
                modes: {
                    bubble: {
                        distance: 250,
                        duration: 2,
                        opacity: 1,
                        size: 6,
                        color: "#fff"
                    },
                },
            },
            particles: {
                color: {
                    value: ["#EDEBDD", "#810100", "#FFF", "#630000"], // Cotton, Cherry Red, White, Maroon
                },
                links: {
                    enable: false,
                },
                move: {
                    direction: "bottom", // Falling down like petals/stardust
                    enable: true,
                    outModes: {
                        default: "out",
                    },
                    random: true,
                    speed: { min: 0.5, max: 1.5 },
                    straight: false,
                    spin: {
                        enable: true,
                        acceleration: 0.1
                    }
                },
                number: {
                    density: {
                        enable: true,
                        area: 800,
                    },
                    value: 120, // Premium density
                },
                opacity: {
                    value: { min: 0.1, max: 0.7 },
                    animation: {
                        enable: true,
                        speed: 1,
                        minimumValue: 0.1,
                        sync: false
                    }
                },
                shape: {
                    type: ["circle", "star"], // Mixed shapes for elegance
                },
                size: {
                    value: { min: 1, max: 5 },
                    animation: {
                        enable: true,
                        speed: 2,
                        minimumValue: 0.5,
                        sync: false
                    }
                },
                wobble: {
                    enable: true,
                    distance: 10,
                    speed: 10
                },
                roll: {
                    enable: true,
                    speed: { min: 5, max: 15 }
                }
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
