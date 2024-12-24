const Message = require("../models/MessageModel");
const notificationService = require("../services/NotificationService");

class MessageService {
  static async getMessagesByConversationId(conversationId, page, limit) {
    try {
      const skip = (page - 1) * limit;

      return await Message.find({conversationId})
        .sort({ time: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .select("-__v -conversationId -isDeleted -updatedAt -createdAt")
        .populate("sender", "_id name avatar")
        .lean();
    } catch (error) {
      throw new Error("Error fetching messages: " + error.message);
    }
  }

  static async sendMessage(data, userId) {
    try {
      const newMessage = new Message({
        conversationId: data.conversationId,
        content: data.content,
        sender: data.sender,
        parentMessageId: data.parentMessageId || null,
      });

      await newMessage.save();

      // Nếu là trả lời tin nhắn
      if (data.parentMessageId) {
        const parentMessage = await Message.findById(data.parentMessageId).populate(
          "sender"
        );

        if (parentMessage) {
          const originalSender = parentMessage.sender;

          // Tránh gửi thông báo cho chính người trả lời
          if (originalSender._id.toString() !== userId.toString()) {
            const tokens = originalSender.fcmTokens?.filter(Boolean);

            if (tokens?.length) {
              const title = "New Reply to Your Comment";
              const body = `Someone replied to your message: "${parentMessage.content}"`;
              const notificationData = {
                type: "comment_reply",
                conversationId: data.conversationId,
                // parentMessageId: data.parentMessageId,
                // newMessageId: newMessage._id.toString(),
              };

              // Gửi thông báo
              await notificationService.sendNotification(
                tokens,
                title,
                body,
                notificationData
              );

              // Lưu thông báo vào cơ sở dữ liệu
              await notificationService.saveNotification(
                originalSender._id,
                "comment_reply",
                title,
                body,
                notificationData
              );
            }
          }
        }
      }

      const savedMessage = await Message.findById(newMessage._id)
        .select("-__v -conversationId -isDeleted -updatedAt -createdAt")
        .populate("sender", "_id name avatar")
        .lean();

      return savedMessage;
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

    message.content = "Message is deleted"
    message.isDeleted = true;
    await message.save();
  }
}

module.exports = MessageService;
