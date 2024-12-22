const NotificationService = require("../services/NotificationService");

class NotificationController {
  async sendNotification(req, res) {
    const { tokens, title, body, data } = req.body;

    try {
      const response = await NotificationService.sendNotification(tokens, title, body, data);
      res.status(200).send({ success: true, response });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).send({ success: false, error: error.message });
    }
  }

  async getAllNotifications(req, res) {
    try {
      const userId = req.id;
      const notifications = await NotificationService.getAllNotifications(userId);
      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async markAsRead(req, res) {
    try {
      const userId = req.id;
      const { notificationId } = req.params;

      const notification = await NotificationService.markAsRead(userId, notificationId);

      if (!notification) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }

      res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: notification,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const userId = req.id;
      await NotificationService.markAllAsRead(userId);
      res.status(200).json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new NotificationController();
