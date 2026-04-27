import { useState, useEffect, useRef } from 'react';
import './Gallery.css';
import { useConfig } from '../context/ConfigContext';
import { supabase } from '../supabase';
import UploadModal from './UploadModal';
import Swal from 'sweetalert2';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { motion, AnimatePresence } from 'framer-motion';

gsap.registerPlugin(Draggable);

const Gallery = () => {
    const { config } = useConfig();
    const [modalOpen, setModalOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [images, setImages] = useState(() => config.images.map(src => ({ id: null, src })));
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('rotational'); // 'rotational' or 'grid'
    
    const containerRef = useRef(null);
    const itemsRef = useRef(null);
    const draggableRef = useRef(null);
    const [activeTouchIndex, setActiveTouchIndex] = useState(null);
    const touchStartPos = useRef({ x: 0, y: 0 });

    // Fetch dynamically uploaded images on mount
    useEffect(() => {
            const fetchImages = async () => {
                try {
                    const { data, error } = await supabase
                        .from('images')
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    const loadedImages = data.map(img => ({
                        id: img.id,
                        src: img.url
                    }));

                    const configImgs = config.images.map(src => ({ id: null, src }));
                    setImages([...configImgs, ...loadedImages]);
                } catch (err) {
                    console.error("Error fetching images from supabase", err);
                }
            };
            fetchImages();
    }, [config.allowGuestUploads, config.images]);

    // GSAP Rotational Logic
    useEffect(() => {
        // Only run if we are in rotational mode and have images
        if (viewMode !== 'rotational' || images.length === 0) {
            if (draggableRef.current) {
                draggableRef.current[0].kill();
                draggableRef.current = null;
            }
            return;
        }

        // Delay initialization until Framer Motion transition is complete (400ms + buffer)
        const timer = setTimeout(() => {
            if (!itemsRef.current) return;

            let ctx = gsap.context(() => {
                const items = gsap.utils.toArray('.gallery-item');
                const degree = 18; 
                const radius = 800;

                // Set initial container pivot
                gsap.set(itemsRef.current, {
                    transformOrigin: `center ${radius}px`,
                    rotation: 0 // Reset rotation to center
                });

                // Set individual item pivots
                items.forEach((item, index) => {
                    gsap.set(item, {
                        rotation: (index - (items.length - 1) / 2) * degree,
                        transformOrigin: `center ${radius}px`
                    });
                });

                // Re-initialize Draggable
                if (draggableRef.current) draggableRef.current[0].kill();
                
                draggableRef.current = Draggable.create(itemsRef.current, {
                    type: "rotation",
                    onDragEnd: function() {
                        const rotation = gsap.getProperty(this.target, "rotation");
                        const snapRotation = Math.round(rotation / degree) * degree;
                        gsap.to(this.target, { 
                            rotation: snapRotation, 
                            duration: 0.6,
                            ease: "power3.out"
                        });
                    }
                });
            }, containerRef);

            return () => ctx.revert();
        }, 500);

        return () => clearTimeout(timer);
    }, [images, viewMode]);

    const handleUploadSuccess = (newImages) => {
        if (Array.isArray(newImages)) {
            setImages(prev => [...prev, ...newImages]);
        } else {
            setImages(prev => [...prev, newImages]);
        }
    };

    const handleTouchStart = (e, index) => {
        touchStartPos.current = { 
            x: e.touches[0].clientX, 
            y: e.touches[0].clientY 
        };
        setActiveTouchIndex(index);
    };

    const handleTouchEnd = (e, index) => {
        const touchEnd = e.changedTouches[0];
        const dx = Math.abs(touchEnd.clientX - touchStartPos.current.x);
        const dy = Math.abs(touchEnd.clientY - touchStartPos.current.y);

        // If movement is minimal, treat as a click/tap
        if (dx < 10 && dy < 10) {
            // Prevent double firing if onClick also exists
            // but usually safe to just call openModal
            openModal(index);
        }
        
        // Reset active state after a short delay for visual feedback
        setTimeout(() => {
            setActiveTouchIndex(null);
        }, 1500);
    };

    const openModal = (index) => {
        setCurrentIndex(index);
        setModalOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setModalOpen(false);
        document.body.style.overflow = 'auto';
    };

    const nextImage = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleDelete = async (e, imageObj, index) => {
        e.stopPropagation();

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#810100',
            cancelButtonColor: '#630000',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            if (imageObj.id) {
                try {
                    const { error: deleteError } = await supabase
                        .from('images')
                        .delete()
                        .eq('id', imageObj.id);
                    if (deleteError) throw deleteError;
                    setImages(prev => prev.filter((_, i) => i !== index));
                    Swal.fire('Deleted!', 'Your photo has been deleted.', 'success');
                } catch (err) {
                    console.error('Delete error:', err);
                    Swal.fire('Error!', 'Something went wrong while deleting.', 'error');
                }
            } else {
                setImages(prev => prev.filter((_, i) => i !== index));
                Swal.fire('Removed!', 'Photo has been removed from view.', 'success');
            }
        }
    };

    return (
        <section className={`gallery-section section-container view-${viewMode}`} id="gallery" ref={containerRef}>
            <h2 className="section-title">Our Memories</h2>

            <div className="gallery-controls">
                <div className="view-toggle">
                    <button 
                        className={viewMode === 'rotational' ? 'active' : ''} 
                        onClick={() => setViewMode('rotational')}
                    >
                        Rotational
                    </button>
                    <button 
                        className={viewMode === 'grid' ? 'active' : ''} 
                        onClick={() => setViewMode('grid')}
                    >
                        Grid View
                    </button>
                </div>
                
                {config.allowGuestUploads && (
                    <button className="upload-trigger-btn" onClick={() => setUploadModalOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <PhotoCameraIcon fontSize="small" /> Upload Photo
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {viewMode === 'rotational' ? (
                    <motion.div 
                        key="rotational-view"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="gallery-viewport"
                    >
                        <div className="gallery-items-container" ref={itemsRef}>
                            {images.map((imgObj, index) => (
                                <div
                                    key={imgObj.id || `rotational-${index}`}
                                    className={`gallery-item ${activeTouchIndex === index ? 'touch-active' : ''}`}
                                    onClick={() => openModal(index)}
                                    onTouchStart={(e) => handleTouchStart(e, index)}
                                    onTouchEnd={(e) => handleTouchEnd(e, index)}
                                >
                                    <div className="item-inner">
                                        <button
                                            className="delete-image-btn"
                                            onClick={(e) => handleDelete(e, imgObj, index)}
                                            onTouchEnd={(e) => e.stopPropagation()} // Prevent modal from opening when deleting
                                            title="Delete Photo"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </button>
                                        <img src={imgObj.src} alt="Couple photo" loading="lazy" />
                                        <div className="gallery-overlay">
                                            <span>View</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="grid-view"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="gallery-grid"
                    >
                        {images.map((imgObj, index) => (
                            <div
                                key={imgObj.id || `grid-${index}`}
                                className={`gallery-item ${activeTouchIndex === index ? 'touch-active' : ''}`}
                                onClick={() => openModal(index)}
                                onTouchStart={(e) => handleTouchStart(e, index)}
                                onTouchEnd={(e) => handleTouchEnd(e, index)}
                            >
                                <div className="item-inner">
                                    <button
                                        className="delete-image-btn"
                                        onClick={(e) => handleDelete(e, imgObj, index)}
                                        onTouchEnd={(e) => e.stopPropagation()}
                                        title="Delete Photo"
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </button>
                                    <img src={imgObj.src} alt="Couple photo" loading="lazy" />
                                    <div className="gallery-overlay">
                                        <span>View</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {modalOpen && (
                <div className="modal-backdrop" onClick={closeModal}>
                    <button className="modal-close" onClick={closeModal}>&times;</button>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="nav-btn prev" onClick={prevImage}>&#10094;</button>
                        <img
                            src={images[currentIndex]?.src}
                            alt="Enlarged couple view"
                            className="modal-img fade-in"
                            key={currentIndex}
                        />
                        <button className="nav-btn next" onClick={nextImage}>&#10095;</button>
                    </div>
                </div>
            )}

            <UploadModal
                isOpen={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                onUploadSuccess={handleUploadSuccess}
            />
        </section>
    );
};

export default Gallery;
