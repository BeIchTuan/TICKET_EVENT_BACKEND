const paymentRoutes = require("./PaymentRoutes");
const UserRouter = require('./UserRouter');
const UniversityRouter = require('./UniversityRouter');
const AuthRouter = require('./AuthRouter');
const FacultyRouter = require('./FacultyRouter');
const ticketRouter = require("./TicketRouter");

const routes = (app) => {
  app.use("/api/payment", paymentRoutes);
  app.use('/api/users', UserRouter);
  app.use('/api/auth', AuthRouter)
  app.use('/api/universities', UniversityRouter)
  app.use('/api/faculties', FacultyRouter)
  app.use('/api/ticket', ticketRouter); 
};

module.exports = routes;
