const contracts = require('../controllers/contracts');
const jwt = require('../middlewares/jwt');

module.exports = (router) => {
    router
        .param('contract_id', contracts.getById)
        .post('/contracts/', jwt, contracts.create)
        .get('/contracts/:contract_id', contracts.read)
        .put('/contracts/:contract_id', jwt, contracts.update)
        .delete('/contracts/:contract_id', jwt, contracts.delete)
        .get('/contracts/', contracts.list)
        .delete('/contracts/', jwt, contracts.clear);
}