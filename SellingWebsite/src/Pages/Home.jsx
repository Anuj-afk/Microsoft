import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Banner from "../components/Banner";
import CategoryCard from "../components/CategoryCard";
import ProductCard from "../components/ProductCard";
import FeatureCard from "../components/FeatureCard";
import TestimonialCard from "../components/TestimonialCard";
import api, { API_ENDPOINTS, apiHelpers } from "../config/api.js";

const Home = () => {
    const [bannerSettings, setBannerSettings] = useState({
        slidingImages: [],
        staticImage: "",
    });
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [featuredProductsLoading, setFeaturedProductsLoading] = useState(true);
    const [offers, setOffers] = useState([]);
    const [offersLoading, setOffersLoading] = useState(true);

    useEffect(() => {
        // Fetch banner settings, categories, featured products, and offers
        Promise.all([
            fetchBannerSettings(),
            fetchCategories(),
            fetchFeaturedProducts(),
            fetchOffers(),
        ])
            .then(() => {
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching initial data:", err);
                setLoading(false);
            });
    }, []);

    // Fetch banner settings
    const fetchBannerSettings = async () => {
        try {
            const response = await api.get(API_ENDPOINTS.SETTINGS.BANNER);
            
            // Handle different response structures
            const settingsData = response.data.settings || response.data;
            setBannerSettings(settingsData);
            return settingsData;
        } catch (err) {
            console.error("Error fetching banner settings:", err);
            // Set empty settings if fetch fails
            setBannerSettings({
                slidingImages: [],
                staticImage: "",
            });
            throw err;
        }
    };

    // Fetch categories
    const fetchCategories = async () => {
        try {
            setCategoriesLoading(true);
            const response = await api.get(API_ENDPOINTS.CATEGORIES.BASE);
            
            // Handle different response structures
            let categoriesData = [];
            if (Array.isArray(response.data)) {
                categoriesData = response.data;
            } else if (response.data && Array.isArray(response.data.categories)) {
                categoriesData = response.data.categories;
            } else if (response.data && Array.isArray(response.data.data)) {
                categoriesData = response.data.data;
            }
            
            // Filter only active categories
            const activeCategories = categoriesData.filter(
                (category) => category.isActive
            );
            setCategories(activeCategories);
            setCategoriesLoading(false);
            return activeCategories;
        } catch (err) {
            console.error("Error fetching categories:", err);
            setCategories([]);
            setCategoriesLoading(false);
            throw err;
        }
    };

    // Fetch featured products
    const fetchFeaturedProducts = async () => {
        try {
            setFeaturedProductsLoading(true);
            
            // Build query parameters for featured products
            const queryParams = {
                featured: 'true',
                limit: '8',
                status: 'active'
            };
            
            const query = apiHelpers.buildQuery(queryParams);
            const response = await api.get(`${API_ENDPOINTS.DEVICES.BASE}${query}`);
            
            console.log('Featured products response:', response.data);
            
            // Handle different response structures
            let productsData = [];
            if (response.data.success) {
                productsData = response.data.devices || [];
            } else if (Array.isArray(response.data)) {
                productsData = response.data;
            } else if (response.data && Array.isArray(response.data.devices)) {
                productsData = response.data.devices;
            } else if (response.data && Array.isArray(response.data.data)) {
                productsData = response.data.data;
            }
            
            setFeaturedProducts(productsData);
            setFeaturedProductsLoading(false);
            return productsData;
        } catch (err) {
            console.error("Error fetching featured products:", err);
            setFeaturedProducts([]);
            setFeaturedProductsLoading(false);
            throw err;
        }
    };

    // Fetch offers
    const fetchOffers = async () => {
        try {
            setOffersLoading(true);

            // Try to fetch offers using centralized API
            const queryParams = {
                location: 'homepage',
                featured: 'true',
                limit: '3',
                status: 'active'
            };

            const query = apiHelpers.buildQuery(queryParams);
            
            try {
                // First try the offers endpoint
                const response = await api.get(`${API_ENDPOINTS.OFFERS.BASE}${query}`);
                console.log('Offers response:', response.data);

                // Handle different response structures
                let offersData = [];
                if (Array.isArray(response.data)) {
                    offersData = response.data;
                } else if (response.data && Array.isArray(response.data.offers)) {
                    offersData = response.data.offers;
                } else if (response.data && Array.isArray(response.data.data)) {
                    offersData = response.data.data;
                }

                setOffers(offersData);
                setOffersLoading(false);
                return offersData;
            } catch (apiError) {
                console.log('Centralized API failed, trying fallback:', apiError);
                
                // Fallback: get all offers and filter on frontend
                const fallbackResponse = await api.get(API_ENDPOINTS.OFFERS.BASE);
                const allOffers = fallbackResponse.data.offers || fallbackResponse.data || [];
                
                // Filter for homepage and featured offers on frontend
                const homepageOffers = Array.isArray(allOffers)
                    ? allOffers
                          .filter((offer) =>
                              offer.displayLocations?.includes("homepage") &&
                              offer.isFeatured &&
                              offer.isActive
                          )
                          .slice(0, 3)
                    : [];

                console.log('Filtered homepage offers:', homepageOffers);
                setOffers(homepageOffers);
                setOffersLoading(false);
                return homepageOffers;
            }
        } catch (err) {
            console.error("Error fetching offers:", err);
            setOffers([]);
            setOffersLoading(false);
            throw err;
        }
    };

    const handleOfferClick = async (offerId) => {
        try {
            // Track offer click
            await api.post(API_ENDPOINTS.OFFERS.CLICK(offerId));
        } catch (error) {
            console.error("Error tracking offer click:", error);
        }
    };

    const formatDiscount = (offer) => {
        if (offer.discountType === "percentage") {
            return `${offer.discountValue}% OFF`;
        } else if (offer.discountType === "fixed") {
            return `₹${offer.discountValue} OFF`;
        } else if (offer.discountType === "free_shipping") {
            return "FREE SHIPPING";
        } else if (offer.discountType === "buy_one_get_one") {
            return "BOGO";
        }
        return "SPECIAL OFFER";
    };

    const getOfferValidityText = (offer) => {
        const now = new Date();
        const endDate = new Date(offer.endDate);
        const timeDiff = endDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysLeft <= 0) {
            return "Offer Expired";
        } else if (daysLeft === 1) {
            return "Last Day!";
        } else if (daysLeft <= 3) {
            return `${daysLeft} Days Left!`;
        } else if (daysLeft <= 7) {
            return `Ends in ${daysLeft} days`;
        }
        return "";
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Banner Section */}
            <Banner bannerSettings={bannerSettings} loading={loading} />

            {/* Categories Section */}
            <section className="py-12 px-6 max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                    Browse Our Categories
                </h2>
                {categoriesLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="text-gray-500 mt-4">Loading categories...</p>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No categories available.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {categories.map((category) => (
                            <CategoryCard
                                key={category._id}
                                title={category.name}
                                image={
                                    category.featuredImage ||
                                    `https://source.unsplash.com/random/600x400/?${category.name}`
                                }
                                description={
                                    category.description ||
                                    `Browse our selection of ${category.name}`
                                }
                                slug={category.slug}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Featured Products Section */}
            <section className="py-12 px-6 max-w-7xl mx-auto bg-white">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">
                        Featured Products
                    </h2>
                    <Link
                        to="/products"
                        className="text-purple-600 hover:text-purple-800 font-medium"
                    >
                        View All <span className="ml-1">→</span>
                    </Link>
                </div>
                {featuredProductsLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="text-gray-500 mt-4">
                            Loading featured products...
                        </p>
                    </div>
                ) : featuredProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No featured products available at the moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {featuredProducts.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </section>

            {/* Dynamic Special Offers Section */}
            {offersLoading ? (
                <section className="py-16 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                        <p className="text-white mt-4">
                            Loading special offers...
                        </p>
                    </div>
                </section>
            ) : offers.length > 0 ? (
                <section className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                Special Offers
                            </h2>
                            <p className="text-gray-600 max-w-2xl mx-auto">
                                Don't miss out on these amazing deals and
                                limited-time offers!
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {offers.map((offer) => (
                                <div
                                    key={offer._id}
                                    className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                                    style={{
                                        background: offer.backgroundImage?.url
                                            ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${offer.backgroundImage.url})`
                                            : offer.backgroundColor,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        color: offer.textColor,
                                    }}
                                >
                                    <div className="p-8 relative z-10">
                                        {/* Discount Badge */}
                                        <div className="inline-block mb-4">
                                            <span
                                                className="px-4 py-2 rounded-full text-sm font-bold text-white"
                                                style={{
                                                    backgroundColor:
                                                        offer.badgeColor ||
                                                        "#ef4444",
                                                }}
                                            >
                                                {formatDiscount(offer)}
                                            </span>
                                        </div>

                                        {/* Offer Content */}
                                        <h3 className="text-2xl font-bold mb-3">
                                            {offer.title}
                                        </h3>
                                        <p className="text-sm opacity-90 mb-4 line-clamp-3">
                                            {offer.description}
                                        </p>

                                        {/* Offer Details */}
                                        <div className="space-y-2 mb-6">
                                            {offer.minOrderAmount > 0 && (
                                                <p className="text-sm opacity-80">
                                                    Min. order: ₹
                                                    {offer.minOrderAmount}
                                                </p>
                                            )}
                                            {offer.promoCode && (
                                                <p className="text-sm opacity-80">
                                                    Code:{" "}
                                                    <span className="font-mono font-bold">
                                                        {offer.promoCode}
                                                    </span>
                                                </p>
                                            )}
                                            {getOfferValidityText(offer) && (
                                                <p className="text-sm font-semibold">
                                                    {getOfferValidityText(
                                                        offer
                                                    )}
                                                </p>
                                            )}
                                        </div>

                                        {/* CTA Button */}
                                        <a
                                            href={offer.ctaLink}
                                            onClick={() =>
                                                handleOfferClick(offer._id)
                                            }
                                            className="inline-block px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-lg font-semibold hover:bg-opacity-30 transition-all duration-300 text-center"
                                        >
                                            {offer.ctaText || "Shop Now"}
                                        </a>
                                    </div>

                                    {/* Hover Effect Overlay */}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            ) : (
                // Fallback to original static offer section if no offers from backend
                <section className=""></section>
            )}

            {/* Why Choose Us Section */}
            <section className="py-16 px-6 max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">
                    Why Choose MultiSoft
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={
                            <svg
                                className="w-12 h-12 text-purple-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                ></path>
                            </svg>
                        }
                        title="Fast Delivery"
                        description="Most orders ship within 24 hours. Free shipping on orders over ₹1,000."
                    />
                    <FeatureCard
                        icon={
                            <svg
                                className="w-12 h-12 text-purple-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                ></path>
                            </svg>
                        }
                        title="3-Year Warranty"
                        description="All our products come with a comprehensive warranty and dedicated support."
                    />
                    <FeatureCard
                        icon={
                            <svg
                                className="w-12 h-12 text-purple-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                ></path>
                            </svg>
                        }
                        title="30-Day Returns"
                        description="Not satisfied? Return your product within 30 days for a full refund."
                    />
                </div>
            </section>

            {/* Customer Reviews Section */}
            <section className="py-16 px-6 max-w-7xl mx-auto bg-gray-100 rounded-lg">
                <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">
                    What Our Customers Say
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <TestimonialCard
                        name="Sarah Johnson"
                        role="Graphic Designer"
                        image="https://source.unsplash.com/random/100x100/?portrait-woman"
                        quote="The CreatorStation Pro has transformed my workflow. Renders that used to take hours now finish in minutes!"
                        rating={5}
                    />
                    <TestimonialCard
                        name="Michael Chen"
                        role="Software Developer"
                        image="https://source.unsplash.com/random/100x100/?portrait-man"
                        quote="ProBook X5 is the perfect balance of performance and portability. Battery life is incredible!"
                        rating={4}
                    />
                    <TestimonialCard
                        name="Emily Rodriguez"
                        role="College Student"
                        image="https://source.unsplash.com/random/100x100/?portrait-woman-2"
                        quote="The UltraSlim S7 is perfect for taking to class. It's lightweight, fast, and the price was right for my budget."
                        rating={5}
                    />
                </div>
            </section>

            {/* Newsletter Section */}
            <section className="py-12 px-6 max-w-7xl mx-auto">
                <div className="bg-gray-800 text-white rounded-lg p-8 md:p-12">
                    <div className="max-w-2xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-4">
                            Stay Updated
                        </h2>
                        <p className="text-gray-300 mb-8">
                            Subscribe to our newsletter for exclusive deals, new
                            product announcements, and tech tips.
                        </p>
                        <form className="flex flex-col md:flex-row gap-4">
                            <input
                                type="email"
                                placeholder="Your email address"
                                className="flex-grow px-4 py-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition duration-300"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
