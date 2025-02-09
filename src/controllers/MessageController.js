const MessageService = require("../services/MessageService");
const ConversationService = require("../services/ConversationService");
const analyzeSentiment = require("../middlewares/PredictText")

class MessageController {
  static async sendMessage(req, res) {
    try {
      const { conversationId, content, parentMessageId } = req.body;
      const userId = req.id;
      // Validate input
      if (!conversationId || !content) {
        return res
          .status(400)
          .json({ message: "Conversation ID and content are required." });
      }

      const sentiment = await analyzeSentiment(content);
      if (!sentiment) {
        return res
          .status(500)
          .json({ message: "Failed to analyze message sentiment." });
      }

      if (sentiment === "negative") {
        return res
          .status(400)
          .json({
            message: "Message contains negative sentiment and cannot be sent.",
          });
      }

      // Verify the conversation exists
      const conversation = await ConversationService.getConversationById(
        conversationId
      );
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found." });
      }

      // Check if user is a member of a private conversation
      if (
        conversation.type === "private" &&
        !conversation.members.includes(req.id)
      ) {
        return res
          .status(403)
          .json({ message: "You do not have access to this conversation." });
      }

      // Send message
      const newMessage = await MessageService.sendMessage(
        {
          conversationId,
          content,
          sender: req.id,
          parentMessageId: parentMessageId || null,
        },
        userId
      );

      res.status(201).json(newMessage);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "An error occurred while sending the message." });
    }
  }

  static async updateMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      const userId = req.id;

      await MessageService.updateMessage(messageId, userId, content);
      return res.status(200).json({ message: "Message updated successfully." });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.id;

      await MessageService.deleteMessage(messageId, userId);
      return res.status(200).json({ message: "Message deleted successfully." });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
}

module.exports = MessageController;
