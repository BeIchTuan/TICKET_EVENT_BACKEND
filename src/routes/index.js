const paymentRoutes = require("./PaymentRoutes");
const UserRouter = require('./UserRouter');
const UniversityRouter = require('./UniversityRouter');
const AuthRouter = require('./AuthRouter');
const ticketRouter = require("./TicketRouter");
const userRouter = require("./UserRouter");

const routes = (app) => {
  app.use("/api/payment", paymentRoutes);
  app.use('/api/users', UserRouter);
  app.use('/api/auth', AuthRouter)
  app.use('/api/universities', UniversityRouter)
  app.use('/api/ticket', ticketRouter); 
};

module.exports = routes;
