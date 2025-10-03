import React, { useState, useRef } from "react";

const DeviceImages = ({ device, selectedImage, setSelectedImage }) => {
    const [isZoomed, setIsZoomed] = useState(false);
    const [backgroundPos, setBackgroundPos] = useState("center");
    const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
    const imgRef = useRef(null);

    const lensSize = 100; // Size of the lens box
    const zoomLevel = 2; // Match with backgroundSize

    const handleMouseMove = (e) => {
        const { left, top, width, height } = imgRef.current.getBoundingClientRect();
        let x = e.clientX - left;
        let y = e.clientY - top;

        // Clamp lens inside image
        if (x < lensSize / 2) x = lensSize / 2;
        if (x > width - lensSize / 2) x = width - lensSize / 2;
        if (y < lensSize / 2) y = lensSize / 2;
        if (y > height - lensSize / 2) y = height - lensSize / 2;

        setLensPos({ x, y });

        // Calculate zoom background position
        const xPercent = (x / width) * 100;
        const yPercent = (y / height) * 100;
        setBackgroundPos(`${xPercent}% ${yPercent}%`);
    };

    const imageUrl =
        device.images?.[selectedImage]?.url ||
        device.primaryImage ||
        "https://via.placeholder.com/600x600?text=No+Image";

    return (
        <div className="space-y-4 relative">
            {/* Main Image with Lens */}
            <div
                className="aspect-square bg-white rounded-lg border overflow-hidden relative"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                ref={imgRef}
            >
                <img
                    src={imageUrl}
                    alt={device.images?.[selectedImage]?.alt || device.name}
                    className="w-full h-full object-cover"
                />

                {/* Lens Overlay */}
                {isZoomed && (
                    <div
                        className="absolute border-2 border-purple-500 bg-purple-200/20 pointer-events-none"
                        style={{
                            width: `${lensSize}px`,
                            height: `${lensSize}px`,
                            left: `${lensPos.x - lensSize / 2}px`,
                            top: `${lensPos.y - lensSize / 2}px`,
                        }}
                    />
                )}
            </div>

            {/* Zoomed View */}
            {isZoomed && (
                <div
                    className="absolute top-0 left-full ml-6 w-[500px] h-[500px] border rounded-lg bg-white hidden md:block shadow-lg"
                    style={{
                        backgroundImage: `url(${imageUrl})`,
                        backgroundRepeat: "no-repeat",
                        backgroundSize: `${zoomLevel * 100}%`, // 200% = 2x zoom
                        backgroundPosition: backgroundPos,
                    }}
                />
            )}

            {/* Thumbnails */}
            {device.images && device.images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                    {device.images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedImage(index)}
                            className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden ${
                                selectedImage === index ? "border-purple-600" : "border-gray-200"
                            }`}
                        >
                            <img
                                src={image.url}
                                alt={image.alt}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DeviceImages;
 