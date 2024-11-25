const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const generalAccessToken = async (payload) => {
  const access_token = jwt.sign(payload, process.env.ACCESS_TOKEN, {
    expiresIn: "365d",
  });

  return access_token;
};

module.exports = {
  generalAccessToken,
};
