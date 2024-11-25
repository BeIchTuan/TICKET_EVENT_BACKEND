const MomoService = require("../services/MomoService");

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
      return res.status(200).json(req.body);
    } catch (error) {
      return res.status(500).json({
        statusCode: 500,
        message: error.message,
      });
    }
  }

  static async checkTransactionStatus(req, res) {
    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({
          statusCode: 400,
          message: "orderId is required"
        });
      }

      const result = await MomoService.checkTransactionStatus(orderId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        statusCode: 500,
        message: error.message,
      });
    }
  }
}

module.exports = PaymentController;
