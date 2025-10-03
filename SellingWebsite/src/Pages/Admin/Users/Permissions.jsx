import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import api, { API_ENDPOINTS } from '../../../config/api.js';

const Permissions = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { canManageUsers } = usePermissions();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState([]);

    const allPermissions = [
        {
            category: 'User Management',
            permissions: [
                { key: 'manage_users', name: 'Manage Users', description: 'Create, edit, and delete user accounts' },
                { key: 'view_users', name: 'View Users', description: 'View user profiles and information' }
            ]
        },
        {
            category: 'Product Management',
            permissions: [
                { key: 'manage_products', name: 'Manage Products', description: 'Create, edit, and delete products' },
                { key: 'view_products', name: 'View Products', description: 'Browse and view product catalog' }
            ]
        },
        {
            category: 'Category Management',
            permissions: [
                { key: 'manage_categories', name: 'Manage Categories', description: 'Create, edit, and delete product categories' }
            ]
        },
        {
            category: 'Order Management',
            permissions: [
                { key: 'manage_orders', name: 'Manage Orders', description: 'View and process customer orders' },
                { key: 'place_orders', name: 'Place Orders', description: 'Create new orders as a customer' }
            ]
        },
        {
            category: 'Content Management',
            permissions: [
                { key: 'manage_pages', name: 'Manage Pages', description: 'Edit website pages and content' },
                { key: 'manage_media', name: 'Manage Media', description: 'Upload and manage media files' },
                { key: 'manage_offers', name: 'Manage Offers', description: 'Create and manage special offers' }
            ]
        },
        {
            category: 'System Administration',
            permissions: [
                { key: 'manage_settings', name: 'Manage Settings', description: 'Configure system settings' },
                { key: 'view_analytics', name: 'View Analytics', description: 'Access analytics and reports' },
                { key: 'system_admin', name: 'System Admin', description: 'Full system administration access' }
            ]
        }
    ];

    useEffect(() => {
        fetchUser();
    }, [id]);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await api.get(API_ENDPOINTS.AUTH.USERS_BY_ID(id), {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                const userData = response.data.user;
                setUser(userData);
                setSelectedPermissions(userData.permissions || []);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            setError('Failed to fetch user data');
        } finally {
            setLoading(false);
        }
    };

    const handlePermissionToggle = (permissionKey) => {
        setSelectedPermissions(prev => {
            if (prev.includes(permissionKey)) {
                return prev.filter(p => p !== permissionKey);
            } else {
                return [...prev, permissionKey];
            }
        });
        setError('');
        setSuccess('');
    };

    const handleRolePermissionPreset = (role) => {
        if (role === 'admin') {
            setSelectedPermissions([
                'manage_users',
                'manage_products',
                'manage_categories',
                'manage_orders',
                'manage_settings',
                'manage_media',
                'view_analytics',
                'manage_pages',
                'manage_offers',
                'system_admin',
                "view_users"
            ]);
        } else if (role === 'user') {
            setSelectedPermissions(['view_products', 'place_orders']);
        }
    };

    const handleSavePermissions = async () => {
        if (!canManageUsers) {
            setError('You do not have permission to manage user permissions');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.put(
                API_ENDPOINTS.AUTH.UPDATE_PERMISSIONS(id),
                { permissions: selectedPermissions }
            );

            if (response.data.success) {
                setUser(response.data.user);
                setSuccess('Permissions updated successfully!');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (error) {
            console.error('Error updating permissions:', error);
            setError(error.response?.data?.message || 'Failed to update permissions');
        } finally {
            setSaving(false);
        }
    };

    const handleSelectAll = () => {
        const allPermissionKeys = allPermissions.flatMap(category => 
            category.permissions.map(p => p.key)
        );
        setSelectedPermissions(allPermissionKeys);
    };

    const handleClearAll = () => {
        setSelectedPermissions([]);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">User Not Found</h2>
                <p className="text-gray-600 mt-2">The user you're looking for doesn't exist.</p>
                <Link
                    to="/admin/users/all"
                    className="mt-4 inline-block bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                    Back to Users
                </Link>
            </div>
        );
    }

    return (
        <PermissionGuard permission="manage_users">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manage User Permissions</h1>
                        <p className="text-gray-600">Configure permissions for {user.name}</p>
                    </div>
                    <div className="flex space-x-4">
                        <Link
                            to={`/admin/users/edit/${id}`}
                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                        >
                            Edit User
                        </Link>
                        <Link
                            to="/admin/users/all"
                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                        >
                            Back to Users
                        </Link>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
                        {success}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}

                {/* User Info */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-lg font-bold text-purple-600">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                            <p className="text-gray-600">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    user.role === 'admin'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-blue-100 text-blue-800'
                                }`}>
                                    {user.role === 'admin' ? 'Admin' : 'User'}
                                </span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    user.isActive
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Permission Controls */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">Permission Settings</h2>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => handleRolePermissionPreset('user')}
                                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                            >
                                User Preset
                            </button>
                            <button
                                onClick={() => handleRolePermissionPreset('admin')}
                                className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
                            >
                                Admin Preset
                            </button>
                            <button
                                onClick={handleSelectAll}
                                className="px-4 py-2 text-green-600 border border-green-600 rounded-md hover:bg-green-50 transition-colors"
                            >
                                Select All
                            </button>
                            <button
                                onClick={handleClearAll}
                                className="px-4 py-2 text-gray-600 border border-gray-600 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>

                    {/* Permission Categories */}
                    <div className="space-y-8">
                        {allPermissions.map((category) => (
                            <div key={category.category}>
                                <h3 className="text-md font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                                    {category.category}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {category.permissions.map((permission) => (
                                        <div
                                            key={permission.key}
                                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                                selectedPermissions.includes(permission.key)
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => handlePermissionToggle(permission.key)}
                                        >
                                            <div className="flex items-start">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPermissions.includes(permission.key)}
                                                    onChange={() => handlePermissionToggle(permission.key)}
                                                    className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                                />
                                                <div className="ml-3">
                                                    <h4 className="text-sm font-medium text-gray-900">
                                                        {permission.name}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {permission.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Selected Permissions Summary */}
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Selected Permissions ({selectedPermissions.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedPermissions.length === 0 ? (
                                <span className="text-sm text-gray-500">No permissions selected</span>
                            ) : (
                                selectedPermissions.map((permissionKey) => {
                                    const permission = allPermissions
                                        .flatMap(c => c.permissions)
                                        .find(p => p.key === permissionKey);
                                    return (
                                        <span
                                            key={permissionKey}
                                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                        >
                                            {permission?.name || permissionKey}
                                            <button
                                                onClick={() => handlePermissionToggle(permissionKey)}
                                                className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-purple-200"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Save Button - only show if user can manage */}
                    <div className="flex justify-end pt-6 border-t border-gray-200 mt-8">
                        <button
                            onClick={handleSavePermissions}
                            disabled={saving}
                            className={`px-6 py-2 text-white rounded-md transition-colors ${
                                saving
                                    ? 'bg-purple-400 cursor-not-allowed'
                                    : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                        >
                            {saving ? 'Saving...' : 'Save Permissions'}
                        </button>
                    </div>
                </div>
            </div>
        </PermissionGuard>
    );
};

export default Permissions;