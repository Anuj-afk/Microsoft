import { useState, useEffect } from 'react';
import axios from 'axios';
import PermissionGuard from '../../components/PermissionGuard';

const Logo = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [currentLogo, setCurrentLogo] = useState(null);

    // Get current logo on component mount
    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/media/logo');
                setCurrentLogo(response.data.logoUrl);
            } catch (err) {
                console.error('Error fetching logo:', err);
            }
        };
        fetchLogo();
    }, []);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError(null);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file');
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:3000/api/media/logo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setCurrentLogo(response.data.fileUrl);
            setFile(null);
            setPreview(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <PermissionGuard permission={['manage_media']}>
            <div className="p-6">
                <h1 className="text-2xl font-semibold mb-6">Logo Management</h1>
                
                {/* Current Logo Display */}
                {currentLogo && (
                    <div className="mb-8">
                        <h2 className="text-lg font-medium mb-4">Current Logo</h2>
                        <img 
                            src={currentLogo} 
                            alt="Current Logo" 
                            className="max-w-[200px] border rounded-lg shadow-sm"
                        />
                    </div>
                )}

                {/* Upload Form */}
                <form onSubmit={handleUpload} className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="logo-upload"
                        />
                        <label 
                            htmlFor="logo-upload"
                            className="cursor-pointer flex flex-col items-center justify-center"
                        >
                            {preview ? (
                                <img 
                                    src={preview} 
                                    alt="Preview" 
                                    className="max-w-[200px] mb-4"
                                />
                            ) : (
                                <div className="text-gray-500 text-center">
                                    <p>Drop your image here or click to upload</p>
                                    <p className="text-sm">PNG, JPG up to 5MB</p>
                                </div>
                            )}
                        </label>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm">{error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={!file || uploading}
                        className={`px-4 py-2 rounded-md text-white ${
                            !file || uploading 
                                ? 'bg-gray-400' 
                                : 'bg-purple-600 hover:bg-purple-700'
                        } transition-colors`}
                    >
                        {uploading ? 'Uploading...' : 'Upload Logo'}
                    </button>
                </form>
            </div>
        </PermissionGuard>
    );
};

export default Logo;