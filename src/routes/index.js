const paymentRoutes = require("./PaymentRoutes");

const routes = (app) => {
  app.use("/api/payment", paymentRoutes);
};

module.exports = routes;
