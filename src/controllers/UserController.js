const UserService = require("../services/UserService");
const User = require("../models/UserModel");
// const cloudinary = require("../config/cloudinary");
// const { uploadToCloudinary } = require("../utils/uploadImage");

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

      let fieldsToUpdate = {};
      if (user.role === "user") {
        const { name, avatar, birthday, gender, phone, address } = data;
        fieldsToUpdate = { name, avatar, birthday, gender, phone, address };
      } else if (user.role === "seller") {
        const { shopName, shopDescription, address } = data;
        fieldsToUpdate = { shopName, shopDescription, address };
      } else {
        return res.status(400).json({
          status: "error",
          message: "Invalid role",
        });
      }

      if (req.file) {
        const uploadResult = await uploadToCloudinary(req.file, "avatar");
        fieldsToUpdate.avatar = uploadResult.secure_url;
      } else {
        fieldsToUpdate.avatar = user.avatar;
      }

      const response = await UserService.updateUser(userId, fieldsToUpdate);
      return res.status(200).json({
        status: "success",
        message: "User updated successfully",
        data: response.data,
      });
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
      const userId = req.params.id;

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
    const { email, name, phone } = req.query; 
    try {
      const users = await UserService.searchUsers({ email, name, phone });
      res.status(200).json(users); 
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
  
}

module.exports = new UserController();
