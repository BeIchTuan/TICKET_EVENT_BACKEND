const express = require("express");
const ConversationController = require("../controllers/ConversationController");
const { authMiddleware } = require("../middlewares/AuthMiddleware");

const router = express.Router();

router.post("/", ConversationController.createConversation);

router.get(
  "/:conversationId/messages",
  authMiddleware(["event_creator", "admin", "ticket_buyer"]),
  ConversationController.getConversationMessages
);

module.exports = router;
