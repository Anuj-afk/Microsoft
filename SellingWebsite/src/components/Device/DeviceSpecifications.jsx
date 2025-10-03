import React from 'react';

const DeviceSpecifications = ({ device, activeSpecTab, setActiveSpecTab }) => {
    const hasDetailedSpecs = device.detailedSpecs && device.detailedSpecs.length > 0;
    const hasOldSpecs = device.specifications && Array.isArray(device.specifications) && device.specifications.length > 0;

    if (!hasDetailedSpecs && !hasOldSpecs) return null;

    if (hasDetailedSpecs) {
        return (
            <div className="bg-white rounded-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Specifications</h2>
                
                {/* Spec Categories Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="flex space-x-8 overflow-x-auto">
                        {device.detailedSpecs.map((category, index) => (
                            category.category && category.specs && category.specs.length > 0 && (
                                <button
                                    key={index}
                                    onClick={() => setActiveSpecTab(index)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                        activeSpecTab === index
                                            ? 'border-purple-500 text-purple-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {category.category}
                                </button>
                            )
                        ))}
                    </nav>
                </div>

                {/* Active Spec Category Content */}
                {device.detailedSpecs[activeSpecTab] && (
                    <div className="space-y-4">
                        {device.detailedSpecs[activeSpecTab].specs.map((spec, index) => (
                            spec.key && spec.value && (
                                <div key={index} className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-gray-100 last:border-b-0">
                                    <dt className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">
                                        {spec.key}
                                    </dt>
                                    <dd className="text-sm text-gray-900 sm:text-right">
                                        {spec.value}
                                    </dd>
                                </div>
                            )
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Fallback to old specifications format
    return (
        <div className="bg-white rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Specifications</h2>
            <div className="space-y-4">
                {device.specifications.map((spec, index) => (
                    spec.key && spec.value && (
                        <div key={index} className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-gray-100 last:border-b-0">
                            <dt className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">
                                {spec.key}
                            </dt>
                            <dd className="text-sm text-gray-900 sm:text-right">
                                {spec.value}
                            </dd>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

export default DeviceSpecifications;