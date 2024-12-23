const MomoService = require("../services/MomoService");
const Ticket = require("../models/TicketModel");
const EmailService = require("../services/EmailService");
const NotificationService = require("../services/NotificationService");

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
      console.log("=== START PAYMENT CALLBACK ===");
      console.log("Headers:", req.headers);
      console.log("Body:", req.body);
      const { orderId, resultCode, message } = req.body;

      console.log("Looking for ticket with orderId:", orderId);
      const ticket = await Ticket.findOne({
        "paymentData.orderId": orderId,
      }).populate({
        path: "buyerId",
        select: "fcmTokens _id",
      });
      console.log("Found ticket:", ticket);

      if (!ticket) {
        console.log("No ticket found for orderId:", orderId);
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy vé với orderId này",
        });
      }

      // Cập nhật trạng thái thanh toán
      const oldStatus = ticket.paymentStatus;
      ticket.paymentStatus = resultCode === 0 ? "paid" : "failed";
      await ticket.save();
      console.log(
        `Updated payment status from ${oldStatus} to ${ticket.paymentStatus}`
      );

      // Gửi email nếu thanh toán thành công
      if (resultCode === 0) {
        try {
          console.log("Attempting to send success email...");
          await EmailService.sendPaymentSuccessEmail(ticket);
          console.log("Payment success email sent");

          // Gửi thông báo qua FCM
          if (ticket.buyerId?.fcmTokens?.length) {
            const tokens = ticket.buyerId.fcmTokens.filter(Boolean);
            const title = "Payment Successful";
            const body = `Your ticket for order ${orderId} has been successfully paid. 🎉`;
            const data = {
              type: "payment_success",
              ticketId: ticket._id.toString(),
              orderId: orderId.toString(),
            };

            await NotificationService.sendNotification(
              tokens,
              title,
              body,
              data
            );

            await NotificationService.saveNotification(
              ticket.buyerId._id,
              "payment_success",
              title,
              body,
              data
            );
          }
        } catch (emailError) {
          console.error("Error sending payment success email:", emailError);
          console.error(emailError.stack);
        }
      }

      console.log("=== END PAYMENT CALLBACK ===");
      return res.status(200).json({
        success: true,
        message: `Cập nhật trạng thái thanh toán thành ${ticket.paymentStatus}`,
        data: {
          ticketId: ticket._id,
          paymentStatus: ticket.paymentStatus,
          momoMessage: message,
        },
      });
    } catch (error) {
      console.error("Payment callback error:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async checkTransactionStatus(req, res) {
    try {
      const { orderId } = req.body;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "orderId is required",
        });
      }

      const result = await MomoService.checkTransactionStatus(orderId);
      const ticket = await Ticket.findOne({
        "paymentData.orderId": orderId,
      });

      if (ticket) {
        const newPaymentStatus = result.resultCode === 0 ? "paid" : "failed";

        // Chỉ gửi email nếu trạng thái thay đổi từ pending sang paid
        if (ticket.paymentStatus !== "paid" && newPaymentStatus === "paid") {
          try {
            await EmailService.sendPaymentSuccessEmail(ticket);
            console.log("Payment success email sent");
          } catch (emailError) {
            console.error("Error sending payment success email:", emailError);
          }
        }

        ticket.paymentStatus = newPaymentStatus;
        await ticket.save();
      }

      return res.status(200).json({
        success: true,
        data: {
          ...result,
          ticketStatus: ticket ? ticket.paymentStatus : null,
        },
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
