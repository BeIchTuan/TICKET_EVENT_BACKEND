const Faculty = require("../models/FacultyModel");
const University = require("../models/UniversityModel");
const Major = require("../models/MajorModel");

class FacultyService {
  async createFaculty(universityId, { name }) {
    const faculty = new Faculty({ name });
    const savedFaculty = await faculty.save();

    await University.findByIdAndUpdate(
      universityId,
      { $push: { faculties: savedFaculty._id } },
      { new: true }
    );

    return savedFaculty;
  }

  async createMajor(facultyId, { name }) {
    const major = new Major({ name });
    const savedMajor = await major.save();

    await Faculty.findByIdAndUpdate(
      facultyId,
      { $push: { majors: savedMajor._id } },
      { new: true }
    );

    return savedMajor;
  }

  async getAllFaculties() {
    return await Faculty.find({ isDeleted: { $ne: false } });
  }

  async updateFaculty(id, data) {
    return await Faculty.findByIdAndUpdate(id, data, { new: true });
  }

  async updateMajor(id, data) {
    return await Major.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteFaculty(id) {
    return await Faculty.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
  }

  async deleteMajor(id) {
    return await Major.findByIdAndDelete(id);
  }

  async getMajorsByFacultyID(facultyId) {
    console.log(facultyId);
    return await Faculty.findById(facultyId).populate({
      path: "majors",
      match: { isDeleted: { $ne: true } },
      select: "name _id",
    });
  }
}

module.exports = new FacultyService();
