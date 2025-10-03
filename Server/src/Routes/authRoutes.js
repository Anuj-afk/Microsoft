import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create new user
        const user = new User({
            name,
            email,
            password,
            phone,
            role: role || 'user',
            metadata: {
                registrationIP: req.ip,
                userAgent: req.get('User-Agent')
            }
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: user.toPublicJSON()
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user by credentials
        const user = await User.findByCredentials(email, password);

        // Update login metadata
        user.metadata.lastLoginIP = req.ip;
        user.metadata.userAgent = req.get('User-Agent');
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: user.toPublicJSON()
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: user.toPublicJSON()
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user information'
        });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, phone, address, preferences } = req.body;
        
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update allowed fields
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (preferences) user.preferences = { ...user.preferences, ...preferences };

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: user.toPublicJSON()
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        const user = await User.findById(req.user.userId).select('+password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
});

// Admin routes
// Get all users (admin only)
router.get('/users', auth, adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, role, status } = req.query;

        let filter = {};
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (role) {
            filter.role = role;
        }

        if (status !== undefined) {
            filter.isActive = status === 'active';
        }

        const users = await User.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(filter);

        res.json({
            success: true,
            users: users.map(user => user.toPublicJSON()),
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / limit),
                total,
                limit: Number(limit)
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users'
        });
    }
});

// Get user by ID (admin only)
router.get('/users/:id', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: user.toPublicJSON()
        });

    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user'
        });
    }
});

// Update user (admin only)
router.put('/users/:id', auth, adminAuth, async (req, res) => {
    try {
        const { name, email, phone, address, preferences, isActive, isEmailVerified } = req.body;
        
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if email is being changed and is unique
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
            user.email = email;
        }

        // Update fields
        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (address) user.address = address;
        if (preferences) user.preferences = { ...user.preferences, ...preferences };
        if (isActive !== undefined) user.isActive = isActive;
        if (isEmailVerified !== undefined) user.isEmailVerified = isEmailVerified;

        await user.save();

        res.json({
            success: true,
            message: 'User updated successfully',
            user: user.toPublicJSON()
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user'
        });
    }
});

// Update user role (admin only)
router.put('/users/:id/role', auth, adminAuth, async (req, res) => {
    try {
        const { role } = req.body;
        
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { 
                role,
                permissions: role === 'admin' ? [
                    'manage_users',
                    'manage_products', 
                    'manage_categories',
                    'manage_orders',
                    'manage_settings',
                    'manage_media',
                    'view_analytics',
                    'manage_pages',
                    'manage_offers',
                    'system_admin'
                ] : ['view_products', 'place_orders']
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User role updated successfully',
            user: user.toPublicJSON()
        });

    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user role'
        });
    }
});

// Toggle user active status (admin only)
router.put('/users/:id/toggle-status', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({
            success: true,
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            user: user.toPublicJSON()
        });

    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status'
        });
    }
});

// Update user permissions (admin only)
router.put('/users/:id/permissions', auth, adminAuth, async (req, res) => {
    try {
        const { permissions } = req.body;

        if (!Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: 'Permissions must be an array'
            });
        }

        const validPermissions = [
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
            'view_products',
            'place_orders',
            "view_users"
        ];

        const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
        if (invalidPermissions.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid permissions: ${invalidPermissions.join(', ')}`
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { permissions },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User permissions updated successfully',
            user: user.toPublicJSON()
        });

    } catch (error) {
        console.error('Update user permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user permissions'
        });
    }
});

// Delete user (admin only) - Soft delete
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting yourself
        if (user._id.toString() === req.user.userId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        // Soft delete by deactivating
        user.isActive = false;
        user.email = `deleted_${Date.now()}_${user.email}`;
        await user.save();

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
});

// Get user statistics (admin only)
router.get('/stats/users', auth, adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const adminUsers = await User.countDocuments({ role: 'admin' });
        const newUsersThisMonth = await User.countDocuments({
            createdAt: { $gte: new Date(new Date().setDate(1)) }
        });
        const verifiedUsers = await User.countDocuments({ isEmailVerified: true });

        // Users by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const usersByMonth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers,
                activeUsers,
                inactiveUsers: totalUsers - activeUsers,
                adminUsers,
                customerUsers: totalUsers - adminUsers,
                newUsersThisMonth,
                verifiedUsers,
                unverifiedUsers: totalUsers - verifiedUsers,
                usersByMonth
            }
        });

    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user statistics'
        });
    }
});

// Create super admin (protected by secret key)
router.post('/create-super-admin', async (req, res) => {
    try {
        const { name, email, password, secretKey } = req.body;

        // Check if secret key matches
        const SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_SECRET;
        
        if (!secretKey || secretKey !== SUPER_ADMIN_SECRET) {
            return res.status(403).json({
                success: false,
                message: 'Invalid secret key. Access denied.'
            });
        }

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create super admin user
        const superAdmin = new User({
            name,
            email,
            password,
            role: 'admin',
            isActive: true,
            isEmailVerified: true,
            lastLogin: new Date(),
            metadata: {
                registrationIP: req.ip,
                userAgent: req.get('User-Agent')
            }
        });

        await superAdmin.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: superAdmin._id, role: superAdmin.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Super admin created successfully',
            token,
            user: superAdmin.toPublicJSON()
        });

    } catch (error) {
        console.error('Super admin creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create super admin',
            error: error.message
        });
    }
});

// Logout (optional - mainly for clearing client-side token)
router.post('/logout', auth, (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

export default router;