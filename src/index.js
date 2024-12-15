const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const routes = require("./routes");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const initializeJobs = require('./jobs');
//const cookieParser = require('cookie-parser');
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

routes(app);

app.get('/', (req, res) => {
  res.send('Hello world!');
});

mongoose.connect(uri)
  .then(() => {
    console.log('Mongoose connected to MongoDB');
    // Now, you can safely start your server and perform database operations
    app.listen(port, () => {
      console.log(`App listening on port ${port}`);

      // Khởi động tất cả cron jobs
      initializeJobs();
    });
  })
  .catch(err => {
    console.error('Mongoose connection error:', err);
  });

