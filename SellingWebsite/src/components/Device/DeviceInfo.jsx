import React from 'react';

const DeviceInfo = ({ device, quantity, setQuantity, handleAddToCart, handleBuyNow }) => {
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(price);
    };

    const getStockStatus = () => {
        if (!device.stock.trackStock) return { status: 'Available', color: 'text-green-600' };
        
        const quantity = device.stock.quantity;
        const threshold = device.stock.lowStockThreshold;
        
        if (quantity === 0) return { status: 'Out of Stock', color: 'text-red-600' };
        if (quantity <= threshold) return { status: `Only ${quantity} left`, color: 'text-orange-600' };
        return { status: 'In Stock', color: 'text-green-600' };
    };

    const getDiscountPercentage = () => {
        if (device.originalPrice && device.originalPrice > device.price) {
            return Math.round(((device.originalPrice - device.price) / device.originalPrice) * 100);
        }
        return 0;
    };

    const stockStatus = getStockStatus();
    const discountPercentage = getDiscountPercentage();
    const isOutOfStock = device.stock.trackStock && device.stock.quantity === 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span>{device.category?.name}</span>
                    {device.brand && (
                        <>
                            <span>•</span>
                            <span>{device.brand}</span>
                        </>
                    )}
                    {device.featured && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                            Featured
                        </span>
                    )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{device.name}</h1>
                {device.model && (
                    <p className="text-gray-600">Model: {device.model}</p>
                )}
                {device.sku && (
                    <p className="text-gray-500 text-sm">SKU: {device.sku}</p>
                )}
            </div>

            {/* Basic Specifications */}
            {device.basicSpecs && device.basicSpecs.length > 0 && (
                <div className="bg-gray-100 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Key Features</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {device.basicSpecs.map((spec, index) => (
                            spec.key && spec.value && (
                                <div key={index} className="flex justify-between">
                                    <span className="text-gray-600 text-sm">{spec.key}:</span>
                                    <span className="text-gray-900 text-sm font-medium">{spec.value}</span>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            )}

            {/* Pricing */}
            <div className="space-y-2">
                <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-purple-600">
                        {formatPrice(device.price)}
                    </span>
                    {device.originalPrice && device.originalPrice > device.price && (
                        <>
                            <span className="text-xl text-gray-500 line-through">
                                {formatPrice(device.originalPrice)}
                            </span>
                            {discountPercentage > 0 && (
                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-medium">
                                    {discountPercentage}% OFF
                                </span>
                            )}
                        </>
                    )}
                </div>
                <p className={`text-sm ${stockStatus.color}`}>
                    {stockStatus.status}
                </p>
            </div>

            {/* Short Description */}
            {device.shortDescription && (
                <div>
                    <p className="text-gray-700">{device.shortDescription}</p>
                </div>
            )}

            {/* Quantity and Actions */}
            <div className="space-y-4">
                {!isOutOfStock && (
                    <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700">Quantity:</label>
                        <div className="flex items-center border border-gray-300 rounded-md">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="px-3 py-2 text-gray-600 hover:text-gray-800"
                            >
                                -
                            </button>
                            <span className="px-4 py-2 border-l border-r border-gray-300">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="px-3 py-2 text-gray-600 hover:text-gray-800"
                            >
                                +
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex space-x-4">
                    <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className={`flex-1 px-6 py-3 rounded-md font-medium transition duration-300 ${
                            isOutOfStock
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                    >
                        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <button
                        onClick={handleBuyNow}
                        disabled={isOutOfStock}
                        className={`flex-1 px-6 py-3 rounded-md font-medium border transition duration-300 ${
                            isOutOfStock
                                ? 'border-gray-400 text-gray-400 cursor-not-allowed'
                                : 'border-purple-600 text-purple-600 hover:bg-purple-50'
                        }`}
                    >
                        Buy Now
                    </button>
                </div>
            </div>

            {/* Tags */}
            {device.tags && device.tags.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Tags:</h3>
                    <div className="flex flex-wrap gap-2">
                        {device.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeviceInfo;