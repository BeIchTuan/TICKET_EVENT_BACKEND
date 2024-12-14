const Message = require("../models/MessageModel");

class MessageService {
  static async getMessagesByConversationId(conversationId, page, limit) {
    try {
      const skip = (page - 1) * limit;

      return await Message.find({ conversationId, isDeleted: false })
        .sort({ time: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .select("-__v")
        .lean();
    } catch (error) {
      throw new Error("Error fetching messages: " + error.message);
    }
  }

  static async sendMessage(data) {
    try {
      const newMessage = new Message({
        conversationId: data.conversationId,
        content: data.content,
        sender: data.sender,
        parentMessageId: data.parentMessageId || null,
      });

      return await newMessage.save();
    } catch (error) {
      throw new Error("Error sending message: " + error.message);
    }
  }

  static async updateMessage(messageId, userId, content) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error("Message not found.");
    }

    if (message.sender.toString() !== userId) {
      throw new Error("You are not authorized to edit this message.");
    }

    message.content = content;
    message.isEdited = true;
    await message.save();
  }

  // Xóa tin nhắn (chuyển isDeleted thành true)
  static async deleteMessage(messageId, userId) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error("Message not found.");
    }

    if (message.sender.toString() !== userId) {
      throw new Error("You are not authorized to delete this message.");
    }

    message.isDeleted = true;
    await message.save();
  }
}

module.exports = MessageService;
