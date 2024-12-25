const UniversityService = require("../services/UniversityService");

class UniversityController {
  // Create a new university
  async createUniversity(req, res) {
    try {
      const university = await UniversityService.createUniversity(req.body);
      const data = university.toJSON();
      res.status(201).json({ message: "University created successfully", ...data });
    } catch (error) {
      res.status(500).json({ message: "Error creating university", error });
    }
  }

  // Get all universities
  async getAllUniversitiesWithFacultiesAndMajors(req, res) {
    try {
      const universities =
        await UniversityService.getAllUniversitiesWithFacultiesAndMajors();
      res.status(200).json(universities);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving universities", error });
    }
  }
  
  async getAllUniversities(req, res) {
    try {
      const universities =
        await UniversityService.getAllUniversities();
      res.status(200).json(universities);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving universities", error });
    }
  }

  // Get a university by ID
  async getUniversityById(req, res) {
    try {
      const university = await UniversityService.getUniversityById(req.params.id);
      if (!university) {
        return res.status(404).json({ message: "University not found" });
      }
      res.status(200).json(university);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving university", error });
    }
  }

  // Update a university by ID
  async updateUniversity(req, res) {
    try {
      const university = await UniversityService.updateUniversity(req.params.id, req.body);
      if (!university) {
        return res.status(404).json({ message: "University not found" });
      }
      res.status(200).json(university);
    } catch (error) {
      res.status(500).json({ message: "Error updating university", error });
    }
  }

  // Delete a university by ID (soft delete)
  async deleteUniversity(req, res) {
    try {
      const university = await UniversityService.deleteUniversity(req.params.id);
      if (!university) {
        return res.status(404).json({ message: "University not found" });
      }
      res.status(200).json({ message: "University deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting university", error });
    }
  }

  //Get university's faculties
  async getFacultiesByUniversity(req, res) {
    try {
      const { universityId } = req.params;
      const university = await UniversityService.getFacultiesByUniversity(universityId);

      if (!university) {
        return res.status(404).json({ success: false, message: "University not found" });
      }

      res.status(200).json(university.faculties);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new UniversityController();
