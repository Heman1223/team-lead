const Category = require('../models/Category');

/**
 * Category Controller
 * Handles file category management
 */

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find()
            .populate('created_by', 'name email')
            .sort({ category_name: 1 });

        res.json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching categories',
            error: error.message 
        });
    }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin)
const createCategory = async (req, res) => {
    try {
        const { category_name, description } = req.body;
        const currentUserId = req.user._id;

        if (!category_name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Category name is required' 
            });
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({ category_name });
        if (existingCategory) {
            return res.status(400).json({ 
                success: false, 
                message: 'Category already exists' 
            });
        }

        const category = await Category.create({
            category_name,
            description,
            created_by: currentUserId
        });

        await category.populate('created_by', 'name email');

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });

    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating category',
            error: error.message 
        });
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_name, description } = req.body;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found' 
            });
        }

        if (category_name) {
            // Check if new name already exists
            const existingCategory = await Category.findOne({ 
                category_name,
                _id: { $ne: id }
            });

            if (existingCategory) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Category name already exists' 
                });
            }

            category.category_name = category_name;
        }

        if (description !== undefined) {
            category.description = description;
        }

        await category.save();
        await category.populate('created_by', 'name email');

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });

    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating category',
            error: error.message 
        });
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByIdAndDelete(id);
        if (!category) {
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found' 
            });
        }

        // Remove category from all files
        const File = require('../models/File');
        await File.updateMany(
            { category_id: id },
            { category_id: null }
        );

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });

    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting category',
            error: error.message 
        });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
