const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// University Schema
const UniversitySchema = new Schema(
  {
    name: { type: String, required: true },
    faculties: [{ type: Schema.Types.ObjectId, ref: "Faculty" }],
    isDeleted: { type: Boolean, default: false },
  },
  { collection: "university" }
);

const University = mongoose.model("University", UniversitySchema);

module.exports = University;
