const Koa = require('koa')
const https = require('https')
const bodyParser = require('koa-bodyparser')
const Router = require('koa-router')
const Mongoose = require('mongoose')
const fs = require('fs')
const util = require('util')
const AutoIncrement = require('mongoose-auto-increment')
const Swagger = require('./middlewares/swagger')
const SwaggerUi = require('koa2-swagger-ui')
const Routes = require('./routes')

// Options to use with mongoose (mainly to avoid deprecacy warnings)
// const url = 'mongodb://127.0.0.1:27017/sharedgoals'
// const mongooseOptions = {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     connectWithNoPrimary: true,
//     authSource: 'sharedgoals',
// }
const url = util.format(
    'mongodb://%s:%s@%s/%s',
    'ewg',
    'WrfdaVht123',
    [
        'rc1a-elv3abzka2anakpv.mdb.yandexcloud.net:27018'
    ].join(','),
    'sharedgoals'
)
const mongooseOptions = {
    useNewUrlParser: true,
    useCreateIndex: true,
    connectWithNoPrimary: true,
    authSource: 'sharedgoals',
    replicaSet: 'rs01',
    ssl: true,
    sslCA: fs.readFileSync(process.env.SSL_CERTIFICATE)
};

// const config = {
//     domain: 'ewg.ru.com', // your domain
//     https: {
//         port: 443, // any port that is open and not already used on your server
//         options: {
//             key: fs.readFileSync(path.resolve(process.cwd(), 'certs/privkey.pem'), 'utf8').toString(),
//             cert: fs.readFileSync(path.resolve(process.cwd(), 'certs/fullchain.pem'), 'utf8').toString(),
//         },
//     },
// };

// Connect to the MongoDB database
Mongoose.connect(url, mongooseOptions)

// Use auto increment for models
AutoIncrement.initialize(Mongoose.connection)


// Create the Koa app
const app = new Koa()
// Create a router object
const router = new Router()
// Register all routes by passing the router to them
Routes(router)

// Options to generate the swagger documentation
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SharedGoals API',
            version: '1.0.0',
            description: 'SharedGoals service API for telegram bot and www-clients',
        },
    },
    /** 
     * Paths to the API docs. The library will fetch comments marked 
     * by a @swagger tag to create the swagger.json document
     */
    apis: [
        './controllers/auth.js',
        './controllers/goals.js',
        './controllers/contracts.js',
        './controllers/commits.js',
        './controllers/users.js',
    ],
    // where to publish the document
    path: '/swagger.json',
}

// Call our own middleware (see in file)
const swagger = Swagger(swaggerOptions)

// Build the UI for swagger and expose it on the /doc endpoint
const swaggerUi = SwaggerUi({
    routePrefix: '/doc',
    swaggerOptions: {
        url: swaggerOptions.path,
    }
})

// Register all middlewares, in the right order
app
    .use(swagger)
    .use(swaggerUi)
    .use(bodyParser())
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(process.env.PORT)

