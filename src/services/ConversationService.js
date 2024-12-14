const Conversation = require("../models/ConversationModel");

class ConversationService {
  static async createConversation(data) {
    try {
      const newConversation = new Conversation({
        title: data.title,
        members: data.members || [],
        type: data.type,
      });

      return await newConversation.save();
    } catch (error) {
      throw new Error("Error creating conversation: " + error.message);
    }
  }

  static async getConversationById(conversationId) {
    try {
      return await Conversation.findOne({
        _id: conversationId,
        isDeleted: false,
      });
    } catch (error) {
      throw new Error("Error fetching conversation: " + error.message);
    }
  }
}

module.exports = ConversationService;
