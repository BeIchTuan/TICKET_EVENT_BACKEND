const paymentRoutes = require("./PaymentRoutes");
const UserRouter = require('./UserRouter');
const UniversityRouter = require('./UniversityRouter');
const AuthRouter = require('./AuthRouter');

const routes = (app) => {
  app.use("/api/payment", paymentRoutes);
  app.use('/api/users', UserRouter);
  app.use('/api/auth', AuthRouter)
  app.use('/api/universities', UniversityRouter)
};

module.exports = routes;
