import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { API_ENDPOINTS } from '../config/api.js';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Check if user is authenticated on app load
    useEffect(() => {
        const checkAuth = async () => {
            const savedToken = localStorage.getItem('token');
            if (savedToken) {
                try {
                    const response = await api.get(API_ENDPOINTS.AUTH.ME);
                    
                    if (response.data.success) {
                        setUser(response.data.user);
                        setToken(savedToken);
                    } else {
                        // Token is invalid, remove it
                        localStorage.removeItem('token');
                        setToken(null);
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Auth check failed:', error);
                    // Token is invalid, remove it
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
                email,
                password
            });

            if (response.data.success) {
                const { token: newToken, user: userData } = response.data;
                
                setToken(newToken);
                setUser(userData);
                localStorage.setItem('token', newToken);
                
                return { success: true, user: userData };
            }
        } catch (error) {
            console.error('Login failed:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, userData);

            if (response.data.success) {
                const { token: newToken, user: newUser } = response.data;
                
                setToken(newToken);
                setUser(newUser);
                localStorage.setItem('token', newToken);
                
                return { success: true, user: newUser };
            }
        } catch (error) {
            console.error('Registration failed:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
    };

    const hasPermission = (permission) => {
        if (!user) return false;
        
        // Super admin has all permissions
        if (user.role === 'admin' && user.permissions?.includes('system_admin')) {
            return true;
        }
        
        // Check if user has the specific permission
        return user.permissions?.includes(permission) || false;
    };

    // Authentication status functions
    const isAuthenticated = () => {
        return !!(user && token);
    };

    const isLoggedIn = () => {
        return isAuthenticated();
    };

    const isAdmin = () => {
        return user?.role === 'admin';
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        hasPermission,
        isAuthenticated,
        isLoggedIn,
        isAdmin
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext };