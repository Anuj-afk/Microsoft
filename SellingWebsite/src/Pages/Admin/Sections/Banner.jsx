import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { API_ENDPOINTS } from '../../../config/api.js';
import PermissionGuard from '../../../components/PermissionGuard';

const Banner = () => {
    const [settings, setSettings] = useState({
        slidingImages: ['', '', '', '', ''],
        staticImage: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [mediaModalOpen, setMediaModalOpen] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(null);
    const [mediaFiles, setMediaFiles] = useState([]);
    const [loadingMedia, setLoadingMedia] = useState(false);

    useEffect(() => {
        fetchBannerSettings();
    }, []);

    const fetchBannerSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await api.get(API_ENDPOINTS.SETTINGS.BANNER);
            
            if (response.data) {
                // Handle different response structures
                const receivedData = response.data.settings || response.data;
                
                // Ensure slidingImages is an array with at least 5 slots
                if (!receivedData.slidingImages || !Array.isArray(receivedData.slidingImages)) {
                    receivedData.slidingImages = ['', '', '', '', ''];
                } else if (receivedData.slidingImages.length < 5) {
                    // Pad the array with empty strings if it has fewer than 5 items
                    while (receivedData.slidingImages.length < 5) {
                        receivedData.slidingImages.push('');
                    }
                }
                setSettings(receivedData);
            }
        } catch (err) {
            console.error('Error fetching banner settings:', err);
            setError(err.response?.data?.message || 'Failed to load banner settings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchMediaFiles = async () => {
        try {
            setLoadingMedia(true);
            const response = await api.get(API_ENDPOINTS.MEDIA.BASE);
            
            // Handle different response structures for media
            let mediaData = [];
            if (Array.isArray(response.data)) {
                mediaData = response.data;
            } else if (response.data && Array.isArray(response.data.media)) {
                mediaData = response.data.media;
            } else if (response.data && Array.isArray(response.data.data)) {
                mediaData = response.data.data;
            }
            
            setMediaFiles(mediaData);
        } catch (err) {
            console.error('Error fetching media:', err);
            setMediaFiles([]);
        } finally {
            setLoadingMedia(false);
        }
    };

    const handleOpenMediaModal = (index) => {
        setActiveImageIndex(index);
        fetchMediaFiles();
        setMediaModalOpen(true);
    };

    const handleSelectImage = (imageUrl) => {
        if (activeImageIndex === 'static') {
            setSettings({
                ...settings,
                staticImage: imageUrl
            });
        } else if (activeImageIndex !== null && Number.isInteger(activeImageIndex)) {
            // Create a deep copy of the slidingImages array
            const newSlidingImages = [...settings.slidingImages];
            // Update the selected index with the new image URL
            newSlidingImages[activeImageIndex] = imageUrl;
            
            setSettings({
                ...settings,
                slidingImages: newSlidingImages
            });
        }
        setMediaModalOpen(false);
        setActiveImageIndex(null);
    };

    const handleRemoveImage = (index) => {
        if (index === 'static') {
            setSettings({
                ...settings,
                staticImage: ''
            });
        } else if (Number.isInteger(index)) {
            const newSlidingImages = [...settings.slidingImages];
            newSlidingImages[index] = '';
            
            setSettings({
                ...settings,
                slidingImages: newSlidingImages
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccessMessage('');

        try {
            // Filter out empty strings before sending to server
            const settingsToSave = {
                ...settings,
                slidingImages: settings.slidingImages.filter(url => url !== '')
            };
            
            // If array is empty after filtering, send an empty array to avoid issues
            if (settingsToSave.slidingImages.length === 0) {
                settingsToSave.slidingImages = [];
            }
            
            console.log("Saving settings:", settingsToSave);
            
            const response = await api.post(API_ENDPOINTS.SETTINGS.BANNER, settingsToSave);
            
            if (response.data) {
                setSuccessMessage('Banner settings saved successfully');
                // Update the local state with the response data if available
                const updatedData = response.data.settings || response.data;
                if (updatedData && typeof updatedData === 'object') {
                    // Ensure we maintain the 5-slot array structure
                    if (updatedData.slidingImages && Array.isArray(updatedData.slidingImages)) {
                        while (updatedData.slidingImages.length < 5) {
                            updatedData.slidingImages.push('');
                        }
                    }
                    setSettings(updatedData);
                }
                
                // Clear success message after 3 seconds
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            console.error('Error saving banner settings:', err);
            setError(err.response?.data?.message || 'Failed to save banner settings. Please try again.');
            // Clear error message after 5 seconds
            setTimeout(() => setError(''), 5000);
        } finally {
            setSaving(false);
        }
    };

    const handleRefresh = () => {
        fetchBannerSettings();
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mr-3"></div>
                <span className="text-gray-600">Loading banner settings...</span>
            </div>
        );
    }

    return (
        <PermissionGuard permission="manage_pages">
            <div className="p-6 max-w-7xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800">Banner Settings</h1>
                        <p className="text-gray-600 mt-1">Configure the banner images for your homepage</p>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={handleRefresh}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Refresh
                        </button>
                        <Link
                            to="/admin/pages"
                            className="text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            ← Back to Pages
                        </Link>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center justify-between">
                        <span>{error}</span>
                        <button
                            onClick={() => setError('')}
                            className="text-red-500 hover:text-red-700"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Success Message */}
                {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 flex items-center justify-between">
                        <span>{successMessage}</span>
                        <button
                            onClick={() => setSuccessMessage('')}
                            className="text-green-500 hover:text-green-700"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Sliding Images Section */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-800">Sliding Images</h2>
                            <span className="text-sm text-gray-500">
                                {settings.slidingImages.filter(img => img).length}/5 images
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            These images will rotate in the banner section. Recommended size: 1200x400px for best results.
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            {settings.slidingImages.map((image, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-3 hover:border-purple-300 transition-colors">
                                    <div className="h-32 bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden relative">
                                        {image ? (
                                            <div className="relative w-full h-full group">
                                                <img 
                                                    src={image} 
                                                    alt={`Slide ${index + 1}`} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.src = '/placeholder-image.jpg';
                                                        e.target.alt = 'Image not found';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                                                    <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenMediaModal(index)}
                                                            className="bg-purple-600 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center hover:bg-purple-700"
                                                            title="Change image"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveImage(index)}
                                                            className="bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center hover:bg-red-600"
                                                            title="Remove image"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleOpenMediaModal(index)}
                                                className="text-gray-400 hover:text-purple-600 transition-colors flex flex-col items-center justify-center p-4"
                                                title="Add image"
                                            >
                                                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                                                </svg>
                                                <span className="text-xs">Add Image</span>
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-center text-sm text-gray-600 font-medium">
                                        Slide {index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Static Image Section */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-medium text-gray-800 mb-4">Static Image</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            This image will appear as a fixed banner element. Recommended size: 1200x400px.
                        </p>
                        
                        <div className="w-full max-w-md mx-auto">
                            <div className="h-48 bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden relative">
                                {settings.staticImage ? (
                                    <div className="relative w-full h-full group">
                                        <img 
                                            src={settings.staticImage} 
                                            alt="Static banner" 
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.src = '/placeholder-image.jpg';
                                                e.target.alt = 'Image not found';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                                            <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenMediaModal('static')}
                                                    className="bg-purple-600 text-white rounded-full p-2 w-8 h-8 flex items-center justify-center hover:bg-purple-700"
                                                    title="Change image"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage('static')}
                                                    className="bg-red-500 text-white rounded-full p-2 w-8 h-8 flex items-center justify-center hover:bg-red-600"
                                                    title="Remove image"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleOpenMediaModal('static')}
                                        className="text-gray-400 hover:text-purple-600 transition-colors flex flex-col items-center justify-center p-8"
                                        title="Add static image"
                                    >
                                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="text-sm">Add Static Image</span>
                                    </button>
                                )}
                            </div>
                            <div className="text-center text-sm text-gray-600 font-medium">
                                Static Image
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={loading}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Reset Changes
                        </button>
                        <button
                            type="submit"
                            disabled={saving || loading}
                            className={`px-6 py-2 rounded-md transition-colors font-medium ${
                                saving || loading
                                    ? 'bg-purple-400 cursor-not-allowed text-white'
                                    : 'bg-purple-600 text-white hover:bg-purple-700'
                            }`}
                        >
                            {saving ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </span>
                            ) : (
                                'Save Banner Settings'
                            )}
                        </button>
                    </div>
                </form>

                {/* Media Selection Modal */}
                {mediaModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-6 border-b">
                                <h3 className="text-lg font-medium text-gray-800">
                                    {activeImageIndex === 'static' 
                                        ? 'Select Static Image' 
                                        : `Select Image for Slide ${activeImageIndex + 1}`}
                                </h3>
                                <button
                                    onClick={() => {
                                        setMediaModalOpen(false);
                                        setActiveImageIndex(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {loadingMedia ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mr-3"></div>
                                        <span className="text-gray-600">Loading media...</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {mediaFiles.map((file) => (
                                            <div 
                                                key={file._id} 
                                                className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-purple-500 hover:shadow-md transition-all group"
                                                onClick={() => handleSelectImage(file.awsUrl || file.url)}
                                            >
                                                <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                                                    <img
                                                        src={file.awsUrl || file.url}
                                                        alt={file.title || file.fileName || 'Media image'}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                        onError={(e) => {
                                                            e.target.src = '/placeholder-image.jpg';
                                                            e.target.alt = 'Image not found';
                                                        }}
                                                    />
                                                </div>
                                                <div className="p-2">
                                                    <p className="text-xs text-gray-600 truncate" title={file.title || file.fileName}>
                                                        {file.title || file.fileName || 'Untitled'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}

                                        {mediaFiles.length === 0 && (
                                            <div className="col-span-full text-center py-12">
                                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <h3 className="text-lg font-medium text-gray-900 mb-2">No media files found</h3>
                                                <p className="text-gray-600 mb-4">
                                                    Upload images in the Media Library to use them in banners
                                                </p>
                                                <Link
                                                    to="/admin/media"
                                                    target="_blank"
                                                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    Go to Media Library
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="border-t p-6 bg-gray-50 flex justify-between items-center">
                                <div className="text-sm text-gray-600">
                                    {mediaFiles.length > 0 && `${mediaFiles.length} images available`}
                                </div>
                                <div className="flex space-x-4">
                                    <Link
                                        to="/admin/media"
                                        target="_blank"
                                        className="text-purple-600 hover:text-purple-800 transition-colors"
                                    >
                                        Media Library
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setMediaModalOpen(false);
                                            setActiveImageIndex(null);
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PermissionGuard>
    );
};

export default Banner;