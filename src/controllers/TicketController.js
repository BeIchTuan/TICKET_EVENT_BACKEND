const TicketService = require('../services/TicketService');
const MomoService = require('../services/MomoService');
const Event = require('../models/EventModel');
const Ticket = require('../models/TicketModel');

class TicketController {
  static async bookTicket(req, res) {
    try {
      const { eventId } = req.body;
      const buyerId = req.id;

      // Đặt vé
      const ticket = await TicketService.bookTicket(eventId, buyerId);
      
      // Lấy thông tin sự kiện để biết giá vé
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Tạo thanh toán MoMo
      const orderInfo = `Thanh toán vé sự kiện: ${event.name}`;
      const paymentResult = await MomoService.createPayment(event.price, orderInfo);

      // Cập nhật thông tin thanh toán vào vé
      await Ticket.findByIdAndUpdate(ticket._id, {
        paymentData: paymentResult
      });

      res.status(201).json({
        status: "success",
        message: "Ticket booked successfully",
        data: {
          _id: ticket._id,
          eventId: ticket.eventId,
          buyerId: ticket.buyerId,
          bookingCode: ticket.bookingCode,
          qrCode: ticket.qrCode,
          status: ticket.status,
          paymentStatus: ticket.paymentStatus,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt
        },
        paymentData: paymentResult
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
      const { cancelReason } = req.body;
      const userId = req.id;

      if (!cancelReason) {
        return res.status(400).json({
          status: "error",
          message: "Reason is required for cancellation"
        });
      }

      await TicketService.cancelTicket(ticketId, userId, cancelReason);
      
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
          status: "error",
          message: "QR code is required"
        });
      }

      const updatedTicket = await TicketService.checkInByQR(qrCode);
      
      res.status(200).json({
        status: "success",
        message: "Check-in successful.",
        ticket: updatedTicket
      });
    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  }

  static async handlePaymentCallback(req, res) {
    try {
      const { orderId, resultCode } = req.body;
      
      // Tìm vé dựa trên orderId trong paymentData
      const ticket = await Ticket.findOne({ "paymentData.orderId": orderId });
      
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Cập nhật trạng thái thanh toán
      ticket.paymentStatus = resultCode === 0 ? 'paid' : 'failed';
      await ticket.save();

      res.status(200).json({
        status: "success",
        message: "Payment status updated"
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  }
}

module.exports = TicketController;
