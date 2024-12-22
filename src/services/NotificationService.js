const admin = require("firebase-admin");
const Notification = require("../models/NotificationModel");

const serviceAccount = require("../serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

class NotificationService {
  async sendNotification(tokens, title, body, data) {
    const payload = {
      notification: {
        title: title,
        body: body,
      },
      data: data || {},
    };

    const multicastMessage = {
      tokens: tokens,
      ...payload,
    };

    try {
      const response = await admin
        .messaging()
        .sendEachForMulticast(multicastMessage);
      console.log("Successfully sent message:", response);
      return response;
    } catch (error) {
      console.error("Error sending notification:", error);
      throw new Error(error + "Failed to send notification");
    }
  }

  async saveNotification(userId, type, title, body, data) {
    const notification = new Notification({
      receiptId: userId,
      type,
      title,
      body,
      data,
    });
    return notification.save();
  }

  async getAllNotifications(userId) {
    try {
      return await Notification.find({ receiptId: userId })
        .select("-__v -receiptId")
        .sort({
          createdAt: -1,
        });
    } catch (error) {
      throw new Error("Failed to fetch notifications: " + error.message);
    }
  }

  async markAsRead(userId, notificationId) {
    try {
      return await Notification.findOneAndUpdate(
        { _id: notificationId, receiptId: userId },
        { isRead: true },
        { new: true }
      );
    } catch (error) {
      throw new Error("Failed to mark notification as read: " + error.message);
    }
  }

  async markAllAsRead(userId) {
    try {
      return await Notification.updateMany(
        { receiptId: userId, isRead: false },
        { isRead: true }
      );
    } catch (error) {
      throw new Error(
        "Failed to mark all notifications as read: " + error.message
      );
    }
  }
}

module.exports = new NotificationService();
