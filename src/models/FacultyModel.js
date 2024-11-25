const mongoose = require("mongoose");

// Faculty Schema
const FacultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  majors: [{ type: String, ref: "Major" }] 
});

module.exports = mongoose.model("Faculty", FacultySchema);
