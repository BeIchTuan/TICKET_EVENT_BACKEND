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

  // Lên lịch gửi thông báo
  async scheduleNotification(req, res) {
    const { tokens, title, body, data, scheduleTime } = req.body;

    try {
      const response = await NotificationService.scheduleNotification(
        tokens,
        title,
        body,
        data,
        scheduleTime
      );
      res.status(200).send({ success: true, message: "Notification scheduled successfully", response });
    } catch (error) {
      console.error("Error scheduling notification:", error);
      res.status(500).send({ success: false, error: error.message });
    }
  }
}

module.exports = new NotificationController();
