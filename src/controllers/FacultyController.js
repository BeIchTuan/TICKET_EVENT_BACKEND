const Faculty = require("../models/FacultyModel");
const FacultyService = require("../services/FacultyService");
const facultyService = require("../services/FacultyService");

class FacultyController {
  async createFaculty(req, res) {
    try {
      const { universityId, name } = req.body;
      const faculty = await FacultyService.createFaculty(universityId, { name });
      const data = faculty.toJSON();
      res.status(201).json({ message: "Faculty created successfully", ...data });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async createMajor(req, res) {
    try {
      const { facultyId, name } = req.body;
      const major = await FacultyService.createMajor(facultyId, { name });
      res.status(201).json(major);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getAllFaculties(req, res) {
    try {
      const faculties = await facultyService.getAllFaculties();
      res.status(200).json({ success: true, data: faculties });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMajorsByFacultyID(req, res) {
    try {
      const { facultyId } = req.params;
      const faculty = await FacultyService.getMajorsByFacultyID(
        facultyId
      );

      if (!faculty) {
        return res
          .status(404)
          .json({ success: false, message: "Faculty not found" });
      }

      res.status(200).json(faculty.majors);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateFaculty(req, res) {
    try {
      const { id } = req.params;
      const updatedFaculty = await facultyService.updateFaculty(id, req.body);
      if (!updatedFaculty) {
        return res
          .status(404)
          .json({ success: false, message: "Faculty not found" });
      }
      res.status(200).json({ success: true, data: updatedFaculty });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteFaculty(req, res) {
    try {
      const { id } = req.params;
      const deletedFaculty = await facultyService.deleteFaculty(id);
      if (!deletedFaculty) {
        return res
          .status(404)
          .json({ success: false, message: "Faculty not found" });
      }
      res
        .status(200)
        .json({ success: true, message: "Faculty deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new FacultyController();
