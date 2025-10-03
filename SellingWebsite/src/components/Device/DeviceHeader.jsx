import React from 'react';
import { Link } from 'react-router-dom';

const DeviceHeader = ({ device }) => {
    return (
        <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <nav className="flex items-center space-x-2 text-sm">
                    <Link to="/" className="text-gray-500 hover:text-gray-700">Home</Link>
                    <span className="text-gray-400">/</span>
                    <Link to="/products" className="text-gray-500 hover:text-gray-700">Products</Link>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-900">{device.name}</span>
                </nav>
            </div>
        </div>
    );
};

export default DeviceHeader;