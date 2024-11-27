const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");

router.post("/register", AuthController.createUser);
router.post("/login", AuthController.loginUser);

module.exports = router;
