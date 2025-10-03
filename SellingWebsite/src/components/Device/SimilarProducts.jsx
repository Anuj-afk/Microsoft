import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../ProductCard';

const SimilarProducts = ({ device, similarProducts, similarProductsLoading }) => {
    // Filter out the current product and out-of-stock products as safety measures
    const filteredSimilarProducts = similarProducts.filter(product => {
        // Exclude current product
        if (product._id === device._id || product.id === device._id) {
            return false;
        }
        
        // Exclude out-of-stock products
        if (product.stock && product.stock.trackStock && product.stock.quantity === 0) {
            return false;
        }
        
        return true;
    });

    if (filteredSimilarProducts.length === 0 && !similarProductsLoading) return null;

    return (
        <div className="bg-white rounded-lg p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Similar Products
                    </h2>
                </div>
                {device.category && (
                    <Link
                        to={`/products/${device.category.slug}`}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1"
                    >
                        View All in {device.category.name}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                )}
            </div>

            {similarProductsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredSimilarProducts.slice(0, 4).map((product) => (
                            <div key={product._id || product.id} className="transform transition-transform duration-300 hover:scale-105">
                                <div className="relative">
                                    <ProductCard product={product} />
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Show matching criteria info */}
                    {filteredSimilarProducts.length > 0 && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                                Why these products are similar:
                            </h4>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                {device.tags && device.tags.length > 0 && (
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                        <span>Matching tags: {device.tags.slice(0, 3).join(', ')}</span>
                                    </div>
                                )}
                                {device.category && (
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                        <span>Same category: {device.category.name}</span>
                                    </div>
                                )}
                                {device.brand && (
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                        <span>Same brand: {device.brand}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {filteredSimilarProducts.length > 4 && (
                <div className="text-center mt-6">
                    <Link
                        to={device.category ? `/products/${device.category.slug}` : '/products'}
                        className="inline-flex items-center px-6 py-3 border border-purple-600 text-purple-600 rounded-md hover:bg-purple-50 transition duration-300"
                    >
                        View More Similar Products
                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default SimilarProducts;