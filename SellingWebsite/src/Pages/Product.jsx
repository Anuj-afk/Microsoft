import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import ProductListItem from '../components/ProductListItem';
import api, { API_ENDPOINTS } from '../config/api.js';

const Products = () => {
    const { slug } = useParams(); // Category slug from URL
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // State management
    const [products, setProducts] = useState([]);
    const [category, setCategory] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Pagination and filtering state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [limit] = useState(12);
    
    // Separate states for applied filters vs form inputs
    const [appliedFilters, setAppliedFilters] = useState({
        search: searchParams.get('search') || '',
        brand: searchParams.get('brand') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortOrder: searchParams.get('sortOrder') || 'desc',
        featured: searchParams.get('featured') || ''
    });
    
    // Form inputs (what user types/selects before clicking search)
    const [filterInputs, setFilterInputs] = useState({
        search: searchParams.get('search') || '',
        brand: searchParams.get('brand') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortOrder: searchParams.get('sortOrder') || 'desc',
        featured: searchParams.get('featured') || ''
    });
    
    // UI state
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [brands, setBrands] = useState([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    // Update this useEffect to use appliedFilters instead of filters
    useEffect(() => {
        setCurrentPage(1);
        
        if (slug) {
            fetchProductsByCategory(slug);
        } else {
            setCategory(null);
            fetchAllProducts();
        }
    }, [slug]);

    // Separate useEffect for applied filter/page changes
    useEffect(() => {
        if (slug) {
            console.log(slug);
            fetchProductsByCategory(slug);
        } else {
            fetchAllProducts();
        }
    }, [currentPage, appliedFilters]);

    useEffect(() => {
        // Update URL search params when applied filters change
        const params = new URLSearchParams();
        Object.entries(appliedFilters).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });
        if (currentPage > 1) params.set('page', currentPage.toString());
        setSearchParams(params);
    }, [appliedFilters, currentPage, setSearchParams]);

    const fetchCategories = async () => {
        try {
            const response = await api.get(API_ENDPOINTS.CATEGORIES.BASE);
            setCategories(response.data.filter(cat => cat.isActive));
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const fetchProductsByCategory = async (slug) => {
        try {
            setLoading(true);
            setError(null);
            
            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
                status: 'active',
                ...appliedFilters // Use appliedFilters instead of filterInputs
            });
            {
                console.log(slug);
            }
            const response = await api.get(
                `${API_ENDPOINTS.DEVICES.BY_CATEGORY(slug)}?${queryParams}`
            );
            
            setProducts(response.data.devices || []);
            setCategory(response.data.category);
            setCurrentPage(response.data.pagination?.current || 1);
            setTotalPages(response.data.pagination?.pages || 1);
            setTotalProducts(response.data.pagination?.total || 0);
            
            const uniqueBrands = [...new Set(response.data.devices?.map(p => p.brand).filter(Boolean))];
            setBrands(uniqueBrands);
            
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load products. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Clean the appliedFilters to remove empty values
            const cleanFilters = Object.entries(appliedFilters).reduce((acc, [key, value]) => {
                if (value && value !== '') {
                    acc[key] = value;
                }
                return acc;
            }, {});

            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
                status: 'active',
                ...cleanFilters
            });

            console.log('Fetching all products with params:', queryParams.toString()); // Debug log
            console.log('Applied filters:', appliedFilters); // Debug log

            const response = await api.get(
                `${API_ENDPOINTS.DEVICES.BASE}?${queryParams}`
            );
            
            console.log('API Response:', response.data); // Debug log
            
            setProducts(response.data.devices || []);
            setCategory(null);
            setCurrentPage(response.data.pagination?.current || 1);
            setTotalPages(response.data.pagination?.pages || 1);
            setTotalProducts(response.data.pagination?.total || 0);
            
            // Extract unique brands
            const uniqueBrands = [...new Set(response.data.devices?.map(p => p.brand).filter(Boolean))];
            setBrands(uniqueBrands);

            // Debug: Log featured products
            const featuredProducts = response.data.devices?.filter(p => p.featured) || [];
            console.log(`Found ${featuredProducts.length} featured products:`, featuredProducts.map(p => p.name));
            
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load products. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Update form inputs without applying filters immediately
    const handleFilterInputChange = (field, value) => {
        setFilterInputs(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle sort changes (apply immediately since sorting doesn't need search button)
    const handleSortChange = (sortBy, sortOrder) => {
        const newAppliedFilters = {
            ...appliedFilters,
            sortBy,
            sortOrder
        };
        
        setAppliedFilters(newAppliedFilters);
        setFilterInputs(prev => ({
            ...prev,
            sortBy,
            sortOrder
        }));
        setCurrentPage(1);
    };

    // Apply filters when search button is clicked
    const handleSearch = () => {
        setSearching(true);
        setAppliedFilters(filterInputs);
        setCurrentPage(1);
        
        // Add a small delay to show the searching state
        setTimeout(() => {
            setSearching(false);
        }, 500);
    };

    // Clear all filters
    const clearFilters = () => {
        const defaultFilters = {
            search: '',
            brand: '',
            minPrice: '',
            maxPrice: '',
            sortBy: 'createdAt',
            sortOrder: 'desc',
            featured: ''
        };
        
        setFilterInputs(defaultFilters);
        setAppliedFilters(defaultFilters);
        setCurrentPage(1);
        
        setSearchParams(new URLSearchParams());
        
        if (slug) {
            navigate('/products', { replace: true });
        }
        
        setCategory(null);
        setTimeout(() => {
            fetchAllProducts();
        }, 0);
    };

    // Remove category filter
    const removeCategoryFilter = () => {
        setSearchParams(new URLSearchParams());
        navigate('/products', { replace: true });
        setCategory(null);
        
        setTimeout(() => {
            fetchAllProducts();
        }, 0);
    };

    // Remove individual applied filter
    const removeAppliedFilter = (filterKey) => {
        const newAppliedFilters = {
            ...appliedFilters,
            [filterKey]: ''
        };
        
        setAppliedFilters(newAppliedFilters);
        setFilterInputs(prev => ({
            ...prev,
            [filterKey]: ''
        }));
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Check if there are unsaved filter changes
    const hasUnsavedChanges = JSON.stringify(filterInputs) !== JSON.stringify(appliedFilters);

    // Pagination component (unchanged)
    const Pagination = () => {
        if (totalPages <= 1) return null;

        const pages = [];
        const showPages = 5;
        const startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
        const endPage = Math.min(totalPages, startPage + showPages - 1);

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="flex justify-center items-center space-x-2 mt-8">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                
                {startPage > 1 && (
                    <>
                        <button
                            onClick={() => handlePageChange(1)}
                            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            1
                        </button>
                        {startPage > 2 && <span className="px-2">...</span>}
                    </>
                )}
                
                {pages.map(page => (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-md ${
                            page === currentPage
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        {page}
                    </button>
                ))}
                
                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span className="px-2">...</span>}
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            {totalPages}
                        </button>
                    </>
                )}
                
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        );
    };

    if (loading && products.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <nav className="flex text-sm text-gray-500">
                        <Link to="/" className="hover:text-purple-600">Home</Link>
                        <span className="mx-2">/</span>
                        <Link to="/products" className="hover:text-purple-600">Products</Link>
                        {category && (
                            <>
                                <span className="mx-2">/</span>
                                <span className="text-gray-900">{category.name}</span>
                            </>
                        )}
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {category ? category.name : 'All Products'}
                    </h1>
                    {category?.description && (
                        <p className="text-gray-600 mb-4">{category.description}</p>
                    )}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-gray-600">
                            {totalProducts} product{totalProducts !== 1 ? 's' : ''} found
                            {category && ` in ${category.name}`}
                        </p>
                        {/* Active filters display */}
                        {(Object.values(appliedFilters).some(v => v) || category) && (
                            <div className="flex items-center gap-2 text-sm flex-wrap">
                                <span className="text-gray-500">Active:</span>
                                {category && (
                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full flex items-center gap-1">
                                        {category.name}
                                        <button
                                            onClick={removeCategoryFilter}
                                            className="text-purple-600 hover:text-purple-800 ml-1"
                                            title="Remove category filter"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                )}
                                {Object.entries(appliedFilters).map(([key, value]) => {
                                    if (!value || key === 'sortBy' || key === 'sortOrder') return null;
                                    return (
                                        <span key={key} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
                                            {key}: {value}
                                            <button
                                                onClick={() => removeAppliedFilter(key)}
                                                className="text-blue-600 hover:text-blue-800 ml-1"
                                                title={`Remove ${key} filter`}
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <div className="lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-gray-900">Filters</h3>
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                                >
                                    Clear All
                                </button>
                            </div>

                            {/* Category Filter */}
                            <div className="mb-6">
                                <h4 className="font-medium text-gray-900 mb-3">Category</h4>
                                {category ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                                            <span className="text-sm font-medium text-purple-800">
                                                {category.name}
                                            </span>
                                            <button
                                                onClick={removeCategoryFilter}
                                                className="text-xs text-purple-600 hover:text-purple-800"
                                                title="Remove category filter"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <button
                                            onClick={removeCategoryFilter}
                                            className="block w-full text-left text-sm text-gray-600 hover:text-purple-600 pl-2 py-1 hover:bg-gray-50 rounded"
                                        >
                                            View All Categories
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {categories.map(cat => (
                                            <Link
                                                key={cat._id}
                                                to={`/products/${cat.slug}`}
                                                className="block text-sm text-gray-600 hover:text-purple-600 p-1 rounded hover:bg-gray-50"
                                            >
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Search Filter */}
                            <div className="mb-6">
                                <h4 className="font-medium text-gray-900 mb-3">Search</h4>
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={filterInputs.search}
                                    onChange={(e) => handleFilterInputChange('search', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearch();
                                        }
                                    }}
                                />
                            </div>

                            {/* Brand Filter */}
                            {brands.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-medium text-gray-900 mb-3">Brand</h4>
                                    <select
                                        value={filterInputs.brand}
                                        onChange={(e) => handleFilterInputChange('brand', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        <option value="">All Brands</option>
                                        {brands.map(brand => (
                                            <option key={brand} value={brand}>{brand}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Price Range Filter */}
                            <div className="mb-6">
                                <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={filterInputs.minPrice}
                                        onChange={(e) => handleFilterInputChange('minPrice', e.target.value)}
                                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filterInputs.maxPrice}
                                        onChange={(e) => handleFilterInputChange('maxPrice', e.target.value)}
                                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            {/* Featured Filter */}
                            <div className="mb-6">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={filterInputs.featured === 'true'}
                                        onChange={(e) => handleFilterInputChange('featured', e.target.checked ? 'true' : '')}
                                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-900">Featured Only</span>
                                </label>
                            </div>

                            {/* Search Button */}
                            <div className="space-y-2">
                                <button
                                    onClick={handleSearch}
                                    disabled={searching || loading}
                                    className={`w-full px-4 py-2 rounded-md font-medium transition duration-300 ${
                                        searching || loading
                                            ? 'bg-gray-400 text-white cursor-not-allowed'
                                            : hasUnsavedChanges
                                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                                : 'bg-gray-200 text-gray-600'
                                    }`}
                                >
                                    {searching ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Searching...
                                        </div>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            Search
                                        </>
                                    )}
                                </button>
                                
                                {hasUnsavedChanges && (
                                    <p className="text-xs text-amber-600 text-center">
                                        Click "Search" to apply filters
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Sort and View Controls */}
                        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600">Sort by:</label>
                                        <select
                                            value={`${appliedFilters.sortBy}-${appliedFilters.sortOrder}`}
                                            onChange={(e) => {
                                                const [sortBy, sortOrder] = e.target.value.split('-');
                                                handleSortChange(sortBy, sortOrder);
                                            }}
                                            className="px-3 py-1 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                        >
                                            <option value="createdAt-desc">Newest First</option>
                                            <option value="createdAt-asc">Oldest First</option>
                                            <option value="price-asc">Price: Low to High</option>
                                            <option value="price-desc">Price: High to Low</option>
                                            <option value="name-asc">Name: A to Z</option>
                                            <option value="name-desc">Name: Z to A</option>
                                            <option value="salesCount-desc">Most Popular</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">View:</span>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                                <p>{error}</p>
                            </div>
                        )}

                        {/* Products Grid/List */}
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-lg shadow-sm border p-4 animate-pulse">
                                        <div className="h-48 bg-gray-200 rounded mb-4"></div>
                                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                    </div>
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8L9.5 15L7 12.5" />
                                </svg>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                                <p className="text-gray-600 mb-4">
                                    {(Object.values(appliedFilters).some(v => v) || category) ? 
                                        'Try adjusting your filters to see more products.' :
                                        'No products are available at the moment.'
                                    }
                                </p>
                                {(Object.values(appliedFilters).some(v => v) || category) && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                                    >
                                        {category ? 'Show All Products' : 'Clear Filters'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className={
                                viewMode === 'grid' 
                                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                                    : 'space-y-6'
                            }>
                                {products.map(product => (
                                    <div key={product._id}>
                                        {viewMode === 'grid' ? (
                                            <ProductCard product={product} />
                                        ) : (
                                            <ProductListItem product={product} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        <Pagination />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Products;