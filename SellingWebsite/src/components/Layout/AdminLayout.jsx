import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { usePermissions } from "../../hooks/usePermissions";
import api, { API_ENDPOINTS } from "../../config/api.js";


const AdminLayout = () => {
    const {
        canManageUsers,
        canViewUsers,
        canManageProducts,
        canManageCategories,
        canManageMedia,
        canManagePages,
        canManageSettings
    } = usePermissions();
    
    const [pagesOpen, setPagesOpen] = useState(false);
    const [mediaOpen, setMediaOpen] = useState(false);
    const [homeOpen, setHomeOpen] = useState(false);
    const [productsOpen, setProductsOpen] = useState(false);
    const [devicesOpen, setDevicesOpen] = useState(false);
    const [usersOpen, setUsersOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const location = useLocation();

    // Fetch categories when the component mounts
    useEffect(() => {
        fetchCategories();
    }, []);

    // Update fetchCategories to show all categories with visual indicators
    const fetchCategories = async () => {
        try {
            const response = await api.get(API_ENDPOINTS.CATEGORIES.BASE);
            // Show ALL categories in admin, but sort them (active first)
            const sortedCategories = response.data.sort((a, b) => {
                // Sort by active status first (active categories first), then by name
                if (a.isActive && !b.isActive) return -1;
                if (!a.isActive && b.isActive) return 1;
                return a.name.localeCompare(b.name);
            });
            setCategories(sortedCategories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
        } finally {
            setCategoriesLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-gray-800 text-white overflow-y-auto">
                <div className="p-4">
                    <h2 className="text-xl font-semibold mb-6">Admin Panel</h2>
                    <nav className="space-y-2">
                        <div className="py-2">
                            <h3 className="text-gray-400 text-sm font-medium mb-2">
                                Content
                            </h3>

                            {/* Logo Link - only show if can manage pages */}
                            {canManagePages && (
                                <Link
                                    to="/admin/logo"
                                    className="block px-4 py-2 rounded-md hover:bg-gray-700 transition-colors mb-2"
                                >
                                    Logo
                                </Link>
                            )}

                            {/* Pages Dropdown - only show if can manage pages */}
                            {canManagePages && (
                                <div className="space-y-1 mb-2">
                                    <button
                                        onClick={() => setPagesOpen(!pagesOpen)}
                                        className="flex items-center justify-between w-full px-4 py-2 text-left rounded-md hover:bg-gray-700 transition-colors"
                                    >
                                        <span>Pages</span>
                                        <svg
                                            className={`w-4 h-4 transform transition-transform ${
                                                pagesOpen ? "rotate-180" : ""
                                            }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>
                                    {pagesOpen && (
                                        <div className="pl-4 space-y-1">
                                            {/* Home Page Dropdown */}
                                            <div className="space-y-1">
                                                <button
                                                    onClick={() => setHomeOpen(!homeOpen)}
                                                    className="flex items-center justify-between w-full px-4 py-2 text-sm text-left rounded-md hover:bg-gray-700 transition-colors"
                                                >
                                                    <span>Home Page</span>
                                                    <svg
                                                        className={`w-3 h-3 transform transition-transform ${
                                                            homeOpen ? "rotate-180" : ""
                                                        }`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 9l-7 7-7-7"
                                                        />
                                                    </svg>
                                                </button>
                                                {homeOpen && (
                                                    <div className="pl-4 space-y-1">
                                                        <Link
                                                            to="/admin/pages/home"
                                                            className="block px-4 py-2 text-xs rounded-md hover:bg-gray-700 transition-colors"
                                                        >
                                                            Edit Home Page
                                                        </Link>
                                                        <Link
                                                            to="/admin/pages/home/banner"
                                                            className="block px-4 py-2 text-xs rounded-md hover:bg-gray-700 transition-colors"
                                                        >
                                                            Banner
                                                        </Link>
                                                        <Link
                                                            to="/admin/pages/home/offer"
                                                            className="block px-4 py-2 text-xs rounded-md hover:bg-gray-700 transition-colors"
                                                        >
                                                            Special Offer
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Products Dropdown - only show if can manage products or categories */}
                            {(canManageProducts || canManageCategories) && (
                                <div className="space-y-1 mb-2">
                                    <button
                                        onClick={() => setProductsOpen(!productsOpen)}
                                        className="flex items-center justify-between w-full px-4 py-2 text-left rounded-md hover:bg-gray-700 transition-colors"
                                    >
                                        <span>Products</span>
                                        <svg
                                            className={`w-4 h-4 transform transition-transform ${
                                                productsOpen ? "rotate-180" : ""
                                            }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>
                                    {productsOpen && (
                                        <div className="pl-4 space-y-1">
                                            {canManageCategories && (
                                                <Link
                                                    to="/admin/categories"
                                                    className="block px-4 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors"
                                                >
                                                    Categories
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Devices Dropdown */}
                            <div className="space-y-1 mb-2">
                                <button
                                    onClick={() => setDevicesOpen(!devicesOpen)}
                                    className="flex items-center justify-between w-full px-4 py-2 text-left rounded-md hover:bg-gray-700 transition-colors"
                                >
                                    <span>Devices</span>
                                    <svg
                                        className={`w-4 h-4 transform transition-transform ${
                                            devicesOpen ? "rotate-180" : ""
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>
                                {devicesOpen && (
                                    <div className="pl-4 space-y-1">
                                        {categoriesLoading ? (
                                            <div className="px-4 py-2 text-sm text-gray-400">
                                                Loading categories...
                                            </div>
                                        ) : categories.length === 0 ? (
                                            <div className="px-4 py-2 text-sm text-gray-400">
                                                No categories found
                                            </div>
                                        ) : (
                                            <>
                                                {categories.map(category => (
                                                    <Link
                                                        key={category._id}
                                                        to={`/admin/devices/${category.slug}`}
                                                        className="block px-4 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors"
                                                    >
                                                        {category.name}
                                                    </Link>
                                                ))}
                                                <div className="border-t border-gray-700 my-2"></div>
                                                <Link
                                                    to="/admin/devices/all"
                                                    className="block px-4 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors"
                                                >
                                                    All Devices
                                                </Link>
                                                <Link
                                                    to="/admin/devices/add"
                                                    className="block px-4 py-2 text-sm text-green-400 rounded-md hover:bg-gray-700 transition-colors"
                                                >
                                                    + Add New Device
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Media Dropdown - only show if can manage media */}
                            {canManageMedia && (
                                <div className="space-y-1 mt-3">
                                    <button
                                        onClick={() => setMediaOpen(!mediaOpen)}
                                        className="flex items-center justify-between w-full px-4 py-2 text-left rounded-md hover:bg-gray-700 transition-colors"
                                    >
                                        <span>Media</span>
                                        <svg
                                            className={`w-4 h-4 transform transition-transform ${
                                                mediaOpen ? "rotate-180" : ""
                                            }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>
                                    {mediaOpen && (
                                        <div className="pl-4 space-y-1">
                                            <Link
                                                to="/admin/media/library"
                                                className="block px-4 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors"
                                            >
                                                Media Library
                                            </Link>
                                            <Link
                                                to="/admin/media/upload"
                                                className="block px-4 py-2 text-sm text-green-400 rounded-md hover:bg-gray-700 transition-colors"
                                            >
                                                + Upload New
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* User Management Section - only show if can view or manage users */}
                        {(canViewUsers || canManageUsers) && (
                            <div className="py-2">
                                <h3 className="text-gray-400 text-sm font-medium mb-2">
                                    User Management
                                </h3>
                                
                                <div className="space-y-1 mb-2">
                                    <button
                                        onClick={() => setUsersOpen(!usersOpen)}
                                        className="flex items-center justify-between w-full px-4 py-2 text-left rounded-md hover:bg-gray-700 transition-colors"
                                    >
                                        <span>Users</span>
                                        <svg
                                            className={`w-4 h-4 transform transition-transform ${
                                                usersOpen ? "rotate-180" : ""
                                            }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>
                                    {usersOpen && (
                                        <div className="pl-4 space-y-1">
                                            <Link
                                                to="/admin/users/all"
                                                className="block px-4 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors"
                                            >
                                                All Users
                                            </Link>
                                            <Link
                                                to="/admin/users/admins"
                                                className="block px-4 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors"
                                            >
                                                Admin Users
                                            </Link>
                                            <Link
                                                to="/admin/users/customers"
                                                className="block px-4 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors"
                                            >
                                                Customers
                                            </Link>
                                            {canManageUsers && (
                                                <>
                                                    <Link
                                                        to="/admin/users/roles"
                                                        className="block px-4 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors"
                                                    >
                                                        Manage Roles
                                                    </Link>
                                                    <div className="border-t border-gray-700 my-2"></div>
                                                    <Link
                                                        to="/admin/users/create"
                                                        className="block px-4 py-2 text-sm text-green-400 rounded-md hover:bg-gray-700 transition-colors"
                                                    >
                                                        + Create New User
                                                    </Link>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Settings - only show if can manage settings */}
                        {canManageSettings && (
                            <div className="py-2">
                                <h3 className="text-gray-400 text-sm font-medium mb-2">
                                    Settings
                                </h3>
                                <Link
                                    to="/admin/settings"
                                    className="block px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                                >
                                    General Settings
                                </Link>
                            </div>
                        )}
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
                <main className="p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
