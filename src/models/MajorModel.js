const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Major Schema
const MajorSchema = new Schema(
  {
    name: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { collection: "major" }
);

const Major = mongoose.model("Major", MajorSchema);

module.exports = Major;