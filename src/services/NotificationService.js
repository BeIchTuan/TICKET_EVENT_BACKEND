const admin = require("firebase-admin");
const schedule = require("node-schedule");
const Notification = require("../models/NotificationModel")

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

  async scheduleNotification(tokens, title, body, data, scheduleTime) {
    const date = new Date(scheduleTime);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid schedule time");
    }

    schedule.scheduleJob(date, async () => {
      try {
        await this.sendNotification(tokens, title, body, data);
        console.log(`Notification sent at ${new Date().toISOString()}`);
      } catch (error) {
        console.error("Error sending scheduled notification:", error);
      }
    });

    return { scheduleTime: date.toISOString() };
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
}

module.exports = new NotificationService();
