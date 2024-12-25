const Faculty = require("../models/FacultyModel");
const Major = require("../models/MajorModel");
const University = require("../models/UniversityModel");

class UniversityService {
  // Create a new university
  async createUniversity(data) {
    const university = new University(data);
    return await university.save();
  }

  // Get all universities
  async getAllUniversities() {
    return await University
      .find({ isDeleted: { $ne: true } })
      .select('-isDeleted -__v')
      .populate('faculties', '_id');
  }

  // Get a university by ID
  async getUniversityById(id) {
    return await University.findOne({ _id: id, isDeleted: { $ne: true } });
  }

  // Get all universities and populate faculties, majors
  async getAllUniversitiesWithFacultiesAndMajors() {
    return await University.find({ isDeleted: { $ne: true } })
      .select("name _id")
      .populate({
        path: "faculties",
        match: { isDeleted: { $ne: true } },
        select: "name _id",
        populate: {
          path: "majors",
          match: { isDeleted: { $ne: true } },
          select: "name _id",
        },
      });
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
    const faculties = await University.findById(universityId).populate({
      path: "faculties",
      match: { isDeleted: { $ne: true } },
      select: "_id name",
    });

    // const facultyObjectIds = faculties.toJSON().faculties.map((faculty) => faculty._id);
    // const facultyIds = facultyObjectIds.map((faculty) => faculty.toString());
    // console.log(facultyIds);
    
    // const majors = Faculty.find({majors: {$in: facultyIds}}).populate('majors');
    // const majosJson = majors.toJSON();

    // console.log(majosJson);
    
    return faculties;
  }
}

module.exports = new UniversityService();
