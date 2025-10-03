import express from 'express';
import mongoose from 'mongoose';
import Category from '../models/Category.js';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find()
            .sort({ order: 1, name: 1 });
        
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Get a single category by ID
router.get('/:id', async (req, res) => {
    try {
        // Check if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid category ID format' });
        }
        
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ error: 'Failed to fetch category' });
    }
});

// Get a category by slug
router.get('/by-slug/:slug', async (req, res) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug });
        
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json(category);
    } catch (error) {
        console.error('Error fetching category by slug:', error);
        res.status(500).json({ error: 'Failed to fetch category' });
    }
});

// Create a new category
router.post('/', async (req, res) => {
    try {
        // Check if slug already exists
        const existingCategory = await Category.findOne({ slug: req.body.slug });
        if (existingCategory) {
            return res.status(400).json({ error: 'A category with this slug already exists' });
        }

        const category = new Category(req.body);
        await category.save();
        
        res.status(201).json({ message: 'Category created successfully', category });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// Update a category
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if ID is valid
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid category ID format' });
        }
        
        // Check if slug already exists on another category
        if (req.body.slug) {
            const existingCategory = await Category.findOne({ 
                slug: req.body.slug,
                _id: { $ne: id }
            });
            
            if (existingCategory) {
                return res.status(400).json({ error: 'A category with this slug already exists' });
            }
        }
        
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );
        
        if (!updatedCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json({ message: 'Category updated successfully', category: updatedCategory });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// Delete a category
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if ID is valid
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid category ID format' });
        }
        
        const deletedCategory = await Category.findByIdAndDelete(id);
        
        if (!deletedCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

export default router;