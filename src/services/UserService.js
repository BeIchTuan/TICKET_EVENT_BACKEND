const bcrypt = require("bcrypt");
const User = require("../models/UserModel");
const Faculty = require("../models/FacultyModel");
const University = require("../models/UniversityModel");
const Major = require("../models/MajorModel");

const { deleteFromCloudinary } = require("../utils/UploadImage");

class UserService {
  async updateUser(id, data) {
    try {
      const user = await User.findOne({ _id: id, isDeleted: false });
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

      // hash password if provided
      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }

      Object.assign(user, data);
      await user.save();

      const updatedUser = await this.getUser(id);

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
      const user = await User.findOne({ _id: id, isDeleted: false });

      if (!user) {
        return {
          status: "error",
          message: "The user is not defined",
        };
      }

      await User.findByIdAndUpdate(id, { isDeleted: true });

      return {
        status: "success",
        message: "User successfully marked as deleted",
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getUser(id) {
    try {
      const user = await User.findOne({ _id: id, isDeleted: false })
      .select("-password -isDeleted -createdAt -updatedAt -__v -accessToken -fcmTokens")
        .populate("university", "_id name")
        .populate("faculty", "_id name")
        .populate("ticketsBought", "_id")
        .populate("eventsCreated", "_id")
        .populate("major", "_id name");

      if (!user) {
        return {
          status: "error",
          message: "User not found",
        };
      }

      // const userData = {
      //   _id: user._id,
      //   email: user.email,
      //   name: user.name || null,
      //   avatar: user.avatar || null,
      //   university: user.university ? user.university.name : null,
      //   faculty: user.faculty ? user.faculty.name : null,
      //   major: user.major ? user.major.name : null,
      //   studentId: user.studentId || null,
      //   birthday: user.birthday || null,
      //   gender: user.gender || null,
      //   phone: user.phone || null,
      //   role: user.role || null,
      // };

      return user;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getUsers({ role }) {
    try {
      const filter = { isDeleted: false };
      if (role) {
        filter.role = role;
      }
      const users = await User.find(filter)
        .select("-password -isDeleted -createdAt -updatedAt -__v -accessToken -fcmTokens")
        .populate("university", "_id name")
        .populate("faculty", "_id name")
        .populate("major", "_id name")
        .populate("ticketsBought", "_id")
        .populate("eventsCreated", "_id")

      return users;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async searchUsers(query, role, userId) {
    try {
      query = decodeURIComponent(query.replace(/\+/g, " "));

      const filter = {
        _id: { $ne: userId },
        isDeleted: false,
      };

      if (/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(query)) {
        filter.email = { $regex: query, $options: "i" };
      } else if (/^\d+$/.test(query)) {
        filter.$or = [
          { phone: { $regex: query, $options: "i" } },
          { studentId: { $regex: query, $options: "i" } },
        ];
      } else {
        filter.name = { $regex: query, $options: "i" };
      }

      if (role) {
        filter.role = role;
      }

      const users = await User.find(filter);

      return users.map((user) => ({
        _id: user._id,
        name: user.name,
        avatar: user.avatar || null,
        studentId: user.studentId || null,
      }));
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = new UserService();
