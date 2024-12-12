const MomoService = require("../services/MomoService");
const Ticket = require("../models/TicketModel");

class PaymentController {
  static async createPayment(req, res) {
    try {
      const { amount, orderInfo } = req.body;
      const result = await MomoService.createPayment(amount, orderInfo);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        statusCode: 500,
        message: error.message,
      });
    }
  }

  static async handleCallback(req, res) {
    try {
      console.log("MoMo callback data:", req.body);
      const { orderId, resultCode, message } = req.body;

      // Tìm vé dựa trên orderId trong paymentData
      const ticket = await Ticket.findOne({ "paymentData.orderId": orderId });
      
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy vé với orderId này"
        });
      }

      // Cập nhật trạng thái thanh toán dựa vào resultCode từ MoMo
      // resultCode = 0: Giao dịch thành công
      // resultCode != 0: Giao dịch thất bại
      ticket.paymentStatus = resultCode === 0 ? 'paid' : 'failed';
      await ticket.save();

      return res.status(200).json({
        success: true,
        message: `Cập nhật trạng thái thanh toán thành ${ticket.paymentStatus}`,
        data: {
          ticketId: ticket._id,
          paymentStatus: ticket.paymentStatus,
          momoMessage: message
        }
      });
    } catch (error) {
      console.error('Payment callback error:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async checkTransactionStatus(req, res) {
    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "orderId is required"
        });
      }

      // Kiểm tra trạng thái giao dịch với MoMo
      const result = await MomoService.checkTransactionStatus(orderId);
      
      // Tìm và cập nhật trạng thái vé
      const ticket = await Ticket.findOne({ "paymentData.orderId": orderId });
      if (ticket) {
        ticket.paymentStatus = result.resultCode === 0 ? 'paid' : 'failed';
        await ticket.save();
      }

      return res.status(200).json({
        success: true,
        data: {
          ...result,
          ticketStatus: ticket ? ticket.paymentStatus : null
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = PaymentController;
