const goals = require('../controllers/goals');
const contracts = require('../controllers/contracts');
const commits = require('../controllers/commits');
const users = require('../controllers/users');
const jwt = require('../middlewares/jwt');

module.exports = (router) => {
    router
        .param('user_id', users.getById)
        .get('/users/:user_id', users.read)
        .get('/users/email/:user_email', users.getByEmail)
        .get('/users/:user_id/goals/', goals.list)
        .get('/users/search/:text/', users.search)
        .get('/users/:user_id/contracts/', contracts.list)
        .get('/users/:user_id/commits/', commits.list)
        .put('/users/:user_id', jwt, users.update)
        .delete('/users/:user_id', jwt, users.delete)
        .get('/users/', users.list)
        .delete('/users/', jwt, users.clear)
}