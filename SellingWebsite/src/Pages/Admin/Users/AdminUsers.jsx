import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api, { API_ENDPOINTS, apiHelpers } from "../../../config/api.js";
import PermissionGuard from "../../../components/PermissionGuard";
import { usePermissions } from "../../../hooks/usePermissions";

const AdminUsers = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { canManageUsers } = usePermissions();

    useEffect(() => {
        fetchAdminUsers();
    }, []);

    const fetchAdminUsers = async () => {
        try {
            setLoading(true);
            
            const query = apiHelpers.buildQuery({
                role: 'admin',
                limit: 50
            });

            const response = await api.get(`${API_ENDPOINTS.AUTH.USERS}${query}`);

            if (response.data.success) {
                setAdmins(response.data.users);
                setError("");
            }
        } catch (error) {
            console.error("Error fetching admin users:", error);
            setError(
                error.response?.data?.message || "Failed to fetch admin users"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (userId) => {
        try {
            const response = await api.put(API_ENDPOINTS.AUTH.TOGGLE_STATUS(userId));

            if (response.data.success) {
                setAdmins(
                    admins.map((admin) =>
                        admin._id === userId
                            ? { ...admin, isActive: !admin.isActive }
                            : admin
                    )
                );
                setError("");
            }
        } catch (error) {
            console.error("Error toggling user status:", error);
            setError(
                error.response?.data?.message || "Failed to update user status"
            );
        }
    };

    return (
        <PermissionGuard permissions={["manage_users", "view_users"]}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Admin Users
                        </h1>
                        <p className="text-gray-600">
                            Manage administrative users
                        </p>
                    </div>
                    {canManageUsers && (
                        <Link
                            to="/admin/users/create"
                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                        >
                            + Create Admin User
                        </Link>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}

                {/* Admin Users Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">
                            Admin Users ({admins.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">
                                Loading admin users...
                            </p>
                        </div>
                    ) : admins.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-600">
                                No admin users found
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Admin User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Last Login
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Permissions
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {admins.map((admin) => (
                                        <tr
                                            key={admin._id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                                            <span className="text-sm font-medium text-red-600">
                                                                {admin.name
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 flex items-center">
                                                            {admin.name}
                                                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                                Admin
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {admin.email}
                                                        </div>
                                                        {admin.phone && (
                                                            <div className="text-sm text-gray-500">
                                                                {admin.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        admin.isActive
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {admin.isActive
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {admin.lastLogin
                                                    ? new Date(
                                                          admin.lastLogin
                                                      ).toLocaleDateString()
                                                    : "Never"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(
                                                    admin.createdAt
                                                ).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {admin.permissions?.length || 0}{" "}
                                                permissions
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <Link
                                                    to={`/admin/users/edit/${admin._id}`}
                                                    className="text-purple-600 hover:text-purple-900 mr-4"
                                                >
                                                    {canManageUsers
                                                        ? "Edit"
                                                        : "View"}
                                                </Link>
                                                {canManageUsers && (
                                                    <button
                                                        onClick={() =>
                                                            handleToggleStatus(
                                                                admin._id
                                                            )
                                                        }
                                                        className={`mr-4 ${
                                                            admin.isActive
                                                                ? "text-red-600 hover:text-red-900"
                                                                : "text-green-600 hover:text-green-900"
                                                        }`}
                                                    >
                                                        {admin.isActive
                                                            ? "Deactivate"
                                                            : "Activate"}
                                                    </button>
                                                )}

                                                <Link
                                                    to={`/admin/users/permissions/${admin._id}`}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Permissions
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </PermissionGuard>
    );
};

export default AdminUsers;
