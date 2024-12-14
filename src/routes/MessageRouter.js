const express = require("express");
const MessageController = require("../controllers/MessageController");
const router = express.Router();
const { authMiddleware } = require("../middlewares/AuthMiddleware");

router.post(
  "/",
  authMiddleware(["event_creator", "admin", "ticket_buyer"]),
  MessageController.sendMessage
);

// Sửa tin nhắn
router.put(
  "/:messageId",
  authMiddleware(["event_creator", "admin", "ticket_buyer"]),
  MessageController.updateMessage
);

// Xóa tin nhắn
router.delete(
  "/:messageId",
  authMiddleware(["event_creator", "admin", "ticket_buyer"]),
  MessageController.deleteMessage
);

module.exports = router;
