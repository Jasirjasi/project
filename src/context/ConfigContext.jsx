import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import defaultConfig from '../config'; // Our initial static config

export const ConfigContext = createContext(null);

export const getClientSlug = () => {
    if (typeof window === 'undefined') return 'main';

    const params = new URLSearchParams(window.location.search);
    if (params.get('client')) return params.get('client').trim();
    if (params.get('c')) return params.get('c').trim();

    const pathParts = window.location.pathname.split('/').filter(Boolean);

    // Ignore if visiting admin routes
    if (pathParts[0] === 'admin') return 'main';

    // e.g. /c/adithi-rajkiran or /client/adithi-rajkiran
    if ((pathParts[0] === 'c' || pathParts[0] === 'client') && pathParts[1]) {
        return pathParts[1].trim();
    }

    // Direct path slug e.g. /adithi-rajkiran
    if (pathParts[0]) {
        return pathParts[0].trim();
    }

    // Subdomain detection (e.g. adithi.weddingapp.com)
    const hostParts = window.location.hostname.split('.');
    if (hostParts.length > 2 && hostParts[0] !== 'www' && hostParts[0] !== 'localhost') {
        return hostParts[0].trim();
    }

    return 'main';
};

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};

export const ConfigProvider = ({ children }) => {
    const [clientSlug, setClientSlug] = useState(() => getClientSlug());
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

const fetchLocalConfig = async (slug) => {
    try {
        const res = await fetch(`/configs/${slug}.json`);
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        // ignore
    }
    return null;
};

    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            try {
                // 1. Try fetching from Supabase settings table
                const { data } = await supabase
                    .from('settings')
                    .select('config')
                    .eq('id', clientSlug)
                    .single();

                if (data && data.config) {
                    setConfig(data.config);
                    setLoading(false);
                    return;
                }

                // 2. Try loading local config file /configs/{clientSlug}.json
                const localConf = await fetchLocalConfig(clientSlug);
                if (localConf) {
                    setConfig(localConf);
                    setLoading(false);
                    return;
                }

                // 3. Fallback to clean isolated tenant config
                if (clientSlug !== 'main' && clientSlug !== 'adithi-rajkiran') {
                    const cleanSlugTitle = clientSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    const tenantFallback = {
                        ...defaultConfig,
                        couple: {
                            name1: cleanSlugTitle,
                            name2: 'Wedding',
                            namesFormatted: cleanSlugTitle,
                        },
                        images: []
                    };
                    setConfig(tenantFallback);
                } else {
                    const mainLocal = await fetchLocalConfig('main') || await fetchLocalConfig('adithi-rajkiran');
                    setConfig(mainLocal || defaultConfig);
                }
            } catch (err) {
                console.error(`Failed to load config for client [${clientSlug}]:`, err);
                const fallback = await fetchLocalConfig(clientSlug) || await fetchLocalConfig('main') || defaultConfig;
                setConfig(fallback);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, [clientSlug]);

    useEffect(() => {
        if (config?.theme) {
            const root = document.documentElement;
            if (config.theme.primaryColor) root.style.setProperty('--color-primary', config.theme.primaryColor);
            if (config.theme.secondaryColor) root.style.setProperty('--color-secondary', config.theme.secondaryColor);
            if (config.theme.accentColor) root.style.setProperty('--color-accent', config.theme.accentColor);
            if (config.theme.backgroundColor) {
                root.style.setProperty('--color-background', config.theme.backgroundColor);
                document.body.style.backgroundColor = config.theme.backgroundColor;
            }
            if (config.theme.textColor) {
                root.style.setProperty('--color-text', config.theme.textColor);
                document.body.style.color = config.theme.textColor;
            }
            if (config.theme.headingFont) root.style.setProperty('--font-heading', `'${config.theme.headingFont}', serif`);
            if (config.theme.bodyFont) {
                root.style.setProperty('--font-body', `'${config.theme.bodyFont}', sans-serif`);
                document.body.style.fontFamily = `'${config.theme.bodyFont}', sans-serif`;
            }
            if (config.theme.accentFont) root.style.setProperty('--font-accent', `'${config.theme.accentFont}', cursive`);
            if (config.theme.baseFontSize) document.body.style.fontSize = config.theme.baseFontSize;
        }

        if (config?.hero?.backgroundImage) {
            const imageUrl = config.hero.backgroundImage;
            const applyFavicon = (href, type) => {
                let link = document.querySelector("link[rel*='icon']");
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.head.appendChild(link);
                }
                link.href = href;
                if (type) link.type = type;
            };

            const applySvgFallback = (url) => {
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><clipPath id="c"><circle cx="50" cy="50" r="50"/></clipPath></defs><image href="${url}" width="100" height="100" preserveAspectRatio="xMidYMid slice" clip-path="url(#c)"/></svg>`;
                applyFavicon(`data:image/svg+xml,${encodeURIComponent(svg)}`, 'image/svg+xml');
            };

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const size = 128;
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.beginPath();
                        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.clip();
                        const minDim = Math.min(img.width, img.height);
                        const sx = (img.width - minDim) / 2;
                        const sy = (img.height - minDim) / 2;
                        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
                        applyFavicon(canvas.toDataURL('image/png'), 'image/png');
                        return;
                    }
                } catch (e) {
                    // Fallback
                }
                applySvgFallback(imageUrl);
            };
            img.onerror = () => applySvgFallback(imageUrl);
            img.src = imageUrl;
        }
    }, [config]);

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fcfaf8' }}>
                <p style={{ fontFamily: 'sans-serif', color: '#666' }}>Loading site...</p>
            </div>
        );
    }

    return (
        <ConfigContext.Provider value={{ config, setConfig, clientSlug, setClientSlug }}>
            {children}
        </ConfigContext.Provider>
    );
};

