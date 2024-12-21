const express = require("express");
const NotificationController = require("../controllers/NotificationController");
const router = express.Router();

router.post("/", NotificationController.sendNotification);

module.exports = router;
