const commits = require('../controllers/commits');
const jwt = require('../middlewares/jwt');

module.exports = (router) => {
    router
        .param('commit_id', commits.getById)
        .post('/commits/', jwt, commits.create)
        .get('/commits/:commit_id', commits.read)
        .put('/commits/:commit_id', jwt, commits.update)
        .delete('/commits/:commit_id', jwt, commits.delete)
        .get('/commits/', commits.list)
        .delete('/commits/', jwt, commits.clear);
}