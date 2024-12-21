const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  type: { type: String}, 
  title: { type: String},
  body: { type: String},
  data: { type: Object}, 
  receiptId: { type: mongoose.Schema.Types.ObjectId, ref: "User"}, 
  isRead: { type: Boolean, default: false }, 
  createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
