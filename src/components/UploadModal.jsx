import { useEffect } from 'react';
import Swal from 'sweetalert2';
import { supabase } from '../supabase';
import { useConfig } from '../context/ConfigContext';
// import './UploadModal.css';

const compressImage = (file, maxWidth = 1600, maxHeight = 1600, quality = 0.78) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to compressed JPEG data URL
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
    const { config, clientSlug } = useConfig();
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
                        // Step 1: Compress images client-side to prevent massive SQL payloads & statement timeouts
                        const compressedUrls = await Promise.all(
                            filesToUpload.map(file => compressImage(file))
                        );

                        const activeClientId = clientSlug || 'main';
                        const uploadedRecords = [];

                        // Step 2: Insert into Supabase 'images' table item by item (avoids giant single SQL transaction timeout)
                        for (const url of compressedUrls) {
                            let { data, error: insertError } = await supabase
                                .from('images')
                                .insert([{ url, client_id: activeClientId }])
                                .select();

                            // Fallback if client_id column does not exist in DB schema yet (PGRST204 or 42703)
                            if (insertError && (insertError.code === 'PGRST204' || insertError.code === '42703' || insertError.message?.includes('client_id') || insertError.message?.includes('does not exist'))) {
                                const fallbackRes = await supabase
                                    .from('images')
                                    .insert([{ url }])
                                    .select();
                                data = fallbackRes.data;
                                insertError = fallbackRes.error;
                            }

                            if (insertError) throw insertError;

                            if (data && data.length > 0) {
                                uploadedRecords.push({
                                    url: data[0].url,
                                    id: data[0].id
                                });
                            } else {
                                uploadedRecords.push({
                                    url,
                                    id: null
                                });
                            }
                        }

                        return uploadedRecords;
                    } catch (err) {
                        console.error('Upload Error:', err);
                        Swal.showValidationMessage(err.message || 'Failed to upload photos. Please try again.');
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
