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
      return res.status(201).json(response);
    } catch (error) {
      return res.status(500).json({
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

      const userData = {
        id: response.userId,
        email,
        role: response.role,
        name: response.name,
        avatar: response.avatar,
        birthday: response.birthday,
        gender: response.gender,
        phone: response.phone,
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
}

module.exports = new AuthController();
