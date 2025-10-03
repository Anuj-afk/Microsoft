import express from 'express';
import mongoose from 'mongoose';
import Device from '../models/Device.js';
import Category from '../models/Category.js';

const router = express.Router();

// Get all devices with optional filtering and pagination
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            search,
            category,
            brand,
            minPrice,
            maxPrice,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            status = 'active',
            featured,
            admin = false,
            exclude, // Add exclude parameter
            inStock = false // Add inStock filter
        } = req.query;

        // Build filter object
        let filter = { status };

        // Exclude specific product IDs
        if (exclude) {
            const excludeIds = Array.isArray(exclude) ? exclude : [exclude];
            filter._id = { $nin: excludeIds.filter(id => mongoose.Types.ObjectId.isValid(id)) };
        }

        // Filter only in-stock products if requested
        if (inStock === 'true') {
            filter.$or = [
                { 'stock.trackStock': false }, // Products that don't track stock
                { 
                    'stock.trackStock': true, 
                    'stock.quantity': { $gt: 0 } // Products with stock > 0
                }
            ];
        }

        // Add search functionality
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { shortDescription: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }

        // Add category filter
        if (category) {
            const categoryDoc = await Category.findOne({ 
                $or: [
                    { _id: mongoose.Types.ObjectId.isValid(category) ? category : null },
                    { slug: category }
                ],
                ...(admin !== 'true' && { isActive: true })
            });
            
            if (categoryDoc) {
                filter.category = categoryDoc._id;
            } else if (admin !== 'true') {
                return res.json({
                    success: true,
                    devices: [],
                    pagination: { current: Number(page), pages: 0, total: 0, limit: Number(limit) }
                });
            }
        }

        // Add brand filter
        if (brand) {
            filter.brand = { $regex: brand, $options: 'i' };
        }

        // Add price range filters
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Add featured filter
        if (featured === 'true') {
            filter.featured = true;
        }

        console.log('Filter object:', filter);

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Execute query
        const devices = await Device.find(filter)
            .populate({
                path: 'category',
                select: 'name slug description isActive',
                ...(admin !== 'true' && { match: { isActive: true } })
            })
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit));

        // Filter results based on admin flag
        let finalDevices = devices;
        if (admin !== 'true') {
            finalDevices = devices.filter(device => device.category && device.category.isActive);
        } else {
            finalDevices = devices.filter(device => device.category);
        }

        const total = await Device.countDocuments(filter);

        res.json({
            success: true,
            devices: finalDevices,
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / limit),
                total: finalDevices.length,
                limit: Number(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch devices',
            error: error.message
        });
    }
});

// Get devices by category slug
router.get('/category/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const {
            page = 1,
            limit = 12,
            search,
            brand,
            minPrice,
            maxPrice,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            featured
        } = req.query;

        // Find the category - ONLY ACTIVE for public
        const category = await Category.findOne({ 
            slug, 
            isActive: true 
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found or inactive',
                error: 'CATEGORY_NOT_FOUND'
            });
        }

        // Build filter object - only active devices and active category
        let filter = { 
            category: category._id, 
            status: 'active'
        };

        // Add search functionality
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { shortDescription: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }

        // Add brand filter
        if (brand) {
            filter.brand = { $regex: brand, $options: 'i' };
        }

        // Add price range filters
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Add featured filter - IMPORTANT
        if (featured === 'true') {
            filter.featured = true;
        }

        console.log('Category filter object:', filter); // Debug log

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Execute query
        const devices = await Device.find(filter)
            .populate('category', 'name slug')
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit));

        // Get total count
        const total = await Device.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        console.log(`Found ${devices.length} devices in category ${category.name}, total: ${total}`); // Debug log

        res.json({
            success: true,
            devices,
            category: {
                _id: category._id,
                name: category.name,
                slug: category.slug,
                description: category.description
            },
            pagination: {
                current: Number(page),
                pages: totalPages,
                total,
                limit: Number(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching devices by category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch devices by category',
            error: error.message
        });
    }
});

// Get featured devices
router.get('/featured', async (req, res) => {
    try {
        const { limit = 8 } = req.query;

        const devices = await Device.find({
            featured: true,
            status: 'active',
            isActive: true
        })
            .populate('category', 'name slug')
            .sort({ salesCount: -1, createdAt: -1 })
            .limit(parseInt(limit))
            .select('-__v');

        res.json(devices);
    } catch (error) {
        console.error('Error fetching featured devices:', error);
        res.status(500).json({ error: 'Failed to fetch featured devices' });
    }
});

// Get a single device by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if ID is valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid device ID' });
        }

        const device = await Device.findById(id)
            .populate('category', 'name slug description')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');

        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        // Increment view count
        await Device.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

        res.json(device);
    } catch (error) {
        console.error('Error fetching device:', error);
        res.status(500).json({ error: 'Failed to fetch device' });
    }
});

// Get a device by slug
router.get('/by-slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const device = await Device.findOne({ slug })
            .populate('category', 'name slug description')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');

        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        // Increment view count
        await Device.findByIdAndUpdate(device._id, { $inc: { viewCount: 1 } });

        res.json(device);
    } catch (error) {
        console.error('Error fetching device by slug:', error);
        res.status(500).json({ error: 'Failed to fetch device' });
    }
});

// Create a new device
router.post('/', async (req, res) => {
    try {
        const deviceData = req.body;

        // Check if slug already exists
        if (deviceData.slug) {
            const existingDevice = await Device.findOne({ slug: deviceData.slug });
            if (existingDevice) {
                return res.status(400).json({ error: 'Device with this slug already exists' });
            }
        }

        // Check if SKU already exists (if provided)
        if (deviceData.sku) {
            const existingSKU = await Device.findOne({ sku: deviceData.sku });
            if (existingSKU) {
                return res.status(400).json({ error: 'Device with this SKU already exists' });
            }
        }

        // Validate category exists
        if (deviceData.category) {
            const category = await Category.findById(deviceData.category);
            if (!category) {
                return res.status(400).json({ error: 'Category not found' });
            }
        }

        const device = new Device(deviceData);
        await device.save();

        // Populate category before returning
        await device.populate('category', 'name slug');

        res.status(201).json({
            message: 'Device created successfully',
            device
        });
    } catch (error) {
        console.error('Error creating device:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: validationErrors 
            });
        }
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ 
                error: `Device with this ${field} already exists` 
            });
        }
        
        res.status(500).json({ error: 'Failed to create device' });
    }
});

// Update a device
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Check if ID is valid
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid device ID' });
        }

        // Check if device exists
        const existingDevice = await Device.findById(id);
        if (!existingDevice) {
            return res.status(404).json({ error: 'Device not found' });
        }

        // Check if slug is being updated and doesn't conflict
        if (updateData.slug && updateData.slug !== existingDevice.slug) {
            const slugExists = await Device.findOne({ 
                slug: updateData.slug, 
                _id: { $ne: id } 
            });
            if (slugExists) {
                return res.status(400).json({ error: 'Device with this slug already exists' });
            }
        }

        // Check if SKU is being updated and doesn't conflict
        if (updateData.sku && updateData.sku !== existingDevice.sku) {
            const skuExists = await Device.findOne({ 
                sku: updateData.sku, 
                _id: { $ne: id } 
            });
            if (skuExists) {
                return res.status(400).json({ error: 'Device with this SKU already exists' });
            }
        }

        // Validate category if being updated
        if (updateData.category && updateData.category !== existingDevice.category.toString()) {
            const category = await Category.findById(updateData.category);
            if (!category) {
                return res.status(400).json({ error: 'Category not found' });
            }
        }

        // Add updatedBy field if user info is available
        // updateData.updatedBy = req.user?._id;

        const device = await Device.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('category', 'name slug');

        res.json({
            message: 'Device updated successfully',
            device
        });
    } catch (error) {
        console.error('Error updating device:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: validationErrors 
            });
        }
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ 
                error: `Device with this ${field} already exists` 
            });
        }
        
        res.status(500).json({ error: 'Failed to update device' });
    }
});

// Delete a device
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if ID is valid
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid device ID' });
        }

        const device = await Device.findByIdAndDelete(id);

        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        res.json({
            message: 'Device deleted successfully',
            device: { _id: device._id, name: device.name }
        });
    } catch (error) {
        console.error('Error deleting device:', error);
        res.status(500).json({ error: 'Failed to delete device' });
    }
});

// Update device stock
router.patch('/:id/stock', async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, operation = 'set' } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid device ID' });
        }

        const device = await Device.findById(id);
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        let newQuantity;
        switch (operation) {
            case 'add':
                newQuantity = device.stock.quantity + quantity;
                break;
            case 'subtract':
                newQuantity = Math.max(0, device.stock.quantity - quantity);
                break;
            case 'set':
            default:
                newQuantity = quantity;
                break;
        }

        const updatedDevice = await Device.findByIdAndUpdate(
            id,
            { 'stock.quantity': newQuantity },
            { new: true }
        ).populate('category', 'name slug');

        res.json({
            message: 'Stock updated successfully',
            device: updatedDevice,
            stockStatus: updatedDevice.stockStatus
        });
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

// Toggle featured status
router.patch('/:id/featured', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid device ID' });
        }

        const device = await Device.findById(id);
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        const updatedDevice = await Device.findByIdAndUpdate(
            id,
            { featured: !device.featured },
            { new: true }
        ).populate('category', 'name slug');

        res.json({
            message: `Device ${updatedDevice.featured ? 'added to' : 'removed from'} featured`,
            device: updatedDevice
        });
    } catch (error) {
        console.error('Error toggling featured status:', error);
        res.status(500).json({ error: 'Failed to update featured status' });
    }
});

// Get device statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const stats = await Device.aggregate([
            {
                $group: {
                    _id: null,
                    totalDevices: { $sum: 1 },
                    activeDevices: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    featuredDevices: {
                        $sum: { $cond: ['$featured', 1, 0] }
                    },
                    totalValue: { $sum: '$price' },
                    averagePrice: { $avg: '$price' },
                    totalStock: { $sum: '$stock.quantity' },
                    lowStockDevices: {
                        $sum: {
                            $cond: [
                                { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const categoryStats = await Device.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            {
                $unwind: '$categoryInfo'
            },
            {
                $group: {
                    _id: '$category',
                    name: { $first: '$categoryInfo.name' },
                    count: { $sum: 1 },
                    totalValue: { $sum: '$price' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const brandStats = await Device.aggregate([
            {
                $group: {
                    _id: '$brand',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$price' }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ]);

        res.json({
            overview: stats[0] || {
                totalDevices: 0,
                activeDevices: 0,
                featuredDevices: 0,
                totalValue: 0,
                averagePrice: 0,
                totalStock: 0,
                lowStockDevices: 0
            },
            categoryStats,
            brandStats
        });
    } catch (error) {
        console.error('Error fetching device statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Add a new admin-specific route that shows all categories and properly filters devices

// Add this new route for admin panel - shows all categories but filters devices properly
router.get('/admin/category/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const {
            page = 1,
            limit = 12,
            search,
            brand,
            minPrice,
            maxPrice,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            featured,
            status = 'active'
        } = req.query;

        // Find the category - INCLUDE INACTIVE ONES for admin
        const category = await Category.findOne({ slug });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
                error: 'CATEGORY_NOT_FOUND'
            });
        }

        // Build filter object - filter devices by status but allow inactive categories
        let filter = { 
            category: category._id,
            status: status // Use the status from query (active/inactive/all)
        };

        // Add search functionality
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { shortDescription: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }

        // Add brand filter
        if (brand) {
            filter.brand = { $regex: brand, $options: 'i' };
        }

        // Add price range filters
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Add featured filter
        if (featured === 'true') {
            filter.featured = true;
        }

        console.log('Admin category filter object:', filter);

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Execute query - populate category regardless of isActive status
        const devices = await Device.find(filter)
            .populate('category', 'name slug description isActive')
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit));

        // Get total count
        const total = await Device.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        console.log(`Found ${devices.length} devices in category ${category.name} (${category.isActive ? 'active' : 'inactive'}), total: ${total}`);

        res.json({
            success: true,
            devices,
            category: {
                _id: category._id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                isActive: category.isActive
            },
            pagination: {
                current: Number(page),
                pages: totalPages,
                total,
                limit: Number(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching devices by category (admin):', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch devices by category',
            error: error.message
        });
    }
});

export default router;
