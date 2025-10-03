import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { API_ENDPOINTS } from '../../../config/api.js';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';

const EditUser = () => {
    const { canManageUsers, canViewUsers } = usePermissions();
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('basic');
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        isActive: false,
        isEmailVerified: false,
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
        },
        preferences: {
            emailNotifications: true,
            smsNotifications: false,
            marketingEmails: true
        }
    });

    useEffect(() => {
        fetchUser();
    }, [id]);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const response = await api.get(API_ENDPOINTS.AUTH.USER_BY_ID(id));

            if (response.data.success) {
                const userData = response.data.user;
                setUser(userData);
                setFormData({
                    name: userData.name || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    role: userData.role || 'user',
                    isActive: userData.isActive || false,
                    isEmailVerified: userData.isEmailVerified || false,
                    address: {
                        street: userData.address?.street || '',
                        city: userData.address?.city || '',
                        state: userData.address?.state || '',
                        zipCode: userData.address?.zipCode || '',
                        country: userData.address?.country || ''
                    },
                    preferences: {
                        emailNotifications: userData.preferences?.emailNotifications ?? true,
                        smsNotifications: userData.preferences?.smsNotifications ?? false,
                        marketingEmails: userData.preferences?.marketingEmails ?? true
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            setError('Failed to fetch user data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
        
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!canManageUsers) {
            setError('You do not have permission to edit users');
            return;
        }
        
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.put(API_ENDPOINTS.AUTH.USER_BY_ID(id), formData);

            if (response.data.success) {
                setSuccess('User updated successfully!');
                setUser(response.data.user);
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (error) {
            console.error('Error updating user:', error);
            setError(error.response?.data?.message || 'Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    const handleRoleChange = async (newRole) => {
        if (!canManageUsers) {
            setError('You do not have permission to change user roles');
            return;
        }

        try {
            const response = await api.put(API_ENDPOINTS.AUTH.USER_ROLE(id), { role: newRole });

            if (response.data.success) {
                setUser(response.data.user);
                setFormData(prev => ({ ...prev, role: newRole }));
                setSuccess('User role updated successfully!');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (error) {
            console.error('Error updating role:', error);
            setError(error.response?.data?.message || 'Failed to update role');
        }
    };

    const handleStatusToggle = async () => {
        if (!canManageUsers) {
            setError('You do not have permission to change user status');
            return;
        }

        try {
            const response = await api.put(API_ENDPOINTS.AUTH.TOGGLE_STATUS(id));

            if (response.data.success) {
                setUser(response.data.user);
                setFormData(prev => ({ ...prev, isActive: response.data.user.isActive }));
                setSuccess(`User ${response.data.user.isActive ? 'activated' : 'deactivated'} successfully!`);
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            setError(error.response?.data?.message || 'Failed to update status');
        }
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
        <PermissionGuard permissions={['manage_users', 'view_users']}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {canManageUsers ? 'Edit User' : 'View User'}
                        </h1>
                        <p className="text-gray-600">
                            {canManageUsers ? 'Manage user information and settings' : 'View user information'}
                        </p>
                    </div>
                    <div className="flex space-x-4">
                        {canManageUsers && (
                            <Link
                                to={`/admin/users/permissions/${id}`}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Manage Permissions
                            </Link>
                        )}
                        <Link
                            to="/admin/users/all"
                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
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

                {/* User Info Card with conditional actions */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-xl font-bold text-purple-600">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
                            <p className="text-gray-600">{user.email}</p>
                            <div className="flex items-center space-x-4 mt-2">
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
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    user.isEmailVerified
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {user.isEmailVerified ? 'Email Verified' : 'Email Pending'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions - only show if user can manage */}
                    {canManageUsers && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 border border-gray-200 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Account Status</h4>
                                <button
                                    onClick={handleStatusToggle}
                                    className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        user.isActive
                                            ? 'bg-red-600 text-white hover:bg-red-700'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                                >
                                    {user.isActive ? 'Deactivate User' : 'Activate User'}
                                </button>
                            </div>

                            <div className="p-4 border border-gray-200 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">User Role</h4>
                                <select
                                    value={user.role}
                                    onChange={(e) => handleRoleChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="p-4 border border-gray-200 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Account Info</h4>
                                <div className="text-sm text-gray-600">
                                    <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                                    <p>Last Login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('basic')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'basic'
                                        ? 'border-purple-500 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Basic Information
                            </button>
                            <button
                                onClick={() => setActiveTab('address')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'address'
                                        ? 'border-purple-500 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Address
                            </button>
                            <button
                                onClick={() => setActiveTab('preferences')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'preferences'
                                        ? 'border-purple-500 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Preferences
                            </button>
                        </nav>
                    </div>

                    <form onSubmit={canManageUsers ? handleSubmit : (e) => e.preventDefault()} className="p-6">
                        {/* Basic Information Tab */}
                        {activeTab === 'basic' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        disabled={!canManageUsers}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                            !canManageUsers ? 'bg-gray-100 cursor-not-allowed' : ''
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        disabled={!canManageUsers}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                            !canManageUsers ? 'bg-gray-100 cursor-not-allowed' : ''
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        disabled={!canManageUsers}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                            !canManageUsers ? 'bg-gray-100 cursor-not-allowed' : ''
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Role
                                    </label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Use the role selector above to change user role</p>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        disabled
                                        className="h-4 w-4 text-purple-600 border-gray-300 rounded cursor-not-allowed"
                                    />
                                    <label className="ml-2 block text-sm text-gray-700">
                                        Active User
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="isEmailVerified"
                                        checked={formData.isEmailVerified}
                                        onChange={handleInputChange}
                                        disabled={!canManageUsers}
                                        className={`h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded ${
                                            !canManageUsers ? 'cursor-not-allowed' : ''
                                        }`}
                                    />
                                    <label className="ml-2 block text-sm text-gray-700">
                                        Email Verified
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Address Tab */}
                        {activeTab === 'address' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Street Address
                                    </label>
                                    <input
                                        type="text"
                                        name="address.street"
                                        value={formData.address.street}
                                        onChange={handleInputChange}
                                        disabled={!canManageUsers}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                            !canManageUsers ? 'bg-gray-100 cursor-not-allowed' : ''
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        name="address.city"
                                        value={formData.address.city}
                                        onChange={handleInputChange}
                                        disabled={!canManageUsers}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                            !canManageUsers ? 'bg-gray-100 cursor-not-allowed' : ''
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        State
                                    </label>
                                    <input
                                        type="text"
                                        name="address.state"
                                        value={formData.address.state}
                                        onChange={handleInputChange}
                                        disabled={!canManageUsers}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                            !canManageUsers ? 'bg-gray-100 cursor-not-allowed' : ''
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ZIP Code
                                    </label>
                                    <input
                                        type="text"
                                        name="address.zipCode"
                                        value={formData.address.zipCode}
                                        onChange={handleInputChange}
                                        disabled={!canManageUsers}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                            !canManageUsers ? 'bg-gray-100 cursor-not-allowed' : ''
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        name="address.country"
                                        value={formData.address.country}
                                        onChange={handleInputChange}
                                        disabled={!canManageUsers}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                            !canManageUsers ? 'bg-gray-100 cursor-not-allowed' : ''
                                        }`}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Preferences Tab */}
                        {activeTab === 'preferences' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="preferences.emailNotifications"
                                                checked={formData.preferences.emailNotifications}
                                                onChange={handleInputChange}
                                                disabled={!canManageUsers}
                                                className={`h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded ${
                                                    !canManageUsers ? 'cursor-not-allowed' : ''
                                                }`}
                                            />
                                            <label className="ml-3 block text-sm text-gray-700">
                                                Email Notifications
                                            </label>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="preferences.smsNotifications"
                                                checked={formData.preferences.smsNotifications}
                                                onChange={handleInputChange}
                                                disabled={!canManageUsers}
                                                className={`h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded ${
                                                    !canManageUsers ? 'cursor-not-allowed' : ''
                                                }`}
                                            />
                                            <label className="ml-3 block text-sm text-gray-700">
                                                SMS Notifications
                                            </label>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="preferences.marketingEmails"
                                                checked={formData.preferences.marketingEmails}
                                                onChange={handleInputChange}
                                                disabled={!canManageUsers}
                                                className={`h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded ${
                                                    !canManageUsers ? 'cursor-not-allowed' : ''
                                                }`}
                                            />
                                            <label className="ml-3 block text-sm text-gray-700">
                                                Marketing Emails
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form Actions - only show if user can manage */}
                        {canManageUsers && (
                            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
                                <button
                                    type="button"
                                    onClick={() => navigate('/admin/users/all')}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`px-6 py-2 text-white rounded-md transition-colors ${
                                        saving
                                            ? 'bg-purple-400 cursor-not-allowed'
                                            : 'bg-purple-600 hover:bg-purple-700'
                                    }`}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </PermissionGuard>
    );
};

export default EditUser;