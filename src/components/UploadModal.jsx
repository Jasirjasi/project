import { useEffect } from 'react';
import Swal from 'sweetalert2';
import { supabase } from '../supabase';
import { useConfig } from '../context/ConfigContext';
// import './UploadModal.css';

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
    const { config } = useConfig();
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

                    try {
                        // Convert file to base64
                        const base64String = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.readAsDataURL(selectedFile);
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = error => reject(error);
                        });

                        // Store base64 in Supabase 'images' table
                        const { data, error: insertError } = await supabase
                            .from('images')
                            .insert([{ url: base64String }])
                            .select();

                        if (insertError) throw insertError;

                        return { url: base64String, id: data[0].id };
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
                onUploadSuccess({ id: file.id, src: file.url });
            }

            // Close the React state for modal open regardless
            onClose();
        };

        openUploadDialog();
    }, [isOpen, onClose, onUploadSuccess]);

    return null; // The UI is fully handled by SweetAlert now
};

export default UploadModal;
