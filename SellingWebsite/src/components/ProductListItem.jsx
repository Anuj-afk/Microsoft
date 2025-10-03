import React from 'react';
import { Link } from 'react-router-dom';

// Product List Item Component

const ProductListItem = ({ product }) => {
    const productId = product._id;
    const productName = product.name;
    const productPrice = product.price;
    const productImage = product.primaryImage || product.images?.[0]?.url || 'https://via.placeholder.com/300x200?text=No+Image';
    const productCategory = product.category?.name || 'Uncategorized';
    const productBrand = product.brand;
    const productDescription = product.shortDescription || product.description || '';
    const productTag = product.featured ? 'Featured' : null;

    return (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex">
                <div className="flex-shrink-0 w-48 min-h-full relative">
                    <img
                        src={productImage}
                        alt={productName}
                        className="w-full h-full object-cover"
                    />
                    {productTag && (
                        <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                            {productTag}
                        </div>
                    )}
                </div>
                <div className="flex-1 p-6">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm text-gray-500">{productCategory}</span>
                                <span className="text-gray-300">•</span>
                                <span className="text-sm text-gray-500">{productBrand}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                {productName}
                            </h3>
                            {productDescription && (
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                    {productDescription}
                                </p>
                            )}
                            <div className="flex items-center gap-4">
                                <Link
                                    to={`/product/${productId}`}
                                    className="text-purple-600 hover:text-purple-800 font-medium"
                                >
                                    View Details →
                                </Link>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-bold text-purple-600 mb-4">
                                ₹{typeof productPrice === 'number' ? productPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : productPrice}
                            </p>
                            <button className="px-4 py-2 bg-purple-600 text-white font-medium rounded hover:bg-purple-700 transition duration-300">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductListItem;