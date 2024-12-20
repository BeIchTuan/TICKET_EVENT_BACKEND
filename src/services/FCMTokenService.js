const User = require('../models/UserModel');

class FCMTokenService {
  static async saveToken(userId, fcmToken) {
    try {
      // Thêm token mới nếu chưa tồn tại
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $addToSet: { fcmTokens: fcmToken } // $addToSet đảm bảo không có token trùng lặp
        },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error('Error saving FCM token: ' + error.message);
    }
  }

  static async deleteToken(userId, fcmToken) {
    try {
      // Xóa token khỏi mảng fcmTokens
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $pull: { fcmTokens: fcmToken }
        },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error('Error deleting FCM token: ' + error.message);
    }
  }
}

module.exports = FCMTokenService;
