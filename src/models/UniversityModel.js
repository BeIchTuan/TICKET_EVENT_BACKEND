const mongoose = require("mongoose");

// University Schema
const UniversitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  faculties: [{ type: String, ref: "Faculty" }] 
});

module.exports = mongoose.model("University", UniversitySchema);
