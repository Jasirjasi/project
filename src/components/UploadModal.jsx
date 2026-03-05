import { useState } from 'react';
import './UploadModal.css';

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setMessage('');
            setError(false);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage('Please select a photo to upload.');
            setError(true);
            return;
        }

        setUploading(true);
        setMessage('');

        const formData = new FormData();
        formData.append('image', file);

        try {
            // Send request to our local local dev server running on 3001
            const response = await fetch('http://localhost:3001/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();

            setMessage('Photo uploaded successfully!');
            setError(false);
            setFile(null);

            // Wait a moment then close and notify parent
            setTimeout(() => {
                onUploadSuccess(data.url);
                onClose();
            }, 1500);

        } catch (err) {
            console.error(err);
            setMessage('Failed to upload photo. Please try again.');
            setError(true);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="upload-modal-overlay" onClick={onClose}>
            <div className="upload-modal-content" onClick={e => e.stopPropagation()}>
                <button className="upload-modal-close" onClick={onClose}>&times;</button>
                <h3>Upload a Memory</h3>
                <p>Share photos you took at our wedding!</p>

                <div className="file-input-wrapper">
                    <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                </div>

                <button
                    className="upload-btn"
                    onClick={handleUpload}
                    disabled={!file || uploading}
                >
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                </button>

                {message && (
                    <div className={`upload-message ${error ? 'error' : 'success'}`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadModal;
