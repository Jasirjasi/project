import { useState, useEffect } from 'react';
import { utils, writeFile } from 'xlsx';
import { supabase } from '../supabase';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useConfig, ConfigContext } from '../context/ConfigContext';
import Swal from 'sweetalert2';
import Gallery from '../components/Gallery';
import MainSite from '../components/MainSite';
import Cropper from 'react-easy-crop';
import JSZip from 'jszip';
import { AVAILABLE_FONTS, BACKGROUND_POSITIONS } from '../constants';
import './Admin.css';

const InlineStyleControls = ({ styleObj, onChange, fonts }) => {
    return (
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', alignItems: 'center', flexWrap: 'wrap', padding: '0.4rem', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
            <input type="text" placeholder="Size (e.g. 2rem)" value={styleObj?.fontSize || ''} onChange={(e) => onChange('fontSize', e.target.value)} style={{ width: '130px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', border: '1px solid #ced4da', borderRadius: '4px' }} title="Font Size" />
            <input type="color" value={styleObj?.color || '#000000'} onChange={(e) => onChange('color', e.target.value)} style={{ width: '28px', height: '28px', padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} title="Text Color" />
            <select
                value={styleObj?.fontFamily || ''}
                onChange={(e) => onChange('fontFamily', e.target.value)}
                style={{ flexGrow: 1, minWidth: '130px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', border: '1px solid #ced4da', borderRadius: '4px' }}
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
    const { config, setConfig, clientSlug, setClientSlug } = useConfig();
    const { clientSlug: urlParamSlug } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // Mode: 'overview' (Client Cards Dashboard) or 'config' (AdminLTE Site Configuration)
    const [viewMode, setViewMode] = useState(() => {
        if (urlParamSlug || location.pathname.includes('/config/')) return 'config';
        return 'overview';
    });

    const [activeTab, setActiveTab] = useState('config');
    const [rsvps, setRsvps] = useState([]);
    const [clientList, setClientList] = useState(['main', 'adithi-rajkiran']);
    const [clientDetails, setClientDetails] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showSplitPreview, setShowSplitPreview] = useState(true);

    // Editing config state
    const [editConfig, setEditConfig] = useState(config);

    useEffect(() => {
        setEditConfig(config);
    }, [config]);

    // Handle URL parameters for direct routing (e.g. /admin/config/adithi-rajkiran)
    useEffect(() => {
        if (urlParamSlug) {
            setClientSlug(urlParamSlug);
            setViewMode('config');
        } else if (location.pathname === '/admin/dashboard' && !urlParamSlug) {
            // Keep user selected viewMode unless explicit
        }
    }, [urlParamSlug, location.pathname, setClientSlug]);

    // Fetch list of clients and their details
    const fetchClients = async () => {
        try {
            // Start with known local configs
            const localSlugs = ['main', 'adithi-rajkiran', 'ameen'];
            let databaseSlugs = [];

            try {
                const { data } = await supabase.from('settings').select('id, config');
                if (data && data.length > 0) {
                    databaseSlugs = data.map(d => d.id);
                    data.forEach(item => {
                        if (item.config) {
                            setClientDetails(prev => ({
                                ...prev,
                                [item.id]: item.config
                            }));
                        }
                    });
                }
            } catch (e) {
                console.error('Supabase settings query error:', e);
            }

            const combinedList = Array.from(new Set([...localSlugs, ...databaseSlugs]));
            const deletedSlugs = JSON.parse(localStorage.getItem('deleted_clients') || '[]');
            const activeList = combinedList.filter(slug => !deletedSlugs.includes(slug));
            setClientList(activeList);

            // Fetch configs for local items not yet loaded
            for (const slug of activeList) {
                if (!clientDetails[slug]) {
                    try {
                        const res = await fetch(`/configs/${slug}.json`);
                        if (res.ok) {
                            const confData = await res.json();
                            setClientDetails(prev => ({ ...prev, [slug]: confData }));
                        }
                    } catch (err) {
                        // ignore missing local file
                    }
                }
            }
        } catch (e) {
            console.error('Failed to fetch clients list:', e);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    // Combine static fonts with custom fonts
    const allFonts = [...AVAILABLE_FONTS, ...(editConfig?.customFonts || [])];

    // Cropper & Splitter States
    const [imageToCrop, setImageToCrop] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);

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
            if (e.touches.length > 0) handleMove(e.touches[0].clientX);
        };
        const handleEnd = () => setIsDragging(false);

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
                    let data = null;
                    let error = null;

                    if (clientSlug && clientSlug !== 'main') {
                        const res = await supabase
                            .from('reservations')
                            .select('*')
                            .eq('client_id', clientSlug)
                            .order('created_at', { ascending: false });
                        data = res.data;
                        error = res.error;
                    } else {
                        const res = await supabase
                            .from('reservations')
                            .select('*')
                            .or('client_id.eq.main,client_id.is.null')
                            .order('created_at', { ascending: false });
                        data = res.data;
                        error = res.error;
                    }

                    if (error && (error.code === 'PGRST204' || error.code === '42703' || error.message?.includes('client_id') || error.message?.includes('does not exist'))) {
                        console.warn("Table 'reservations' missing 'client_id' column, falling back to simple select.");
                        const fallbackRes = await supabase
                            .from('reservations')
                            .select('*')
                            .order('created_at', { ascending: false });
                        data = fallbackRes.data;
                        error = fallbackRes.error;
                    }

                    if (error) throw error;
                    setRsvps(data || []);
                } catch (err) {
                    console.error('Failed to fetch RSVPs:', err);
                }
            };
            fetchRsvps();
        }
    }, [activeTab, clientSlug]);

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

    const persistConfig = async (configToSave, overrideSlug = null) => {
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
            const targetSlug = overrideSlug || clientSlug || 'main';

            const { error: saveError } = await supabase
                .from('settings')
                .upsert({ id: targetSlug, config: cleanConfig });

            if (saveError) throw saveError;

            if (targetSlug === clientSlug) {
                setConfig(cleanConfig);
            }
            setClientDetails(prev => ({ ...prev, [targetSlug]: cleanConfig }));
            await fetchClients();
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

    const handleExportConfig = (slugToExport) => {
        const targetSlug = slugToExport || clientSlug || 'main';
        const configData = (targetSlug === clientSlug && editConfig) 
            ? editConfig 
            : (clientDetails[targetSlug] || config || {});

        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(configData, null, 2)
        )}`;

        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute('download', `${targetSlug}_config.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        Swal.fire({
            icon: 'success',
            title: 'Configuration Exported',
            text: `Downloaded site configuration JSON file for [${targetSlug}]!`,
            timer: 2000,
            showConfirmButton: false
        });
    };

    const handleImportConfig = async (targetSlugToImport) => {
        const activeTargetSlug = targetSlugToImport || clientSlug || 'main';

        const { value: file } = await Swal.fire({
            title: `Import Site Configuration JSON`,
            html: `Select a <code>.json</code> configuration file to load into client <strong>[${activeTargetSlug}]</strong>.`,
            input: 'file',
            inputAttributes: {
                'accept': '.json,application/json',
                'aria-label': 'Upload site configuration JSON file'
            },
            showCancelButton: true,
            confirmButtonColor: '#3c8dbc',
            confirmButtonText: 'Import & Apply Config'
        });

        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const parsedConfig = JSON.parse(e.target.result);
                    if (!parsedConfig || typeof parsedConfig !== 'object' || Array.isArray(parsedConfig)) {
                        throw new Error('Invalid JSON structure! The file must be a JSON object.');
                    }

                    if (activeTargetSlug === clientSlug) {
                        setEditConfig(parsedConfig);
                    }

                    const success = await persistConfig(parsedConfig, activeTargetSlug);
                    if (success) {
                        await fetchClients();
                        Swal.fire({
                            icon: 'success',
                            title: 'Configuration Imported!',
                            text: `Successfully loaded and saved JSON configuration for client [${activeTargetSlug}].`
                        });
                    }
                } catch (err) {
                    console.error('Import Config Error:', err);
                    Swal.fire('Import Error', `Failed to parse JSON file: ${err.message}`, 'error');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleCreateNewClient = async () => {
        const { value: newSlug } = await Swal.fire({
            title: 'Create New Client Site',
            input: 'text',
            inputLabel: 'Client Unique Identifier / URL Slug',
            inputPlaceholder: 'e.g. alex-sam',
            showCancelButton: true,
            confirmButtonColor: '#3c8dbc',
            confirmButtonText: 'Create Client',
            inputValidator: (value) => {
                if (!value || !value.trim()) return 'Please enter a valid client slug!';
                const formatted = value.trim().toLowerCase();
                if (!/^[a-z0-9_-]+$/.test(formatted)) {
                    return 'Only lowercase letters, numbers, hyphens (-) and underscores (_) are allowed.';
                }
            }
        });

        if (newSlug) {
            const cleanSlug = newSlug.trim().toLowerCase();

            // Un-mark slug from deleted list if recreating
            const deletedSlugs = JSON.parse(localStorage.getItem('deleted_clients') || '[]');
            if (deletedSlugs.includes(cleanSlug)) {
                const updatedDeleted = deletedSlugs.filter(s => s !== cleanSlug);
                localStorage.setItem('deleted_clients', JSON.stringify(updatedDeleted));
            }

            const initialClientConfig = {
                ...config,
                couple: {
                    ...config?.couple,
                    name1: 'Partner 1',
                    name2: 'Partner 2',
                    namesFormatted: 'Partner 1 & Partner 2'
                }
            };

            const { error: insertErr } = await supabase
                .from('settings')
                .upsert({ id: cleanSlug, config: initialClientConfig });

            if (insertErr) {
                Swal.fire('Error', insertErr.message, 'error');
            } else {
                Swal.fire('Success!', `Client [${cleanSlug}] created successfully.`, 'success');
                await fetchClients();
                setClientSlug(cleanSlug);
                setViewMode('config');
                navigate(`/admin/config/${cleanSlug}`);
            }
        }
    };

    const handleDeleteClient = async (slugToDelete) => {
        const targetSlug = slugToDelete || clientSlug || 'main';
        if (targetSlug === 'main') {
            Swal.fire('Action Not Allowed', 'The default [main] client template cannot be deleted.', 'warning');
            return;
        }

        const result = await Swal.fire({
            title: `Delete Client [${targetSlug}]?`,
            text: `Are you sure you want to delete client [${targetSlug}]? This will permanently remove its configuration, gallery images, and guest RSVPs!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, Delete Client'
        });

        if (result.isConfirmed) {
            try {
                Swal.fire({
                    title: 'Deleting Client...',
                    text: 'Removing client configuration and associated data...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });

                // Delete settings from Supabase
                await supabase.from('settings').delete().eq('id', targetSlug);

                // Delete associated photos & RSVPs from Supabase
                try {
                    await supabase.from('images').delete().eq('client_id', targetSlug);
                } catch (imgErr) {
                    console.warn('Could not delete images for client:', imgErr);
                }

                try {
                    await supabase.from('reservations').delete().eq('client_id', targetSlug);
                } catch (rsvpErr) {
                    console.warn('Could not delete reservations for client:', rsvpErr);
                }

                // Add to deleted_clients list in localStorage so local JSON configs don't reappear
                const deletedSlugs = JSON.parse(localStorage.getItem('deleted_clients') || '[]');
                if (!deletedSlugs.includes(targetSlug)) {
                    deletedSlugs.push(targetSlug);
                    localStorage.setItem('deleted_clients', JSON.stringify(deletedSlugs));
                }

                await fetchClients();

                if (clientSlug === targetSlug) {
                    setClientSlug('main');
                    setViewMode('overview');
                    navigate('/admin/dashboard');
                }

                Swal.fire('Deleted!', `Client [${targetSlug}] has been permanently removed.`, 'success');
            } catch (err) {
                console.error('Delete client error:', err);
                Swal.fire('Error', 'Failed to delete client: ' + (err.message || 'Unknown error'), 'error');
            }
        }
    };

    const handleRenameClient = async (oldSlug) => {
        const targetSlug = oldSlug || clientSlug;
        if (!targetSlug || targetSlug === 'main') {
            Swal.fire('Action Not Allowed', 'The default [main] client template cannot be renamed.', 'warning');
            return;
        }

        const { value: newSlug } = await Swal.fire({
            title: `Rename Client [${targetSlug}]`,
            text: 'Changing the client identifier will update the site URL, database settings, uploaded photos, and guest RSVPs.',
            input: 'text',
            inputValue: targetSlug,
            inputLabel: 'New Client Unique Identifier / URL Slug',
            inputPlaceholder: 'e.g. ameen-wedding',
            showCancelButton: true,
            confirmButtonColor: '#3c8dbc',
            confirmButtonText: 'Rename & Migrate Data',
            inputValidator: (value) => {
                if (!value || !value.trim()) return 'Please enter a valid client slug!';
                const formatted = value.trim().toLowerCase();
                if (formatted === targetSlug) {
                    return 'New slug must be different from current slug!';
                }
                if (formatted === 'main') {
                    return 'The slug "main" is reserved!';
                }
                if (!/^[a-z0-9_-]+$/.test(formatted)) {
                    return 'Only lowercase letters, numbers, hyphens (-) and underscores (_) are allowed.';
                }
            }
        });

        if (!newSlug) return;
        const cleanNewSlug = newSlug.trim().toLowerCase();

        try {
            Swal.fire({
                title: 'Renaming Client...',
                text: 'Updating site settings, photos, and guest RSVPs in database...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            // 1. Fetch current settings for targetSlug
            let currentConfig = clientDetails[targetSlug] || editConfig || {};
            const { data: existingDbSetting } = await supabase.from('settings').select('config').eq('id', targetSlug).maybeSingle();
            if (existingDbSetting && existingDbSetting.config) {
                currentConfig = existingDbSetting.config;
            }

            // 2. Insert/Upsert new setting with cleanNewSlug
            const { error: insertErr } = await supabase
                .from('settings')
                .upsert({ id: cleanNewSlug, config: currentConfig });

            if (insertErr) throw insertErr;

            // 3. Delete old setting record
            await supabase.from('settings').delete().eq('id', targetSlug);

            // 4. Update 'images' table client_id
            try {
                await supabase
                    .from('images')
                    .update({ client_id: cleanNewSlug })
                    .eq('client_id', targetSlug);
            } catch (imgErr) {
                console.warn('Could not migrate images client_id column:', imgErr);
            }

            // 5. Update 'reservations' table client_id
            try {
                await supabase
                    .from('reservations')
                    .update({ client_id: cleanNewSlug })
                    .eq('client_id', targetSlug);
            } catch (rsvpErr) {
                console.warn('Could not migrate reservations client_id column:', rsvpErr);
            }

            // 6. Refresh client list and set active client
            await fetchClients();

            if (clientSlug === targetSlug) {
                setClientSlug(cleanNewSlug);
                setEditConfig(currentConfig);
                navigate(`/admin/config/${cleanNewSlug}`);
            }

            Swal.fire(
                'Client Renamed!',
                `Client [${targetSlug}] has been successfully renamed to [${cleanNewSlug}]. All associated photos, RSVPs, and configurations have been transferred.`,
                'success'
            );
        } catch (err) {
            console.error('Rename Client Error:', err);
            Swal.fire('Rename Failed', err.message || 'An error occurred while renaming the client.', 'error');
        }
    };

    const handleSaveConfig = async () => {
        const success = await persistConfig(editConfig);
        if (success) {
            Swal.fire('Saved!', `Website configuration for [${clientSlug}] updated successfully.`, 'success');
        }
    };

    const handleSelectClientCard = (slug) => {
        setClientSlug(slug);
        setViewMode('config');
        navigate(`/admin/config/${slug}`);
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
            await new Promise(resolve => image.onload = resolve);

            const { width, height, x, y } = croppedAreaPixels;
            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
            const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);

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
            Swal.fire({ title: 'Processing Font...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const newFonts = [];

            if (file.name.toLowerCase().endsWith('.zip')) {
                const zip = new JSZip();
                const contents = await zip.loadAsync(file);
                for (const [filename, zipEntry] of Object.entries(contents.files)) {
                    if (!zipEntry.dir && (filename.endsWith('.ttf') || filename.endsWith('.otf') || filename.endsWith('.woff') || filename.endsWith('.woff2'))) {
                        const blob = await zipEntry.async('blob');
                        const uploadedFont = await uploadAndRegisterFont(blob, filename);
                        if (uploadedFont) newFonts.push(uploadedFont);
                    }
                }
            } else {
                const uploadedFont = await uploadAndRegisterFont(file, file.name);
                if (uploadedFont) newFonts.push(uploadedFont);
            }

            if (newFonts.length > 0) {
                const updatedFonts = [...(editConfig.customFonts || []), ...newFonts];
                const newConfig = { ...editConfig, customFonts: updatedFonts };
                setEditConfig(newConfig);
                const success = await persistConfig(newConfig);
                if (success) Swal.fire('Success!', `Registered ${newFonts.length} font(s).`, 'success');
            } else {
                Swal.fire('Error', 'No valid font files found in upload.', 'error');
            }
        } catch (err) {
            console.error('Font upload error:', err);
            Swal.fire('Error', 'Failed to upload font.', 'error');
        }
    };

    const uploadAndRegisterFont = async (blob, filename) => {
        try {
            const cleanFilename = filename.split('/').pop();
            const storagePath = `custom-fonts/${Date.now()}_${cleanFilename}`;
            const { error } = await supabase.storage.from('fonts').upload(storagePath, blob);
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from('fonts').getPublicUrl(storagePath);
            const fontBaseName = cleanFilename.split('.')[0].replace(/[-_]/g, ' ');
            return { name: fontBaseName, family: `'${fontBaseName}'`, url: publicUrl };
        } catch (err) {
            console.error(err);
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
        const exportData = rsvps.map(rsvp => ({
            'Client Site': rsvp.client_id || clientSlug || 'main',
            'Name': rsvp.name,
            'Status': rsvp.guests === '0' ? 'Declined' : 'Attending',
            'Number of Guests': rsvp.guests,
            'Message': rsvp.message || '',
            'Date Submitted': rsvp.created_at ? new Date(rsvp.created_at).toLocaleString() : ''
        }));
        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, 'RSVPs');
        writeFile(wb, `Wedding_RSVPs_${clientSlug}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const currentColor = extractColor(editConfig.hero?.overlayColor);

    // Filter client list based on search query
    const filteredClientList = clientList.filter(slug => {
        const details = clientDetails[slug];
        const names = details?.couple?.namesFormatted || details?.couple?.name1 || slug;
        return slug.toLowerCase().includes(searchQuery.toLowerCase()) || names.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const activeClientDetail = clientDetails[clientSlug] || editConfig;
    const activeCoupleNames = activeClientDetail?.couple?.namesFormatted || activeClientDetail?.couple?.name1 || clientSlug;
    const activeHeroImg = activeClientDetail?.hero?.backgroundImage || '';

    const handleMenuClick = (tabName) => {
        setActiveTab(tabName);
        if (window.innerWidth <= 992) {
            setSidebarCollapsed(true);
        }
    };

    return (
        <div className="adminlte-wrapper">
            {/* Mobile Sidebar Backdrop Overlay */}
            <div
                className={`sidebar-backdrop ${viewMode === 'config' && !sidebarCollapsed ? 'active' : ''}`}
                onClick={() => setSidebarCollapsed(true)}
            ></div>

            {/* AdminLTE Top Navbar */}
            <header className="adminlte-navbar">
                <div className="adminlte-navbar-left">
                    <button
                        className="adminlte-sidebar-toggle"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        title="Toggle Navigation Sidebar"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                    <h1 className="adminlte-brand-title">
                        AdminLTE Wedding Studio <span className="adminlte-brand-badge">Multi-Tenant</span>
                    </h1>
                </div>

                <div className="adminlte-navbar-right">
                    {viewMode === 'config' ? (
                        <>
                            <button
                                onClick={() => { setViewMode('overview'); navigate('/admin/dashboard'); }}
                                className="btn-card-action btn-card-view"
                                style={{ padding: '0.45rem 0.85rem' }}
                            >
                                ⬅️ All Clients
                            </button>
                            <select
                                value={clientSlug || 'main'}
                                onChange={(e) => handleSelectClientCard(e.target.value)}
                                style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #ced4da', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                                {clientList.map(slug => (
                                    <option key={slug} value={slug}>{slug === 'main' ? 'main (Default Template)' : slug}</option>
                                ))}
                            </select>
                        </>
                    ) : null}

                    <button
                        onClick={handleCreateNewClient}
                        className="btn-card-action btn-card-config"
                        style={{ padding: '0.45rem 0.85rem' }}
                    >
                        + New Client
                    </button>

                    {viewMode === 'config' && (
                        <>
                            <button
                                onClick={() => handleExportConfig(clientSlug)}
                                className="btn-card-action"
                                style={{ padding: '0.45rem 0.85rem', backgroundColor: '#28a745', color: '#fff' }}
                                title="Download / Export Site Configuration JSON"
                            >
                                📥 Export JSON
                            </button>
                            <button
                                onClick={() => handleImportConfig(clientSlug)}
                                className="btn-card-action"
                                style={{ padding: '0.45rem 0.85rem', backgroundColor: '#6f42c1', color: '#fff' }}
                                title="Upload / Import Site Configuration JSON"
                            >
                                📤 Import JSON
                            </button>
                            {clientSlug !== 'main' && (
                                <>
                                    <button
                                        onClick={() => handleRenameClient(clientSlug)}
                                        className="btn-card-action"
                                        style={{ padding: '0.45rem 0.85rem', backgroundColor: '#17a2b8', color: '#fff' }}
                                        title="Rename Client Slug & Transfer All Data"
                                    >
                                        ✏️ Rename Client
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClient(clientSlug)}
                                        className="btn-card-action btn-card-delete"
                                        style={{ padding: '0.45rem 0.85rem' }}
                                        title="Permanently Delete Client Site & Associated Data"
                                    >
                                        🗑️ Delete Client
                                    </button>
                                </>
                            )}
                            <a
                                href={clientSlug === 'main' ? '/?client=main' : `/${clientSlug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-card-action btn-card-view"
                                style={{ padding: '0.45rem 0.85rem', textDecoration: 'none' }}
                            >
                                🔗 View Site
                            </a>
                        </>
                    )}

                    <button
                        onClick={handleLogout}
                        className="btn-card-action btn-card-delete"
                        style={{ width: 'auto', padding: '0.45rem 0.85rem' }}
                        title="Log Out"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* AdminLTE Main Shell Body */}
            <div className="adminlte-layout-body">
                {/* AdminLTE Left Sidebar (Visible in Site Config View) */}
                {viewMode === 'config' && (
                    <aside className={`adminlte-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                        <div className="sidebar-client-profile">
                            {activeHeroImg ? (
                                <img src={activeHeroImg} alt="Client Avatar" className="client-avatar-thumb" />
                            ) : (
                                <div className="client-avatar-thumb">
                                    {clientSlug ? clientSlug.charAt(0).toUpperCase() : 'M'}
                                </div>
                            )}
                            <div className="sidebar-client-info">
                                <span className="sidebar-client-name">{activeCoupleNames}</span>
                                <span className="sidebar-client-slug">
                                    <span className="status-dot-online"></span> /{clientSlug}
                                </span>
                            </div>
                        </div>

                        <div className="sidebar-search-box">
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <ul className="sidebar-nav-menu">
                            <li className="sidebar-menu-header">Site Settings</li>
                            <li className="sidebar-menu-item">
                                <button
                                    className={`sidebar-menu-link ${activeTab === 'config' ? 'active' : ''}`}
                                    onClick={() => handleMenuClick('config')}
                                >
                                    <span className="sidebar-menu-icon">⚙️</span>
                                    <span>Configuration & Couple</span>
                                </button>
                            </li>
                            <li className="sidebar-menu-item">
                                <button
                                    className={`sidebar-menu-link ${activeTab === 'rsvps' ? 'active' : ''}`}
                                    onClick={() => handleMenuClick('rsvps')}
                                >
                                    <span className="sidebar-menu-icon">💌</span>
                                    <span>RSVPs & Guests</span>
                                    {rsvps.length > 0 && <span className="sidebar-menu-badge">{rsvps.length}</span>}
                                </button>
                            </li>
                            <li className="sidebar-menu-item">
                                <button
                                    className={`sidebar-menu-link ${activeTab === 'music' ? 'active' : ''}`}
                                    onClick={() => handleMenuClick('music')}
                                >
                                    <span className="sidebar-menu-icon">🎵</span>
                                    <span>Background Playlist</span>
                                </button>
                            </li>
                            <li className="sidebar-menu-item">
                                <button
                                    className={`sidebar-menu-link ${activeTab === 'fonts' ? 'active' : ''}`}
                                    onClick={() => handleMenuClick('fonts')}
                                >
                                    <span className="sidebar-menu-icon">🔤</span>
                                    <span>Font Library</span>
                                </button>
                            </li>
                            <li className="sidebar-menu-item">
                                <button
                                    className={`sidebar-menu-link ${activeTab === 'gallery' ? 'active' : ''}`}
                                    onClick={() => handleMenuClick('gallery')}
                                >
                                    <span className="sidebar-menu-icon">📷</span>
                                    <span>Gallery Storage</span>
                                </button>
                            </li>

                            <li className="sidebar-menu-header">Live Preview Controls</li>
                            <li className="sidebar-menu-item">
                                <button
                                    className="sidebar-menu-link"
                                    onClick={() => setShowSplitPreview(!showSplitPreview)}
                                >
                                    <span className="sidebar-menu-icon">{showSplitPreview ? '👁️‍🗨️' : '👁️'}</span>
                                    <span>{showSplitPreview ? 'Hide Split Preview' : 'Show Split Preview'}</span>
                                </button>
                            </li>
                        </ul>
                    </aside>
                )}

                {/* AdminLTE Content Area */}
                <main className="adminlte-content-wrapper">
                    {/* View Mode 1: Client Overview Cards Dashboard */}
                    {viewMode === 'overview' && (
                        <div className="adminlte-content-body">
                            {/* Page Header */}
                            <div className="adminlte-content-header" style={{ padding: '0 0 1.25rem 0' }}>
                                <div>
                                    <h2 className="adminlte-page-title">Client Portfolio Overview</h2>
                                    <p style={{ color: '#6c757d', margin: '0.2rem 0 0 0', fontSize: '0.9rem' }}>
                                        Manage multi-tenant wedding websites, configurations, RSVPs, and live invitations.
                                    </p>
                                </div>

                                <ul className="adminlte-breadcrumbs">
                                    <li><a onClick={() => setViewMode('overview')}>Home</a></li>
                                    <li>/</li>
                                    <li style={{ fontWeight: '600', color: '#495057' }}>Client Overview</li>
                                </ul>
                            </div>

                            {/* Metric Info Boxes */}
                            <div className="info-box-grid">
                                <div className="info-box">
                                    <div className="info-box-icon bg-info-blue">👥</div>
                                    <div className="info-box-content">
                                        <span className="info-box-text">Total Clients</span>
                                        <span className="info-box-number">{clientList.length}</span>
                                    </div>
                                </div>

                                <div className="info-box">
                                    <div className="info-box-icon bg-info-green">✨</div>
                                    <div className="info-box-content">
                                        <span className="info-box-text">Active Sites</span>
                                        <span className="info-box-number">{clientList.length}</span>
                                    </div>
                                </div>

                                <div className="info-box">
                                    <div className="info-box-icon bg-info-warning">💌</div>
                                    <div className="info-box-content">
                                        <span className="info-box-text">Guest RSVPs</span>
                                        <span className="info-box-number">{rsvps.length > 0 ? rsvps.length : 'Live'}</span>
                                    </div>
                                </div>

                                <div className="info-box">
                                    <div className="info-box-icon bg-info-danger">📷</div>
                                    <div className="info-box-content">
                                        <span className="info-box-text">Upload Feature</span>
                                        <span className="info-box-number">Enabled</span>
                                    </div>
                                </div>
                            </div>

                            {/* Search & Actions Bar */}
                            <div className="client-overview-header">
                                <div className="client-search-filter">
                                    <span>🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Search clients by name or slug..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <button
                                    className="btn-card-action btn-card-config"
                                    style={{ width: 'auto', padding: '0.6rem 1.25rem' }}
                                    onClick={handleCreateNewClient}
                                >
                                    + Add New Client Site
                                </button>
                            </div>

                            {/* Client Cards Grid */}
                            <div className="client-cards-grid">
                                {filteredClientList.map(slug => {
                                    const details = clientDetails[slug] || {};
                                    const coupleName = details?.couple?.namesFormatted || (details?.couple?.name1 ? `${details.couple.name1} & ${details.couple.name2 || ''}` : slug);
                                    const bgImage = details?.hero?.backgroundImage || '';

                                    return (
                                        <div key={slug} className="client-card">
                                            <div
                                                className="client-card-cover"
                                                style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}
                                            >
                                                <div className="client-card-cover-overlay"></div>
                                                <span className="client-card-slug-badge">/{slug}</span>
                                                <span className="client-card-status-pill">Active</span>
                                                <div className="client-card-title-box">
                                                    <h3 className="client-card-names">{coupleName}</h3>
                                                </div>
                                            </div>

                                            <div className="client-card-body">
                                                <div className="client-info-row">
                                                    <span>Client Identifier:</span>
                                                    <strong>{slug}</strong>
                                                </div>
                                                <div className="client-info-row">
                                                    <span>Theme Primary:</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: details?.theme?.primaryColor || '#810100', border: '1px solid #ccc', display: 'inline-block' }}></span>
                                                        <strong>{details?.theme?.primaryColor || '#810100'}</strong>
                                                    </span>
                                                </div>
                                                <div className="client-info-row">
                                                    <span>Guest Uploads:</span>
                                                    <strong>{details?.allowGuestUploads !== false ? 'Enabled' : 'Disabled'}</strong>
                                                </div>
                                            </div>

                                            <div className="client-card-actions">
                                                <button
                                                    className="btn-card-action btn-card-config"
                                                    onClick={() => handleSelectClientCard(slug)}
                                                    title="Open AdminLTE Site Configuration"
                                                >
                                                    ⚙️ Configure Site
                                                </button>

                                                <a
                                                    href={slug === 'main' ? '/?client=main' : `/${slug}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn-card-action btn-card-view"
                                                    style={{ textDecoration: 'none' }}
                                                    title="View Live Client Invitation Page"
                                                >
                                                    🔗 View Site
                                                </a>

                                                <button
                                                    className="btn-card-action"
                                                    style={{ backgroundColor: '#28a745', color: '#fff' }}
                                                    onClick={() => handleExportConfig(slug)}
                                                    title="Export Site Configuration JSON"
                                                >
                                                    📥
                                                </button>

                                                <button
                                                    className="btn-card-action"
                                                    style={{ backgroundColor: '#6f42c1', color: '#fff' }}
                                                    onClick={() => handleImportConfig(slug)}
                                                    title="Import Site Configuration JSON"
                                                >
                                                    📤
                                                </button>

                                                {slug !== 'main' && (
                                                    <>
                                                        <button
                                                            className="btn-card-action"
                                                            style={{ backgroundColor: '#17a2b8', color: '#fff' }}
                                                            onClick={() => handleRenameClient(slug)}
                                                            title="Rename Client Identifier & URL Slug"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className="btn-card-action btn-card-delete"
                                                            onClick={() => handleDeleteClient(slug)}
                                                            title="Delete Client Site"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Add New Client Card Trigger */}
                                <div className="client-card-add" onClick={handleCreateNewClient}>
                                    <div className="add-client-icon-circle">+</div>
                                    <h4 style={{ margin: '0 0 0.4rem 0', color: '#212529', fontSize: '1.1rem' }}>Create New Client</h4>
                                    <p style={{ margin: 0, color: '#6c757d', fontSize: '0.85rem' }}>
                                        Setup a custom wedding site configuration with a unique URL slug.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View Mode 2: AdminLTE Site Configuration View */}
                    {viewMode === 'config' && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {/* Content Header with Breadcrumbs */}
                            <div className="adminlte-content-header">
                                <h2 className="adminlte-page-title">
                                    <span>Site Configuration:</span>
                                    <span style={{ color: '#3c8dbc' }}>{activeCoupleNames}</span>
                                </h2>

                                <ul className="adminlte-breadcrumbs">
                                    <li><a onClick={() => { setViewMode('overview'); navigate('/admin/dashboard'); }}>Home</a></li>
                                    <li>/</li>
                                    <li><a onClick={() => { setViewMode('overview'); navigate('/admin/dashboard'); }}>Clients</a></li>
                                    <li>/</li>
                                    <li style={{ fontWeight: '600', color: '#495057' }}>{clientSlug}</li>
                                </ul>
                            </div>

                            {/* Main Content Pane */}
                            <div className="adminlte-content-body" style={{ flex: 1, padding: '1rem 1.5rem' }}>
                                {activeTab === 'config' && editConfig && (
                                    <div className="admin-split-layout">
                                        <div className="admin-config-panel" style={{ width: showSplitPreview ? `${splitWidth}%` : '100%' }}>
                                            <div className="card-adminlte card-primary">
                                                <div className="card-header-adminlte">
                                                    <h3 className="card-title-adminlte">
                                                        <span>⚙️</span> Wedding Site Configuration
                                                    </h3>
                                                    <div className="card-tools-adminlte">
                                                        <button
                                                            className="btn-card-action"
                                                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', backgroundColor: '#28a745', color: '#fff', marginRight: '0.4rem' }}
                                                            onClick={() => handleExportConfig(clientSlug)}
                                                            title="Download site configuration JSON file"
                                                        >
                                                            📥 Export JSON
                                                        </button>
                                                        <button
                                                            className="btn-card-action"
                                                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', backgroundColor: '#6f42c1', color: '#fff', marginRight: '0.4rem' }}
                                                            onClick={() => handleImportConfig(clientSlug)}
                                                            title="Upload site configuration JSON file"
                                                        >
                                                            📤 Import JSON
                                                        </button>
                                                        <button
                                                            className="btn-card-action btn-card-config"
                                                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                                                            onClick={handleSaveConfig}
                                                        >
                                                            Save Changes
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="card-body-adminlte admin-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                    {/* Couple Info */}
                                                    <div>
                                                        <h4 style={{ marginBottom: '1rem', color: '#3c8dbc', borderBottom: '1px solid #e9ecef', paddingBottom: '0.4rem' }}>
                                                            Couple Details
                                                        </h4>
                                                        <div className="form-group">
                                                            <label>Partner 1 Name</label>
                                                            <input value={editConfig.couple?.name1 || ''} onChange={(e) => handleConfigChange(e, 'couple', 'name1')} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Partner 2 Name</label>
                                                            <input value={editConfig.couple?.name2 || ''} onChange={(e) => handleConfigChange(e, 'couple', 'name2')} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Formatted Names (Hero Banner Display)</label>
                                                            <input value={editConfig.couple?.namesFormatted || ''} onChange={(e) => handleConfigChange(e, 'couple', 'namesFormatted')} />
                                                            <InlineStyleControls styleObj={editConfig.couple?.namesFormattedStyle} onChange={(prop, val) => handleStyleChange('couple', 'namesFormattedStyle', prop, val)} fonts={allFonts} />
                                                        </div>

                                                        <h4 style={{ margin: '1.5rem 0 1rem', color: '#3c8dbc', borderBottom: '1px solid #e9ecef', paddingBottom: '0.4rem' }}>
                                                            General Settings
                                                        </h4>
                                                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                            <input type="checkbox" checked={editConfig.allowGuestUploads !== false} onChange={(e) => handleConfigChange(e, 'root', 'allowGuestUploads')} style={{ width: 'auto', transform: 'scale(1.3)' }} />
                                                            <label style={{ margin: 0 }}>Allow Guest Photo Uploads to Gallery</label>
                                                        </div>

                                                        <h4 style={{ margin: '1.5rem 0 1rem', color: '#3c8dbc', borderBottom: '1px solid #e9ecef', paddingBottom: '0.4rem' }}>
                                                            Theme Colors & Typography
                                                        </h4>
                                                        <div className="form-group" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                            <div>
                                                                <label>Primary Color</label>
                                                                <input type="color" value={editConfig.theme?.primaryColor || '#810100'} onChange={(e) => handleConfigChange(e, 'theme', 'primaryColor')} style={{ width: '40px', height: '40px', padding: 0, border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer' }} />
                                                            </div>
                                                            <div>
                                                                <label>Secondary Color</label>
                                                                <input type="color" value={editConfig.theme?.secondaryColor || '#630000'} onChange={(e) => handleConfigChange(e, 'theme', 'secondaryColor')} style={{ width: '40px', height: '40px', padding: 0, border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer' }} />
                                                            </div>
                                                            <div>
                                                                <label>Accent Color</label>
                                                                <input type="color" value={editConfig.theme?.accentColor || '#EDEBDD'} onChange={(e) => handleConfigChange(e, 'theme', 'accentColor')} style={{ width: '40px', height: '40px', padding: 0, border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer' }} />
                                                            </div>
                                                            <div>
                                                                <label>Background Color</label>
                                                                <input type="color" value={editConfig.theme?.backgroundColor || '#EDEBDD'} onChange={(e) => handleConfigChange(e, 'theme', 'backgroundColor')} style={{ width: '40px', height: '40px', padding: 0, border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer' }} />
                                                            </div>
                                                            <div>
                                                                <label>Text Color</label>
                                                                <input type="color" value={editConfig.theme?.textColor || '#1B1717'} onChange={(e) => handleConfigChange(e, 'theme', 'textColor')} style={{ width: '40px', height: '40px', padding: 0, border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer' }} />
                                                            </div>
                                                        </div>

                                                        <div className="form-group">
                                                            <label>Heading Font</label>
                                                            <select value={editConfig.theme?.headingFont || ''} onChange={(e) => handleConfigChange(e, 'theme', 'headingFont')}>
                                                                {allFonts.map(f => (
                                                                    <option key={f.name} value={f.family}>{f.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Body Font</label>
                                                            <select value={editConfig.theme?.bodyFont || ''} onChange={(e) => handleConfigChange(e, 'theme', 'bodyFont')}>
                                                                {allFonts.map(f => (
                                                                    <option key={f.name} value={f.family}>{f.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Accent Font</label>
                                                            <select value={editConfig.theme?.accentFont || ''} onChange={(e) => handleConfigChange(e, 'theme', 'accentFont')}>
                                                                {allFonts.map(f => (
                                                                    <option key={f.name} value={f.family}>{f.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Hero Section */}
                                                    <div>
                                                        <h4 style={{ marginBottom: '1rem', color: '#3c8dbc', borderBottom: '1px solid #e9ecef', paddingBottom: '0.4rem' }}>
                                                            Hero Section Media & Content
                                                        </h4>
                                                        <div className="form-group">
                                                            <label>Media Background Type</label>
                                                            <select
                                                                value={editConfig.hero?.backgroundType || 'image'}
                                                                onChange={(e) => handleConfigChange(e, 'hero', 'backgroundType')}
                                                            >
                                                                <option value="image">Image (with Ken Burns Effect)</option>
                                                                <option value="video">Cinematic Video</option>
                                                            </select>
                                                        </div>

                                                        <div className="form-group">
                                                            <label>Upload Media File</label>
                                                            <input
                                                                type="file"
                                                                accept={editConfig.hero?.backgroundType === 'video' ? "video/mp4,video/webm" : "image/png, image/jpeg, image/jpg, image/webp"}
                                                                onChange={async (e) => {
                                                                    const file = e.target.files[0];
                                                                    if (!file) return;

                                                                    if (editConfig.hero?.backgroundType === 'video') {
                                                                        try {
                                                                            Swal.fire({ title: 'Uploading Video...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                                                                            const storagePath = `hero/${Date.now()}_${file.name}`;
                                                                            const { error } = await supabase.storage.from('hero-media').upload(storagePath, file);
                                                                            if (error) throw error;
                                                                            const { data: { publicUrl } } = supabase.storage.from('hero-media').getPublicUrl(storagePath);
                                                                            setEditConfig(prev => ({ ...prev, hero: { ...prev.hero, backgroundImage: publicUrl } }));
                                                                            Swal.fire('Uploaded!', 'Video background updated.', 'success');
                                                                        } catch (err) {
                                                                            Swal.fire('Error', 'Failed to upload video media.', 'error');
                                                                        }
                                                                    } else {
                                                                        handleImageUpload(e);
                                                                    }
                                                                }}
                                                            />
                                                            {editConfig.hero?.backgroundImage && (
                                                                <div style={{ marginTop: '0.5rem' }}>
                                                                    {editConfig.hero.backgroundType === 'video' ? (
                                                                        <video src={editConfig.hero.backgroundImage} muted loop autoPlay style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px' }} />
                                                                    ) : (
                                                                        <img src={editConfig.hero.backgroundImage} alt="Hero Preview" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px' }} />
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="form-group">
                                                            <label>Hero Subtitle</label>
                                                            <input value={editConfig.hero?.subtitle || ''} onChange={(e) => handleConfigChange(e, 'hero', 'subtitle')} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Date Text</label>
                                                            <input value={editConfig.hero?.dateText || ''} onChange={(e) => handleConfigChange(e, 'hero', 'dateText')} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Location Text</label>
                                                            <input value={editConfig.hero?.locationText || ''} onChange={(e) => handleConfigChange(e, 'hero', 'locationText')} />
                                                        </div>

                                                        <h4 style={{ margin: '1.5rem 0 1rem', color: '#3c8dbc', borderBottom: '1px solid #e9ecef', paddingBottom: '0.4rem' }}>
                                                            Event & Venue Details
                                                        </h4>
                                                        <div className="form-group">
                                                            <label>Day of Week</label>
                                                            <input value={editConfig.details?.ceremony?.dayOfWeek || ''} onChange={(e) => handleNestedConfigChange(e, 'details', 'ceremony', 'dayOfWeek')} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Full Date</label>
                                                            <input value={editConfig.details?.ceremony?.dateFull || ''} onChange={(e) => handleNestedConfigChange(e, 'details', 'ceremony', 'dateFull')} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Muhurtham / Ceremony Time</label>
                                                            <input value={editConfig.details?.ceremony?.muhurtham || ''} placeholder="e.g. 11:00 AM" onChange={(e) => handleNestedConfigChange(e, 'details', 'ceremony', 'muhurtham')} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Ceremony Label</label>
                                                            <input value={editConfig.details?.ceremony?.muhurthamLabel || ''} placeholder="e.g. Muhurtham, Nikkah, Ceremony Time" onChange={(e) => handleNestedConfigChange(e, 'details', 'ceremony', 'muhurthamLabel')} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Ceremony Start Time</label>
                                                            <input value={editConfig.details?.ceremony?.timeStart || ''} placeholder="e.g. 11:00 AM" onChange={(e) => handleNestedConfigChange(e, 'details', 'ceremony', 'timeStart')} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Time Notes</label>
                                                            <input value={editConfig.details?.ceremony?.timeNotes || ''} placeholder="e.g. Reception to follow" onChange={(e) => handleNestedConfigChange(e, 'details', 'ceremony', 'timeNotes')} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Venue Name</label>
                                                            <input value={editConfig.details?.venue?.name || ''} onChange={(e) => handleNestedConfigChange(e, 'details', 'venue', 'name')} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Venue Address</label>
                                                            <input value={editConfig.details?.venue?.address || ''} onChange={(e) => handleNestedConfigChange(e, 'details', 'venue', 'address')} />
                                                        </div>

                                                        <button
                                                            className="btn-card-action btn-card-config"
                                                            style={{ marginTop: '1.5rem', width: '100%', padding: '0.8rem' }}
                                                            onClick={handleSaveConfig}
                                                        >
                                                            Save Site Configuration
                                                        </button>

                                                        {clientSlug !== 'main' && (
                                                            <div style={{ marginTop: '2.5rem', padding: '1.25rem', border: '1px solid #dc3545', borderRadius: '8px', backgroundColor: '#fff5f5' }}>
                                                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#dc3545', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                    ⚠️ Danger Zone
                                                                </h4>
                                                                <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#6c757d' }}>
                                                                    Deleting client site <strong>[{clientSlug}]</strong> will permanently remove its configuration, gallery images, and guest RSVPs.
                                                                </p>
                                                                <button
                                                                    className="btn-card-action btn-card-delete"
                                                                    style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', width: 'auto' }}
                                                                    onClick={() => handleDeleteClient(clientSlug)}
                                                                >
                                                                    🗑️ Delete Client Site [{clientSlug}]
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Split Interactive Real-time Preview Panel */}
                                        {showSplitPreview && (
                                            <>
                                                <div
                                                    className="admin-splitter"
                                                    onMouseDown={() => setIsDragging(true)}
                                                    onTouchStart={() => setIsDragging(true)}
                                                >
                                                    <div className="splitter-handle"></div>
                                                </div>

                                                <div className="admin-preview-panel" style={{ width: `${100 - splitWidth}%` }}>
                                                    <div className="preview-card">
                                                        <h3>Real-Time Live Invitation Preview</h3>
                                                        <div className="preview-container-wrapper">
                                                            <div className="preview-scaling-container">
                                                                <ConfigContext.Provider value={{ config: editConfig, setConfig, clientSlug, setClientSlug }}>
                                                                    <MainSite isPreview={true} />
                                                                </ConfigContext.Provider>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Tab 2: RSVPs */}
                                {activeTab === 'rsvps' && (
                                    <div className="card-adminlte card-success">
                                        <div className="card-header-adminlte">
                                            <h3 className="card-title-adminlte">
                                                <span>💌</span> Guest Reservations ({rsvps.length})
                                            </h3>
                                            <button className="btn-card-action btn-card-config" onClick={handleExportRSVPs}>
                                                Export to Excel
                                            </button>
                                        </div>
                                        <div className="card-body-adminlte admin-table-container">
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>
                                                        <th style={{ padding: '0.8rem' }}>Client Site</th>
                                                        <th style={{ padding: '0.8rem' }}>Guest Name</th>
                                                        <th style={{ padding: '0.8rem' }}>Attending Status</th>
                                                        <th style={{ padding: '0.8rem' }}>Message</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rsvps.map(rsvp => (
                                                        <tr key={rsvp.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                                                            <td style={{ padding: '0.8rem' }}>
                                                                <span style={{
                                                                    background: '#e9ecef',
                                                                    padding: '0.25rem 0.6rem',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: '600'
                                                                }}>
                                                                    {rsvp.client_id || clientSlug || 'main'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '0.8rem', fontWeight: '600' }}>{rsvp.name}</td>
                                                            <td style={{ padding: '0.8rem' }}>
                                                                <span style={{
                                                                    background: rsvp.guests === '0' ? '#f8d7da' : '#d4edda',
                                                                    color: rsvp.guests === '0' ? '#721c24' : '#155724',
                                                                    padding: '0.3rem 0.6rem',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.85rem',
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    {rsvp.guests === '0' ? 'Declined' : `${rsvp.guests} Attending`}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '0.8rem', color: '#666' }}>{rsvp.message || '-'}</td>
                                                        </tr>
                                                    ))}
                                                    {rsvps.length === 0 && (
                                                        <tr>
                                                            <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                                                                No RSVPs submitted yet for this client.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Tab 3: Music Playlist */}
                                {activeTab === 'music' && (
                                    <div className="card-adminlte card-warning">
                                        <div className="card-header-adminlte">
                                            <h3 className="card-title-adminlte">
                                                <span>🎵</span> Background Music Playlist
                                            </h3>
                                        </div>
                                        <div className="card-body-adminlte">
                                            <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>Upload MP3 audio files to play seamlessly on the wedding site.</p>
                                            <input
                                                type="file"
                                                multiple
                                                accept="audio/mp3,audio/mpeg"
                                                onChange={async (e) => {
                                                    const files = Array.from(e.target.files);
                                                    if (files.length === 0) return;
                                                    try {
                                                        Swal.fire({ title: 'Uploading Music...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                                                        const newUrls = [];
                                                        for (const file of files) {
                                                            const storagePath = `playlist/${Date.now()}_${file.name}`;
                                                            const { error } = await supabase.storage.from('music').upload(storagePath, file);
                                                            if (error) throw error;
                                                            const { data: { publicUrl } } = supabase.storage.from('music').getPublicUrl(storagePath);
                                                            newUrls.push(publicUrl);
                                                        }
                                                        const updatedPlaylist = [...(editConfig.playlist || []), ...newUrls];
                                                        const newConfig = { ...editConfig, playlist: updatedPlaylist };
                                                        setEditConfig(newConfig);
                                                        await persistConfig(newConfig);
                                                        Swal.fire('Success!', `${files.length} song(s) added.`, 'success');
                                                    } catch (err) {
                                                        Swal.fire('Error', 'Failed to upload music.', 'error');
                                                    }
                                                }}
                                                id="music-file-input"
                                                style={{ display: 'none' }}
                                            />
                                            <button
                                                className="btn-card-action btn-card-config"
                                                onClick={() => document.getElementById('music-file-input').click()}
                                            >
                                                Upload MP3 Songs
                                            </button>

                                            <h4 style={{ marginTop: '1.5rem', marginBottom: '0.8rem' }}>Current Playlist</h4>
                                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                                {(editConfig.playlist || []).map((url, idx) => (
                                                    <li key={idx} style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span>{idx + 1}. {url.split('/').pop()}</span>
                                                        <button
                                                            style={{ border: 'none', background: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '1.1rem' }}
                                                            onClick={() => {
                                                                const newPlaylist = editConfig.playlist.filter((_, i) => i !== idx);
                                                                setEditConfig(prev => ({ ...prev, playlist: newPlaylist }));
                                                            }}
                                                        >
                                                            &times;
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Tab 4: Font Library */}
                                {activeTab === 'fonts' && (
                                    <div className="card-adminlte card-primary">
                                        <div className="card-header-adminlte">
                                            <h3 className="card-title-adminlte">
                                                <span>🔤</span> Font Library & Registration
                                            </h3>
                                        </div>
                                        <div className="card-body-adminlte admin-grid-2col">
                                            <div>
                                                <h4>Upload Font (.TTF / .WOFF / .ZIP)</h4>
                                                <input
                                                    type="file"
                                                    accept=".ttf,.otf,.woff,.woff2,.zip"
                                                    onChange={handleFontFileUpload}
                                                    id="font-file-input"
                                                    style={{ display: 'none' }}
                                                />
                                                <button
                                                    className="btn-card-action btn-card-config"
                                                    onClick={() => document.getElementById('font-file-input').click()}
                                                    style={{ marginTop: '0.8rem' }}
                                                >
                                                    Select Font File
                                                </button>
                                            </div>

                                            <div>
                                                <h4>Available Custom Fonts</h4>
                                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                                    {allFonts.map((f, i) => (
                                                        <li key={i} style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid #e9ecef' }}>
                                                            <strong style={{ fontFamily: f.family }}>{f.name}</strong> ({f.family})
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tab 5: Gallery Storage */}
                                {activeTab === 'gallery' && (
                                    <div className="card-adminlte card-info">
                                        <div className="card-header-adminlte">
                                            <h3 className="card-title-adminlte">
                                                <span>📷</span> Guest Photo Upload Storage
                                            </h3>
                                        </div>
                                        <div className="card-body-adminlte">
                                            <Gallery isAdmin={true} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Cropper Modal */}
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
                    <div className="cropper-controls">
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
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
