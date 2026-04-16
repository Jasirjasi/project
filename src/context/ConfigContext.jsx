import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import defaultConfig from '../config'; // Our initial static config

export const ConfigContext = createContext(null);

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('settings')
                    .select('config')
                    .eq('id', 'main')
                    .single();

                if (data) {
                    setConfig(data.config);
                } else {
                    // If no config exists in Supabase, try to initialize it
                    // Check if we have an active session (likely admin)
                    const { data: { session } } = await supabase.auth.getSession();

                    if (session) {
                        await supabase
                            .from('settings')
                            .upsert({ id: 'main', config: defaultConfig });
                    }
                    setConfig(defaultConfig);
                }
            } catch (err) {
                console.error("Failed to load config from Supabase:", err);
                // Fallback to static config if Supabase fails
                setConfig(defaultConfig);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fcfaf8' }}>
                <p style={{ fontFamily: 'sans-serif', color: '#666' }}>Loading...</p>
            </div>
        );
    }

    return (
        <ConfigContext.Provider value={{ config, setConfig }}>
            {children}
        </ConfigContext.Provider>
    );
};
