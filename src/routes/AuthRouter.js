const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const FCMTokenController = require('../controllers/FCMTokenController');
const { authMiddleware } = require('../middlewares/AuthMiddleware');

router.post("/register", AuthController.createUser);
router.post("/login", AuthController.loginUser);
router.post('/fcm-token', authMiddleware(), FCMTokenController.saveToken);
router.delete('/fcm-token', authMiddleware(), FCMTokenController.deleteToken);

module.exports = router;
