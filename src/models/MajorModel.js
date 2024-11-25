const mongoose = require("mongoose");

// Major Schema
const MajorSchema = new mongoose.Schema({
  name: { type: String, required: true }
});

module.exports = mongoose.model("Major", MajorSchema);
