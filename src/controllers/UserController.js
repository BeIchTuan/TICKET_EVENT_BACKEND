const UserService = require("../services/UserService");
const User = require("../models/UserModel");
const cloudinary = require("../config/cloudinary");
const { uploadToCloudinary } = require("../utils/UploadImage");

class UserController {
  async updateUser(req, res) {
    try {
      const userId = req.id;

      const data = req.body;

      if (!userId) {
        return res.status(400).json({
          status: "error",
          message: "userID is required",
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
        });
      }

      if (req.file) {
        const uploadResult = await uploadToCloudinary(req.file, "avatar");
        data.avatar = uploadResult.secure_url;
      } else {
        data.avatar = user.avatar;
      }

      const response = await UserService.updateUser(userId, data);

      return res.status(200).json(response.data);
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        error: error.toString(),
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      if (!userId) {
        return res.status(400).json({
          status: "error",
          message: "userID is required",
        });
      }

      const response = await UserService.deleteUser(userId);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        error: error.toString(),
      });
    }
  }

  async getUser(req, res) {
    try {
      const userId = req.id;

      if (!userId) {
        return res.status(400).json({
          status: "error",
          message: "userID is required",
        });
      }

      const response = await UserService.getUser(userId);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        error: error.toString(),
      });
    }
  }

  async getUsers(req, res) {
    const { role } = req.query;
    try {
      const users = await UserService.getUsers({ role });
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async searchUsers(req, res) {
    const { query } = req.query; // Lấy query từ query string
    const { role } = req.query; // Lấy role từ query string
    const userId = req.id;
    try {
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      const users = await UserService.searchUsers(query.trim(), role, userId);
      res.status(200).json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

module.exports = new UserController();
