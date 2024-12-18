const bcrypt = require("bcrypt");
const User = require("../models/UserModel");
const Faculty = require("../models/FacultyModel");
const University = require("../models/UniversityModel");
const Major = require("../models/MajorModel");

const { deleteFromCloudinary } = require("../utils/UploadImage");

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
      const user = await User.findById(id)
        .populate("university", "name")
        .populate("faculty", "name")
        .populate("major", "name");

      if (!user) {
        return {
          status: "error",
          message: "User not found",
        };
      }

      const userData = {
        _id: user._id,
        email: user.email,
        name: user.name || null,
        avatar: user.avatar || null,
        university: user.university ? user.university.name : null,
        faculty: user.faculty ? user.faculty.name : null,
        major: user.major ? user.major.name : null,
        studentId: user.studentId || null,
        birthday: user.birthday || null,
        gender: user.gender || null,
        phone: user.phone || null,
        role: user.role || null,
      };

      return userData;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getUsers({ role }) {
    try {
      const filter = role ? { role } : {};

      const users = await User.find(filter)
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

  // async searchUsers(query, role, userId) {
  //   try {
  //     const filter = {
  //       _id: { $ne: userId }, // Exclude the user with userId
  //     };

  //     if (/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(query)) {
  //       filter.email = query;
  //     } else if (/^\d+$/.test(query)) {
  //       filter.$or = [{ phone: query }, { studentId: query }];
  //     } else {
  //       filter.name = { $regex: query, $options: "i" };
  //     }

  //     if (role) {
  //       filter.role = role;
  //     }

  //     const users = await User.find(filter);

  //     return users.map((user) => ({
  //       _id: user._id,
  //       name: user.name,
  //       avatar: user.avatar || null,
  //       studentId: user.studentId || null,
  //     }));
  //   } catch (error) {
  //     throw new Error(error.message);
  //   }
  // }

  async searchUsers(query, role, userId) {
    try {
      query = decodeURIComponent(query.replace(/\+/g, " "));
  
      const filter = {
        _id: { $ne: userId }, 
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
