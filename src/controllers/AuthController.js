const AuthService = require("../services/AuthService");

class AuthController {
  async createUser(req, res) {
    try {
      const {
        email,
        password,
        confirmPassword,
        name,
        phone,
        university,
        faculty,
        major,
        studentId,
        gender,
        role,
      } = req.body;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmail = emailRegex.test(email);

      if (!email || !password || !confirmPassword || !name || !role) {
        return res.status(422).json({
          status: "error",
          message: "All fields are required!",
        });
      } else if (!isEmail) {
        return res.status(422).json({
          status: "error",
          message: "Invalid email format",
        });
      } else if (password !== confirmPassword) {
        return res.status(422).json({
          status: "error",
          message: "Please check the confirm password again!",
        });
      }

      const response = await AuthService.createUser(req.body);

      if (response.status === "error") {
        return res.status(409).json({
          status: response.status,
          message: response.message,
        });
      }

      return res.status(201).json(response);
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Internal server error",
        error: error.toString(),
      });
    }
  }

  async loginUser(req, res) {
    try {
      const { email, password } = req.body;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmail = emailRegex.test(email);

      if (!email || !password) {
        return res.status(422).json({
          status: "error",
          message: "All fields are required!",
        });
      } else if (!isEmail) {
        return res.status(422).json({
          status: "error",
          message: "Invalid email format",
        });
      }

      const response = await AuthService.loginUser(req.body);

      if (response.status === "error") {
        return res
          .status(401)
          .json({ status: "error", message: response.message }); // Trả về mã lỗi thích hợp
      }

      const userData = {
        id: response.userId,
        email,
        role: response.role,
        name: response.name,
        avatar: response.avatar,
      };

      return res.status(200).json({
        status: "success",
        message: "Login successful",
        token: response.access_token,
        user: userData,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        error: error.toString(),
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res
          .status(400)
          .json({ success: false, message: "Email is required" });
      }

      const result = await AuthService.resetPassword(email);
      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error("Error in PasswordController:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AuthController();
