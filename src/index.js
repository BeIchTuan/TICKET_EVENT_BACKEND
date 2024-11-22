const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const routes = require("./routes");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
//const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");

dotenv.config();
app.use(morgan("combined"));

//app.use(cookieParser());

//const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];

// Sử dụng middleware cors
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Cho phép gửi cookie
  })
);

const uri = process.env.MONGO_URI;

const port = process.env.PORT || 3001;
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello world!");
});

routes(app);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
let client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Khởi tạo kết nối MongoDB
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await client.connect();

    // Kiểm tra kết nối
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
}

// Gọi hàm run
run();

// Xử lý sự kiện khi tắt ứng dụng
process.on("SIGINT", async () => {
  console.log("Closing MongoDB connection...");
  if (client) await client.close();
  console.log("MongoDB connection closed.");
  process.exit(0); // Thoát ứng dụng
});

// Khởi động server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
