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

module.exports = checkPermission;