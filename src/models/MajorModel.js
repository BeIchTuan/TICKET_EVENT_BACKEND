const mongoose = require("mongoose");

// Major Schema
const MajorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { collection: "major" }
);

module.exports = mongoose.model("Major", MajorSchema);
