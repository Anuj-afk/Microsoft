import { Link } from "react-router-dom";

// Product Card Component
const ProductCard = ({ product }) => {
    // Handle both old mock data structure and new API data structure
    const productId = product._id || product.id;
    const productName = product.name;
    const productPrice = product.price;
    const productOriginalPrice = product.originalPrice;
    const productImage = product.primaryImage || product.images?.[0]?.url || product.image || 'https://via.placeholder.com/300x200?text=No+Image';
    const productCategory = product.category?.name || product.category;
    const productSpecs = product.shortDescription || product.specs || '';
    const productTag = product.featured ? 'Featured' : product.tag || null;
    const productBrand = product.brand;
    const productModel = product.model;
    const stockStatus = product.stockStatus || 'in-stock';
    
    // Use basicSpecs for product cards, fallback to old specifications
    const basicSpecs = product.basicSpecs || [];
    const fallbackSpecs = product.specifications || [];

    // Calculate discount percentage if original price exists
    const discountPercentage = productOriginalPrice && productOriginalPrice > productPrice 
        ? Math.round(((productOriginalPrice - productPrice) / productOriginalPrice) * 100)
        : 0;

    // Get specifications as a single line string - prioritize basicSpecs
    const getSpecsLine = () => {
        let specsToUse = [];
        
        // First try basicSpecs
        if (Array.isArray(basicSpecs) && basicSpecs.length > 0) {
            specsToUse = basicSpecs
                .filter(spec => spec && spec.key && spec.value)
                .map(spec => spec.value)
                .slice(0, 6);
        }
        // Fallback to old specifications format
        else if (Array.isArray(fallbackSpecs) && fallbackSpecs.length > 0) {
            specsToUse = fallbackSpecs
                .filter(spec => spec && spec.key && spec.value)
                .map(spec => spec.value)
                .slice(0, 6);
        }
        
        return specsToUse.join(', ');
    };

    const specsLine = getSpecsLine();

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:-translate-y-2 h-[500px] flex flex-col">
            {/* Image Section - Fixed Height */}
            <div className="relative h-48 flex-shrink-0">
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
                {discountPercentage > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        -{discountPercentage}%
                    </div>
                )}
                {stockStatus === 'out-of-stock' && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-bold">Out of Stock</span>
                    </div>
                )}
            </div>
            
            {/* Content Section - Remaining Height (232px) */}
            <div className="flex flex-col flex-grow p-4">
                {/* Category and Brand Section - Fixed Height */}
                <div className="h-5 flex items-center gap-2 mb-2">
                    <p className="text-sm text-gray-500 truncate">
                        {productCategory}
                    </p>
                    {productBrand && (
                        <>
                            <span className="text-gray-300 flex-shrink-0">•</span>
                            <p className="text-sm text-gray-500 truncate">
                                {productBrand}
                            </p>
                        </>
                    )}
                </div>

                {/* Product Name Section - Fixed Height */}
                <div className="h-14 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 line-clamp-2 leading-tight">
                        {productName}
                    </h3>
                </div>

                {/* Model Section - Fixed Height */}
                <div className="h-5 mb-3">
                    {productModel && (
                        <p className="text-sm text-gray-600 truncate">
                            Model: {productModel}
                        </p>
                    )}
                </div>
                
                {/* Specifications Section - Fixed Height */}
                <div className="h-10 mb-3">
                    {specsLine ? (
                        <div className="bg-gray-50 rounded px-3 py-2 h-full flex items-center">
                            <p className="text-sm text-gray-700 line-clamp-2 leading-tight" title={specsLine}>
                                {specsLine}
                            </p>
                        </div>
                    ) : productSpecs ? (
                        <div className="h-full flex items-center">
                            <p className="text-sm text-gray-600 line-clamp-2 leading-tight">
                                {productSpecs}
                            </p>
                        </div>
                    ) : (
                        <div className="h-full"></div>
                    )}
                </div>
                
                {/* Price Section - Fixed Height */}
                <div className="h-12 flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                        <p className="text-lg font-bold text-purple-600 leading-tight">
                            ₹{typeof productPrice === 'number' ? productPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : productPrice}
                        </p>
                        {productOriginalPrice && productOriginalPrice > productPrice && (
                            <p className="text-sm text-gray-500 line-through leading-tight">
                                ₹{productOriginalPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </p>
                        )}
                    </div>
                    {stockStatus === 'low-stock' && (
                        <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded flex-shrink-0">
                            Low Stock
                        </span>
                    )}
                </div>
                
                {/* Buttons Section - Fixed Height at Bottom */}
                <div className="h-10 flex space-x-2 mt-auto">
                    <button 
                        className={`flex-1 px-4 py-2 font-medium rounded transition duration-300 text-sm ${
                            stockStatus === 'out-of-stock'
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                        disabled={stockStatus === 'out-of-stock'}
                    >
                        {stockStatus === 'out-of-stock' ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <Link
                        to={`/product/${productId}`}
                        className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition duration-300 text-sm flex items-center justify-center"
                    >
                        Details
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;