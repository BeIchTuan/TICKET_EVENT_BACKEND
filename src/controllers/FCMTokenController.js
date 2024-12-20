const FCMTokenService = require('../services/FCMTokenService');

class FCMTokenController {
  static async saveToken(req, res) {
    try {
      const { fcmToken } = req.body;
      const userId = req.id;

      if (!fcmToken) {
        return res.status(400).json({
          status: 'error',
          message: 'FCM token is required'
        });
      }

      const updatedUser = await FCMTokenService.saveToken(userId, fcmToken);

      return res.status(200).json({
        status: 'success',
        message: 'FCM token saved successfully',
        data: {
          fcmTokens: updatedUser.fcmTokens
        }
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  static async deleteToken(req, res) {
    try {
      const { fcmToken } = req.body;
      const userId = req.id;

      if (!fcmToken) {
        return res.status(400).json({
          status: 'error',
          message: 'FCM token is required'
        });
      }

      const updatedUser = await FCMTokenService.deleteToken(userId, fcmToken);

      return res.status(200).json({
        status: 'success',
        message: 'FCM token deleted successfully',
        data: {
          fcmTokens: updatedUser.fcmTokens
        }
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }
}

module.exports = FCMTokenController;
