import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { API_ENDPOINTS } from "../../../config/api.js";
import PermissionGuard from "../../../components/PermissionGuard";
import { usePermissions } from "../../../hooks/usePermissions";

const AddDevice = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;
    const { canManageProducts } = usePermissions();

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        category: "",
        description: "",
        shortDescription: "",
        price: "",
        originalPrice: "",
        discount: 0,
        brand: "",
        model: "",
        sku: "",
        // Basic specifications for product cards
        basicSpecs: [
            { key: "Processor", value: "" },
            { key: "Memory", value: "" },
            { key: "Storage", value: "" },
            { key: "Display", value: "" },
            { key: "Graphics", value: "" },
            { key: "Operating System", value: "" }
        ],
        // Detailed specifications organized by categories
        detailedSpecs: [
            {
                category: "Performance",
                specs: [
                    { key: "Processor", value: "" },
                    { key: "Memory", value: "" },
                    { key: "Graphics", value: "" },
                    { key: "Chipset", value: "" }
                ]
            },
            {
                category: "Storage",
                specs: [
                    { key: "Primary Storage", value: "" },
                    { key: "Secondary Storage", value: "" },
                    { key: "Storage Type", value: "" }
                ]
            },
            {
                category: "Display",
                specs: [
                    { key: "Screen Size", value: "" },
                    { key: "Resolution", value: "" },
                    { key: "Panel Type", value: "" },
                    { key: "Refresh Rate", value: "" }
                ]
            },
            {
                category: "Connectivity",
                specs: [
                    { key: "WiFi", value: "" },
                    { key: "Bluetooth", value: "" },
                    { key: "USB Ports", value: "" },
                    { key: "Other Ports", value: "" }
                ]
            },
            {
                category: "Physical",
                specs: [
                    { key: "Dimensions", value: "" },
                    { key: "Weight", value: "" },
                    { key: "Color", value: "" },
                    { key: "Material", value: "" }
                ]
            },
            {
                category: "Software & Warranty",
                specs: [
                    { key: "Operating System", value: "" },
                    { key: "Pre-installed Software", value: "" },
                    { key: "Warranty", value: "" },
                    { key: "Support", value: "" }
                ]
            }
        ],
        // Keep old specifications for backward compatibility
        specifications: [],
        images: [],
        stock: {
            quantity: 0,
            lowStockThreshold: 5,
            trackStock: true,
        },
        status: "draft",
        featured: false,
        tags: [],
        metaData: {
            title: "",
            description: "",
            keywords: [],
        },
    });

    const [categories, setCategories] = useState([]);
    const [mediaFiles, setMediaFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [mediaModalOpen, setMediaModalOpen] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(null);
    const [loadingMedia, setLoadingMedia] = useState(false);

    // Tag and keyword input states
    const [currentTag, setCurrentTag] = useState("");
    const [currentKeyword, setCurrentKeyword] = useState("");

    useEffect(() => {
        fetchInitialData();
    }, [id, isEditMode]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);

            // Fetch categories
            const categoriesResponse = await api.get(API_ENDPOINTS.CATEGORIES.BASE);
            setCategories(categoriesResponse.data);

            // If editing, fetch device data
            if (isEditMode) {
                const deviceResponse = await api.get(API_ENDPOINTS.DEVICES.BY_ID(id));
                const device = deviceResponse.data;

                setFormData({
                    ...device,
                    tags: device.tags || [],
                    metaData: {
                        title: device.metaData?.title || "",
                        description: device.metaData?.description || "",
                        keywords: device.metaData?.keywords || [],
                    },
                    // Handle basicSpecs
                    basicSpecs: device.basicSpecs && device.basicSpecs.length > 0 
                        ? device.basicSpecs 
                        : [
                            { key: "Processor", value: "" },
                            { key: "Memory", value: "" },
                            { key: "Storage", value: "" },
                            { key: "Display", value: "" },
                            { key: "Graphics", value: "" },
                            { key: "Operating System", value: "" }
                        ],
                    // Handle detailedSpecs
                    detailedSpecs: device.detailedSpecs && device.detailedSpecs.length > 0
                        ? device.detailedSpecs
                        : [
                            {
                                category: "Performance",
                                specs: [
                                    { key: "Processor", value: "" },
                                    { key: "Memory", value: "" },
                                    { key: "Graphics", value: "" },
                                    { key: "Chipset", value: "" }
                                ]
                            },
                            {
                                category: "Storage",
                                specs: [
                                    { key: "Primary Storage", value: "" },
                                    { key: "Secondary Storage", value: "" },
                                    { key: "Storage Type", value: "" }
                                ]
                            },
                            {
                                category: "Display",
                                specs: [
                                    { key: "Screen Size", value: "" },
                                    { key: "Resolution", value: "" },
                                    { key: "Panel Type", value: "" },
                                    { key: "Refresh Rate", value: "" }
                                ]
                            },
                            {
                                category: "Connectivity",
                                specs: [
                                    { key: "WiFi", value: "" },
                                    { key: "Bluetooth", value: "" },
                                    { key: "USB Ports", value: "" },
                                    { key: "Other Ports", value: "" }
                                ]
                            },
                            {
                                category: "Physical",
                                specs: [
                                    { key: "Dimensions", value: "" },
                                    { key: "Weight", value: "" },
                                    { key: "Color", value: "" },
                                    { key: "Material", value: "" }
                                ]
                            },
                            {
                                category: "Software & Warranty",
                                specs: [
                                    { key: "Operating System", value: "" },
                                    { key: "Pre-installed Software", value: "" },
                                    { key: "Warranty", value: "" },
                                    { key: "Support", value: "" }
                                ]
                            }
                        ],
                    // Keep old specifications for backward compatibility
                    specifications: device.specifications || []
                });
            }

            setLoading(false);
        } catch (err) {
            console.error("Error fetching initial data:", err);
            setError("Failed to load data");
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
            setLoadingMedia(false);
        } catch (err) {
            console.error("Error fetching media files:", err);
            setMediaFiles([]);
            setLoadingMedia(false);
        }
    };

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.includes(".")) {
            const [parent, child] = name.split(".");
            setFormData((prev) => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: type === "checkbox" ? checked : value,
                },
            }));
        } else {
            let newValue = type === "checkbox" ? checked : value;

            // Auto-generate slug when name changes
            if (name === "name" && value) {
                const slug = generateSlug(value);
                setFormData((prev) => ({
                    ...prev,
                    name: value,
                    slug: slug,
                }));
                return;
            }

            setFormData((prev) => ({
                ...prev,
                [name]: newValue,
            }));
        }
    };

    // Handle basic specification changes
    const handleBasicSpecChange = (index, field, value) => {
        const updatedSpecs = [...formData.basicSpecs];
        updatedSpecs[index] = {
            ...updatedSpecs[index],
            [field]: value,
        };
        setFormData({
            ...formData,
            basicSpecs: updatedSpecs,
        });
    };

    // Add new basic specification
    const addBasicSpec = () => {
        setFormData({
            ...formData,
            basicSpecs: [
                ...formData.basicSpecs,
                { key: "", value: "" },
            ],
        });
    };

    // Remove basic specification
    const removeBasicSpec = (index) => {
        const updatedSpecs = formData.basicSpecs.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            basicSpecs: updatedSpecs,
        });
    };

    // Handle detailed specification changes
    const handleDetailedSpecChange = (categoryIndex, specIndex, field, value) => {
        const updatedDetailedSpecs = [...formData.detailedSpecs];
        updatedDetailedSpecs[categoryIndex].specs[specIndex] = {
            ...updatedDetailedSpecs[categoryIndex].specs[specIndex],
            [field]: value,
        };
        setFormData({
            ...formData,
            detailedSpecs: updatedDetailedSpecs,
        });
    };

    // Handle detailed spec category name change
    const handleDetailedSpecCategoryChange = (categoryIndex, newCategoryName) => {
        const updatedDetailedSpecs = [...formData.detailedSpecs];
        updatedDetailedSpecs[categoryIndex].category = newCategoryName;
        setFormData({
            ...formData,
            detailedSpecs: updatedDetailedSpecs,
        });
    };

    // Add new detailed specification category
    const addDetailedSpecCategory = () => {
        setFormData({
            ...formData,
            detailedSpecs: [
                ...formData.detailedSpecs,
                {
                    category: "",
                    specs: [{ key: "", value: "" }]
                },
            ],
        });
    };

    // Remove detailed specification category
    const removeDetailedSpecCategory = (categoryIndex) => {
        const updatedSpecs = formData.detailedSpecs.filter((_, i) => i !== categoryIndex);
        setFormData({
            ...formData,
            detailedSpecs: updatedSpecs,
        });
    };

    // Add new spec to detailed category
    const addSpecToCategory = (categoryIndex) => {
        const updatedDetailedSpecs = [...formData.detailedSpecs];
        updatedDetailedSpecs[categoryIndex].specs.push({ key: "", value: "" });
        setFormData({
            ...formData,
            detailedSpecs: updatedDetailedSpecs,
        });
    };

    // Remove spec from detailed category
    const removeSpecFromCategory = (categoryIndex, specIndex) => {
        const updatedDetailedSpecs = [...formData.detailedSpecs];
        updatedDetailedSpecs[categoryIndex].specs = updatedDetailedSpecs[categoryIndex].specs.filter((_, i) => i !== specIndex);
        setFormData({
            ...formData,
            detailedSpecs: updatedDetailedSpecs,
        });
    };

    const handleArrayAdd = (arrayType, value, inputSetter) => {
        if (!value.trim()) return;

        if (arrayType === "tags") {
            if (!formData.tags.includes(value.toLowerCase())) {
                setFormData((prev) => ({
                    ...prev,
                    tags: [...prev.tags, value.toLowerCase()],
                }));
            }
        } else if (arrayType === "keywords") {
            if (!formData.metaData.keywords.includes(value.toLowerCase())) {
                setFormData((prev) => ({
                    ...prev,
                    metaData: {
                        ...prev.metaData,
                        keywords: [
                            ...prev.metaData.keywords,
                            value.toLowerCase(),
                        ],
                    },
                }));
            }
        }

        inputSetter("");
    };

    const handleArrayRemove = (arrayType, index) => {
        if (arrayType === "tags") {
            setFormData((prev) => ({
                ...prev,
                tags: prev.tags.filter((_, i) => i !== index),
            }));
        } else if (arrayType === "keywords") {
            setFormData((prev) => ({
                ...prev,
                metaData: {
                    ...prev.metaData,
                    keywords: prev.metaData.keywords.filter(
                        (_, i) => i !== index
                    ),
                },
            }));
        }
    };

    const handleOpenMediaModal = (index = null) => {
        setActiveImageIndex(index);
        setMediaModalOpen(true);
        fetchMediaFiles();
    };

    const handleSelectImage = (imageUrl) => {
        if (activeImageIndex === null) {
            // Adding new image
            setFormData((prev) => ({
                ...prev,
                images: [
                    ...prev.images,
                    {
                        url: imageUrl,
                        alt: "",
                        isPrimary: prev.images.length === 0,
                    },
                ],
            }));
        } else {
            // Replacing existing image
            setFormData((prev) => ({
                ...prev,
                images: prev.images.map((img, i) =>
                    i === activeImageIndex ? { ...img, url: imageUrl } : img
                ),
            }));
        }
        setMediaModalOpen(false);
    };

    const handleImageRemove = (index) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const handleSetPrimaryImage = (index) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.map((img, i) => ({
                ...img,
                isPrimary: i === index,
            })),
        }));
    };

    const handleImageAltChange = (index, alt) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.map((img, i) =>
                i === index ? { ...img, alt } : img
            ),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError(null);

            // Validate required fields
            if (
                !formData.name ||
                !formData.category ||
                !formData.price ||
                !formData.brand ||
                !formData.model
            ) {
                setError("Please fill in all required fields");
                setSaving(false);
                return;
            }

            let response;
            if (isEditMode) {
                response = await api.put(API_ENDPOINTS.DEVICES.BY_ID(id), formData);
            } else {
                response = await api.post(API_ENDPOINTS.DEVICES.BASE, formData);
            }

            setSuccessMessage(
                isEditMode
                    ? "Device updated successfully!"
                    : "Device created successfully!"
            );

            // Clear error message after success
            setTimeout(() => {
                setSuccessMessage("");
                navigate("/admin/devices/all");
            }, 2000);
        } catch (err) {
            console.error("Error saving device:", err);
            setError(
                err.response?.data?.error ||
                    (isEditMode
                        ? "Failed to update device"
                        : "Failed to create device")
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <PermissionGuard permissions={['manage_products', 'view_products']}>
            <div className="max-w-6xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    {isEditMode ? "Edit Device" : "Add New Device"}
                </h1>
                <p className="text-gray-600 mt-2">
                    {isEditMode
                        ? "Update device information"
                        : "Create a new device for your catalog"}
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
                    {successMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Basic Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Device Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                readOnly={canManageProducts ? false : true}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Slug
                            </label>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleInputChange}
                                readOnly={canManageProducts ? false : true}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category *
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                disabled={canManageProducts ? false : true}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                                required
                            >
                                <option value="">Select Category</option>
                                {categories
                                    .filter((cat) => cat.isActive)
                                    .map((category) => (
                                        <option
                                            key={category._id}
                                            value={category._id}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Brand *
                            </label>
                            <input
                                type="text"
                                name="brand"
                                value={formData.brand}
                                onChange={handleInputChange}
                                readOnly={canManageProducts ? false : true}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Model *
                            </label>
                            <input
                                type="text"
                                name="model"
                                value={formData.model}
                                onChange={handleInputChange}
                                readOnly={canManageProducts ? false : true}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                SKU
                            </label>
                            <input
                                type="text"
                                name="sku"
                                value={formData.sku}
                                onChange={handleInputChange}
                                readOnly={canManageProducts ? false : true}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Short Description
                        </label>
                        <input
                            type="text"
                            name="shortDescription"
                            value={formData.shortDescription}
                            onChange={handleInputChange}
                            maxLength={200}
                            readOnly={canManageProducts ? false : true}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                            placeholder="Brief description (max 200 characters)"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            {formData.shortDescription.length}/200 characters
                        </p>
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            readOnly={canManageProducts ? false : true}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                            placeholder="Detailed description of the device"
                        />
                    </div>
                </div>

                {/* Pricing & Status */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Pricing & Status
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Price (₹) *
                            </label>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                min="0"
                                step="0.01"
                                readOnly={canManageProducts ? false : true}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                                placeholder="e.g., 25000"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Original Price (₹)
                            </label>
                            <input
                                type="number"
                                id="originalPrice"
                                name="originalPrice"
                                value={formData.originalPrice}
                                onChange={handleInputChange}
                                min="0"
                                step="0.01"
                                readOnly={canManageProducts ? false : true}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                                placeholder="e.g., 30000"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Leave empty if same as price
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Discount (%)
                            </label>
                            <input
                                type="number"
                                name="discount"
                                value={formData.discount}
                                onChange={handleInputChange}
                                min="0"
                                max="100"
                                readOnly={canManageProducts ? false : true}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                disabled={canManageProducts ? false : true}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                            >
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="discontinued">
                                    Discontinued
                                </option>
                            </select>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="featured"
                                checked={formData.featured}
                                onChange={handleInputChange}
                                disabled={canManageProducts ? false : true}
                                className={`h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded ${canManageProducts ? '' : 'cursor-not-allowed'}`}
                            />
                            <label className="ml-2 block text-sm text-gray-700">
                                Featured Device
                            </label>
                        </div>
                    </div>
                </div>

                {/* Images */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Images
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {formData.images.map((image, index) => (
                            <div
                                key={index}
                                className="relative border border-gray-300 rounded-lg p-4"
                            >
                                <img
                                    src={image.url}
                                    alt={image.alt || "Device image"}
                                    className="w-full h-40 object-cover rounded mb-2"
                                />

                                <input
                                    type="text"
                                    placeholder="Alt text"
                                    value={image.alt}
                                    onChange={(e) =>
                                        handleImageAltChange(
                                            index,
                                            e.target.value
                                        )
                                    }
                                    readOnly={canManageProducts ? false : true}
                                    className={`w-full px-2 py-1 text-sm border border-gray-300 rounded mb-2 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                                />

                                <div className="flex justify-between items-center">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSetPrimaryImage(index)
                                        }
                                        disabled={canManageProducts ? false : true}
                                        className={`px-2 py-1 text-xs rounded ${
                                            image.isPrimary
                                                ? "bg-green-100 text-green-800 border border-green-300"
                                                : "bg-gray-100 text-gray-600 border border-gray-300"
                                        } ${canManageProducts ? '' : 'cursor-not-allowed'}`}
                                    >
                                        {image.isPrimary
                                            ? "Primary"
                                            : "Set Primary"}
                                    </button>

                                    <div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleOpenMediaModal(index)
                                            }
                                            disabled={canManageProducts ? false : true}
                                            className={`px-2 py-1 text-xs bg-blue-100 text-blue-600 border border-blue-300 rounded mr-2 ${canManageProducts ? '' : 'cursor-not-allowed'}`}
                                        >
                                            Change
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleImageRemove(index)
                                            }
                                            disabled={canManageProducts ? false : true}
                                            className={`px-2 py-1 text-xs bg-red-100 text-red-600 border border-red-300 rounded ${canManageProducts ? '' : 'cursor-not-allowed'}`}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() => handleOpenMediaModal()}
                            disabled={canManageProducts ? false : true}
                            className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors ${canManageProducts ? '' : 'cursor-not-allowed'}`}
                        >
                            <div className="text-gray-400">
                                <svg
                                    className="mx-auto h-12 w-12 mb-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
                                </svg>
                                <p>Add Image</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Stock Management */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Stock Management
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Stock Quantity
                            </label>
                            <input
                                type="number"
                                name="stock.quantity"
                                value={formData.stock.quantity}
                                onChange={handleInputChange}
                                min="0"
                                disabled={canManageProducts ? false : true}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Low Stock Threshold
                            </label>
                            <input
                                type="number"
                                name="stock.lowStockThreshold"
                                value={formData.stock.lowStockThreshold}
                                onChange={handleInputChange}
                                min="0"
                                disabled={canManageProducts ? false : true}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="stock.trackStock"
                                checked={formData.stock.trackStock}
                                onChange={handleInputChange}
                                disabled={canManageProducts ? false : true}
                                className={`h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded ${canManageProducts ? '' : 'cursor-not-allowed'}`}
                            />
                            <label className="ml-2 block text-sm text-gray-700">
                                Track Stock
                            </label>
                        </div>
                    </div>
                </div>

                {/* Basic Specifications (for Product Cards) */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                Basic Specifications
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Key specs shown on product cards (keep it concise - max 6 specs recommended)
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={addBasicSpec}
                            disabled={canManageProducts ? false : true}
                            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 ${canManageProducts ? '' : 'cursor-not-allowed'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Basic Spec
                        </button>
                    </div>

                    <div className="space-y-4">
                        {formData.basicSpecs.map((spec, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Specification Name
                                    </label>
                                    <input
                                        type="text"
                                        value={spec.key}
                                        onChange={(e) => handleBasicSpecChange(index, "key", e.target.value)}
                                        placeholder="e.g., Processor, RAM, Storage"
                                        disabled={canManageProducts ? false : true}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Value (Keep Short)
                                        </label>
                                        <input
                                            type="text"
                                            value={spec.value}
                                            onChange={(e) => handleBasicSpecChange(index, "value", e.target.value)}
                                            placeholder="e.g., Intel i7, 16GB, 512GB SSD"
                                            disabled={canManageProducts ? false : true}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={() => removeBasicSpec(index)}
                                            disabled={canManageProducts ? false : true}
                                            className={`px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md ${canManageProducts ? '' : 'cursor-not-allowed'}`}
                                            title="Remove basic specification"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {formData.basicSpecs.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p>No basic specifications added yet.</p>
                                <p className="text-sm">Click "Add Basic Spec" to get started.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detailed Specifications (for Product Pages) */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                Detailed Specifications
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Comprehensive specs organized by categories for product detail pages
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={addDetailedSpecCategory}
                            disabled={canManageProducts ? false : true}
                            className={`px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2 ${canManageProducts ? '' : 'cursor-not-allowed'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Category
                        </button>
                    </div>

                    <div className="space-y-6">
                        {formData.detailedSpecs.map((category, categoryIndex) => (
                            <div key={categoryIndex} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex-1 mr-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Category Name
                                        </label>
                                        <input
                                            type="text"
                                            value={category.category}
                                            onChange={(e) => handleDetailedSpecCategoryChange(categoryIndex, e.target.value)}
                                            placeholder="e.g., Performance, Display, Connectivity"
                                            disabled={canManageProducts ? false : true}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => addSpecToCategory(categoryIndex)}
                                            className={`px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 ${canManageProducts ? '' : 'cursor-not-allowed'}`}
                                            disabled={canManageProducts ? false : true}
                                            title="Add specification to this category"
                                        >
                                            + Spec
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeDetailedSpecCategory(categoryIndex)}
                                            className={`px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md ${canManageProducts ? '' : 'cursor-not-allowed'}`}
                                            disabled={canManageProducts ? false : true}
                                            title="Remove entire category"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {category.specs.map((spec, specIndex) => (
                                        <div key={specIndex} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-white border border-gray-200 rounded-md">
                                            <div>
                                                <input
                                                    type="text"
                                                    value={spec.key}
                                                    onChange={(e) => handleDetailedSpecChange(categoryIndex, specIndex, "key", e.target.value)}
                                                    placeholder="Specification name"
                                                    disabled={canManageProducts ? false : true}
                                                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={spec.value}
                                                    onChange={(e) => handleDetailedSpecChange(categoryIndex, specIndex, "value", e.target.value)}
                                                    placeholder="Detailed specification value"
                                                    disabled={canManageProducts ? false : true}
                                                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeSpecFromCategory(categoryIndex, specIndex)}
                                                    disabled={canManageProducts ? false : true}
                                                    className={`px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md ${canManageProducts ? '' : 'cursor-not-allowed'}`}
                                                    title="Remove this specification"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {formData.detailedSpecs.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p>No detailed specification categories added yet.</p>
                                <p className="text-sm">Click "Add Category" to get started.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tags */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Tags
                    </h2>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={currentTag}
                            onChange={(e) => setCurrentTag(e.target.value)}
                            placeholder="Add tag"
                            disabled={canManageProducts ? false : true}
                            className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                        />
                        <button
                            type="button"
                            onClick={() =>
                                handleArrayAdd(
                                    "tags",
                                    currentTag,
                                    setCurrentTag
                                )
                            }
                            disabled={canManageProducts ? false : true}
                            className={`px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 ${canManageProducts ? '' : 'cursor-not-allowed'}`}
                        >
                            Add Tag
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleArrayRemove("tags", index)
                                    }
                                    disabled={canManageProducts ? false : true}
                                    className={`ml-2 text-blue-600 hover:text-blue-800 ${canManageProducts ? '' : 'cursor-not-allowed'}`}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* SEO Meta Data */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        SEO Meta Data
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Meta Title
                            </label>
                            <input
                                type="text"
                                name="metaData.title"
                                value={formData.metaData.title}
                                onChange={handleInputChange}
                                disabled={canManageProducts ? false : true}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Meta Description
                            </label>
                            <textarea
                                name="metaData.description"
                                value={formData.metaData.description}
                                onChange={handleInputChange}
                                rows={3}
                                disabled={canManageProducts ? false : true}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Meta Keywords
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={currentKeyword}
                                    onChange={(e) =>
                                        setCurrentKeyword(e.target.value)
                                    }
                                    placeholder="Add keyword"
                                    disabled={canManageProducts ? false : true}
                                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${canManageProducts ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleArrayAdd(
                                            "keywords",
                                            currentKeyword,
                                            setCurrentKeyword
                                        )
                                    }
                                    disabled={canManageProducts ? false : true}
                                    className={`px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 ${canManageProducts ? '' : 'cursor-not-allowed'}`}
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.metaData.keywords.map(
                                    (keyword, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                                        >
                                            {keyword}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleArrayRemove(
                                                        "keywords",
                                                        index
                                                    )
                                                }
                                                disabled={canManageProducts ? false : true}
                                                className={`ml-2 text-green-600 hover:text-green-800 ${canManageProducts ? '' : 'cursor-not-allowed'}`}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => navigate("/admin/devices/all")}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving || !canManageProducts}
                        className={`px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 ${canManageProducts ? '' : 'cursor-not-allowed'}`}
                    >
                        {saving
                            ? "Saving..."
                            : isEditMode
                            ? "Update Device"
                            : "Create Device"}
                    </button>
                </div>
            </form>

            {/* Media Modal */}
            {mediaModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-4xl max-h-[80vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                Select Image
                            </h3>
                            <button
                                onClick={() => setMediaModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {loadingMedia ? (
                            <div className="flex justify-center items-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {mediaFiles.map((file) => (
                                    <div
                                        key={file._id}
                                        className="cursor-pointer border border-gray-300 rounded-lg p-2 hover:border-purple-500"
                                        onClick={() =>
                                            handleSelectImage(file.awsUrl || file.url)
                                        }
                                    >
                                        <img
                                            src={file.awsUrl || file.url}
                                            alt={file.title}
                                            className="w-full h-20 object-cover rounded mb-1"
                                        />
                                        <p className="text-xs text-gray-600 truncate">
                                            {file.title}
                                        </p>
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

export default AddDevice;
