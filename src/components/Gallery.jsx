import { useState, useEffect } from 'react';
import './Gallery.css';
import config from '../config';
import UploadModal from './UploadModal';

const Gallery = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [images, setImages] = useState(config.images); // Use images from config
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    // Fetch dynamically uploaded images on mount
    useEffect(() => {
        if (config.allowGuestUploads) {
            fetch('http://localhost:3001/api/images')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setImages([...config.images, ...data]);
                    }
                })
                .catch(console.error);
        }
    }, []);

    const handleUploadSuccess = (newImageUrl) => {
        setImages(prev => [...prev, newImageUrl]);
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
                {images.map((src, index) => (
                    <div
                        key={index}
                        className="gallery-item"
                        onClick={() => openModal(index)}
                    >
                        <img src={src} alt="Couple photo" loading="lazy" />
                        <div className="gallery-overlay">
                            <span>View</span>
                        </div>
                    </div>
                ))}
            </div>

            {modalOpen && (
                <div className="modal-backdrop" onClick={closeModal}>
                    <button className="modal-close" onClick={closeModal}>&times;</button>

                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="nav-btn prev" onClick={prevImage}>&#10094;</button>
                        <img
                            src={images[currentIndex]}
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
