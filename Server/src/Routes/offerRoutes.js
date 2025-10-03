import express from 'express';
import mongoose from 'mongoose';
import Offer from '../models/Offer.js';
import Category from '../models/Category.js';
import Device from '../models/Device.js';

const router = express.Router();

// Get all offers with optional filtering
router.get('/', async (req, res) => {
    try {
        const { 
            location, 
            featured, 
            status, 
            active, 
            limit = 10, 
            page = 1, 
            sort = '-createdAt' 
        } = req.query;

        let query = {};

        // Filter by location
        if (location) {
            query.displayLocations = { $in: [location] };
        }

        // Filter by featured status
        if (featured === 'true') {
            query.isFeatured = true;
        }

        // Filter by active status
        if (active !== undefined) {
            query.isActive = active === 'true';
        }

        // Filter by status
        if (status) {
            query.status = status;
        } else {
            // Default to active offers only
            // query.status = 'active';
            // query.isActive = true;
            
            // Also check date validity for active offers
            const now = new Date();
            // query.startDate = { $lte: now };
            // query.endDate = { $gte: now };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const offers = await Offer.find(query)
            .sort(sort)
            .limit(parseInt(limit))
            .skip(skip)
            .populate('applicableCategories', 'name slug')
            .populate('applicableProducts', 'name slug price')
            .populate('excludedProducts', 'name slug');

        const total = await Offer.countDocuments(query);

        res.json({
            offers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).json({ error: 'Failed to fetch offers' });
    }
});

// Get offers by location (separate route for cleaner URL structure)
router.get('/location/:location', async (req, res) => {
    try {
        const { location } = req.params;
        const { 
            featured, 
            limit = 10, 
            page = 1, 
            sort = '-priority -createdAt' 
        } = req.query;

        let query = {
            displayLocations: { $in: [location] },
            status: 'active',
            isActive: true,
        };

        // Add date validity check for active offers
        const now = new Date();
        query.startDate = { $lte: now };
        query.endDate = { $gte: now };

        // Filter by featured status
        if (featured === 'true') {
            query.isFeatured = true;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const offers = await Offer.find(query)
            .sort(sort)
            .limit(parseInt(limit))
            .skip(skip)
            .populate('applicableCategories', 'name slug')
            .populate('applicableProducts', 'name slug price');

        // Return array directly for simpler frontend handling
        res.json(offers);
    } catch (error) {
        console.error('Error fetching offers by location:', error);
        res.status(500).json({ error: 'Failed to fetch offers' });
    }
});

// Get featured offers
router.get('/featured', async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const now = new Date();

        const offers = await Offer.find({
            isFeatured: true,
            isActive: true,
            status: 'active',
            startDate: { $lte: now },
            endDate: { $gte: now }
        })
        .sort({ priority: -1, createdAt: -1 })
        .limit(parseInt(limit))
        .populate('applicableCategories', 'name slug')
        .populate('applicableProducts', 'name slug price');

        res.json(offers);
    } catch (error) {
        console.error('Error fetching featured offers:', error);
        res.status(500).json({ error: 'Failed to fetch featured offers' });
    }
});

// Get single offer by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid offer ID' });
        }

        const offer = await Offer.findById(id)
            .populate('applicableCategories', 'name slug featuredImage')
            .populate('applicableProducts', 'name slug price featuredImage')
            .populate('excludedProducts', 'name slug');

        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        res.json(offer);
    } catch (error) {
        console.error('Error fetching offer:', error);
        res.status(500).json({ error: 'Failed to fetch offer' });
    }
});

// Create new offer
router.post('/', async (req, res) => {
    try {
        const offerData = req.body;

        // Validate categories if provided
        if (offerData.applicableCategories && offerData.applicableCategories.length > 0) {
            const validCategories = await Category.find({ _id: { $in: offerData.applicableCategories } });
            if (validCategories.length !== offerData.applicableCategories.length) {
                return res.status(400).json({ error: 'Some categories are invalid' });
            }
        }

        // Validate products if provided
        if (offerData.applicableProducts && offerData.applicableProducts.length > 0) {
            const validProducts = await Device.find({ _id: { $in: offerData.applicableProducts } });
            if (validProducts.length !== offerData.applicableProducts.length) {
                return res.status(400).json({ error: 'Some products are invalid' });
            }
        }

        const offer = new Offer(offerData);
        await offer.save();

        const populatedOffer = await Offer.findById(offer._id)
            .populate('applicableCategories', 'name slug')
            .populate('applicableProducts', 'name slug price');

        res.status(201).json(populatedOffer);
    } catch (error) {
        console.error('Error creating offer:', error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({ error: `${field} already exists` });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: 'Failed to create offer' });
    }
});

// Update offer
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid offer ID' });
        }

        // Check if offer exists
        const existingOffer = await Offer.findById(id);
        if (!existingOffer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        // Additional date validation before update
        if (updateData.startDate && updateData.endDate) {
            const startDate = new Date(updateData.startDate);
            const endDate = new Date(updateData.endDate);
            
            if (endDate <= startDate) {
                return res.status(400).json({ error: 'End date must be after start date' });
            }
        }

        // Check for duplicate slug (excluding current offer)
        if (updateData.slug && updateData.slug !== existingOffer.slug) {
            const duplicateSlug = await Offer.findOne({ 
                slug: updateData.slug, 
                _id: { $ne: id } 
            });
            if (duplicateSlug) {
                return res.status(400).json({ error: 'Offer with this slug already exists' });
            }
        }

        // Check for duplicate promo code (excluding current offer)
        if (updateData.promoCode && updateData.promoCode !== existingOffer.promoCode) {
            const duplicatePromo = await Offer.findOne({ 
                promoCode: updateData.promoCode.toUpperCase(), 
                _id: { $ne: id } 
            });
            if (duplicatePromo) {
                return res.status(400).json({ error: 'Promo code already exists' });
            }
        }

        // Validate categories if provided
        if (updateData.applicableCategories) {
            const validCategories = await Category.find({ 
                _id: { $in: updateData.applicableCategories } 
            });
            if (validCategories.length !== updateData.applicableCategories.length) {
                return res.status(400).json({ error: 'Some categories are invalid' });
            }
        }

        // Validate products if provided
        if (updateData.applicableProducts) {
            const validProducts = await Device.find({ 
                _id: { $in: updateData.applicableProducts } 
            });
            if (validProducts.length !== updateData.applicableProducts.length) {
                return res.status(400).json({ error: 'Some products are invalid' });
            }
        }

        // Update any error messages or validation messages that might reference currency:
        // In the validation sections, you can add helpful error messages:
        if (updateData.minOrderAmount && updateData.minOrderAmount < 0) {
            return res.status(400).json({ error: 'Minimum order amount must be greater than or equal to ₹0' });
        }

        if (updateData.discountValue && updateData.discountValue < 0) {
            return res.status(400).json({ error: 'Discount value must be greater than or equal to 0' });
        }

        updateData.updatedBy = updateData.updatedBy || existingOffer.createdBy;

        const updatedOffer = await Offer.findByIdAndUpdate(
            id,
            updateData,
            { 
                new: true, 
                runValidators: true,
                context: 'query'
            }
        ).populate('applicableCategories', 'name slug')
         .populate('applicableProducts', 'name slug price')
         .populate('excludedProducts', 'name slug');

        res.json(updatedOffer);
    } catch (error) {
        console.error('Error updating offer:', error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({ error: `${field} already exists` });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: 'Failed to update offer' });
    }
});

// Track offer click
router.post('/:id/click', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid offer ID' });
        }

        const offer = await Offer.findById(id);
        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        await offer.incrementClicks();
        res.json({ message: 'Click tracked successfully' });
    } catch (error) {
        console.error('Error tracking click:', error);
        res.status(500).json({ error: 'Failed to track click' });
    }
});

// Track offer view
router.post('/:id/view', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid offer ID' });
        }

        const offer = await Offer.findById(id);
        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        await offer.incrementViews();
        res.json({ message: 'View tracked successfully' });
    } catch (error) {
        console.error('Error tracking view:', error);
        res.status(500).json({ error: 'Failed to track view' });
    }
});

// Delete offer
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid offer ID' });
        }

        const offer = await Offer.findByIdAndDelete(id);
        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        res.json({ message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({ error: 'Failed to delete offer' });
    }
});

router.get('/debug/all', async (req, res) => {
    try {
        const offers = await Offer.find({});
        res.json({
            total: offers.length,
            offers: offers.map(offer => ({
                id: offer._id,
                title: offer.title,
                status: offer.status,
                isActive: offer.isActive,
                isFeatured: offer.isFeatured,
                displayLocations: offer.displayLocations,
                startDate: offer.startDate,
                endDate: offer.endDate,
                isCurrentlyValid: offer.startDate <= new Date() && offer.endDate >= new Date()
            }))
        });
    } catch (error) {
        console.error('Error in debug endpoint:', error);
        res.status(500).json({ error: 'Failed to fetch debug info' });
    }
});

export default router;