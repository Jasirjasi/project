import { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import defaultConfig from '../config'; // Our initial static config

const ConfigContext = createContext(null);

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
                const docRef = doc(db, 'settings', 'main');
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setConfig(docSnap.data());
                } else {
                    // If no config exists in Firestore, save the default config there
                    await setDoc(docRef, defaultConfig);
                    setConfig(defaultConfig);
                }
            } catch (err) {
                console.error("Failed to load config from Firebase:", err);
                // Fallback to static config if Firebase fails (e.g., config missing during dev)
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
