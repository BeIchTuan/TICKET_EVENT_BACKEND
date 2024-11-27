const bcrypt = require("bcrypt");
const { generalAccessToken } = require("./Jwtservice");
const User = require("../models/UserModel");
const Faculty = require("../models/FacultyModel");
const University = require("../models/UniversityModel");
const Major = require("../models/MajorModel");

// const { deleteFromCloudinary } = require("../utils/uploadImage");

class UserService {
  async updateUser(id, data) {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error("User not found");
      }

      if (data.avatar && user.avatar) {
        const publicId = user.avatar
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0];
        await deleteFromCloudinary(publicId); // Delete old avatar
      } else if (!data.avatar && user.avatar) {
        data.avatar = user.avatar; // Keep the old avatar if no new avatar provided
      }

      if (data.address) {
        try {
          data.address = JSON.parse(data.address); // Parse address JSON
        } catch {
          return {
            status: "error",
            message: "Invalid address format. Ensure it's a valid JSON string.",
          };
        }
      }

      Object.assign(user, data);
      const updatedUser = await user.save();

      return {
        status: "success",
        message: "Updated",
        data: updatedUser,
      };
    } catch (error) {
      throw new Error("Failed to update user: " + error.message);
    }
  }

  async deleteUser(id) {
    try {
      const user = await User.findById(id);

      if (!user) {
        return {
          status: "error",
          message: "The user is not defined",
        };
      }

      await User.findByIdAndDelete(id);
      return {
        status: "success",
        message: "Delete success",
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getUser(id) {
    try {
      const user = await User.findById(id);

      if (!user) {
        return {
          status: "error",
          message: "User not found",
        };
      }

      const userData = {
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        birthday: user.birthday,
        gender: user.gender,
        phone: user.phone,
        address: user.address,
      };

      if (user.role === "seller") {
        userData.shopName = user.shopName;
        userData.shopDescription = user.shopDescription;
        userData.shopAddress = user.shopAddress;
      }

      return {
        status: "success",
        user: userData,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getUsers(query) {
    const filter = {query};
    try {
      const users = await User.find()
        .populate("university", "name")
        .populate("faculty", "name")
        .populate("major", "name");

      return users.map((user) => ({
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        gender: user.gender,
        university: user.university?.name || null,
        faculty: user.faculty?.name || null,
        major: user.major?.name || null,
        studentId: user.studentId,
      }));
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = new UserService();
