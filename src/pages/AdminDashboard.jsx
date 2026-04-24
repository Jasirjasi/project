import { useState, useEffect } from 'react';
import { utils, writeFile } from 'xlsx';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { useConfig, ConfigContext } from '../context/ConfigContext';
import Swal from 'sweetalert2';
import Gallery from '../components/Gallery';
import Hero from '../components/Hero';
import MainSite from '../components/MainSite';
import Cropper from 'react-easy-crop';
import JSZip from 'jszip';
import { AVAILABLE_FONTS, BACKGROUND_POSITIONS } from '../constants';
import './Admin.css';

const InlineStyleControls = ({ styleObj, onChange, fonts }) => {
    return (
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', alignItems: 'center', flexWrap: 'wrap', padding: '0.4rem', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #eaeaea' }}>
            <input type="text" placeholder="Size (e.g. 2rem)" value={styleObj?.fontSize || ''} onChange={(e) => onChange('fontSize', e.target.value)} style={{ width: '130px', padding: '0.3rem', fontSize: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} title="Font Size" />
            <input type="color" value={styleObj?.color || '#000000'} onChange={(e) => onChange('color', e.target.value)} style={{ width: '28px', height: '28px', padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} title="Text Color" />
            <select
                value={styleObj?.fontFamily || ''}
                onChange={(e) => onChange('fontFamily', e.target.value)}
                style={{ flexGrow: 1, minWidth: '130px', padding: '0.3rem', fontSize: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }}
                title="Font Family"
            >
                <option value="">Default Font</option>
                {fonts.map(f => (
                    <option key={f.name} value={f.family}>{f.name}</option>
                ))}
            </select>
        </div>
    );
};

const AdminDashboard = () => {
    const { config, setConfig } = useConfig();
    const [activeTab, setActiveTab] = useState('config');
    const [rsvps, setRsvps] = useState([]);
    const navigate = useNavigate();

    // Local state for editing config
    const [editConfig, setEditConfig] = useState(config);

    // Combine static fonts with custom fonts from edit state
    const allFonts = [...AVAILABLE_FONTS, ...(editConfig?.customFonts || [])];

    // Cropping states
    const [imageToCrop, setImageToCrop] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);

    // Splitter state
    const [splitWidth, setSplitWidth] = useState(50);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const handleMove = (clientX) => {
            if (!isDragging) return;
            const newWidth = (clientX / window.innerWidth) * 100;
            if (newWidth > 20 && newWidth < 80) {
                setSplitWidth(newWidth);
            }
        };

        const handleMouseMove = (e) => handleMove(e.clientX);
        const handleTouchMove = (e) => {
            if (e.touches.length > 0) {
                handleMove(e.touches[0].clientX);
            }
        };

        const handleEnd = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleEnd);
            document.body.style.cursor = 'col-resize';
        } else {
            document.body.style.cursor = 'default';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging]);

    useEffect(() => {
        if (activeTab === 'rsvps') {
            const fetchRsvps = async () => {
                try {
                    const { data, error } = await supabase
                        .from('reservations')
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    setRsvps(data);
                } catch (err) {
                    console.error('Failed to fetch RSVPs:', err);
                }
            };
            fetchRsvps();
        }
    }, [activeTab]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
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

    const handleNestedConfigChange = (e, section, subSection, key) => {
        setEditConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [subSection]: {
                    ...prev[section][subSection],
                    [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
                }
            }
        }));
    };

    const handleStyleChange = (section, styleKey, prop, value) => {
        setEditConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [styleKey]: {
                    ...(prev[section][styleKey] || {}),
                    [prop]: value
                }
            }
        }));
    };

    const handleColorOpacityChange = (newHex, newOpacity) => {
        let r = 131, g = 24, b = 67;
        if (newHex.startsWith('#')) {
            r = parseInt(newHex.slice(1, 3), 16) || 0;
            g = parseInt(newHex.slice(3, 5), 16) || 0;
            b = parseInt(newHex.slice(5, 7), 16) || 0;
        }
        const newColorStr = `rgba(${r}, ${g}, ${b}, ${newOpacity})`;
        handleConfigChange({ target: { type: 'text', value: newColorStr } }, 'hero', 'overlayColor');
    };

    const extractColor = (colorStr) => {
        if (!colorStr) return { hex: '#831843', opacity: 0.5 };
        if (colorStr.startsWith('#')) {
            return { hex: colorStr.substring(0, 7), opacity: colorStr.length === 9 ? parseInt(colorStr.substring(7, 9), 16) / 255 : 1 };
        }
        if (colorStr.startsWith('rgba') || colorStr.startsWith('rgb')) {
            const parts = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (parts) {
                const r = parseInt(parts[1]).toString(16).padStart(2, '0');
                const g = parseInt(parts[2]).toString(16).padStart(2, '0');
                const b = parseInt(parts[3]).toString(16).padStart(2, '0');
                return {
                    hex: `#${r}${g}${b}`,
                    opacity: parts[4] !== undefined ? parseFloat(parts[4]) : 1
                };
            }
        }
        return { hex: '#831843', opacity: 0.5 };
    };

    const persistConfig = async (configToSave) => {
        try {
            const sanitize = (obj) => {
                if (obj === undefined) return null;
                if (obj === null || typeof obj !== 'object') return obj;
                if (Array.isArray(obj)) return obj.map(sanitize);
                const result = {};
                for (const key in obj) {
                    if (obj[key] !== undefined) {
                        result[key] = sanitize(obj[key]);
                    }
                }
                return result;
            };

            const cleanConfig = sanitize(configToSave);

            const { error: saveError } = await supabase
                .from('settings')
                .upsert({ id: 'main', config: cleanConfig });

            if (saveError) throw saveError;

            setConfig(cleanConfig);
            return true;
        } catch (err) {
            console.error("Supabase Save Error:", err);
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: `Error: ${err.message}`,
            });
            return false;
        }
    };

    const handleSaveConfig = async () => {
        const success = await persistConfig(editConfig);
        if (success) {
            Swal.fire('Saved!', 'Website configuration has been updated.', 'success');
        }
    };

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const showCroppedImage = async () => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const image = new Image();
            image.src = imageToCrop;

            await new Promise((resolve) => {
                image.onload = resolve;
            });

            const { width, height, x, y } = croppedAreaPixels;
            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(
                image,
                x, y, width, height,
                0, 0, width, height
            );

            const croppedBase64 = canvas.toDataURL('image/jpeg', 0.8);

            setEditConfig(prev => ({
                ...prev,
                hero: { ...prev.hero, backgroundImage: croppedBase64 }
            }));
            setIsCropping(false);
            setImageToCrop(null);
        } catch (e) {
            console.error(e);
        }
    };

    const handleFontFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            Swal.fire({
                title: 'Processing Font...',
                text: 'Extracting and uploading...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            const newFonts = [];
            if (file.name.toLowerCase().endsWith('.zip')) {
                const zip = new JSZip();
                const contents = await zip.loadAsync(file);
                for (const [filename, zipEntry] of Object.entries(contents.files)) {
                    if (!zipEntry.dir && (
                        filename.toLowerCase().endsWith('.ttf') ||
                        filename.toLowerCase().endsWith('.otf') ||
                        filename.toLowerCase().endsWith('.woff') ||
                        filename.toLowerCase().endsWith('.woff2')
                    )) {
                        const blob = await zipEntry.async('blob');
                        const uploadedFont = await uploadAndRegisterFont(blob, filename);
                        if (uploadedFont) newFonts.push(uploadedFont);
                    }
                }
            } else if (
                file.name.toLowerCase().endsWith('.ttf') ||
                file.name.toLowerCase().endsWith('.otf') ||
                file.name.toLowerCase().endsWith('.woff') ||
                file.name.toLowerCase().endsWith('.woff2')
            ) {
                const uploadedFont = await uploadAndRegisterFont(file, file.name);
                if (uploadedFont) newFonts.push(uploadedFont);
            } else {
                Swal.fire('Error', 'Please upload a valid font file (.ttf, .otf, .woff, .woff2) or a .zip archive.', 'error');
                return;
            }

            if (newFonts.length > 0) {
                const updatedFonts = [...(editConfig.customFonts || []), ...newFonts];
                const newConfig = { ...editConfig, customFonts: updatedFonts };

                setEditConfig(newConfig);
                const success = await persistConfig(newConfig);

                if (success) {
                    Swal.fire('Success!', `Registered and saved ${newFonts.length} new font(s).`, 'success');
                }
            } else if (Swal.isVisible()) {
                // If we didn't already show an error and no fonts were found
                Swal.fire('Error', 'No valid font files found in the upload.', 'error');
            }
        } catch (err) {
            console.error('Font upload error:', err);
            if (err.message && (err.message.includes('Bucket not found') || err.message.includes('does not exist'))) {
                Swal.fire({
                    title: 'Storage Bucket Missing',
                    html: `
                        <div style="text-align: left; font-size: 0.9rem;">
                            <p>To upload fonts, you need to create a bucket named <strong>"fonts"</strong> in your Supabase Dashboard:</p>
                            <ol>
                                <li>Go to <strong>Storage</strong> in Supabase.</li>
                                <li>Click <strong>New Bucket</strong> and name it <strong>fonts</strong>.</li>
                                <li>Set it to <strong>Public</strong>.</li>
                                <li>Add an <strong>RLS Policy</strong> to allow "Insert" for all users (or authenticated admins).</li>
                            </ol>
                        </div>
                    `,
                    icon: 'warning'
                });
            } else {
                Swal.fire('Error', 'Failed to process font file. Check console for details.', 'error');
            }
        }
    };

    const uploadAndRegisterFont = async (blob, filename) => {
        try {
            const cleanFilename = filename.split('/').pop(); // Handle zip paths
            const storagePath = `custom-fonts/${Date.now()}_${cleanFilename}`;

            const { data, error } = await supabase.storage
                .from('fonts')
                .upload(storagePath, blob);

            if (error) {
                // If bucket doesn't exist, this might fail. We should ideally create it or warn.
                console.error('Upload error:', error);
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('fonts')
                .getPublicUrl(storagePath);

            const fontBaseName = cleanFilename.split('.')[0].replace(/[-_]/g, ' ');
            const family = `'${fontBaseName}'`;

            return { name: fontBaseName, family, url: publicUrl };
        } catch (err) {
            console.error('Individual font upload failed:', err);
            return null;
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            setImageToCrop(event.target.result);
            setIsCropping(true);
        };
    };
    
    const handleExportRSVPs = () => {
        if (rsvps.length === 0) {
            Swal.fire('No Data', 'There are no RSVPs to export.', 'info');
            return;
        }

        // Format data for Excel
        const exportData = rsvps.map(rsvp => ({
            'Name': rsvp.name,
            'Status': rsvp.guests === '0' ? 'Declined' : 'Attending',
            'Number of Guests': rsvp.guests,
            'Message': rsvp.message || '',
            'Date Submitted': new Date(rsvp.created_at).toLocaleString()
        }));

        // Create worksheet
        const ws = utils.json_to_sheet(exportData);
        
        // Create workbook
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, 'RSVPs');

        // Export file
        writeFile(wb, `Wedding_RSVPs_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const currentColor = extractColor(editConfig.hero?.overlayColor);

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
                <button className={`admin-nav-btn ${activeTab === 'fonts' ? 'active' : ''}`} onClick={() => setActiveTab('fonts')}>Font Library</button>
                <button className={`admin-nav-btn ${activeTab === 'music' ? 'active' : ''}`} onClick={() => setActiveTab('music')}>Music Library</button>
                <button className={`admin-nav-btn ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => setActiveTab('gallery')}>Gallery Storage</button>
            </nav>

            <main className="admin-content">
                {activeTab === 'config' && editConfig && (
                    <div className="admin-split-layout">
                        <div className="admin-config-panel" style={{ width: `${splitWidth}%` }}>
                            <div className="admin-card">
                                <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>Site Configuration</h3>
                                <div className="admin-form" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
                                            <InlineStyleControls styleObj={editConfig.couple.namesFormattedStyle} onChange={(prop, val) => handleStyleChange('couple', 'namesFormattedStyle', prop, val)} fonts={allFonts} />
                                        </div>

                                        <h4 style={{ margin: '2rem 0 1rem', color: '#666' }}>General Features</h4>
                                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <label style={{ margin: 0 }}>Allow Guest Photo Uploads</label>
                                            <input type="checkbox" checked={editConfig.allowGuestUploads} onChange={(e) => handleConfigChange(e, 'root', 'allowGuestUploads')} style={{ width: 'auto', transform: 'scale(1.5)' }} />
                                        </div>

                                        <h4 style={{ margin: '2rem 0 1rem', color: '#666' }}>Typography & Colors</h4>
                                        <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                                            <div>
                                                <label>Primary Color</label>
                                                <input type="color" value={editConfig.theme?.primaryColor || '#DB2777'} onChange={(e) => handleConfigChange(e, 'theme', 'primaryColor')} style={{ width: '40px', height: '40px', padding: 0, border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }} />
                                            </div>
                                            <div>
                                                <label>Text Color</label>
                                                <input type="color" value={editConfig.theme?.textColor || '#831843'} onChange={(e) => handleConfigChange(e, 'theme', 'textColor')} style={{ width: '40px', height: '40px', padding: 0, border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Heading Font Family</label>
                                            <select value={editConfig.theme?.headingFont || ''} onChange={(e) => handleConfigChange(e, 'theme', 'headingFont')}>
                                                {allFonts.map(f => (
                                                    <option key={f.name} value={f.family}>{f.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Body Font Family</label>
                                            <select value={editConfig.theme?.bodyFont || ''} onChange={(e) => handleConfigChange(e, 'theme', 'bodyFont')}>
                                                {allFonts.map(f => (
                                                    <option key={f.name} value={f.family}>{f.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Accent Font Family</label>
                                            <select value={editConfig.theme?.accentFont || ''} onChange={(e) => handleConfigChange(e, 'theme', 'accentFont')}>
                                                {allFonts.map(f => (
                                                    <option key={f.name} value={f.family}>{f.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Base Font Size</label>
                                            <input value={editConfig.theme?.baseFontSize || '16px'} onChange={(e) => handleConfigChange(e, 'theme', 'baseFontSize')} placeholder="e.g., 16px" />
                                        </div>

                                        <div className="form-group" style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input type="checkbox" checked={editConfig.theme?.traditionalMode} onChange={(e) => handleConfigChange(e, 'theme', 'traditionalMode')} style={{ width: 'auto' }} />
                                                <label style={{ margin: 0 }}>Traditional Mode</label>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 style={{ marginBottom: '1rem', color: '#666' }}>Hero Section</h4>
                                        <div className="form-group">
                                            <label>Background Type</label>
                                            <select 
                                                value={editConfig.hero.backgroundType || 'image'} 
                                                onChange={(e) => handleConfigChange(e, 'hero', 'backgroundType')}
                                                style={{ marginBottom: '1rem' }}
                                            >
                                                <option value="image">Image (with Ken Burns Effect)</option>
                                                <option value="video">Cinematic Video</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label>{(editConfig.hero.backgroundType === 'video' ? 'Hero Video' : 'Background Image')}</label>
                                            <input
                                                type="file"
                                                accept={editConfig.hero.backgroundType === 'video' ? "video/mp4,video/webm" : "image/png, image/jpeg, image/jpg, image/webp"}
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;

                                                    if (editConfig.hero.backgroundType === 'video') {
                                                        // Handle Video Upload
                                                        try {
                                                            Swal.fire({ title: 'Uploading Video...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
                                                            const storagePath = `hero/${Date.now()}_${file.name}`;
                                                            const { data, error } = await supabase.storage.from('hero-media').upload(storagePath, file);
                                                            if (error) throw error;
                                                            const { data: { publicUrl } } = supabase.storage.from('hero-media').getPublicUrl(storagePath);
                                                            setEditConfig(prev => ({ ...prev, hero: { ...prev.hero, backgroundImage: publicUrl } }));
                                                            Swal.fire('Uploaded!', 'Video background has been updated.', 'success');
                                                        } catch (err) {
                                                            console.error(err);
                                                            Swal.fire('Error', 'Failed to upload video. Ensure a bucket named "hero-media" exists.', 'error');
                                                        }
                                                    } else {
                                                        // Handle Image Upload (existing crop logic)
                                                        handleImageUpload(e);
                                                    }
                                                }}
                                            />
                                            {editConfig.hero.backgroundImage && (
                                                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                    <div style={{ width: '100%', position: 'relative' }}>
                                                        {editConfig.hero.backgroundType === 'video' ? (
                                                            <video 
                                                                src={editConfig.hero.backgroundImage} 
                                                                muted loop autoPlay 
                                                                style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                                                            />
                                                        ) : (
                                                            <img
                                                                src={editConfig.hero.backgroundImage}
                                                                alt="preview"
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100px',
                                                                    objectFit: 'cover',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid #ddd',
                                                                    backgroundPosition: editConfig.hero.backgroundPosition || 'center'
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    {editConfig.hero.backgroundType === 'image' && (
                                                        <div style={{ marginTop: '0.5rem', width: '100%' }}>
                                                            <label style={{ fontSize: '0.8rem', color: '#666' }}>View Position</label>
                                                            <select
                                                                value={editConfig.hero.backgroundPosition || 'center'}
                                                                onChange={(e) => handleConfigChange(e, 'hero', 'backgroundPosition')}
                                                                style={{ marginTop: '0.2rem' }}
                                                            >
                                                                {BACKGROUND_POSITIONS.map(pos => (
                                                                    <option key={pos.value} value={pos.value}>{pos.name}</option>
                                                                ))}
                                                            </select>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                                <input type="checkbox" checked={editConfig.hero.useKenBurns !== false} onChange={(e) => handleConfigChange(e, 'hero', 'useKenBurns')} style={{ width: 'auto' }} />
                                                                <label style={{ margin: 0, fontSize: '0.8rem' }}>Use Ken Burns Zoom Effect</label>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <button
                                                        className="admin-btn"
                                                        style={{ marginTop: '0.5rem', background: '#dc3545', width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                                                        onClick={() => setEditConfig(prev => ({ ...prev, hero: { ...prev.hero, backgroundImage: '' } }))}
                                                    >
                                                        Remove Media
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="form-group">
                                            <label>Overlay Color (RGBA or HEX)</label>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <input
                                                    type="color"
                                                    value={currentColor.hex}
                                                    onChange={(e) => handleColorOpacityChange(e.target.value, currentColor.opacity)}
                                                    style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                                                    title="Pick a solid color"
                                                />
                                                <input
                                                    type="range"
                                                    min="0" max="1" step="0.01"
                                                    value={currentColor.opacity}
                                                    onChange={(e) => handleColorOpacityChange(currentColor.hex, parseFloat(e.target.value))}
                                                    style={{ width: '80px', cursor: 'pointer' }}
                                                    title="Adjust Transparency"
                                                />
                                                <input
                                                    value={editConfig.hero.overlayColor || ''}
                                                    onChange={(e) => handleConfigChange(e, 'hero', 'overlayColor')}
                                                    placeholder="e.g., rgba(131, 24, 67, 0.5) or #831843"
                                                    style={{ flexGrow: 1 }}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input type="checkbox" checked={editConfig.hero.showParticles !== false} onChange={(e) => handleConfigChange(e, 'hero', 'showParticles')} style={{ width: 'auto' }} />
                                            <label style={{ margin: 0 }}>Enable Cinematic Particles</label>
                                        </div>
                                        <div className="form-group">
                                            <label>Subtitle</label>
                                            <input value={editConfig.hero.subtitle} onChange={(e) => handleConfigChange(e, 'hero', 'subtitle')} />
                                            <InlineStyleControls styleObj={editConfig.hero.subtitleStyle} onChange={(prop, val) => handleStyleChange('hero', 'subtitleStyle', prop, val)} fonts={allFonts} />
                                        </div>
                                        <div className="form-group">
                                            <label>Date Text</label>
                                            <input value={editConfig.hero.dateText} onChange={(e) => handleConfigChange(e, 'hero', 'dateText')} />
                                            <InlineStyleControls styleObj={editConfig.hero.dateStyle} onChange={(prop, val) => handleStyleChange('hero', 'dateStyle', prop, val)} fonts={allFonts} />
                                        </div>
                                        <div className="form-group">
                                            <label>Time Text</label>
                                            <input value={editConfig.hero.timeText || ''} onChange={(e) => handleConfigChange(e, 'hero', 'timeText')} placeholder="e.g., 4:00 PM" />
                                            <InlineStyleControls styleObj={editConfig.hero.timeStyle} onChange={(prop, val) => handleStyleChange('hero', 'timeStyle', prop, val)} fonts={allFonts} />
                                        </div>
                                        <div className="form-group">
                                            <label>Location Text</label>
                                            <input value={editConfig.hero.locationText} onChange={(e) => handleConfigChange(e, 'hero', 'locationText')} />
                                            <InlineStyleControls styleObj={editConfig.hero.locationStyle} onChange={(prop, val) => handleStyleChange('hero', 'locationStyle', prop, val)} fonts={allFonts} />
                                        </div>

                                        <h4 style={{ margin: '2rem 0 1rem', color: '#666' }}>RSVP Settings</h4>
                                        <div className="form-group">
                                            <label>Deadline Text</label>
                                            <input value={editConfig.rsvp.deadline} onChange={(e) => handleConfigChange(e, 'rsvp', 'deadline')} />
                                        </div>

                                        <h4 style={{ margin: '2rem 0 1rem', color: '#666' }}>When & Where (Ceremony)</h4>
                                        <div className="form-group">
                                            <label>Day of Week</label>
                                            <input value={editConfig.details.ceremony.dayOfWeek} onChange={(e) => handleNestedConfigChange(e, 'details', 'ceremony', 'dayOfWeek')} />
                                        </div>
                                        <div className="form-group">
                                            <label>Full Date</label>
                                            <input value={editConfig.details.ceremony.dateFull} onChange={(e) => handleNestedConfigChange(e, 'details', 'ceremony', 'dateFull')} />
                                        </div>
                                        <div className="form-group">
                                            <label>Time Start</label>
                                            <input value={editConfig.details.ceremony.timeStart} onChange={(e) => handleNestedConfigChange(e, 'details', 'ceremony', 'timeStart')} />
                                        </div>
                                        <div className="form-group">
                                            <label>Time Notes</label>
                                            <input value={editConfig.details.ceremony.timeNotes} onChange={(e) => handleNestedConfigChange(e, 'details', 'ceremony', 'timeNotes')} />
                                        </div>

                                        <h4 style={{ margin: '2rem 0 1rem', color: '#666' }}>When & Where (Venue)</h4>
                                        <div className="form-group">
                                            <label>Venue Name</label>
                                            <input value={editConfig.details.venue.name} onChange={(e) => handleNestedConfigChange(e, 'details', 'venue', 'name')} />
                                        </div>
                                        <div className="form-group">
                                            <label>Venue Address</label>
                                            <input value={editConfig.details.venue.address} onChange={(e) => handleNestedConfigChange(e, 'details', 'venue', 'address')} />
                                        </div>
                                        <div className="form-group">
                                            <label>Map URL</label>
                                            <input value={editConfig.details.venue.mapUrl} onChange={(e) => handleNestedConfigChange(e, 'details', 'venue', 'mapUrl')} />
                                        </div>

                                        <button className="admin-btn" style={{ marginTop: '1rem' }} onClick={handleSaveConfig}>Save Application Configuration</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div 
                            className="admin-splitter" 
                            onMouseDown={() => setIsDragging(true)}
                            onTouchStart={() => setIsDragging(true)}
                        >
                            <div className="splitter-handle"></div>
                        </div>

                        <div className="admin-preview-panel" style={{ width: `${100 - splitWidth}%` }}>
                            <div className="admin-card preview-card">
                                <h3>Full Site Live Preview</h3>
                                <div className="preview-container-wrapper">
                                    <div className="preview-scaling-container">
                                        <ConfigContext.Provider value={{ config: editConfig, setConfig }}>
                                            <MainSite isPreview={true} />
                                        </ConfigContext.Provider>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'rsvps' && (
                    <div className="admin-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Reservations ({rsvps.length})</h3>
                            <button 
                                className="admin-btn" 
                                style={{ width: 'auto', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                onClick={handleExportRSVPs}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                Export to Excel
                            </button>
                        </div>
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

                {activeTab === 'fonts' && (
                    <div className="admin-card">
                        <h3>Font Library</h3>
                        <p style={{ marginBottom: '2rem', color: '#666' }}>Add fonts stored in <code style={{ background: '#eee', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>public/fonts/</code> to have them appear in dropdowns.</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h4 style={{ marginBottom: '1rem' }}>Upload & Auto-Register</h4>
                                <div className="admin-form" style={{ marginBottom: '2rem' }}>
                                    <div className="form-group" style={{ background: '#fcfaf8', padding: '1.5rem', border: '2px dashed #ddd', borderRadius: '8px', textAlign: 'center' }}>
                                        <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>Upload single font files or a .zip archive containing multiple fonts.</p>
                                        <input
                                            type="file"
                                            accept=".ttf,.otf,.woff,.woff2,.zip"
                                            onChange={handleFontFileUpload}
                                            style={{ display: 'none' }}
                                            id="font-upload-input"
                                        />
                                        <button
                                            className="admin-btn"
                                            style={{ width: 'auto' }}
                                            onClick={() => document.getElementById('font-upload-input').click()}
                                        >
                                            Select Font File/Zip
                                        </button>
                                    </div>
                                </div>

                                <h4 style={{ marginBottom: '1rem' }}>Manual Registration</h4>
                                <div className="admin-form">
                                    <div className="form-group">
                                        <label>Display Name (e.g. My Custom Font)</label>
                                        <input id="new-font-name" placeholder="My Custom Font" />
                                    </div>
                                    <div className="form-group">
                                        <label>Font Family Name (e.g. 'MyFont', sans-serif)</label>
                                        <input id="new-font-family" placeholder="'My Font', sans-serif" />
                                    </div>
                                    <div className="form-group">
                                        <label>Font Filename (e.g. MyFont.woff2)</label>
                                        <input id="new-font-file" placeholder="MyFont.woff2" />
                                    </div>
                                    <button className="admin-btn" style={{ width: 'auto' }} onClick={() => {
                                        const name = document.getElementById('new-font-name').value;
                                        const family = document.getElementById('new-font-family').value;
                                        const filename = document.getElementById('new-font-file').value;
                                        if (name && family && filename) {
                                            const updatedFonts = [...(editConfig.customFonts || []), { name, family, url: `/fonts/${filename}` }];
                                            const newConfig = { ...editConfig, customFonts: updatedFonts };

                                            setEditConfig(newConfig);
                                            persistConfig(newConfig).then(success => {
                                                if (success) {
                                                    document.getElementById('new-font-name').value = '';
                                                    document.getElementById('new-font-family').value = '';
                                                    document.getElementById('new-font-file').value = '';
                                                    Swal.fire('Success', 'Font registered and saved.', 'success');
                                                }
                                            });
                                        }
                                    }}>Add to Library</button>
                                </div>
                            </div>
                            <div>
                                <h4 style={{ marginBottom: '1rem' }}>Available Fonts</h4>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {[...AVAILABLE_FONTS, ...(editConfig.customFonts || [])].map((f, i) => (
                                        <li key={i} style={{ padding: '0.8rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <strong style={{ fontFamily: f.family }}>{f.name}</strong>
                                                <div style={{ fontSize: '0.7rem', color: '#888' }}>{f.family}</div>
                                            </div>
                                            {i >= AVAILABLE_FONTS.length && (
                                                <button
                                                    style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '1.2rem' }}
                                                    onClick={() => {
                                                        const userFonts = editConfig.customFonts || [];
                                                        const newFonts = userFonts.filter((_, idx) => idx !== (i - AVAILABLE_FONTS.length));
                                                        setEditConfig(prev => ({ ...prev, customFonts: newFonts }));
                                                    }}
                                                >&times;</button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'music' && (
                    <div className="admin-card">
                        <h3>Music Playlist Manager</h3>
                        <p style={{ marginBottom: '2rem', color: '#666' }}>Upload background music (.mp3) to play across the website. Multiple songs will be played in a sequence.</p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h4 style={{ marginBottom: '1rem' }}>Add Songs</h4>
                                <div className="admin-form" style={{ marginBottom: '2rem' }}>
                                    <div className="form-group" style={{ background: '#fcfaf8', padding: '1.5rem', border: '2px dashed #ddd', borderRadius: '8px', textAlign: 'center' }}>
                                        <input
                                            type="file"
                                            multiple
                                            accept="audio/mp3,audio/mpeg"
                                            onChange={async (e) => {
                                                const files = Array.from(e.target.files);
                                                if (files.length === 0) return;

                                                try {
                                                    Swal.fire({ title: 'Uploading Music...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
                                                    
                                                    const newUrls = [];
                                                    for (const file of files) {
                                                        const storagePath = `playlist/${Date.now()}_${file.name}`;
                                                        const { data, error } = await supabase.storage.from('music').upload(storagePath, file);
                                                        if (error) throw error;
                                                        const { data: { publicUrl } } = supabase.storage.from('music').getPublicUrl(storagePath);
                                                        newUrls.push(publicUrl);
                                                    }

                                                    const updatedPlaylist = [...(editConfig.playlist || []), ...newUrls];
                                                    const newConfig = { ...editConfig, playlist: updatedPlaylist };
                                                    setEditConfig(newConfig);
                                                    await persistConfig(newConfig);
                                                    
                                                    Swal.fire('Success!', `${files.length} song(s) added to playlist.`, 'success');
                                                } catch (err) {
                                                    console.error(err);
                                                    Swal.fire('Error', 'Failed to upload music. Ensure a bucket named "music" exists.', 'error');
                                                }
                                            }}
                                            style={{ display: 'none' }}
                                            id="music-upload-input"
                                        />
                                        <button
                                            className="admin-btn"
                                            style={{ width: 'auto' }}
                                            onClick={() => document.getElementById('music-upload-input').click()}
                                        >
                                            Select MP3 Files
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 style={{ marginBottom: '1rem' }}>Current Playlist</h4>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {(editConfig.playlist || []).map((url, i) => {
                                        const filename = url.split('/').pop().split('_').pop();
                                        return (
                                            <li key={i} style={{ padding: '0.8rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#999' }}>{i + 1}.</span>
                                                    <span style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={filename}>{filename}</span>
                                                </div>
                                                <button
                                                    style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '1.2rem' }}
                                                    onClick={() => {
                                                        const newPlaylist = editConfig.playlist.filter((_, idx) => idx !== i);
                                                        setEditConfig(prev => ({ ...prev, playlist: newPlaylist }));
                                                    }}
                                                >&times;</button>
                                            </li>
                                        );
                                    })}
                                    {(editConfig.playlist || []).length === 0 && <p style={{ color: '#999', fontSize: '0.9rem' }}>No music added yet.</p>}
                                </ul>
                                {(editConfig.playlist || []).length > 0 && (
                                    <button 
                                        className="admin-btn" 
                                        style={{ marginTop: '1rem', background: '#28a745' }}
                                        onClick={handleSaveConfig}
                                    >
                                        Save Playlist Order
                                    </button>
                                )}
                            </div>
                        </div>
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

            {isCropping && (
                <div className="cropper-modal">
                    <div className="cropper-container">
                        <Cropper
                            image={imageToCrop}
                            crop={crop}
                            zoom={zoom}
                            aspect={16 / 9}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>
                    <div className="cropper-buttons">
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(e.target.value)}
                            className="zoom-range"
                        />
                        <div className="cropper-buttons">
                            <button onClick={() => setIsCropping(false)} className="admin-btn cancel">Cancel</button>
                            <button onClick={showCroppedImage} className="admin-btn save">Crop & Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
