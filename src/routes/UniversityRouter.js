const express = require("express");
const router = express.Router();
const UniversityController = require("../controllers/UniversityController");
const { authMiddleware } = require("../middlewares/AuthMiddleware");

router.post(
  "/",
  authMiddleware(["admin"]),
  UniversityController.createUniversity
);
// router.get("/universities/:id", UniversityController.getUniversityById);
// router.put("/universities/:id", UniversityController.updateUniversity);
// router.delete("/universities/:id", UniversityController.deleteUniversity);
router.get(
  "/:universityId/faculties",
  UniversityController.getFacultiesByUniversity
);
router.get("/", UniversityController.getAllUniversities);

module.exports = router;
