const TicketService = require('../services/TicketService');

class TicketController {
  static async bookTicket(req, res) {
    try {
      const { eventId } = req.body;
      const buyerId = req.id;

      const result = await TicketService.bookTicket(eventId, buyerId);
      
      res.status(201).json({
        status: "success",
        message: "Ticket booked successfully",
        data: {
          _id: result._id,
          eventId: result.eventId,
          buyerId: result.buyerId,
          bookingCode: result.bookingCode,
          qrCode: result.qrCode,
          status: result.status,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt
        }
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  }

  static async cancelTicket(req, res) {
    try {
      const { ticketId } = req.params;
      const userId = req.id;

      await TicketService.cancelTicket(ticketId, userId);
      
      res.status(200).json({
        message: "Ticket cancelled successfully."
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }

  static async transferTicket(req, res) {
    try {
      const { ticketId } = req.params;
      const { newOwnerId } = req.body;
      const currentOwnerId = req.id;

      await TicketService.transferTicket(ticketId, currentOwnerId, newOwnerId);

      res.status(200).json({
        message: "Ticket transfer initiated. Waiting for confirmation."
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }

  static async confirmTransfer(req, res) {
    try {
      const { ticketId } = req.params;
      const newOwnerId = req.id;

      await TicketService.confirmTransfer(ticketId, newOwnerId);

      res.status(200).json({
        message: "Ticket transferred successfully."
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }

  static async rejectTransfer(req, res) {
    try {
      const { ticketId } = req.params;
      const userId = req.id;

      await TicketService.rejectTransfer(ticketId, userId);

      res.status(200).json({
        message: "Ticket transfer rejected."
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }

  static async checkIn(req, res) {
    try {
      const { qrCode } = req.body;
      
      if (!qrCode) {
        return res.status(400).json({
          message: "QR code is required"
        });
      }

      await TicketService.checkInByQR(qrCode);
      
      res.status(200).json({
        message: "Check-in successful."
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
}

module.exports = TicketController;
