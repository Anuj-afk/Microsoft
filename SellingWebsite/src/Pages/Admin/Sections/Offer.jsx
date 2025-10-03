import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { API_ENDPOINTS, apiHelpers } from '../../../config/api.js';
import PermissionGuard from '../../../components/PermissionGuard';

const Offer = () => {
    const [offers, setOffers] = useState([]); // Ensure it's always an array
    const [currentOffer, setCurrentOffer] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [settings, setSettings] = useState({
        title: 'Special Back to School Offer',
        slug: '',
        description: 'Get up to 25% off on selected laptops and desktops, plus free accessories bundle with any purchase over ₹1,500.',
        shortDescription: 'Limited time offer - save big on tech!',
        discountType: 'percentage',
        discountValue: 25,
        minOrderAmount: 1500,
        ctaText: 'Shop the Sale',
        ctaLink: '/offers',
        backgroundImage: { url: '', alt: '' },
        backgroundColor: '#7c3aed',
        textColor: '#ffffff',
        badgeColor: '#ef4444',
        badgeText: '',
        startDate: '',
        endDate: '',
        isActive: true,
        isFeatured: false,
        displayLocations: ['homepage'],
        priority: 1,
        status: 'draft',
        terms: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [mediaModalOpen, setMediaModalOpen] = useState(false);
    const [mediaFiles, setMediaFiles] = useState([]);
    const [loadingMedia, setLoadingMedia] = useState(false);

    useEffect(() => {
        fetchAllOffers();
    }, []);

    const fetchAllOffers = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('Fetching offers...'); // Debug log
            
            const response = await api.get(API_ENDPOINTS.OFFERS.BASE);
            
            console.log('API Response:', response.data); // Debug log
            
            // Handle different response structures
            let offersData = [];
            if (Array.isArray(response.data)) {
                offersData = response.data;
            } else if (response.data && Array.isArray(response.data.offers)) {
                offersData = response.data.offers;
            } else if (response.data && Array.isArray(response.data.data)) {
                offersData = response.data.data;
            } else {
                console.warn('Unexpected response structure:', response.data);
                offersData = [];
            }
            
            setOffers(offersData);
            
        } catch (err) {
            console.error('Error fetching offers:', err);
            setError(`Failed to load offers: ${err.response?.data?.message || err.message}`);
            setOffers([]); // Ensure offers is always an array even on error
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSettings({
            title: 'New Special Offer',
            slug: '',
            description: 'Enter your offer description here...',
            shortDescription: 'Brief offer description',
            discountType: 'percentage',
            discountValue: 0,
            minOrderAmount: 0,
            ctaText: 'Shop Now',
            ctaLink: '/offers',
            backgroundImage: { url: '', alt: '' },
            backgroundColor: '#7c3aed',
            textColor: '#ffffff',
            badgeColor: '#ef4444',
            badgeText: '',
            startDate: '',
            endDate: '',
            isActive: true,
            isFeatured: false,
            displayLocations: ['homepage'],
            priority: 1,
            status: 'draft',
            terms: ''
        });
        setCurrentOffer(null);
        setIsEditing(false);
    };

    const handleNewOffer = () => {
        resetForm();
        setShowForm(true);
    };

    const handleEditOffer = (offer) => {
        setCurrentOffer(offer);
        setIsEditing(true);
        setSettings({
            title: offer.title || 'Special Offer',
            slug: offer.slug || '',
            description: offer.description || '',
            shortDescription: offer.shortDescription || '',
            discountType: offer.discountType || 'percentage',
            discountValue: offer.discountValue || 0,
            minOrderAmount: offer.minOrderAmount || 0,
            ctaText: offer.ctaText || 'Shop Now',
            ctaLink: offer.ctaLink || '/offers',
            backgroundImage: offer.backgroundImage || { url: '', alt: '' },
            backgroundColor: offer.backgroundColor || '#7c3aed',
            textColor: offer.textColor || '#ffffff',
            badgeColor: offer.badgeColor || '#ef4444',
            badgeText: offer.badgeText || '',
            startDate: offer.startDate ? offer.startDate.split('T')[0] : '',
            endDate: offer.endDate ? offer.endDate.split('T')[0] : '',
            isActive: offer.isActive ?? true,
            isFeatured: offer.isFeatured ?? false,
            displayLocations: offer.displayLocations || ['homepage'],
            priority: offer.priority || 1,
            status: offer.status || 'draft',
            terms: offer.terms || ''
        });
        setShowForm(true);
    };

    const handleDeleteOffer = async (offerId) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this offer? This action cannot be undone.');
        if (!confirmDelete) return;

        try {
            await api.delete(API_ENDPOINTS.OFFERS.BY_ID(offerId));
            
            // Ensure offers is an array before filtering
            const updatedOffers = Array.isArray(offers) 
                ? offers.filter(offer => offer._id !== offerId)
                : [];
                
            setOffers(updatedOffers);
            setSuccessMessage('Offer deleted successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error('Error deleting offer:', err);
            setError(err.response?.data?.message || 'Failed to delete offer');
            setTimeout(() => setError(''), 5000);
        }
    };

    const toggleOfferStatus = async (offerId, currentStatus) => {
        try {
            const response = await api.patch(API_ENDPOINTS.OFFERS.BY_ID(offerId), {
                isActive: !currentStatus
            });
            
            // Ensure offers is an array before mapping
            const updatedOffers = Array.isArray(offers)
                ? offers.map(offer => 
                    offer._id === offerId 
                        ? { ...offer, isActive: !currentStatus }
                        : offer
                )
                : [];
                
            setOffers(updatedOffers);
            
            setSuccessMessage(`Offer ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error('Error toggling offer status:', err);
            setError(err.response?.data?.message || 'Failed to update offer status');
            setTimeout(() => setError(''), 5000);
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
            console.error('Error fetching media files:', err);
            setMediaFiles([]);
        } finally {
            setLoadingMedia(false);
        }
    };

    const handleOpenMediaModal = () => {
        setMediaModalOpen(true);
        fetchMediaFiles();
    };

    const handleSelectImage = (imageUrl) => {
        setSettings(prev => ({
            ...prev,
            backgroundImage: {
                url: imageUrl,
                alt: 'Special offer background'
            }
        }));
        setMediaModalOpen(false);
    };

    const handleRemoveImage = () => {
        setSettings(prev => ({
            ...prev,
            backgroundImage: { url: '', alt: '' }
        }));
    };

    const validateDates = (startDate, endDate) => {
        if (!startDate || !endDate) return true;
        return new Date(endDate) > new Date(startDate);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name === 'displayLocations') {
            const locations = [...settings.displayLocations];
            if (checked) {
                if (!locations.includes(value)) {
                    locations.push(value);
                }
            } else {
                const index = locations.indexOf(value);
                if (index > -1) {
                    locations.splice(index, 1);
                }
            }
            setSettings(prev => ({
                ...prev,
                displayLocations: locations
            }));
            return;
        }

        if (name === 'startDate' || name === 'endDate') {
            const newSettings = {
                ...settings,
                [name]: value
            };
            
            if (name === 'startDate' && settings.endDate) {
                if (!validateDates(value, settings.endDate)) {
                    setError('Start date must be before end date');
                    setTimeout(() => setError(''), 3000);
                }
            } else if (name === 'endDate' && settings.startDate) {
                if (!validateDates(settings.startDate, value)) {
                    setError('End date must be after start date');
                    setTimeout(() => setError(''), 3000);
                }
            }
        }

        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Auto-generate slug from title
        if (name === 'title') {
            const slug = value
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            
            setSettings(prev => ({
                ...prev,
                slug: slug
            }));
        }

        // Auto-generate badge text based on discount
        if (name === 'discountType' || name === 'discountValue') {
            let badgeText = '';
            const discountType = name === 'discountType' ? value : settings.discountType;
            const discountValue = name === 'discountValue' ? value : settings.discountValue;
            
            if (discountType === 'percentage') {
                badgeText = `${discountValue}% OFF`;
            } else if (discountType === 'fixed') {
                badgeText = `₹${discountValue} OFF`;
            } else if (discountType === 'free_shipping') {
                badgeText = 'FREE SHIPPING';
            } else if (discountType === 'buy_one_get_one') {
                badgeText = 'BOGO';
            }

            setSettings(prev => ({
                ...prev,
                badgeText: badgeText
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const offerData = {
                ...settings,
                startDate: settings.startDate ? new Date(settings.startDate).toISOString() : new Date().toISOString(),
                endDate: settings.endDate ? new Date(settings.endDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            };

            const startDate = new Date(offerData.startDate);
            const endDate = new Date(offerData.endDate);
            
            if (endDate <= startDate) {
                throw new Error('End date must be after start date');
            }

            let response;
            if (isEditing && currentOffer) {
                response = await api.put(API_ENDPOINTS.OFFERS.BY_ID(currentOffer._id), offerData);
                
                // Ensure offers is an array before mapping
                const updatedOffers = Array.isArray(offers)
                    ? offers.map(offer => 
                        offer._id === currentOffer._id 
                            ? { ...offer, ...response.data }
                            : offer
                    )
                    : [response.data];
                    
                setOffers(updatedOffers);
                setSuccessMessage('Offer updated successfully!');
            } else {
                response = await api.post(API_ENDPOINTS.OFFERS.BASE, offerData);
                
                // Ensure offers is an array before adding new offer
                const updatedOffers = Array.isArray(offers) 
                    ? [response.data, ...offers]
                    : [response.data];
                    
                setOffers(updatedOffers);
                setSuccessMessage('Offer created successfully!');
            }

            setTimeout(() => setSuccessMessage(''), 3000);
            setShowForm(false);
            resetForm();
        } catch (err) {
            console.error('Error saving offer:', err);
            setError(err.response?.data?.error || err.message || 'Failed to save offer');
            setTimeout(() => setError(''), 5000);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (err) {
            return 'Invalid date';
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            'active': 'bg-green-100 text-green-800',
            'draft': 'bg-gray-100 text-gray-800',
            'paused': 'bg-yellow-100 text-yellow-800',
            'expired': 'bg-red-100 text-red-800'
        };
        
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || statusColors.draft}`}>
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Draft'}
            </span>
        );
    };

    // Ensure offers is always an array for safe operations
    const safeOffers = Array.isArray(offers) ? offers : [];

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600">Loading offers...</span>
            </div>
        );
    }

    return (
        <PermissionGuard permission="manage_offers">
            <div className="p-6 max-w-7xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800">Offers Management</h1>
                        <p className="text-gray-600 mt-1">Create and manage special offers for your website</p>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={handleNewOffer}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                            Create New Offer
                        </button>
                        <Link
                            to="/admin/pages"
                            className="text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            ← Back to Pages
                        </Link>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {successMessage && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
                        <p>{successMessage}</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                        <p>{error}</p>
                    </div>
                )}

                {/* Offers List */}
                {!showForm && (
                    <div className="bg-white rounded-lg shadow-sm border">
                        <div className="px-6 py-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-800">All Offers ({safeOffers.length})</h2>
                        </div>
                        
                        {safeOffers.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No offers found</h3>
                                <p className="text-gray-600 mb-4">
                                    {error ? 'There was an error loading offers. ' : ''}
                                    Create your first offer to get started
                                </p>
                                <button
                                    onClick={handleNewOffer}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                                >
                                    Create New Offer
                                </button>
                                {error && (
                                    <button
                                        onClick={fetchAllOffers}
                                        className="ml-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                    >
                                        Retry Loading
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Offer Details
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Discount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Schedule
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Display
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {safeOffers.map((offer) => (
                                            <tr key={offer._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start space-x-4">
                                                        {offer.backgroundImage?.url && (
                                                            <img
                                                                src={offer.backgroundImage.url}
                                                                alt={offer.title}
                                                                className="w-16 h-12 object-cover rounded border"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="text-sm font-medium text-gray-900">
                                                                    {offer.title || 'Untitled Offer'}
                                                                </h3>
                                                                {offer.isFeatured && (
                                                                    <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                                                                        Featured
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                                {offer.shortDescription || offer.description || 'No description available'}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Slug: {offer.slug || 'No slug'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <div className="font-medium text-gray-900">
                                                            {offer.discountType === 'percentage' && `${offer.discountValue || 0}% OFF`}
                                                            {offer.discountType === 'fixed' && `₹${offer.discountValue || 0} OFF`}
                                                            {offer.discountType === 'free_shipping' && 'FREE SHIPPING'}
                                                            {offer.discountType === 'buy_one_get_one' && 'BOGO'}
                                                            {!offer.discountType && 'No discount set'}
                                                        </div>
                                                        {offer.minOrderAmount > 0 && (
                                                            <div className="text-gray-600">
                                                                Min: ₹{offer.minOrderAmount}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    <div>Start: {formatDate(offer.startDate)}</div>
                                                    <div>End: {formatDate(offer.endDate)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        {getStatusBadge(offer.status)}
                                                        <label className="flex items-center mt-1">
                                                            <input
                                                                type="checkbox"
                                                                checked={offer.isActive || false}
                                                                onChange={() => toggleOfferStatus(offer._id, offer.isActive)}
                                                                className="w-3 h-3 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                                                            />
                                                            <span className="ml-1 text-xs text-gray-600">Active</span>
                                                        </label>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {(offer.displayLocations || ['homepage']).map(location => (
                                                            <span
                                                                key={location}
                                                                className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                                                            >
                                                                {location.replace('_', ' ')}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Priority: {offer.priority || 1}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEditOffer(offer)}
                                                            className="text-purple-600 hover:text-purple-900"
                                                            title="Edit offer"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteOffer(offer._id)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Delete offer"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                    </div>
                )}

                {/* Form Modal/Panel */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
                        <div className="min-h-screen px-4 text-center">
                            <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle bg-white shadow-xl rounded-lg">
                                {/* Form Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        {isEditing ? 'Edit Offer' : 'Create New Offer'}
                                    </h2>
                                    <button
                                        onClick={() => setShowForm(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Preview Section */}
                                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview</h3>
                                    <div 
                                        className="rounded-lg p-8 text-white relative overflow-hidden"
                                        style={{ 
                                            backgroundColor: settings.backgroundColor,
                                            backgroundImage: settings.backgroundImage?.url ? `url(${settings.backgroundImage.url})` : 'none',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            color: settings.textColor
                                        }}
                                    >
                                        {settings.backgroundImage?.url && (
                                            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                                        )}
                                        <div className="relative z-10 max-w-2xl">
                                            {settings.badgeText && (
                                                <div className="inline-block mb-4">
                                                    <span 
                                                        className="px-4 py-2 rounded-full text-sm font-bold text-white"
                                                        style={{ backgroundColor: settings.badgeColor }}
                                                    >
                                                        {settings.badgeText}
                                                    </span>
                                                </div>
                                            )}
                                            <h2 className="text-2xl font-bold mb-4">{settings.title}</h2>
                                            <p className="text-lg mb-6 opacity-90">{settings.description}</p>
                                            {settings.minOrderAmount > 0 && (
                                                <p className="text-sm mb-4 opacity-80">
                                                    Min. order: ₹{settings.minOrderAmount}
                                                </p>
                                            )}
                                            <div className="inline-block px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-lg font-semibold">
                                                {settings.ctaText}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Content - keeping the existing form structure */}
                                <form onSubmit={handleSubmit} className="space-y-6 max-h-96 overflow-y-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Title */}
                                        <div className="md:col-span-2">
                                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                                Offer Title *
                                            </label>
                                            <input
                                                type="text"
                                                id="title"
                                                name="title"
                                                value={settings.title}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                                required
                                            />
                                        </div>

                                        {/* Description */}
                                        <div className="md:col-span-2">
                                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                                Description *
                                            </label>
                                            <textarea
                                                id="description"
                                                name="description"
                                                value={settings.description}
                                                onChange={handleInputChange}
                                                rows={3}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                                required
                                            />
                                        </div>

                                        {/* Discount Type & Value */}
                                        <div>
                                            <label htmlFor="discountType" className="block text-sm font-medium text-gray-700 mb-2">
                                                Discount Type *
                                            </label>
                                            <select
                                                id="discountType"
                                                name="discountType"
                                                value={settings.discountType}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                                required
                                            >
                                                <option value="percentage">Percentage (%)</option>
                                                <option value="fixed">Fixed Amount (₹)</option>
                                                <option value="free_shipping">Free Shipping</option>
                                                <option value="buy_one_get_one">Buy One Get One</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 mb-2">
                                                Discount Value *
                                            </label>
                                            <input
                                                type="number"
                                                id="discountValue"
                                                name="discountValue"
                                                value={settings.discountValue}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.01"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                                required
                                            />
                                        </div>

                                        {/* Dates */}
                                        <div>
                                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                                                Start Date *
                                            </label>
                                            <input
                                                type="date"
                                                id="startDate"
                                                name="startDate"
                                                value={settings.startDate}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                                                End Date *
                                            </label>
                                            <input
                                                type="date"
                                                id="endDate"
                                                name="endDate"
                                                value={settings.endDate}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                                required
                                            />
                                        </div>

                                        {/* CTA */}
                                        <div>
                                            <label htmlFor="ctaText" className="block text-sm font-medium text-gray-700 mb-2">
                                                CTA Text *
                                            </label>
                                            <input
                                                type="text"
                                                id="ctaText"
                                                name="ctaText"
                                                value={settings.ctaText}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="ctaLink" className="block text-sm font-medium text-gray-700 mb-2">
                                                CTA Link *
                                            </label>
                                            <input
                                                type="text"
                                                id="ctaLink"
                                                name="ctaLink"
                                                value={settings.ctaLink}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Background Image */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Background Image
                                        </label>
                                        
                                        {settings.backgroundImage?.url && (
                                            <div className="mb-4">
                                                <div className="relative inline-block">
                                                    <img
                                                        src={settings.backgroundImage.url}
                                                        alt="Background"
                                                        className="max-w-xs h-32 object-cover rounded-lg border"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveImage}
                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={handleOpenMediaModal}
                                            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Select Image
                                        </button>
                                    </div>

                                    {/* Status & Toggles */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                                                Status
                                            </label>
                                            <select
                                                id="status"
                                                name="status"
                                                value={settings.status}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                <option value="draft">Draft</option>
                                                <option value="active">Active</option>
                                                <option value="paused">Paused</option>
                                                <option value="expired">Expired</option>
                                            </select>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    name="isActive"
                                                    checked={settings.isActive}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">Active</span>
                                            </label>

                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    name="isFeatured"
                                                    checked={settings.isFeatured}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">Featured</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Submit Buttons */}
                                    <div className="flex justify-end space-x-4 border-t pt-6">
                                        <button
                                            type="button"
                                            onClick={() => setShowForm(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className={`px-6 py-2 rounded-md text-white font-semibold transition-colors ${
                                                saving 
                                                    ? 'bg-gray-400 cursor-not-allowed' 
                                                    : 'bg-purple-600 hover:bg-purple-700'
                                            }`}
                                        >
                                            {saving ? 'Saving...' : isEditing ? 'Update Offer' : 'Create Offer'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Media Selection Modal */}
                {mediaModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center">
                        <div className="bg-white rounded-lg p-6 max-w-4xl max-h-screen overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Select Background Image</h3>
                                <button
                                    onClick={() => setMediaModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            {loadingMedia ? (
                                <div className="flex justify-center items-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                                    {mediaFiles.map((file) => (
                                        <div
                                            key={file._id}
                                            className="cursor-pointer border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                                            onClick={() => handleSelectImage(file.awsUrl || file.url)}
                                        >
                                            <img
                                                src={file.awsUrl || file.url}
                                                alt={file.title || file.fileName}
                                                className="w-full h-24 object-cover"
                                            />
                                            <div className="p-2">
                                                <p className="text-xs text-gray-600 truncate">
                                                    {file.title || file.fileName}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </PermissionGuard>
    );
};

export default Offer;
