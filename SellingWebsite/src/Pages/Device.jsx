import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import DeviceHeader from '../components/Device/DeviceHeader';
import DeviceImages from '../components/Device/DeviceImages';
import DeviceInfo from '../components/Device/DeviceInfo';
import DeviceDescription from '../components/Device/DeviceDescription';
import DeviceSpecifications from '../components/Device/DeviceSpecifications';
import SimilarProducts from '../components/Device/SimilarProducts';
import DeviceReviews from '../components/Device/DeviceReviews';
import DeviceMetaInfo from '../components/Device/DeviceMetaInfo';
import api, { API_ENDPOINTS } from '../config/api.js';

const Device = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [device, setDevice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [activeSpecTab, setActiveSpecTab] = useState(0);

    // Similar products state
    const [similarProducts, setSimilarProducts] = useState([]);
    const [similarProductsLoading, setSimilarProductsLoading] = useState(false);

    useEffect(() => {
        fetchDevice();
    }, [id]);

    useEffect(() => {
        if (device) {
            fetchSimilarProducts();
        }
    }, [device]);

    const fetchDevice = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get(API_ENDPOINTS.DEVICES.BY_ID(id));
            setDevice(response.data);
            
            if (response.data.images && response.data.images.length > 0) {
                setSelectedImage(0);
            }
            
        } catch (err) {
            console.error('Error fetching device:', err);
            setError(err.response?.data?.message || 'Failed to load device details');
        } finally {
            setLoading(false);
        }
    };

    const fetchSimilarProducts = async () => {
        try {
            setSimilarProductsLoading(true);
            
            // Build base query parameters
            const baseParams = {
                limit: '20', // Get more to filter and sort
                status: 'active'
            };

            // Always exclude current product ID
            if (id) {
                baseParams.exclude = id;
            }

            console.log('Fetching similar products with params:', baseParams);

            const response = await api.get(
                API_ENDPOINTS.DEVICES.BASE + `?${new URLSearchParams(baseParams)}`
            );
            
            let allProducts = response.data.devices || [];
            
            // Filter out current product and out-of-stock products
            allProducts = allProducts.filter(product => {
                // Exclude current product
                if (product._id === id || product._id === device._id) {
                    return false;
                }
                
                // Exclude out-of-stock products
                if (product.stock && product.stock.trackStock && product.stock.quantity === 0) {
                    return false;
                }
                
                return true;
            });

            // Calculate similarity scores based on tags, category, and brand
            const currentTags = device.tags || [];
            const currentCategory = device.category?._id;
            const currentBrand = device.brand;

            const productsWithScores = allProducts.map(product => {
                let score = 0;
                
                // Tag matching (highest priority) - 3 points per matching tag
                const productTags = product.tags || [];
                const matchingTags = currentTags.filter(tag => 
                    productTags.some(pTag => pTag.toLowerCase() === tag.toLowerCase())
                );
                score += matchingTags.length * 3;
                
                // Same category - 2 points
                if (product.category?._id === currentCategory) {
                    score += 2;
                }
                
                // Same brand - 1 point
                if (product.brand && currentBrand && 
                    product.brand.toLowerCase() === currentBrand.toLowerCase()) {
                    score += 1;
                }
                
                return {
                    ...product,
                    similarityScore: score,
                    matchingTags: matchingTags.length
                };
            });

            // Sort by similarity score (highest first), then by creation date
            productsWithScores.sort((a, b) => {
                if (b.similarityScore !== a.similarityScore) {
                    return b.similarityScore - a.similarityScore;
                }
                // If same score, prefer newer products
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            // Take top 8 products
            const similarProducts = productsWithScores.slice(0, 8);

            console.log('Similar products analysis:');
            console.log('Current product tags:', currentTags);
            console.log('Current product category:', device.category?.name);
            console.log('Current product brand:', currentBrand);
            console.log('Found products with scores:', similarProducts.map(p => ({
                name: p.name,
                score: p.similarityScore,
                matchingTags: p.matchingTags,
                tags: p.tags,
                inStock: p.stock?.trackStock ? p.stock.quantity > 0 : true
            })));
            
            setSimilarProducts(similarProducts);
            
        } catch (err) {
            console.error('Error fetching similar products:', err);
            setSimilarProducts([]);
        } finally {
            setSimilarProductsLoading(false);
        }
    };

    const handleAddToCart = () => {
        console.log(`Adding ${quantity} of ${device.name} to cart`);
    };

    const handleBuyNow = () => {
        console.log(`Buying ${quantity} of ${device.name}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-xl mb-4">Error Loading Device</div>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!device) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-gray-600 text-xl mb-4">Device Not Found</div>
                    <button 
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DeviceHeader device={device} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <DeviceImages 
                        device={device}
                        selectedImage={selectedImage}
                        setSelectedImage={setSelectedImage}
                    />
                    <DeviceInfo 
                        device={device}
                        quantity={quantity}
                        setQuantity={setQuantity}
                        handleAddToCart={handleAddToCart}
                        handleBuyNow={handleBuyNow}
                    />
                </div>

                <div className="mt-16 space-y-12">
                    <DeviceDescription device={device} />
                    
                    <DeviceSpecifications 
                        device={device}
                        activeSpecTab={activeSpecTab}
                        setActiveSpecTab={setActiveSpecTab}
                    />
                    
                    <SimilarProducts 
                        device={device}
                        similarProducts={similarProducts}
                        similarProductsLoading={similarProductsLoading}
                    />
                    
                    <DeviceReviews device={device} />
                    
                    <DeviceMetaInfo device={device} />
                </div>
            </div>
        </div>
    );
};

export default Device;