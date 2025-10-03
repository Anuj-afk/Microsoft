import React from 'react';

const DeviceMetaInfo = ({ device }) => {
    return (
        <div className="bg-white rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    {device.brand && (
                        <div>
                            <dt className="text-sm font-medium text-gray-600">Brand</dt>
                            <dd className="text-sm text-gray-900">{device.brand}</dd>
                        </div>
                    )}
                    {device.model && (
                        <div>
                            <dt className="text-sm font-medium text-gray-600">Model</dt>
                            <dd className="text-sm text-gray-900">{device.model}</dd>
                        </div>
                    )}
                    {device.sku && (
                        <div>
                            <dt className="text-sm font-medium text-gray-600">SKU</dt>
                            <dd className="text-sm text-gray-900">{device.sku}</dd>
                        </div>
                    )}
                </div>
                <div className="space-y-4">
                    <div>
                        <dt className="text-sm font-medium text-gray-600">Category</dt>
                        <dd className="text-sm text-gray-900">{device.category?.name}</dd>
                    </div>
                    {device.stock.trackStock && (
                        <div>
                            <dt className="text-sm font-medium text-gray-600">Stock Quantity</dt>
                            <dd className="text-sm text-gray-900">{device.stock.quantity} units</dd>
                        </div>
                    )}
                    <div>
                        <dt className="text-sm font-medium text-gray-600">Added On</dt>
                        <dd className="text-sm text-gray-900">
                            {new Date(device.createdAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-600">Last Updated</dt>
                        <dd className="text-sm text-gray-900">
                            {new Date(device.updatedAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </dd>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeviceMetaInfo;