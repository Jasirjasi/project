import { useState, useEffect } from 'react';
import './Gallery.css';
import { useConfig } from '../context/ConfigContext';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import UploadModal from './UploadModal';
import Swal from 'sweetalert2';

const Gallery = () => {
    const { config } = useConfig();
    const [modalOpen, setModalOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [images, setImages] = useState(() => config.images.map(src => ({ id: null, src }))); // Use images from config as objects
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    // Fetch dynamically uploaded images on mount
    useEffect(() => {
        if (config.allowGuestUploads) {
            const fetchImages = async () => {
                try {
                    const q = query(collection(db, 'images'), orderBy('createdAt', 'desc'));
                    const querySnapshot = await getDocs(q);
                    const loadedImages = querySnapshot.docs.map(docSnap => ({
                        id: docSnap.id,
                        src: docSnap.data().url
                    }));

                    const configImgs = config.images.map(src => ({ id: null, src }));
                    setImages([...configImgs, ...loadedImages]);
                } catch (err) {
                    console.error("Error fetching images from firestore", err);
                }
            };
            fetchImages();
        }
    }, [config.allowGuestUploads, config.images]);

    const handleUploadSuccess = (newImageObj) => {
        setImages(prev => [...prev, newImageObj]);
    };

    const openModal = (index) => {
        setCurrentIndex(index);
        setModalOpen(true);
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
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
        e.stopPropagation(); // prevent modal from opening

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            // Check if it's an uploaded image dynamically served from Firestore
            if (imageObj.id) {
                try {
                    await deleteDoc(doc(db, 'images', imageObj.id));
                    setImages(prev => prev.filter((_, i) => i !== index));
                    Swal.fire(
                        'Deleted!',
                        'Your photo has been deleted.',
                        'success'
                    );
                } catch (err) {
                    console.error('Delete error:', err);
                    Swal.fire('Error!', 'Something went wrong while deleting.', 'error');
                }
            } else {
                // If it's a default config image, just remove from UI
                setImages(prev => prev.filter((_, i) => i !== index));
                Swal.fire(
                    'Removed!',
                    'Photo has been removed from view.',
                    'success'
                );
            }
        }
    };

    return (
        <section className="gallery-section section-container" id="gallery">
            <h2 className="section-title">Our Memories</h2>

            {config.allowGuestUploads && (
                <div className="gallery-actions">
                    <button className="upload-trigger-btn" onClick={() => setUploadModalOpen(true)}>
                        <i className="fa-solid fa-camera"></i> Upload Photo
                    </button>
                </div>
            )}

            <div className="gallery-grid">
                {images.map((imgObj, index) => (
                    <div
                        key={imgObj.id || index}
                        className="gallery-item"
                        onClick={() => openModal(index)}
                    >
                        <img src={imgObj.src} alt="Couple photo" loading="lazy" />
                        <div className="gallery-overlay">
                            <span>View</span>
                        </div>
                        <button
                            className="delete-image-btn"
                            onClick={(e) => handleDelete(e, imgObj, index)}
                            title="Delete Photo"
                        >
                            <i className="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                ))}
            </div>

            {modalOpen && (
                <div className="modal-backdrop" onClick={closeModal}>
                    <button className="modal-close" onClick={closeModal}>&times;</button>

                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="nav-btn prev" onClick={prevImage}>&#10094;</button>
                        <img
                            src={images[currentIndex]?.src}
                            alt="Enlarged couple view"
                            className="modal-img fade-in"
                            key={currentIndex} /* Key change forces re-render for animation */
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
