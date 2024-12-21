const express = require("express");
const NotificationController = require("../controllers/NotificationController");
const router = express.Router();
const { authMiddleware } = require("../middlewares/AuthMiddleware");

router.post("/", NotificationController.sendNotification);

router.get(
  "/",
  authMiddleware(["event_creator", "admin", "ticket_buyer"]),
  NotificationController.getAllNotifications
);

router.patch(
  "/:notificationId/mark-as-read",
  authMiddleware(["event_creator", "admin", "ticket_buyer"]),
  NotificationController.markAsRead
);

router.patch(
  "/mark-all-as-read",
  authMiddleware(["event_creator", "admin", "ticket_buyer"]),
  NotificationController.markAllAsRead
);

module.exports = router;
