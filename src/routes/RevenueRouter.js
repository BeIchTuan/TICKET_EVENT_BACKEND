const express = require("express");
const RevenueController = require("../controllers/RevenueController");
const { authMiddleware } = require("../middlewares/AuthMiddleware");
const router = express.Router();

router.get(
  "/chart/:eventId",
  authMiddleware(["event_creator", "admin"]),
  RevenueController.getRevenueChartByEvent
);

router.get(
  "/chart",
  authMiddleware(["event_creator", "admin"]),
  RevenueController.getTotalRevenueChart
);

module.exports = router;
