const express = require('express')
const router = express.Router()
const UniversityController = require("../controllers/UniversityController");
const { authMiddleware } = require('../middlewares/AuthMiddleware');

router.post("/universities", UniversityController.createUniversity);
router.get("/universities", authMiddleware(['admin']), UniversityController.getAllUniversities);
router.get("/universities/:id", UniversityController.getUniversityById);
router.put("/universities/:id", UniversityController.updateUniversity);
router.delete("/universities/:id", UniversityController.deleteUniversity);

module.exports = router;

