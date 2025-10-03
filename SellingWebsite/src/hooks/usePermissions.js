import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const usePermissions = () => {
    const { user } = useContext(AuthContext);
    
    const hasPermission = (permission) => {
        if (!user) return false;
        
        // Super admin has all permissions
        if (user.role === 'admin' && user.permissions?.includes('system_admin')) {
            return true;
        }
        
        // Check if user has the specific permission
        return user.permissions?.includes(permission) || false;
    };

    const hasAnyPermission = (permissions) => {
        return permissions.some(permission => hasPermission(permission));
    };

    const hasAllPermissions = (permissions) => {
        return permissions.every(permission => hasPermission(permission));
    };

    const canManageUsers = () => hasPermission('manage_users');
    const canViewUsers = () => hasAnyPermission(['manage_users', 'view_users']);
    const canManageProducts = () => hasPermission('manage_products');
    const canViewProducts = () => hasAnyPermission(['manage_products', 'view_products']);
    const canManageCategories = () => hasPermission('manage_categories');
    const canManageOrders = () => hasPermission('manage_orders');
    const canManageSettings = () => hasPermission('manage_settings');
    const canManageMedia = () => hasPermission('manage_media');
    const canViewAnalytics = () => hasPermission('view_analytics');
    const canManagePages = () => hasPermission('manage_pages');
    const canManageOffers = () => hasPermission('manage_offers');
    
    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canManageUsers,
        canViewUsers,
        canManageProducts,
        canViewProducts,
        canManageCategories,
        canManageOrders,
        canManageSettings,
        canManageMedia,
        canViewAnalytics,
        canManagePages,
        canManageOffers,
        user
    };
};