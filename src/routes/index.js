const paymentRoutes = require("./PaymentRoutes");
const UserRouter = require('./UserRouter');
const UniversityRouter = require('./UniversityRouter');
const AuthRouter = require('./AuthRouter');
const FacultyRouter = require('./FacultyRouter');
const ticketRouter = require("./TicketRouter");
const eventRouter = require('./EventRouter');
const categoryRouter = require('./CategoryRouter');
const conversationRouter = require('./ConversationRouter');
const messageRouter = require('./MessageRouter');
const NotificationRouter = require('./NotificationRouter');
const RevenueRouter = require('./RevenueRouter');

const routes = (app) => {
  app.use("/api/payment", paymentRoutes);
  app.use('/api/users', UserRouter);
  app.use('/api/auth', AuthRouter)
  app.use('/api/universities', UniversityRouter)
  app.use('/api/faculties', FacultyRouter)
  app.use('/api/ticket', ticketRouter);
  app.use('/api/events', eventRouter);
  app.use('/api/categories', categoryRouter);
  app.use('/api/conversations', conversationRouter)
  app.use('/api/messages', messageRouter)
  app.use('/api/notifications', NotificationRouter)
  app.use('/api/revenues', RevenueRouter)
};

module.exports = routes;
