const bcrypt = require("bcrypt");
const { generalAccessToken } = require("./Jwtservice");
const User = require("../models/UserModel");
const EmailService = require("../services/EmailService");

class AuthService {
  async createUser(newUser) {
    const {
      email,
      password,
      name,
      phone,
      university,
      faculty,
      major,
      studentId,
      gender,
      role,
    } = newUser;

    try {
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return {
          status: "error",
          message: "The email already exists",
        };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userData = {
        email,
        password: hashedPassword,
        name,
        phone,
        university,
        faculty,
        major,
        studentId,
        gender,
        role,
      };

      const createdUser = await User.create(userData);

      const populatedUser = await User.findById(createdUser._id)
        .populate("university", "name")
        .populate("faculty", "name")
        .populate("major", "name");

      return {
        status: "success",
        message: "User registered successfully",
        data: populatedUser,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async loginUser(userLogin) {
    const { email, password } = userLogin;

    try {
      const user = await User.findOne({ email });

      if (!user) {
        return {
          status: "error",
          message: "Email not found, please register",
        };
      }

      const isPasswordValid = bcrypt.compareSync(password, user.password);
      if (!isPasswordValid) {
        return {
          status: "error",
          message: "Invalid email or password",
        };
      }

      const accessToken = await generalAccessToken({
        id: user.id,
        role: user.role,
      });

      user.accessToken = accessToken;
      await user.save();

      return {
        status: "success",
        message: "Login successful",
        userId: user._id,
        role: user.role,
        name: user.name,
        avatar: user.avatar,
        access_token: accessToken,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async resetPassword(email) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error("User not found");
      }

      const newPassword = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      user.password = hashedPassword;
      await user.save();

      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50; text-align: center;">Yêu cầu cấp lại mật khẩu</h2>
          <p>Xin chào <strong>${user.name}</strong>,</p>
          <p>Mật khẩu mới của bạn là:</p>
          <div style="text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0;">
            ${newPassword}
          </div>
          <p>Vui lòng đổi mật khẩu ngay lập tức để bảo mật tài khoản.</p>
          <p style="font-size: 12px; color: #666;">Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      `;

      await EmailService.sendEmail({
        to: user.email,
        subject: "[Ticket Event] Yêu cầu cấp lại mật khẩu",
        html: emailContent,
      });

      console.log("Password reset email sent successfully.");
      return {
        success: true,
        message: "Password reset email sent successfully",
      };
    } catch (error) {
      console.error("Error in PasswordService:", error);
      throw new Error(`Failed to reset password: ${error.message}`);
    }
  }
}

module.exports = new AuthService();
