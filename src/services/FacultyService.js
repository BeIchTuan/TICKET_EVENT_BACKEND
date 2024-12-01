const Faculty = require("../models/FacultyModel");

class FacultyService {
  async createFaculty(data) {
    return await Faculty.create(data);
  }

  async getAllFaculties() {
    return await Faculty.find({ isDeleted: { $ne: false } });
  }

  async updateFaculty(id, data) {
    return await Faculty.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteFaculty(id) {
    return await Faculty.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
  }

  async getMajorsByFacultyID(facultyId) {
    console.log(facultyId)
    return await Faculty.findById(facultyId)
    .populate({
      path: "majors",
      match: { isDeleted: { $ne: true } }, 
      select: "name _id", 
    })
  }
}

module.exports = new FacultyService();
