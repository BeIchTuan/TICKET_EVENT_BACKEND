const express = require("express");
const router = express.Router();
const UniversityController = require("../controllers/UniversityController");
const { authMiddleware } = require("../middlewares/AuthMiddleware");

router.post(
  "/",
  authMiddleware(["admin"]),
  UniversityController.createUniversity
);
//router.get("/:id", UniversityController.getUniversityById);
router.put("/:id", UniversityController.updateUniversity);
router.delete("/:id", UniversityController.deleteUniversity);
router.get(
  "/:universityId/faculties",
  UniversityController.getFacultiesByUniversity
);

router.get("/all", UniversityController.getAllUniversitiesWithFacultiesAndMajors);
router.get("/", UniversityController.getAllUniversities);

module.exports = router;
