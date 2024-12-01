const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Faculty Schema
const FacultySchema = new Schema(
  {
    name: { type: String, required: true },
    majors: [{ type: Schema.Types.ObjectId, ref: "Major" }],
    isDeleted: { type: Boolean, default: false },
  },
  { collection: "faculty" }
);

const Faculty = mongoose.model("Faculty", FacultySchema);

module.exports = Faculty;  