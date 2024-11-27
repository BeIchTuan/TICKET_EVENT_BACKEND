const paymentRoutes = require("./PaymentRoutes");
const UserRouter = require('./UserRouter')
const UniversityRouter = require('./UniversityRouter')

const routes = (app) => {
  app.use("/api/payment", paymentRoutes);
  app.use('/', UserRouter)
  app.use('/', UniversityRouter)
};

module.exports = routes;
