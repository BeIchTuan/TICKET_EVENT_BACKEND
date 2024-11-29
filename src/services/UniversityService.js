const University = require("../models/UniversityModel");

class UniversityService {
  // Create a new university
  async createUniversity(data) {
    const university = new University(data);
    return await university.save();
  }

  // Get all universities
  async getAllUniversities() {
    return await University.find({ isDeleted: { $ne: true } });
  }

  // Get a university by ID
  async getUniversityById(id) {
    return await University.findOne({ _id: id, isDeleted: { $ne: true } });
  }

  // Update a university by ID
  async updateUniversity(id, data) {
    return await University.findByIdAndUpdate(id, data, { new: true });
  }

  // Delete a university by ID (soft delete)
  async deleteUniversity(id) {
    return await University.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
  }

  async getFacultiesByUniversity(universityId) {
    return await University.findById(universityId)
    .populate({
      path: "faculties",
      match: { isDeleted: { $ne: true } }, 
      select: "name _id", 
    })
  }
}

module.exports = new UniversityService();
