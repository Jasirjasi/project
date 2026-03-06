import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import Swal from 'sweetalert2';
import Gallery from '../components/Gallery';
import './Admin.css';

const AdminDashboard = () => {
    const { config, setConfig } = useConfig();
    const [activeTab, setActiveTab] = useState('config');
    const [rsvps, setRsvps] = useState([]);
    const navigate = useNavigate();

    // Local state for editing config
    const [editConfig, setEditConfig] = useState(config);

    useEffect(() => {
        if (activeTab === 'rsvps') {
            const fetchRsvps = async () => {
                try {
                    const querySnapshot = await getDocs(collection(db, 'reservations'));
                    const rsvpList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    // Sort descending manually (or by using a query orderBy if index exists)
                    rsvpList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                    setRsvps(rsvpList);
                } catch (err) {
                    console.error('Failed to fetch RSVPs:', err);
                }
            };
            fetchRsvps();
        }
    }, [activeTab]);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/admin');
    };

    const handleConfigChange = (e, section, key) => {
        if (section === 'root') {
            setEditConfig(prev => ({
                ...prev,
                [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
            }));
        } else {
            setEditConfig(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
                }
            }));
        }
    };

    const saveConfig = async () => {
        try {
            await setDoc(doc(db, 'settings', 'main'), editConfig);
            setConfig(editConfig);
            Swal.fire('Saved!', 'Website configuration has been updated.', 'success');
        } catch (err) {
            console.error(err);
            Swal.fire('Error!', 'Failed to save configuration.', 'error');
        }
    };

    return (
        <div className="admin-dashboard-container">
            <header className="admin-header">
                <h2>Sudo Dashboard</h2>
                <button onClick={handleLogout} className="admin-btn" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                    Logout
                </button>
            </header>

            <nav className="admin-nav">
                <button className={`admin-nav-btn ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>Configuration</button>
                <button className={`admin-nav-btn ${activeTab === 'rsvps' ? 'active' : ''}`} onClick={() => setActiveTab('rsvps')}>RSVPs</button>
                <button className={`admin-nav-btn ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => setActiveTab('gallery')}>Gallery Storage</button>
            </nav>

            <main className="admin-content">
                {activeTab === 'config' && editConfig && (
                    <div className="admin-card">
                        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>Site Configuration</h3>
                        <div className="admin-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h4 style={{ marginBottom: '1rem', color: '#666' }}>Couple Information</h4>
                                <div className="form-group">
                                    <label>Name 1</label>
                                    <input value={editConfig.couple.name1} onChange={(e) => handleConfigChange(e, 'couple', 'name1')} />
                                </div>
                                <div className="form-group">
                                    <label>Name 2</label>
                                    <input value={editConfig.couple.name2} onChange={(e) => handleConfigChange(e, 'couple', 'name2')} />
                                </div>
                                <div className="form-group">
                                    <label>Formatted Names (Hero Banner)</label>
                                    <input value={editConfig.couple.namesFormatted} onChange={(e) => handleConfigChange(e, 'couple', 'namesFormatted')} />
                                </div>

                                <h4 style={{ margin: '2rem 0 1rem', color: '#666' }}>General Features</h4>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <label style={{ margin: 0 }}>Allow Guest Photo Uploads</label>
                                    <input type="checkbox" checked={editConfig.allowGuestUploads} onChange={(e) => handleConfigChange(e, 'root', 'allowGuestUploads')} style={{ width: 'auto', transform: 'scale(1.5)' }} />
                                </div>
                            </div>

                            <div>
                                <h4 style={{ marginBottom: '1rem', color: '#666' }}>Hero Section</h4>
                                <div className="form-group">
                                    <label>Subtitle</label>
                                    <input value={editConfig.hero.subtitle} onChange={(e) => handleConfigChange(e, 'hero', 'subtitle')} />
                                </div>
                                <div className="form-group">
                                    <label>Date Text</label>
                                    <input value={editConfig.hero.dateText} onChange={(e) => handleConfigChange(e, 'hero', 'dateText')} />
                                </div>
                                <div className="form-group">
                                    <label>Location Text</label>
                                    <input value={editConfig.hero.locationText} onChange={(e) => handleConfigChange(e, 'hero', 'locationText')} />
                                </div>

                                <h4 style={{ margin: '2rem 0 1rem', color: '#666' }}>RSVP Settings</h4>
                                <div className="form-group">
                                    <label>Deadline Text</label>
                                    <input value={editConfig.rsvp.deadline} onChange={(e) => handleConfigChange(e, 'rsvp', 'deadline')} />
                                </div>

                                <button className="admin-btn" style={{ marginTop: '1rem' }} onClick={saveConfig}>Save Application Configuration</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'rsvps' && (
                    <div className="admin-card">
                        <h3>Reservations ({rsvps.length})</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd', background: '#fcfaf8' }}>
                                    <th style={{ padding: '1rem 0.8rem' }}>Name</th>
                                    <th style={{ padding: '1rem 0.8rem' }}>Guests</th>
                                    <th style={{ padding: '1rem 0.8rem' }}>Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rsvps.map(rsvp => (
                                    <tr key={rsvp.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '0.8rem' }}>{rsvp.name}</td>
                                        <td style={{ padding: '0.8rem' }}>
                                            <span style={{
                                                background: rsvp.guests === '0' ? '#ffebee' : '#e8f5e9',
                                                color: rsvp.guests === '0' ? '#c62828' : '#2e7d32',
                                                padding: '0.3rem 0.6rem',
                                                borderRadius: '4px',
                                                fontSize: '0.9rem',
                                                fontWeight: 'bold'
                                            }}>
                                                {rsvp.guests === '0' ? 'Declined' : `${rsvp.guests} Attending`}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.8rem', color: '#666' }}>{rsvp.message || '-'}</td>
                                    </tr>
                                ))}
                                {rsvps.length === 0 && <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No RSVPs have been submitted yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'gallery' && (
                    <div className="admin-card" style={{ background: '#fcfaf8' }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Gallery Manager</h3>
                        <p style={{ marginBottom: '2rem', color: '#666' }}>You can delete guest-uploaded images below. Deleting an image will permanently remove it from Firestore.</p>
                        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
                            <Gallery />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
