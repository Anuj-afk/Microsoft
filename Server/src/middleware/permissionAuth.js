const User = require('../models/User');

const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user.userId);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (user.hasPermission(requiredPermission)) {
                next();
            } else {
                res.status(403).json({
                    success: false,
                    message: `Access denied. Required permission: ${requiredPermission}`
                });
            }
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                message: 'Permission check failed'
            });
        }
    };
};

// Multiple permissions check (user needs ALL permissions)
const checkMultiplePermissions = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user.userId);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const hasAllPermissions = requiredPermissions.every(permission => 
                user.hasPermission(permission)
            );

            if (hasAllPermissions) {
                next();
            } else {
                res.status(403).json({
                    success: false,
                    message: `Access denied. Required permissions: ${requiredPermissions.join(', ')}`
                });
            }
        } catch (error) {
            console.error('Multiple permissions check error:', error);
            res.status(500).json({
                success: false,
                message: 'Permission check failed'
            });
        }
    };
};

// Any permission check (user needs ANY of the permissions)
const checkAnyPermission = (permissions) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user.userId);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const hasAnyPermission = permissions.some(permission => 
                user.hasPermission(permission)
            );

            if (hasAnyPermission) {
                next();
            } else {
                res.status(403).json({
                    success: false,
                    message: `Access denied. Required any of: ${permissions.join(', ')}`
                });
            }
        } catch (error) {
            console.error('Any permission check error:', error);
            res.status(500).json({
                success: false,
                message: 'Permission check failed'
            });
        }
    };
};

export { checkPermission, checkMultiplePermissions, checkAnyPermission };