const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    avatar: { type: String },
    university: { type: Schema.Types.ObjectId, ref: "University" },
    faculty: { type: Schema.Types.ObjectId, ref: "Faculty" },
    major: { type: Schema.Types.ObjectId, ref: "Major" },
    studentId: { type: String, unique: true },
    birthday: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    phone: { type: String },
    role: {
      type: String,
      enum: ["admin", "event_creator", "ticket_buyer"],
      required: true,
    },
    //eventsCreated: [{type: Schema.Types.ObjectId, ref: "Event"}],
    //ticketsBought: [{type: Schema.Types.ObjectId, ref: "Ticket"}],
  },
  { collection: "user" }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
