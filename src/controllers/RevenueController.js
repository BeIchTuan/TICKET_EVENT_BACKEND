const RevenueService = require("../services/RevenueService");

class RevenueController {
  static async getTotalRevenueChart(req, res) {
    try {
      const { startDate, endDate, interval } = req.query;
      const userId = req.id;
      const userRole = req.role;

      const result = await RevenueService.getTotalRevenueChart({
        userId,
        userRole,
        startDate,
        endDate,
        interval,
      });

      return res.status(200).json({
        status: "success",
        chartData: result.chartData,
        total: result.total,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch revenue chart report",
      });
    }
  }

  static async getRevenueChartByEvent(req, res) {
    try {
      const { startDate, endDate, interval } = req.query;
      const eventId = req.params.eventId;
      const userId = req.id;
      const userRole = req.role;

      const result = await RevenueService.getRevenueChartByEvent({
        userId,
        userRole,
        startDate,
        endDate,
        interval,
        eventId,
      });

      return res.status(200).json({
        status: "success",
        chartData: result.chartData,
        total: result.total,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: "error",
        message: "Failed to fetch revenue chart report",
      });
    }
  }
}

module.exports = RevenueController;
