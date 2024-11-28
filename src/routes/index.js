const paymentRoutes = require("./PaymentRoutes");
const ticketRouter = require("./TicketRouter");
const userRouter = require("./UserRouter");

const routes = (app) => {
  app.use("/api/payment", paymentRoutes);
  app.use('/api/tickets', ticketRouter);
  app.use('/api/users', userRouter);
};

module.exports = routes;
