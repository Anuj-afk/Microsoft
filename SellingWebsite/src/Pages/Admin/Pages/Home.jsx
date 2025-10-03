import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { API_ENDPOINTS } from '../../../config/api.js';
import PermissionGuard from '../../../components/PermissionGuard';

const AdminHome = () => {
    const [page, setPage] = useState({
        title: 'Home',
        slug: 'home',
        metaTitle: '',
        metaDescription: '',
        status: 'published',
        featuredImage: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [mediaModalOpen, setMediaModalOpen] = useState(false);
    const [mediaFiles, setMediaFiles] = useState([]);
    const [loadingMedia, setLoadingMedia] = useState(false);

    useEffect(() => {
        fetchHomePage();
    }, []);

    const fetchHomePage = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await api.get(API_ENDPOINTS.PAGES.HOME);
            
            if (response.data) {
                // Handle different response structures
                const pageData = response.data.page || response.data;
                setPage(pageData);
            }
        } catch (err) {
            console.error('Error fetching home page:', err);
            setError(err.response?.data?.message || 'Failed to load home page data. Please try again.');
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPage({ ...page, [name]: value });
    };

    const handleOpenMediaModal = () => {
        fetchMediaFiles();
        setMediaModalOpen(true);
    };

    const handleSelectImage = (imageUrl) => {
        setPage({
            ...page,
            featuredImage: imageUrl
        });
        setMediaModalOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccessMessage('');

        try {
            const response = await api.post(API_ENDPOINTS.PAGES.HOME, page);
            
            if (response.data) {
                setSuccessMessage('Home page updated successfully');
                // Update local state with response data if available
                const updatedData = response.data.page || response.data;
                if (updatedData && typeof updatedData === 'object') {
                    setPage(updatedData);
                }
                
                // Clear success message after 3 seconds
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            console.error('Error saving home page:', err);
            setError(err.response?.data?.message || 'Failed to update home page. Please try again.');
            // Clear error message after 5 seconds
            setTimeout(() => setError(''), 5000);
        } finally {
            setSaving(false);
        }
    };

    const handleRefresh = () => {
        fetchHomePage();
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mr-3"></div>
                <span className="text-gray-600">Loading home page data...</span>
            </div>
        );
    }

    return (
        <PermissionGuard permission="manage_pages">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800">Edit Home Page</h1>
                        <p className="text-gray-600 mt-1">Manage your homepage content and SEO settings</p>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={handleRefresh}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Refresh
                        </button>
                        <Link
                            to="/admin/pages/home/banner"
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                            Banner Settings
                        </Link>
                    </div>
                </div>

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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            {/* Page title */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Page Title
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={page.title}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Enter page title"
                                />
                            </div>

                            {/* Meta information */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border">
                                <h2 className="text-lg font-medium mb-4 text-gray-800">SEO Settings</h2>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Meta Title
                                        </label>
                                        <input
                                            type="text"
                                            name="metaTitle"
                                            value={page.metaTitle}
                                            onChange={handleChange}
                                            placeholder="Leave blank to use page title"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Recommended length: 50-60 characters
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Meta Description
                                        </label>
                                        <textarea
                                            name="metaDescription"
                                            value={page.metaDescription}
                                            onChange={handleChange}
                                            rows="3"
                                            placeholder="Enter a brief description for search engines"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        ></textarea>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Recommended length: 150-160 characters ({page.metaDescription.length}/160)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Page settings */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border">
                                <h2 className="text-lg font-medium mb-4 text-gray-800">Page Settings</h2>
                                
                                {/* URL Slug */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        URL Slug
                                    </label>
                                    <input
                                        type="text"
                                        name="slug"
                                        value={page.slug}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Typically should remain "home" for the homepage
                                    </p>
                                </div>

                                {/* Status */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={page.status}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                    </select>
                                </div>

                                {/* Featured Image */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Featured Image
                                    </label>
                                    {page.featuredImage ? (
                                        <div className="mb-2">
                                            <img 
                                                src={page.featuredImage} 
                                                alt="Featured" 
                                                className="h-32 w-full object-cover rounded-md border"
                                                onError={(e) => {
                                                    e.target.src = '/placeholder-image.jpg';
                                                    e.target.alt = 'Image not found';
                                                }}
                                            />
                                            <div className="mt-2 flex space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={handleOpenMediaModal}
                                                    className="text-sm text-purple-600 hover:text-purple-800"
                                                >
                                                    Change Image
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPage({...page, featuredImage: ''})}
                                                    className="text-sm text-red-600 hover:text-red-800"
                                                >
                                                    Remove Image
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleOpenMediaModal}
                                            className="w-full px-3 py-8 border border-dashed border-gray-300 rounded-md text-gray-600 hover:text-gray-800 hover:border-purple-400 transition-colors flex flex-col items-center"
                                        >
                                            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Select Featured Image
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit button */}
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
                                'Update Home Page'
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
                                <h3 className="text-lg font-medium text-gray-800">Select Featured Image</h3>
                                <button
                                    onClick={() => setMediaModalOpen(false)}
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
                                                    Upload images in the Media Library to use them as featured images
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
                                        onClick={() => setMediaModalOpen(false)}
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

export default AdminHome;