const Conversation = require("../models/ConversationModel");

class ConversationService {
  static async getConversations(userId, page, limit, type) {
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };

    if (type === "public") {
      filter.type = "public";
    } else if (type === "private") {
      filter.type = "private";
      filter.members = userId; 
    } else {
      filter.$or = [{ type: "public" }, { type: "private", members: userId }];
    }

    // Truy vấn MongoDB với bộ lọc
    return await Conversation.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 }); 
  }

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
