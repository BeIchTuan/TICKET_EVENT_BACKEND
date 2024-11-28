const express = require('express')
const router = express.Router()
const userController = require('../controllers/UserController')
const { authMiddleware } = require('../middlewares/AuthMiddleware');
// const upload = require("../middlewares/uploadImage");

//Work with user information
// router.put('/user/:id', upload.single("avatar"), authMiddleware(['user', 'seller']), userController.updateUser)
// router.delete('/user/:id', userController.deleteUser)
// router.get('/user/:id', userController.getUser)

//Get all users
router.get('/all',authMiddleware(['admin']), userController.getUsers)

//Search users
router.get('/search', userController.searchUsers)

module.exports = router