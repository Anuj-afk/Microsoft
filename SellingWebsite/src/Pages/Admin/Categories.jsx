import { useState, useEffect } from 'react';
import axios from 'axios';
import PermissionGuard from '../../components/PermissionGuard';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        featuredImage: '',
        isActive: true
    });
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [mediaModalOpen, setMediaModalOpen] = useState(false);
    const [mediaFiles, setMediaFiles] = useState([]);
    const [loadingMedia, setLoadingMedia] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:3000/api/categories');
            setCategories(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Failed to load categories. Please try again.');
            setLoading(false);
        }
    };

    const fetchMediaFiles = async () => {
        try {
            setLoadingMedia(true);
            const response = await axios.get('http://localhost:3000/api/media');
            setMediaFiles(response.data);
            setLoadingMedia(false);
        } catch (err) {
            console.error('Error fetching media:', err);
            setLoadingMedia(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });

        // Auto-generate slug from name if slug is empty
        if (name === 'name' && !formData.slug) {
            setFormData({
                ...formData,
                name: value,
                slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            });
        }
    };

    const handleOpenMediaModal = () => {
        fetchMediaFiles();
        setMediaModalOpen(true);
    };

    const handleSelectImage = (imageUrl) => {
        setFormData({
            ...formData,
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
            if (editMode && currentCategory) {
                await axios.put(`http://localhost:3000/api/categories/${currentCategory._id}`, formData);
                setSuccessMessage('Category updated successfully');
            } else {
                await axios.post('http://localhost:3000/api/categories', formData);
                setSuccessMessage('Category created successfully');
            }
            
            resetForm();
            fetchCategories();
        } catch (err) {
            console.error('Error saving category:', err);
            setError(err.response?.data?.error || 'Failed to save category. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (category) => {
        setCurrentCategory(category);
        setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            featuredImage: category.featuredImage || '',
            isActive: category.isActive
        });
        setEditMode(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) {
            return;
        }

        try {
            await axios.delete(`http://localhost:3000/api/categories/${id}`);
            setSuccessMessage('Category deleted successfully');
            fetchCategories();
        } catch (err) {
            console.error('Error deleting category:', err);
            setError('Failed to delete category. Please try again.');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            description: '',
            featuredImage: '',
            isActive: true
        });
        setEditMode(false);
        setCurrentCategory(null);
    };

    if (loading) {
        return <div className="p-6">Loading categories...</div>;
    }

    return (
        <PermissionGuard permission={['manage_categories']}>
            <div className="p-6">
            <h1 className="text-2xl font-semibold mb-6">
                {editMode ? 'Edit Category' : 'Add New Category'}
            </h1>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                    {successMessage}
                </div>
            )}

            {/* Category Form */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Slug *
                        </label>
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Used in URLs, e.g., laptops
                        </p>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Featured Image
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Recommended size: 600x400px, ratio 3:2
                        </p>
                        {formData.featuredImage ? (
                            <div className="mb-2">
                                <img 
                                    src={formData.featuredImage} 
                                    alt="Category" 
                                    className="h-32 w-full object-cover rounded-md"
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, featuredImage: ''})}
                                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                                >
                                    Remove Image
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleOpenMediaModal}
                                className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-gray-600 hover:text-gray-800"
                            >
                                Select Image
                            </button>
                        )}
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isActive"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                        />
                        <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                            Active (will be displayed on the site)
                        </label>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    {editMode && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:bg-purple-400"
                    >
                        {saving ? 'Saving...' : editMode ? 'Update Category' : 'Add Category'}
                    </button>
                </div>
            </form>

            {/* Categories List */}
            <h2 className="text-xl font-medium mb-4">All Categories</h2>
            
            {categories.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-sm text-center text-gray-500">
                    No categories found. Create your first category above.
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Image
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Slug
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {categories.map((category) => (
                                <tr key={category._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {category.featuredImage ? (
                                            <img 
                                                src={category.featuredImage} 
                                                alt={category.name} 
                                                className="h-10 w-10 rounded-md object-cover"
                                            />
                                        ) : (
                                            <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-500">
                                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{category.slug}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            category.isActive 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {category.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(category)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category._id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Media Selection Modal */}
            {mediaModalOpen && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-11/12 max-w-4xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Select an Image</h3>
                            <button
                                onClick={() => setMediaModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {loadingMedia ? (
                            <div className="text-center py-12">Loading media...</div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {mediaFiles.map((file) => (
                                    <div 
                                        key={file._id} 
                                        className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-purple-500"
                                        onClick={() => handleSelectImage(file.awsUrl)}
                                    >
                                        <img
                                            src={file.awsUrl}
                                            alt={file.title}
                                            className="w-full h-32 object-cover"
                                        />
                                    </div>
                                ))}

                                {mediaFiles.length === 0 && (
                                    <div className="col-span-full text-center py-8 text-gray-500">
                                        No media files found. Please upload images in the Media Library.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
            </div>
        </PermissionGuard>
    );
};

export default Categories;