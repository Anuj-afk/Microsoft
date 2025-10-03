// Banner Component that uses the banner settings
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Banner = ({ bannerSettings, loading }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [slideDirection, setSlideDirection] = useState("left");

    const directions = ["left", "right", "top", "bottom"];

    useEffect(() => {
        if (
            bannerSettings.slidingImages &&
            bannerSettings.slidingImages.filter((img) => img).length > 0
        ) {
            const interval = setInterval(() => {
                // Randomly select a new direction
                const newDirection =
                    directions[Math.floor(Math.random() * directions.length)];
                setSlideDirection(newDirection);

                // Get the valid images (non-empty)
                const validImages = bannerSettings.slidingImages.filter(
                    (img) => img
                );

                if (validImages.length > 0) {
                    setCurrentImageIndex(
                        (prevIndex) => (prevIndex + 1) % validImages.length
                    );
                }
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [bannerSettings]);

    const slideClasses = {
        left: "animate-slide-left",
        right: "animate-slide-right",
        top: "animate-slide-top",
        bottom: "animate-slide-bottom",
    };

    // Filter out empty sliding images
    const slidingImages = bannerSettings.slidingImages
        ? bannerSettings.slidingImages.filter((img) => img)
        : [];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[400px]">
                Loading banner...
            </div>
        );
    }

    // If no images are configured, show a demo banner for the company
    if (slidingImages.length === 0 && !bannerSettings.staticImage) {
        return (
            <div className="bg-gradient-to-tr from-slate-800 via-purple-900 to-indigo-800 py-16">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center">
                    <div className="md:w-1/2 mb-8 md:mb-0">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            Next-Gen Computing
                            <br />
                            <span className="text-purple-300">
                                for Work & Play
                            </span>
                        </h1>
                        <p className="text-xl text-gray-200 mb-8">
                            Discover our premium selection of laptops, desktops,
                            and accessories designed for performance,
                            reliability, and value.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                to="/products/laptops"
                                className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition duration-300"
                            >
                                Shop Laptops
                            </Link>
                            <Link
                                to="/products/desktops"
                                className="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-md hover:bg-white hover:text-purple-900 transition duration-300"
                            >
                                Shop Desktops
                            </Link>
                        </div>
                    </div>
                    <div className="md:w-1/2">
                        <img
                            src="https://source.unsplash.com/random/600x400/?laptop,desktop"
                            alt="Featured computers"
                            className="rounded-lg shadow-xl"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-between items-center bg-gradient-to-tr from-slate-50/90 via-rose-100/80 to-purple-200/90 p-8 rounded-lg my-8 h-[400px]">
            <div className="flex-1 p-4 overflow-hidden">
                {slidingImages.length > 0 && (
                    <img
                        key={currentImageIndex}
                        src={slidingImages[currentImageIndex]}
                        alt={`Rotating banner image ${currentImageIndex + 1}`}
                        className={`w-full max-w-[500px] h-[300px] object-cover rounded-lg shadow-purple-100/20 shadow-lg ${slideClasses[slideDirection]}`}
                    />
                )}
            </div>
            <div className="flex-1 p-4">
                {bannerSettings.staticImage ? (
                    <img
                        src={bannerSettings.staticImage}
                        alt="Static banner image"
                        className="w-full max-w-[500px] h-[300px] object-cover rounded-lg shadow-rose-100/20 shadow-lg"
                    />
                ) : (
                    <div className="w-full max-w-[500px] h-[300px] flex items-center justify-center bg-gray-100 rounded-lg shadow-rose-100/20 shadow-lg">
                        <p className="text-gray-400">No static image</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Banner;