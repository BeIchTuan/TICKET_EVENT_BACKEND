const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const conversationSchema = new Schema(
  {
    title: { type: String },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    type: { type: String, enum: ["public", "private"] },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
  { collection: "conversation" }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
