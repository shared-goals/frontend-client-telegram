module.exports = (router) => {
    require('./goals')(router);
    require('./contracts')(router);
    require('./commits')(router);
    require('./users')(router);
    require('./auth')(router);
}