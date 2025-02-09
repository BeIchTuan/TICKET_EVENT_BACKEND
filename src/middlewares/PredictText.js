const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

async function analyzeSentiment(content) {
  try {
    const response = await axios.post(process.env.NGROK_API_ENDPOINT, {
      sentence: content,
    });
    console.log(process.env.NGROK_API_ENDPOINT)
    return response.data.sentiment; // 'positive', 'negative', or 'neutral'
  } catch (error) {
    console.error("Error calling sentiment analysis service:", error.message);
    return null;
  }
}

module.exports = analyzeSentiment