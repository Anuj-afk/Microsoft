import express from 'express';
import Settings from '../models/Setting.js';

const router = express.Router();

// Get settings
router.get('/', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        
        // If no settings exist, create default settings
        if (!settings) {
            settings = await Settings.create({});
        }
        
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Get banner settings
router.get('/banner', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        
        // If no settings exist, create default settings
        if (!settings) {
            settings = await Settings.create({});
        }
        
        // If banner settings don't exist, initialize them
        if (!settings.banner) {
            settings.banner = {
                slidingImages: [],
                staticImage: ''
            };
            await settings.save();
        }
        
        // Ensure slidingImages is always an array
        if (!Array.isArray(settings.banner.slidingImages)) {
            settings.banner.slidingImages = [];
            await settings.save();
        }
        
        res.json(settings.banner);
    } catch (error) {
        console.error('Error fetching banner settings:', error);
        res.status(500).json({ error: 'Failed to fetch banner settings' });
    }
});

// Update banner settings
router.post('/banner', async (req, res) => {
    try {
        const bannerSettings = req.body;
        
        // Ensure slidingImages is an array
        if (!Array.isArray(bannerSettings.slidingImages)) {
            bannerSettings.slidingImages = [];
        }
        
        let settings = await Settings.findOne();
        
        if (settings) {
            settings.banner = bannerSettings;
            await settings.save();
        } else {
            // Create new settings with banner
            settings = await Settings.create({
                banner: bannerSettings
            });
        }
        
        res.json({ message: 'Banner settings updated successfully', banner: settings.banner });
    } catch (error) {
        console.error('Error updating banner settings:', error);
        res.status(500).json({ error: 'Failed to update banner settings' });
    }
});

// Get offer settings
router.get('/offer', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        
        // If no settings exist, create default settings
        if (!settings) {
            settings = await Settings.create({});
        }
        
        // If offer settings don't exist, initialize them
        if (!settings.offer) {
            settings.offer = {
                title: 'Special Back to School Offer',
                description: 'Get up to 25% off on selected laptops and desktops, plus free accessories bundle with any purchase over $1,500.',
                discount: 25,
                minOrderAmount: 1500,
                ctaText: 'Shop the Sale',
                ctaLink: '/offers',
                backgroundImage: '',
                isActive: true,
                startDate: '',
                endDate: '',
                backgroundColor: '#7c3aed',
                textColor: '#ffffff'
            };
            await settings.save();
        }
        
        res.json(settings.offer);
    } catch (error) {
        console.error('Error fetching offer settings:', error);
        res.status(500).json({ error: 'Failed to fetch offer settings' });
    }
});

// Update offer settings
router.post('/offer', async (req, res) => {
    try {
        const offerSettings = req.body;
        
        let settings = await Settings.findOne();
        
        if (settings) {
            settings.offer = offerSettings;
            await settings.save();
        } else {
            // Create new settings with offer
            settings = await Settings.create({
                offer: offerSettings
            });
        }
        
        res.json({ message: 'Offer settings updated successfully', offer: settings.offer });
    } catch (error) {
        console.error('Error updating offer settings:', error);
        res.status(500).json({ error: 'Failed to update offer settings' });
    }
});

// Update settings
router.post('/', async (req, res) => {
    try {
        const updatedSettings = req.body;
        
        let settings = await Settings.findOne();
        
        if (settings) {
            // Update existing settings
            settings = await Settings.findByIdAndUpdate(
                settings._id,
                updatedSettings,
                { new: true }
            );
        } else {
            // Create new settings
            settings = await Settings.create(updatedSettings);
        }
        
        res.json({ message: 'Settings updated successfully', settings });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;