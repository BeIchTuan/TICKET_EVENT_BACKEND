const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const { authMiddleware } = require('../middlewares/AuthMiddleware');

router.get('/', CategoryController.getCategories);
router.post('/create', authMiddleware(['admin']), CategoryController.createCategory);

module.exports = router;
