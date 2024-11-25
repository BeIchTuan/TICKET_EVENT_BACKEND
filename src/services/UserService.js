const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const { generalAccessToken } = require("./Jwtservice");
// const { deleteFromCloudinary } = require("../utils/uploadImage");

const createUser = (newUser) => {
  return new Promise(async (resolve, reject) => {
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
      const checkUser = await User.findOne({
        email: email,
      });

      if (checkUser !== null) {
        resolve({
          status: "error",
          message: "The email already exists",
        });
      }

      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(password, 10); // Use 10 as salt rounds for hashing

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

      // Create the user in the database
      const createdUser = await User.create(userData);

      if (createdUser) {
        resolve({
          status: "success",
          message: "User registered successfully",
          data: createdUser,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

const loginUser = (userLogin) => {
  return new Promise(async (resolve, reject) => {
    const { email, password } = userLogin;

    try {
      const checkUser = await User.findOne({
        email: email,
      });

      if (checkUser === null) {
        resolve({
          status: "error",
          message: "The user is not defined",
        });
      }

      const comparePassword = bcrypt.compareSync(password, checkUser.password);

      if (!comparePassword) {
        resolve({
          status: "error",
          message: "Invalid email or password",
        });
      }

      // const access_token = await generalAccessToken({
      //   id: checkUser.id,
      //   role: checkUser.role
      // })

      // const refresh_token = await generalRefreshToken({
      //   id: checkUser.id,
      //   role: checkUser.role
      // })

      // resolve({
      //   status: "success",
      //   message: "Login successful",
      //   access_token: access_token,
      //   refresh_token: refresh_token
      // });

      const access_token = await generalAccessToken({
        id: checkUser.id,
        role: checkUser.role,
      });

      //console.log('service', access_token)

      // Trường hợp nếu người dùng có vai trò là seller
      let shopInfo = {};
      if (checkUser.role === "seller") {
        shopInfo = {
          shopName: checkUser.shopName,
          shopDescription: checkUser.shopDescription,
          shopAddress: checkUser.shopAddress,
        };
      }

      resolve({
        status: "success",
        message: "Login successful",
        userId: checkUser._id,
        role: checkUser.role,
        name: checkUser.name,
        avatar: checkUser.avatar,
        birthday: checkUser.birthday,
        gender: checkUser.gender,
        phone: checkUser.phone,
        address: checkUser.address,
        access_token: access_token,
        ...shopInfo, // Thêm thông tin cửa hàng nếu có
      });
    } catch (e) {
      reject(e);
    }
  });
};

const updateUser = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error("User not found");
      }

      // Nếu có avatar mới, xóa avatar cũ trên Cloudinary
      if (data.avatar && user.avatar) {
        const publicId = user.avatar
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0]; // Lấy publicId từ URL
        await deleteFromCloudinary(publicId); // Xóa ảnh cũ
      } else if (!data.avatar && user.avatar) {
        data.avatar = user.avatar; // Giữ nguyên avatar cũ nếu không có avatar mới
      }

      if (data.address) {
        try {
          data.address = JSON.parse(data.address); // Parse JSON thành mảng đối tượng
        } catch (err) {
          return {
            status: "error",
            message: "Invalid address format. Ensure it's a valid JSON string.",
          };
        }
      }

      // Cập nhật các trường hợp lệ đã được lọc trong controller
      Object.assign(user, data);
      const updatedUser = await user.save();

      resolve({
        status: "success",
        message: "Updated",
        data: updatedUser,
      });
    } catch (error) {
      reject(new Error("Failed to update user: " + error.message));
    }
  });
};

const deleteUser = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkUser = await User.findOne({
        _id: id,
      });

      if (checkUser === null) {
        resolve({
          status: "error",
          message: "The user is not defined",
        });
      }

      await User.findByIdAndDelete(id);
      resolve({
        status: "success",
        message: "Delete success",
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getUser = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findOne({ _id: id });

      if (user === null) {
        return resolve({
          status: "error",
          message: "User not found",
        });
      }

      // Dữ liệu chung cho tất cả người dùng
      const userData = {
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        birthday: user.birthday,
        gender: user.gender,
        phone: user.phone,
        address: user.address,
      };

      // Nếu role là "seller", thêm các trường liên quan đến cửa hàng
      if (user.role === "seller") {
        userData.shopName = user.shopName;
        userData.shopDescription = user.shopDescription;
        userData.shopAddress = user.shopAddress;
      }

      // Trả về dữ liệu người dùng với thông tin bổ sung nếu là seller
      resolve({
        status: "success",
        user: userData,
      });
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = {
  createUser,
  loginUser,
  updateUser,
  deleteUser,
  getUser,
};
