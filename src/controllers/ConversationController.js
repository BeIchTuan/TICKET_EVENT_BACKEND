const ConversationService = require('../services/ConversationService');
const MessageService = require('../services/MessageService');

class ConversationController {
  static async createConversation(req, res) {
    try {
      const { title, members, type } = req.body;

      // Validate input
      if (!title || !type) {
        return res.status(400).json({ message: 'Title and type are required.' });
      }

      // Call service to create conversation
      const conversation = await ConversationService.createConversation({
        title,
        members: type === 'public' ? [] : members,
        type,
      });

      res.status(201).json({
        message: 'Conversation created successfully.',
        conversationId: conversation._id,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred while creating the conversation.' });
    }
  }

  static async getConversationMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Validate conversationId
      if (!conversationId) {
        return res.status(400).json({ message: 'Conversation ID is required.' });
      }

      // Validate access for private rooms
      const conversation = await ConversationService.getConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found.' });
      }

      if (conversation.type === 'private' && !conversation.members.includes(req.id)) {
        return res.status(403).json({ message: 'You do not have access to this conversation.' });
      }

      // Fetch messages
      const messages = await MessageService.getMessagesByConversationId(conversationId, page, limit);

      res.status(200).json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred while fetching messages.' });
    }
  }
}

module.exports = ConversationController;
