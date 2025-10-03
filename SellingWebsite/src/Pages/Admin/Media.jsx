import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PermissionGuard from '../../components/PermissionGuard';

const MediaLibrary = () => {
    const [mediaFiles, setMediaFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [deletingFile, setDeletingFile] = useState(null);

    useEffect(() => {
        fetchMediaFiles();
    }, []);

    const fetchMediaFiles = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/media');
            setMediaFiles(response.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to load media files');
            setLoading(false);
        }
    };

    const handleDelete = async (fileId, fileName) => {
        if (!window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            setDeletingFile(fileId);
            await axios.delete(`http://localhost:3000/api/media/${fileId}`);
            
            // Remove the file from the local state
            setMediaFiles(prevFiles => prevFiles.filter(file => file._id !== fileId));
            setSuccessMessage('Media file deleted successfully');
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error('Delete error:', err);
            setError(err.response?.data?.error || 'Failed to delete media file');
            setTimeout(() => setError(''), 5000);
        } finally {
            setDeletingFile(null);
        }
    };

    const copyToClipboard = async (url) => {
        try {
            await navigator.clipboard.writeText(url);
            setSuccessMessage('URL copied to clipboard');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error('Copy failed:', err);
            setError('Failed to copy URL');
            setTimeout(() => setError(''), 3000);
        }
    };

    if (loading) return <div className="p-6 flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>;

    return (
        <PermissionGuard permission={['manage_media']}>
            <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Media Library</h1>
                <Link
                    to="/admin/media/upload"
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                    Upload New
                </Link>
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
                    <p>{error}</p>
                </div>
            )}
            
            {successMessage && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
                    <p>{successMessage}</p>
                </div>
            )}

            {mediaFiles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg font-medium">No media files found</p>
                    <p className="text-sm">Upload some files to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {mediaFiles.map((file) => (
                        <div key={file._id} className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow group">
                            <div className="relative">
                                <img
                                    src={file.awsUrl || file.url}
                                    alt={file.title || file.fileName}
                                    className="w-full h-48 object-cover"
                                    loading="lazy"
                                />
                                {file.fileType === 'image/logo' && (
                                    <span className="absolute top-2 left-2 px-2 py-1 bg-purple-600 text-white text-xs rounded">
                                        Logo
                                    </span>
                                )}
                                
                                {/* Delete button */}
                                <button
                                    onClick={() => handleDelete(file._id, file.title || file.fileName)}
                                    disabled={deletingFile === file._id}
                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                    title="Delete file"
                                >
                                    {deletingFile === file._id ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <div className="p-4">
                                <h3 className="font-medium truncate mb-2" title={file.title || file.fileName}>
                                    {file.title || file.fileName}
                                </h3>
                                <div className="space-y-1 text-sm text-gray-500 mb-3">
                                    <p>Size: {file.fileSize ? (file.fileSize / 1024).toFixed(2) + ' KB' : 'Unknown'}</p>
                                    <p>Type: {file.fileType || 'Unknown'}</p>
                                    <p>Uploaded: {new Date(file.createdAt || file.uploadDate).toLocaleDateString()}</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <button
                                        onClick={() => copyToClipboard(file.awsUrl || file.url)}
                                        className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors duration-200"
                                    >
                                        Copy URL
                                    </button>
                                    
                                    <a
                                        href={file.awsUrl || file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm text-center transition-colors duration-200"
                                    >
                                        View File
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            </div>
        </PermissionGuard>
    );
};

const MediaUpload = () => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files));
        setError(null);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (files.length === 0) {
            setError('Please select files to upload');
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file); // Make sure this field name matches the backend
        });

        try {
            await axios.post('http://localhost:3000/api/media/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            setFiles([]);
            // Redirect to library after successful upload
            window.location.href = '/admin/media/library';
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <PermissionGuard permission={['manage_media']}>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">Upload Media</h1>
                    <Link
                        to="/admin/media/library"
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Back to Library
                    </Link>
                </div>

                <form onSubmit={handleUpload} className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="media-upload"
                        />
                        <label
                            htmlFor="media-upload"
                            className="cursor-pointer flex flex-col items-center justify-center"
                        >
                            <div className="text-gray-500 text-center">
                                <p>Drop your files here or click to upload</p>
                                <p className="text-sm">PNG, JPG up to 5MB</p>
                            </div>
                        </label>
                    </div>

                    {files.length > 0 && (
                        <div className="mt-4">
                            <h3 className="font-medium mb-2">Selected Files:</h3>
                            <ul className="space-y-1">
                                {files.map((file, index) => (
                                    <li key={index} className="text-sm text-gray-600">
                                        {file.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {error && (
                        <div className="text-red-500 text-sm">{error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={files.length === 0 || uploading}
                        className={`px-4 py-2 rounded-md text-white ${
                            files.length === 0 || uploading
                                ? 'bg-gray-400'
                                : 'bg-purple-600 hover:bg-purple-700'
                        } transition-colors`}
                    >
                        {uploading ? 'Uploading...' : 'Upload Files'}
                    </button>
                </form>
            </div>
        </PermissionGuard>
    );
};

const Media = {
    Library: MediaLibrary,
    Upload: MediaUpload
};

export default Media;