import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { API_ENDPOINTS, apiHelpers } from '../../../config/api.js';

const CategoryDevices = () => {
    const { slug } = useParams();

    const [devices, setDevices] = useState([]);
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Pagination and filtering states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDevices, setTotalDevices] = useState(0);
    const [limit] = useState(12);

    // Filter states
    const [filters, setFilters] = useState({
        search: '',
        status: 'active',
        brand: '',
        featured: '',
        minPrice: '',
        maxPrice: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });

    // UI states
    const [showFilters, setShowFilters] = useState(false);
    const [selectedDevices, setSelectedDevices] = useState([]);
    const [bulkAction, setBulkAction] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    useEffect(() => {
        fetchCategoryDevices();
    }, [slug, currentPage, filters]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchCategoryDevices = async () => {
        try {
            setLoading(true);
            setError(null);

            // Build query parameters using the centralized helper
            const queryParams = {
                page: currentPage.toString(),
                limit: limit.toString(),
                admin: 'true', // Add admin flag
                ...Object.entries(filters).reduce((acc, [key, value]) => {
                    if (value) acc[key] = value;
                    return acc;
                }, {})
            };

            const query = apiHelpers.buildQuery(queryParams);

            console.log(`Fetching devices for category: ${slug} (admin mode)`);
            console.log('Query params:', query);

            // Use the centralized API endpoint
            const response = await api.get(`${API_ENDPOINTS.DEVICES.ADMIN_CATEGORY(slug)}${query}`);

            console.log('API Response:', response.data);

            if (response.data.success) {
                setDevices(response.data.devices || []);
                setCategory(response.data.category);
                setCurrentPage(response.data.pagination?.current || 1);
                setTotalPages(response.data.pagination?.pages || 0);
                setTotalDevices(response.data.pagination?.total || 0);
                
                // Clear any previous errors
                setError(null);
                setSuccessMessage('');
            } else {
                throw new Error(response.data.message || 'Failed to fetch devices');
            }

        } catch (err) {
            console.error('Error fetching category devices:', err);
            
            if (err.response?.status === 404) {
                setError('Category not found');
                setCategory(null);
            } else {
                setError('Failed to load devices. Please try again.');
            }
            
            setDevices([]);
            setTotalDevices(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            status: 'active',
            brand: '',
            featured: '',
            minPrice: '',
            maxPrice: '',
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });
        setCurrentPage(1);
    };

    const handleDelete = async (deviceId, deviceName) => {
        if (!window.confirm(`Are you sure you want to delete "${deviceName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await api.delete(API_ENDPOINTS.DEVICES.BY_ID(deviceId));
            setSuccessMessage('Device deleted successfully');
            fetchCategoryDevices();

            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error('Error deleting device:', err);
            setError(err.response?.data?.error || err.response?.data?.message || 'Failed to delete device');
            setTimeout(() => setError(''), 5000);
        }
    };

    const toggleFeatured = async (deviceId, currentStatus) => {
        try {
            await api.patch(API_ENDPOINTS.DEVICES.FEATURED_TOGGLE(deviceId));
            setSuccessMessage(`Device ${!currentStatus ? 'added to' : 'removed from'} featured`);
            fetchCategoryDevices();

            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error('Error toggling featured status:', err);
            setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update featured status');
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleSelectDevice = (deviceId) => {
        setSelectedDevices(prev => 
            prev.includes(deviceId) 
                ? prev.filter(id => id !== deviceId)
                : [...prev, deviceId]
        );
    };

    const handleSelectAll = () => {
        if (selectedDevices.length === devices.length) {
            setSelectedDevices([]);
        } else {
            setSelectedDevices(devices.map(device => device._id));
        }
    };

    const handleBulkAction = async () => {
        if (!bulkAction || selectedDevices.length === 0) return;

        if (bulkAction === 'delete') {
            if (!window.confirm(`Are you sure you want to delete ${selectedDevices.length} devices? This action cannot be undone.`)) {
                return;
            }

            try {
                await Promise.all(
                    selectedDevices.map(deviceId => 
                        api.delete(API_ENDPOINTS.DEVICES.BY_ID(deviceId))
                    )
                );
                setSuccessMessage(`${selectedDevices.length} devices deleted successfully`);
                setSelectedDevices([]);
                setBulkAction('');
                fetchCategoryDevices();
                setTimeout(() => setSuccessMessage(''), 3000);
            } catch (error) {
                console.error('Error deleting devices:', error);
                setError('Failed to delete some devices');
                setTimeout(() => setError(''), 5000);
            }
        } else if (bulkAction === 'featured') {
            try {
                await Promise.all(
                    selectedDevices.map(deviceId => 
                        api.patch(API_ENDPOINTS.DEVICES.FEATURED_TOGGLE(deviceId))
                    )
                );
                setSuccessMessage(`${selectedDevices.length} devices updated`);
                setSelectedDevices([]);
                setBulkAction('');
                fetchCategoryDevices();
                setTimeout(() => setSuccessMessage(''), 3000);
            } catch (error) {
                console.error('Error updating featured status:', error);
                setError('Failed to update some devices');
                setTimeout(() => setError(''), 5000);
            }
        }
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            active: 'bg-green-100 text-green-800',
            draft: 'bg-yellow-100 text-yellow-800',
            inactive: 'bg-red-100 text-red-800',
            discontinued: 'bg-gray-100 text-gray-800'
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getStockBadge = (device) => {
        if (!device.stock?.trackStock) {
            return <span className="text-gray-500 text-sm">Not tracked</span>;
        }

        const quantity = device.stock.quantity;
        const threshold = device.stock.lowStockThreshold;

        if (quantity === 0) {
            return <span className="text-red-600 font-medium">Out of stock</span>;
        } else if (quantity <= threshold) {
            return <span className="text-yellow-600 font-medium">Low stock ({quantity})</span>;
        } else {
            return <span className="text-green-600 font-medium">In stock ({quantity})</span>;
        }
    };

    const formatPrice = (price) => {
        return `₹${parseFloat(price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    };

    const Pagination = () => {
        const pageNumbers = [];
        const maxPageButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

        if (endPage - startPage + 1 < maxPageButtons) {
            startPage = Math.max(1, endPage - maxPageButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                    <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Showing{' '}
                            <span className="font-medium">
                                {Math.min((currentPage - 1) * limit + 1, totalDevices)}
                            </span>{' '}
                            to{' '}
                            <span className="font-medium">
                                {Math.min(currentPage * limit, totalDevices)}
                            </span>{' '}
                            of{' '}
                            <span className="font-medium">{totalDevices}</span> devices
                        </p>
                    </div>
                    <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                            >
                                <span className="sr-only">Previous</span>
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                </svg>
                            </button>
                            {pageNumbers.map((pageNum) => (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                        currentPage === pageNum
                                            ? 'bg-purple-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600'
                                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                            >
                                <span className="sr-only">Next</span>
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        );
    };

    if (loading && devices.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (error && !category) {
        return (
            <div className="p-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Category not found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        The category "{slug}" does not exist or is not active.
                    </p>
                    <div className="mt-6">
                        <Link
                            to="/admin/devices/all"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                        >
                            View All Devices
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-center">
                        <Link
                            to="/admin/devices/all"
                            className="mr-4 text-gray-500 hover:text-purple-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                {category?.name || 'Category Devices'}
                                {category && !category.isActive && (
                                    <span className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full">
                                        Inactive Category
                                    </span>
                                )}
                            </h1>
                            {category?.description && (
                                <p className="mt-1 text-sm text-gray-600">{category.description}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {/* View Mode Toggle */}
                        <div className="flex rounded-lg overflow-hidden border border-gray-300">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-2 text-sm ${
                                    viewMode === 'grid' 
                                        ? 'bg-purple-600 text-white' 
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-2 text-sm ${
                                    viewMode === 'list' 
                                        ? 'bg-purple-600 text-white' 
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
                                </svg>
                            </button>
                        </div>
                        
                        <Link
                            to={`/admin/devices/add?category=${category?._id}`}
                            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Device
                        </Link>
                    </div>
                </div>

                {/* Category Image */}
                {category?.featuredImage && (
                    <div className="mt-4">
                        <img
                            src={category.featuredImage}
                            alt={category.name}
                            className="w-full h-40 object-cover rounded-lg"
                        />
                    </div>
                )}
            </div>

            {/* Inactive Category Warning */}
            {category && !category.isActive && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" />
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                                Inactive Category
                            </h3>
                            <div className="mt-1 text-sm text-yellow-700">
                                <p>
                                    This category is currently inactive. It won't appear on the public website but you can still manage its devices here.
                                </p>
                            </div>
                            <div className="mt-4">
                                <div className="flex">
                                    <Link
                                        to="/admin/categories"
                                        className="bg-yellow-50 text-yellow-800 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                                    >
                                        Manage Categories
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Messages */}
            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                    {successMessage}
                </div>
            )}

            {/* Filters */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center text-gray-700 hover:text-purple-600"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                        </svg>
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                    <button
                        onClick={clearFilters}
                        className="text-sm text-purple-600 hover:text-purple-800"
                    >
                        Clear Filters
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Search devices..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                            <option value="inactive">Inactive</option>
                            <option value="discontinued">Discontinued</option>
                        </select>
                    </div>

                    <div>
                        <select
                            value={filters.featured}
                            onChange={(e) => handleFilterChange('featured', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">All Devices</option>
                            <option value="true">Featured Only</option>
                            <option value="false">Non-Featured</option>
                        </select>
                    </div>

                    <div>
                        <select
                            value={filters.sortBy}
                            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="createdAt">Sort by Date</option>
                            <option value="name">Sort by Name</option>
                            <option value="price">Sort by Price</option>
                            <option value="salesCount">Sort by Sales</option>
                        </select>
                    </div>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Filter by brand..."
                                value={filters.brand}
                                onChange={(e) => handleFilterChange('brand', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <input
                                type="number"
                                placeholder="Min price"
                                value={filters.minPrice}
                                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <input
                                type="number"
                                placeholder="Max price"
                                value={filters.maxPrice}
                                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <select
                                value={filters.sortOrder}
                                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="desc">Descending</option>
                                <option value="asc">Ascending</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Actions */}
            {selectedDevices.length > 0 && (
                <div className="mb-4 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-blue-700">
                            {selectedDevices.length} device(s) selected
                        </span>
                        <div className="flex items-center gap-2">
                            <select
                                value={bulkAction}
                                onChange={(e) => setBulkAction(e.target.value)}
                                className="px-3 py-1 border border-blue-300 rounded-md text-sm"
                            >
                                <option value="">Choose action...</option>
                                <option value="featured">Toggle Featured</option>
                                <option value="delete">Delete Selected</option>
                            </select>
                            <button
                                onClick={handleBulkAction}
                                disabled={!bulkAction}
                                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Devices Display */}
            {devices.length === 0 && !loading ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No devices found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {Object.values(filters).some(value => value !== '' && value !== 'active' && value !== 'createdAt' && value !== 'desc') 
                            ? 'Try adjusting your filters or search terms.'
                            : `No devices found in the ${category?.name || 'category'} category.`
                        }
                    </p>
                    <div className="mt-6">
                        <Link
                            to={`/admin/devices/add?category=${category?._id}`}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add First Device
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    {viewMode === 'grid' ? (
                        <div className="p-6">
                            {/* Bulk select header for grid */}
                            <div className="flex items-center mb-4">
                                <input
                                    type="checkbox"
                                    checked={selectedDevices.length === devices.length && devices.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-2"
                                />
                                <span className="text-sm text-gray-600">Select all</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {devices.map((device) => (
                                    <div
                                        key={device._id}
                                        className={`relative bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                                            selectedDevices.includes(device._id) ? 'ring-2 ring-purple-500' : ''
                                        }`}
                                    >
                                        {/* Selection checkbox */}
                                        <div className="absolute top-2 left-2 z-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedDevices.includes(device._id)}
                                                onChange={() => handleSelectDevice(device._id)}
                                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                            />
                                        </div>

                                        {/* Featured badge */}
                                        {device.featured && (
                                            <div className="absolute top-2 right-2 z-10">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    Featured
                                                </span>
                                            </div>
                                        )}

                                        {/* Device image */}
                                        <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                                            {device.images && device.images.length > 0 ? (
                                                <img
                                                    className="w-full h-full object-cover"
                                                    src={device.images.find(img => img.isPrimary)?.url || device.images[0]?.url}
                                                    alt={device.name}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Device info */}
                                        <div className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="text-sm font-medium text-gray-900 truncate">
                                                        {device.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {device.brand} - {device.model}
                                                    </p>
                                                    {device.sku && (
                                                        <p className="text-xs text-gray-400">SKU: {device.sku}</p>
                                                    )}
                                                </div>
                                                {getStatusBadge(device.status)}
                                            </div>

                                            <div className="mt-2">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-lg font-medium text-gray-900">
                                                            {formatPrice(device.price)}
                                                        </span>
                                                        {device.originalPrice && device.originalPrice !== device.price && (
                                                            <span className="ml-2 text-sm text-gray-500 line-through">
                                                                {formatPrice(device.originalPrice)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-1 text-sm">
                                                    {getStockBadge(device)}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="mt-4 flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Link
                                                        to={`/admin/devices/edit/${device._id}`}
                                                        className="text-purple-600 hover:text-purple-900"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </Link>
                                                    <button
                                                        onClick={() => toggleFeatured(device._id, device.featured)}
                                                        className={`${device.featured ? 'text-yellow-600 hover:text-yellow-800' : 'text-gray-400 hover:text-yellow-600'}`}
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(device._id, device.name)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* List View */
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedDevices.length === devices.length && devices.length > 0}
                                                onChange={handleSelectAll}
                                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Device
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Stock
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {devices.map((device) => (
                                        <tr key={device._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDevices.includes(device._id)}
                                                    onChange={() => handleSelectDevice(device._id)}
                                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-12 w-12">
                                                        {device.images && device.images.length > 0 ? (
                                                            <img
                                                                className="h-12 w-12 rounded-lg object-cover"
                                                                src={device.images.find(img => img.isPrimary)?.url || device.images[0]?.url}
                                                                alt={device.name}
                                                            />
                                                        ) : (
                                                            <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                                                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 flex items-center">
                                                            {device.name}
                                                            {device.featured && (
                                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                    Featured
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {device.brand} - {device.model}
                                                        </div>
                                                        {device.sku && (
                                                            <div className="text-xs text-gray-400">SKU: {device.sku}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatPrice(device.price)}
                                                </div>
                                                {device.originalPrice && device.originalPrice !== device.price && (
                                                    <div className="text-sm text-gray-500 line-through">
                                                        {formatPrice(device.originalPrice)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {getStockBadge(device)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(device.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <Link
                                                        to={`/admin/devices/edit/${device._id}`}
                                                        className="text-purple-600 hover:text-purple-900"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </Link>
                                                    <button
                                                        onClick={() => toggleFeatured(device._id, device.featured)}
                                                        className={`${device.featured ? 'text-yellow-600 hover:text-yellow-800' : 'text-gray-400 hover:text-yellow-600'}`}
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(device._id, device.name)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && <Pagination />}
                </div>
            )}
        </div>
    );
};

export default CategoryDevices;
