const Category = require('../models/CategoryModel');

class CategoryController {
    static async createCategory(req, res) {
        try {
            const category = new Category(req.body);
            await category.save();
            res.status(201).json({
                message: "Category created successfully",
                category
            });
        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }

    static async getCategories(req, res) {
        try {
            const categories = await Category.find({ isDeleted: false });
            res.status(200).json(categories);
        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }
}

module.exports = CategoryController;
