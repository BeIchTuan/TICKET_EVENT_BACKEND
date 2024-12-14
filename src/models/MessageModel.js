const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    content: { type: String },
    time: { type: Date, default: Date.now },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
    parentMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  },
  { collection: "message" }
);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
