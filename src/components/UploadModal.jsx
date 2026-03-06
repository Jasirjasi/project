import { useEffect } from 'react';
import Swal from 'sweetalert2';
import config from '../config';
// import './UploadModal.css';

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
    useEffect(() => {
        if (!isOpen) return;

        const openUploadDialog = async () => {
            const { value: file } = await Swal.fire({
                title: 'Upload a Memory',
                text: 'Share photos you took at our wedding!',
                input: 'file',
                inputAttributes: {
                    'accept': 'image/png, image/jpeg, image/jpg, image/webp',
                    'aria-label': 'Upload your family photo'
                },
                showCancelButton: true,
                confirmButtonText: 'Upload Photo',
                showLoaderOnConfirm: true,
                customClass: {
                    input: 'swal2-custom-file-input',
                    popup: 'swal2-custom-popup',
                    confirmButton: 'swal2-custom-confirm-btn',
                    cancelButton: 'swal2-custom-cancel-btn'
                },
                preConfirm: async (selectedFile) => {
                    if (!selectedFile) {
                        Swal.showValidationMessage('Please select a photo to upload.');
                        return false;
                    }

                    const formData = new FormData();
                    formData.append('image', selectedFile);

                    try {
                        const response = await fetch(`${config.apiUrl}/upload`, {
                            method: 'POST',
                            body: formData,
                        });

                        if (!response.ok) throw new Error('Upload failed');
                        return await response.json();
                    } catch (err) {
                        console.error(err);
                        Swal.showValidationMessage('Failed to upload photo. Please try again.');
                    }
                },
                allowOutsideClick: () => !Swal.isLoading()
            });

            if (file && file.url) {
                Swal.fire({
                    title: 'Success!',
                    text: 'Photo uploaded successfully!',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                onUploadSuccess(file.url);
            }

            // Close the React state for modal open regardless
            onClose();
        };

        openUploadDialog();
    }, [isOpen, onClose, onUploadSuccess]);

    return null; // The UI is fully handled by SweetAlert now
};

export default UploadModal;
