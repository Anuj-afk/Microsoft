import express from 'express';
import mongoose from 'mongoose';
import Page from '../models/Page.js';

const router = express.Router();

// Get all pages
router.get('/', async (req, res) => {
    try {
        const pages = await Page.find()
            .sort({ createdAt: -1 })
            .select('title slug status featuredImage isHomePage createdAt updatedAt');
        
        res.json(pages);
    } catch (error) {
        console.error('Error fetching pages:', error);
        res.status(500).json({ error: 'Failed to fetch pages' });
    }
});

// Get home page data - this needs to be BEFORE the /:id route to avoid conflict
router.get('/home', async (req, res) => {
    try {
        let homePage = await Page.findOne({ isHomePage: true });
        
        // If no home page is explicitly set, look for a page with slug 'home'
        if (!homePage) {
            homePage = await Page.findOne({ slug: 'home' });
        }
        
        // If still no home page, create default
        if (!homePage) {
            homePage = await Page.create({
                title: 'Home',
                slug: 'home',
                status: 'published',
                isHomePage: true,
                metaTitle: '',
                metaDescription: ''
            });
        }
        
        res.json(homePage);
    } catch (error) {
        console.error('Error fetching home page:', error);
        res.status(500).json({ error: 'Failed to fetch home page data' });
    }
});

// Update home page
router.post('/home', async (req, res) => {
    try {
        const pageData = req.body;
        
        // Ensure this is set as the home page
        pageData.isHomePage = true;
        
        let homePage = await Page.findOne({ isHomePage: true });
        if (!homePage) {
            homePage = await Page.findOne({ slug: 'home' });
        }
        
        if (homePage) {
            homePage = await Page.findByIdAndUpdate(
                homePage._id,
                pageData,
                { new: true }
            );
        } else {
            // Create home page if it doesn't exist
            homePage = await Page.create(pageData);
        }
        
        res.json({ message: 'Home page updated successfully', page: homePage });
    } catch (error) {
        console.error('Error updating home page:', error);
        res.status(500).json({ error: 'Failed to update home page' });
    }
});

// Get a page by slug
router.get('/by-slug/:slug', async (req, res) => {
    try {
        const page = await Page.findOne({ slug: req.params.slug });
        
        if (!page) {
            return res.status(404).json({ error: 'Page not found' });
        }
        
        res.json(page);
    } catch (error) {
        console.error('Error fetching page by slug:', error);
        res.status(500).json({ error: 'Failed to fetch page' });
    }
});

// Get a single page by ID - this needs to come AFTER the more specific routes
router.get('/:id', async (req, res) => {
    try {
        // Check if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid page ID format' });
        }
        
        const page = await Page.findById(req.params.id);
        
        if (!page) {
            return res.status(404).json({ error: 'Page not found' });
        }
        
        res.json(page);
    } catch (error) {
        console.error('Error fetching page:', error);
        res.status(500).json({ error: 'Failed to fetch page' });
    }
});

// Create a new page
router.post('/', async (req, res) => {
    try {
        // Check if slug already exists
        const existingPage = await Page.findOne({ slug: req.body.slug });
        if (existingPage) {
            return res.status(400).json({ error: 'A page with this slug already exists' });
        }

        const page = new Page(req.body);
        await page.save();
        
        res.status(201).json({ message: 'Page created successfully', page });
    } catch (error) {
        console.error('Error creating page:', error);
        res.status(500).json({ error: 'Failed to create page' });
    }
});

// Update a page
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if ID is valid
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid page ID format' });
        }
        
        // Check if slug already exists on another page
        if (req.body.slug) {
            const existingPage = await Page.findOne({ 
                slug: req.body.slug,
                _id: { $ne: id }
            });
            
            if (existingPage) {
                return res.status(400).json({ error: 'A page with this slug already exists' });
            }
        }
        
        const updatedPage = await Page.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );
        
        if (!updatedPage) {
            return res.status(404).json({ error: 'Page not found' });
        }
        
        res.json({ message: 'Page updated successfully', page: updatedPage });
    } catch (error) {
        console.error('Error updating page:', error);
        res.status(500).json({ error: 'Failed to update page' });
    }
});

// Delete a page
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if ID is valid
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid page ID format' });
        }
        
        const deletedPage = await Page.findByIdAndDelete(id);
        
        if (!deletedPage) {
            return res.status(404).json({ error: 'Page not found' });
        }
        
        res.json({ message: 'Page deleted successfully' });
    } catch (error) {
        console.error('Error deleting page:', error);
        res.status(500).json({ error: 'Failed to delete page' });
    }
});

export default router;