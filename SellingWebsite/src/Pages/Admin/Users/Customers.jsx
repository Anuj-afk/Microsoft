import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api, { API_ENDPOINTS, apiHelpers } from "../../../config/api.js";
import PermissionGuard from "../../../components/PermissionGuard";
import { usePermissions } from "../../../hooks/usePermissions";

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const { canManageUsers } = usePermissions();

    useEffect(() => {
        fetchCustomers();
    }, [currentPage, searchTerm]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);

            const queryParams = {
                page: currentPage,
                limit: 10,
                role: "user",
                ...(searchTerm && { search: searchTerm }),
            };

            const query = apiHelpers.buildQuery(queryParams);
            const response = await api.get(`${API_ENDPOINTS.AUTH.USERS}${query}`);

            if (response.data.success) {
                setCustomers(response.data.users);
                setTotalPages(response.data.pagination.pages);
                setTotalCustomers(response.data.pagination.total);
                setError("");
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
            setError(
                error.response?.data?.message || "Failed to fetch customers"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (userId) => {
        try {
            const response = await api.put(API_ENDPOINTS.AUTH.TOGGLE_STATUS(userId));

            if (response.data.success) {
                setCustomers(
                    customers.map((customer) =>
                        customer._id === userId
                            ? { ...customer, isActive: !customer.isActive }
                            : customer
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

    const exportCustomers = async () => {
        try {
            const query = apiHelpers.buildQuery({
                role: "user",
                limit: 1000
            });
            
            const response = await api.get(`${API_ENDPOINTS.AUTH.USERS}${query}`);

            if (response.data.success) {
                // Simple CSV export
                const csvContent =
                    "data:text/csv;charset=utf-8," +
                    "Name,Email,Phone,Status,Join Date,Last Login\n" +
                    response.data.users
                        .map(
                            (customer) =>
                                `"${customer.name}","${customer.email}","${
                                    customer.phone || ""
                                }","${
                                    customer.isActive ? "Active" : "Inactive"
                                }","${new Date(
                                    customer.createdAt
                                ).toLocaleDateString()}","${
                                    customer.lastLogin
                                        ? new Date(
                                              customer.lastLogin
                                          ).toLocaleDateString()
                                        : "Never"
                                }"`
                        )
                        .join("\n");

                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute(
                    "download",
                    `customers_${new Date().toISOString().split("T")[0]}.csv`
                );
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error("Error exporting customers:", error);
            setError("Failed to export customers");
        }
    };

    return (
        <PermissionGuard permissions={["manage_users", "view_users"]}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Customer Users
                        </h1>
                        <p className="text-gray-600">
                            Manage customer accounts
                        </p>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={exportCustomers}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                        >
                            Export Customers
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="max-w-md">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Customers
                        </label>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}

                {/* Customers Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">
                            Customers ({totalCustomers})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">
                                Loading customers...
                            </p>
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-600">No customers found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email Verified
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Last Login
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Join Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {customers.map((customer) => (
                                        <tr
                                            key={customer._id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <span className="text-sm font-medium text-blue-600">
                                                                {customer.name
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {customer.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {customer.email}
                                                        </div>
                                                        {customer.phone && (
                                                            <div className="text-sm text-gray-500">
                                                                {customer.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        customer.isActive
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {customer.isActive
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        customer.isEmailVerified
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                    }`}
                                                >
                                                    {customer.isEmailVerified
                                                        ? "Verified"
                                                        : "Pending"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {customer.lastLogin
                                                    ? new Date(
                                                          customer.lastLogin
                                                      ).toLocaleDateString()
                                                    : "Never"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(
                                                    customer.createdAt
                                                ).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <Link
                                                    to={`/admin/users/edit/${customer._id}`}
                                                    className="text-purple-600 hover:text-purple-900 mr-4"
                                                >
                                                    View
                                                </Link>
                                                {canManageUsers && (
                                                    <button
                                                        onClick={() =>
                                                            handleToggleStatus(
                                                                customer._id
                                                            )
                                                        }
                                                        className={`mr-4 ${
                                                            customer.isActive
                                                                ? "text-red-600 hover:text-red-900"
                                                                : "text-green-600 hover:text-green-900"
                                                        }`}
                                                    >
                                                        {customer.isActive
                                                            ? "Deactivate"
                                                            : "Activate"}
                                                    </button>
                                                )}

                                                <button className="text-green-600 hover:text-green-900">
                                                    Contact
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing page{" "}
                                        <span className="font-medium">
                                            {currentPage}
                                        </span>{" "}
                                        of{" "}
                                        <span className="font-medium">
                                            {totalPages}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                        <button
                                            onClick={() =>
                                                setCurrentPage(
                                                    Math.max(1, currentPage - 1)
                                                )
                                            }
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() =>
                                                setCurrentPage(
                                                    Math.min(
                                                        totalPages,
                                                        currentPage + 1
                                                    )
                                                )
                                            }
                                            disabled={
                                                currentPage === totalPages
                                            }
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PermissionGuard>
    );
};

export default Customers;
