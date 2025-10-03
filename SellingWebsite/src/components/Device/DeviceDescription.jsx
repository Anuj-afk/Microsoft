import React from 'react';

const DeviceDescription = ({ device }) => {
    if (!device.description) return null;

    return (
        <div className="bg-white rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Description</h2>
            <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {device.description}
                </p>
            </div>
        </div>
    );
};

export default DeviceDescription;