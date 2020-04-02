const goals = require('../controllers/goals');
const jwt = require('../middlewares/jwt');

module.exports = (router) => {
    router
        .param('goal_id', goals.getById)
        .post('/goals/', jwt, goals.create)
        .get('/goals/:goal_id', goals.read)
        .put('/goals/:goal_id', jwt, goals.update)
        .delete('/goals/:goal_id', jwt, goals.delete)
        .get('/goals/', goals.list)
        .delete('/goals/', jwt, goals.clear)
        .get('/goals/:goal_id/contract', goals.getContract);
}