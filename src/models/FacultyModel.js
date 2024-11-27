const mongoose = require("mongoose");

// Faculty Schema
const FacultySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    majors: [{ type: String, ref: "Major" }],
    isDeleted: { type: Boolean, default: false },
  },
  { collection: "faculty" }
);

module.exports = mongoose.model("Faculty", FacultySchema);
  