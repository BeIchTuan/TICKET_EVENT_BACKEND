const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

// Middleware xác thực và phân quyền
const authMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    let accessToken = req.headers['authorization'];

    if (accessToken && accessToken.startsWith("Bearer ")) {
      accessToken = accessToken.slice(7); // Loại bỏ "Bearer " khỏi token
    }

    if (!accessToken) {
      return res.status(401).json({ error: "Please Login First" });
    } else {
      try {
        // Giải mã token
        const deCodeToken = await jwt.verify(
          accessToken,
          process.env.ACCESS_TOKEN
        );

        //console.log('Decoded Token:', deCodeToken);

        // Lưu thông tin người dùng vào request
        req.role = deCodeToken.role;
        req.id = deCodeToken.id;

        // Kiểm tra xem role của user có được phép truy cập không
        if (allowedRoles.length && !allowedRoles.includes(req.role)) {
          return res
            .status(403)
            .json({ error: "Access denied: Insufficient permissions" });
        }

        next();
      } catch (error) {
        if (
          error.name === "JsonWebTokenError" ||
          error.name === "TokenExpiredError"
        ) {
          return res
            .status(401)
            .json({ error: "Invalid or expired token. Please log in again." });
        }
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  };
};

module.exports = {
  authMiddleware,
};
