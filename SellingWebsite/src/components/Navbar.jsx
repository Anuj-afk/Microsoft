import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { API_ENDPOINTS } from '../config/api.js';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const [logo, setLogo] = useState(null);
    const [categories, setCategories] = useState([]);
    const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
    const navigate = useNavigate();
    const { user, logout, isAdmin, isLoggedIn } = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const response = await api.get(API_ENDPOINTS.MEDIA.LOGO);
                setLogo(response.data.logoUrl);
            } catch (err) {
                console.error('Error fetching logo:', err);
            }
        };
        
        const fetchCategories = async () => {
            try {
                const response = await api.get(API_ENDPOINTS.CATEGORIES.BASE);
                const activeCategories = response.data.filter(category => category.isActive);
                setCategories(activeCategories);
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };
        
        fetchLogo();
        fetchCategories();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
        setUserMenuOpen(false);
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.user-menu-container')) {
                setUserMenuOpen(false);
            }
        };

        if (userMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [userMenuOpen]);

    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo and brand */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center">
                            {logo ? (
                                <img 
                                    src={logo} 
                                    alt="Multisoft Logo" 
                                    className="h-8 w-auto mr-2"
                                />
                            ) : (
                                <span className="text-2xl font-bold text-purple-600">Multisoft</span>
                            )}
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium">
                            Home
                        </Link>
                        <Link to="/products" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium">
                            Products
                        </Link>
                        <Link to="/about" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium">
                            About
                        </Link>
                        <Link to="/contact" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium">
                            Contact
                        </Link>

                        {/* User Menu */}
                        {isLoggedIn() ? (
                            <div className="relative user-menu-container">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    aria-expanded={userMenuOpen}
                                    aria-haspopup="true"
                                >
                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                        <span className="text-purple-600 font-medium text-sm">
                                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <span className="max-w-24 truncate">{user?.name || 'User'}</span>
                                    <svg 
                                        className={`w-4 h-4 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border ring-1 ring-black ring-opacity-5">
                                        <div className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                                            <div className="font-medium">{user?.name || 'User'}</div>
                                            <div className="text-gray-500 truncate">{user?.email || ''}</div>
                                            {isAdmin() && (
                                                <span className="inline-flex mt-1 bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                        
                                        <Link
                                            to="/profile"
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Profile
                                        </Link>
                                        
                                        <Link
                                            to="/orders"
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                            Orders
                                        </Link>
                                        
                                        {isAdmin() && (
                                            <Link
                                                to="/admin"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Admin Dashboard
                                            </Link>
                                        )}
                                        
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/login"
                                    className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Sign up
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-purple-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            aria-expanded={isOpen}
                        >
                            <span className="sr-only">Open main menu</span>
                            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                {isOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t shadow-lg">
                        <Link
                            to="/"
                            className="text-gray-700 hover:text-purple-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Home
                        </Link>
                        <Link
                            to="/products"
                            className="text-gray-700 hover:text-purple-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Products
                        </Link>
                        <Link
                            to="/about"
                            className="text-gray-700 hover:text-purple-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            About
                        </Link>
                        <Link
                            to="/contact"
                            className="text-gray-700 hover:text-purple-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Contact
                        </Link>

                        {isLoggedIn() ? (
                            <>
                                <div className="border-t border-gray-200 pt-4 mt-4">
                                    <div className="flex items-center px-3 py-2">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                            <span className="text-purple-600 font-medium">
                                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-base font-medium text-gray-800">{user?.name || 'User'}</div>
                                            <div className="text-sm text-gray-500">{user?.email || ''}</div>
                                            {isAdmin() && (
                                                <span className="inline-flex mt-1 bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <Link
                                    to="/profile"
                                    className="text-gray-700 hover:text-purple-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Profile
                                </Link>
                                
                                <Link
                                    to="/orders"
                                    className="text-gray-700 hover:text-purple-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Orders
                                </Link>
                                
                                {isAdmin() && (
                                    <Link
                                        to="/admin"
                                        className="text-gray-700 hover:text-purple-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Admin Dashboard
                                    </Link>
                                )}
                                
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsOpen(false);
                                    }}
                                    className="text-gray-700 hover:text-purple-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors"
                                >
                                    Sign out
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="border-t border-gray-200 pt-4 mt-4">
                                    <Link
                                        to="/login"
                                        className="text-gray-700 hover:text-purple-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Sign in
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="bg-purple-600 text-white hover:bg-purple-700 block px-3 py-2 rounded-md text-base font-medium transition-colors mt-2"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Sign up
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;