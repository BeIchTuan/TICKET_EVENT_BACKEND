const express = require("express");
const router = express.Router();
const facultyController = require("../controllers/FacultyController");
const { authMiddleware } = require('../middlewares/AuthMiddleware');

router.get("/", facultyController.getAllFaculties);
// router.post("/", facultyController.createFaculty);
router.get("/:facultyId/majors", facultyController.getMajorsByFacultyID);
// router.put("/:id", facultyController.updateFaculty);
// router.delete("/:id", facultyController.deleteFaculty);

module.exports = router;




