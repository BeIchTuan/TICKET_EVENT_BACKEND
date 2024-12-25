const express = require("express");
const router = express.Router();
const facultyController = require("../controllers/FacultyController");
const { authMiddleware } = require("../middlewares/AuthMiddleware");

router.get("/", facultyController.getAllFaculties);

router.post(
  "/",
  authMiddleware(["admin"]),
  facultyController.createFaculty
);

router.post(
    "/majors",
    authMiddleware(["admin"]),
    facultyController.createMajor
  );

router.get("/:facultyId/majors", facultyController.getMajorsByFacultyID);
router.put("/:id", facultyController.updateFaculty);
router.delete("/:id", facultyController.deleteFaculty);

module.exports = router;
