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
            const { value: fileResults } = await Swal.fire({
                title: 'Upload a Memory',
                text: 'Share photos you took at our wedding!',
                input: 'file',
                inputAttributes: {
                    'accept': 'image/png, image/jpeg, image/jpg, image/webp',
                    'aria-label': 'Upload your family photos',
                    'multiple': 'multiple'
                },
                showCancelButton: true,
                confirmButtonText: 'Upload Photos',
                showLoaderOnConfirm: true,
                customClass: {
                    input: 'swal2-custom-file-input',
                    popup: 'swal2-custom-popup',
                    confirmButton: 'swal2-custom-confirm-btn',
                    cancelButton: 'swal2-custom-cancel-btn'
                },
                preConfirm: async (selectedFiles) => {
                    if (!selectedFiles || (selectedFiles instanceof FileList && selectedFiles.length === 0)) {
                        Swal.showValidationMessage('Please select at least one photo to upload.');
                        return false;
                    }

                    // Ensure selectedFiles is an array/iterable
                    const filesToUpload = selectedFiles instanceof FileList ? Array.from(selectedFiles) : [selectedFiles];

                    try {
                        const uploadPromises = filesToUpload.map(async (file) => {
                            // Convert file to base64
                            const base64String = await new Promise((resolve, reject) => {
                                const reader = new FileReader();
                                reader.readAsDataURL(file);
                                reader.onload = () => resolve(reader.result);
                                reader.onerror = error => reject(error);
                            });
                            return base64String;
                        });

                        const base64Strings = await Promise.all(uploadPromises);

                        // Batch store in Supabase 'images' table
                        const { data, error: insertError } = await supabase
                            .from('images')
                            .insert(base64Strings.map(url => ({ url })))
                            .select();

                        if (insertError) throw insertError;

                        return data.map((row, index) => ({
                            url: row.url,
                            id: row.id
                        }));
                    } catch (err) {
                        console.error(err);
                        Swal.showValidationMessage('Failed to upload photos. Please try again.');
                    }
                },
                allowOutsideClick: () => !Swal.isLoading()
            });

            if (fileResults && fileResults.length > 0) {
                Swal.fire({
                    title: 'Success!',
                    text: `${fileResults.length} photo(s) uploaded successfully!`,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                onUploadSuccess(fileResults.map(f => ({ id: f.id, src: f.url })));
            }

            // Close the React state for modal open regardless
            onClose();
        };

        openUploadDialog();
    }, [isOpen, onClose, onUploadSuccess]);

    return null; // The UI is fully handled by SweetAlert now
};

export default UploadModal;
