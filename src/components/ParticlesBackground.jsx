import { useEffect, useRef } from "react";
import * as THREE from "three";

const ParticlesBackground = ({ show }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!show || !containerRef.current) return;

        let renderer, scene, camera, geometry, material, texture, animationFrameId;

        try {
            // Check for WebGL support
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                console.warn("WebGL not supported, skipping particles.");
                return;
            }

            // Scene setup
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            
            renderer = new THREE.WebGLRenderer({ 
                alpha: true, 
                antialias: true,
                powerPreference: "high-performance"
            });
            
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            containerRef.current.appendChild(renderer.domElement);

            camera.position.z = 5;

            // Particle texture creation (soft bokeh)
            const createParticleTexture = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 64;
                canvas.height = 64;
                const context = canvas.getContext('2d');

                const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
                gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.5)');
                gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.2)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                context.fillStyle = gradient;
                context.fillRect(0, 0, 64, 64);

                const texture = new THREE.CanvasTexture(canvas);
                return texture;
            };

            texture = createParticleTexture();

            // Geometry
            const particlesCount = 300;
            const positions = new Float32Array(particlesCount * 3);
            const colors = new Float32Array(particlesCount * 3);
            const scales = new Float32Array(particlesCount);
            const velocities = new Float32Array(particlesCount * 3);
            
            // Theme colors
            const palette = [
                new THREE.Color("#EDEBDD"), // Cotton
                new THREE.Color("#810100"), // Cherry Red
                new THREE.Color("#FFFFFF"), // White
                new THREE.Color("#630000"), // Maroon
            ];

            for (let i = 0; i < particlesCount; i++) {
                // Position
                positions[i * 3] = (Math.random() - 0.5) * 15;
                positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

                // Color
                const color = palette[Math.floor(Math.random() * palette.length)];
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;

                // Scale
                scales[i] = Math.random();

                // Velocity
                velocities[i * 3] = (Math.random() - 0.5) * 0.005;
                velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
                velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
            }

            geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
            
            material = new THREE.PointsMaterial({
                size: 0.15,
                sizeAttenuation: true,
                map: texture,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                vertexColors: true,
                opacity: 0.6
            });

            const particles = new THREE.Points(geometry, material);
            scene.add(particles);

            // Animation
            const clock = new THREE.Clock();

            const animate = () => {
                animationFrameId = requestAnimationFrame(animate);
                const elapsedTime = clock.getElapsedTime();

                const posAttribute = geometry.getAttribute('position');
                for (let i = 0; i < particlesCount; i++) {
                    // Apply velocity
                    posAttribute.array[i * 3] += velocities[i * 3];
                    posAttribute.array[i * 3 + 1] += velocities[i * 3 + 1];
                    posAttribute.array[i * 3 + 2] += velocities[i * 3 + 2];

                    // Brownian-like jitter
                    posAttribute.array[i * 3] += Math.sin(elapsedTime + i) * 0.001;
                    posAttribute.array[i * 3 + 1] += Math.cos(elapsedTime + i) * 0.001;

                    // Wrap around
                    if (posAttribute.array[i * 3] > 10) posAttribute.array[i * 3] = -10;
                    if (posAttribute.array[i * 3] < -10) posAttribute.array[i * 3] = 10;
                    if (posAttribute.array[i * 3 + 1] > 10) posAttribute.array[i * 3 + 1] = -10;
                    if (posAttribute.array[i * 3 + 1] < -10) posAttribute.array[i * 3 + 1] = 10;
                    if (posAttribute.array[i * 3 + 2] > 5) posAttribute.array[i * 3 + 2] = -5;
                    if (posAttribute.array[i * 3 + 2] < -5) posAttribute.array[i * 3 + 2] = 5;
                }
                posAttribute.needsUpdate = true;

                particles.rotation.y = elapsedTime * 0.05;
                particles.rotation.x = elapsedTime * 0.02;

                renderer.render(scene, camera);
            };

            animate();

            // Resize handler
            const handleResize = () => {
                if (!renderer || !camera) return;
                const width = window.innerWidth;
                const height = window.innerHeight;

                camera.aspect = width / height;
                camera.updateProjectionMatrix();

                renderer.setSize(width, height);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            };

            window.addEventListener('resize', handleResize);

            // Cleanup
            return () => {
                window.removeEventListener('resize', handleResize);
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                
                if (containerRef.current && renderer && renderer.domElement.parentNode === containerRef.current) {
                    containerRef.current.removeChild(renderer.domElement);
                }

                if (geometry) geometry.dispose();
                if (material) material.dispose();
                if (texture) texture.dispose();
                if (renderer) renderer.dispose();
            };
        } catch (error) {
            console.error("Error initializing WebGL Particles:", error);
            // Return empty cleanup if init fails
            return () => {};
        }
    }, [show]);

    if (!show) return null;

    return (
        <div 
            ref={containerRef}
            className="particles-container"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 2,
                overflow: 'hidden'
            }}
        />
    );
};

export default ParticlesBackground;
