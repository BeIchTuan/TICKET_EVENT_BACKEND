const UserRouter = require('./UserRouter')

const routes = (app) => {
    app.use('/', UserRouter)
};

module.exports = routes;
