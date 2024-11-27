const bcrypt = require("bcrypt");
const { generalAccessToken } = require("./Jwtservice");
const User = require("../models/UserModel");

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
          message: "The email and role already exists",
        };
      }

      const hashedPassword = await bcrypt.hash(password, 10); // Use 10 as salt rounds
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
      return {
        status: "success",
        message: "User registered successfully",
        data: createdUser,
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
          message: "The user is not defined",
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
        birthday: user.birthday,
        gender: user.gender,
        phone: user.phone,
        access_token: accessToken,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = new AuthService();
