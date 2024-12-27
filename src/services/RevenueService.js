const Ticket = require("../models/TicketModel");
const Event = require("../models/EventModel");
const moment = require("moment");

class RevenueService {
    static async getTotalRevenueChart({
      userId,
      userRole,
      startDate,
      endDate,
      interval,
    }) {
      const matchCondition = { isDeleted: false };

      if (userRole !== "admin") {
        matchCondition.createdBy = userId;
      }

      const events = await Event.find(matchCondition).select("_id");
      const eventIds = events.map((event) => event._id);

      const ticketMatch = {
        eventId: { $in: eventIds },
        isDeleted: false,
        // paymentStatus: 'paid',
      };

      if (startDate) {
        ticketMatch.createdAt = { $gte: new Date(startDate) };
      }

      if (endDate) {
        ticketMatch.createdAt = ticketMatch.createdAt || {};
        ticketMatch.createdAt.$lte = new Date(endDate);
      }

      const groupByFormat =
        {
          day: "%Y-%m-%d",
          week: "%Y-%U",
          month: "%Y-%m",
          year: "%Y",
        }[interval] || "%Y-%m-%d";

      const tickets = await Ticket.aggregate([
        { $match: ticketMatch },
        {
          $group: {
            _id: { $dateToString: { format: groupByFormat, date: "$createdAt" } },
            totalRevenue: { $sum: "$paymentData.amount" },
            totalTickets: { $sum: 1 },
            cancelledTickets: {
              $sum: {
                $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
              },
            },
            users: { $addToSet: "$buyerId" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Chuẩn hóa dữ liệu đầu ra
      const chartData = {
        labels: tickets.map((t) => t._id),
        revenue: tickets.map((t) => t.totalRevenue),
        tickets: tickets.map((t) => t.totalTickets),
        cancelledTickets: tickets.map((t) => t.cancelledTickets),
        users: tickets.map((t) => t.users.length),
      };

      const total = {
        totalRevenue: chartData.revenue.reduce((acc, curr) => acc + curr, 0),
        totalTickets: chartData.tickets.reduce((acc, curr) => acc + curr, 0),
        totalCancelledTickets: chartData.cancelledTickets.reduce(
          (acc, curr) => acc + curr,
          0
        ),
        totalUsers: [...new Set(tickets.flatMap((t) => t.users))].length,
      };

      return { chartData, total };
    }

  static async getRevenueChartByEvent({
    userId,
    userRole,
    startDate,
    endDate,
    interval,
    eventId,
  }) {

    console.log(eventId)
    const matchCondition = { isDeleted: false };

    if (userRole !== "admin") {
      matchCondition.createdBy = userId;
    }

    let eventIds = [];
    if (eventId) {
      const event = await Event.findOne({ _id: eventId, isDeleted: false });
      console.log(event)
      if (
        !event ||
        (userRole !== "admin" && event.createdBy.toString() !== userId)
      ) {
        console.log("No matching event found for eventId:", eventId);
        return {
          chartData: {
            labels: [],
            revenue: [],
            tickets: [],
            cancelledTickets: [],
            users: [],
          },
          total: {
            totalRevenue: 0,
            totalTickets: 0,
            totalCancelledTickets: 0,
            totalUsers: 0,
          },
        };
      }
      eventIds = [event._id];
    } else {
      const events = await Event.find(matchCondition).select("_id");
      eventIds = events.map((event) => event._id);
    }

    const ticketMatch = {
      eventId: { $in: eventIds },
      isDeleted: false,
      status: "booked"
    };

    console.log(ticketMatch)

    if (startDate) {
      ticketMatch.createdAt = { $gte: new Date(startDate) };
    }

    if (endDate) {
      ticketMatch.createdAt = ticketMatch.createdAt || {};
      ticketMatch.createdAt.$lte = new Date(endDate);
    }

    const groupByFormat =
      {
        day: "%Y-%m-%d",
        week: "%Y-%U",
        month: "%Y-%m",
        year: "%Y",
      }[interval] || "%Y-%m-%d";

    const tickets = await Ticket.aggregate([
      { $match: ticketMatch },
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: "$createdAt" } },
          totalRevenue: { $sum: "$paymentData.amount" },
          totalTickets: { $sum: 1 },
          cancelledTickets: {
            $sum: {
              $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
            },
          },
          users: { $addToSet: "$buyerId" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const chartData = {
      labels: tickets.map((t) => t._id),
      revenue: tickets.map((t) => t.totalRevenue),
      tickets: tickets.map((t) => t.totalTickets),
      cancelledTickets: tickets.map((t) => t.cancelledTickets),
      users: tickets.map((t) => t.users.length),
    };

    const total = {
      totalRevenue: chartData.revenue.reduce((acc, curr) => acc + curr, 0),
      totalTickets: chartData.tickets.reduce((acc, curr) => acc + curr, 0),
      totalCancelledTickets: chartData.cancelledTickets.reduce(
        (acc, curr) => acc + curr,
        0
      ),
      totalUsers: [...new Set(tickets.flatMap((t) => t.users))].length,
    };

    return { chartData, total };
  }
}

module.exports = RevenueService;
