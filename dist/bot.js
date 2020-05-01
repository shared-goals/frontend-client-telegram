"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value) }) }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)) } catch (e) { reject(e) } }
        function rejected(value) { try { step(generator["throw"](value)) } catch (e) { reject(e) } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected) }
        step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
}

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod }
}

var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod
    var result = {}
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k]
    result["default"] = mod
    return result
}

Object.defineProperty(exports, "__esModule", { value: true })

require('dotenv').config()

// require('./models')

// Core libs
const fs = __importDefault(require("fs"))
const path = __importDefault(require("path"))

// Main libs
const Telegraf = __importStar(require("telegraf"))
const I18n = __importStar(require("telegraf-i18n"))
const Stage = __importDefault(require("telegraf/stage"))
const Session = __importDefault(require("telegraf/session"))

// DB, http
const reqPromise = __importDefault(require("request-promise"))

// Utils
const logger = __importDefault(require("./util/logger"))
const errorHandler = __importDefault(require("./util/error-handler"))
const keyboards = require("./util/keyboards")
const session = require("./util/session")

// Controllers
const goalsScene = __importDefault(require("./controllers/goals"))
const contractsScene = __importDefault(require("./controllers/contracts"))
const aboutScene = __importDefault(require("./controllers/about"))
const startScene = __importDefault(require("./controllers/start"))
const settingsScene = __importDefault(require("./controllers/settings"))
const adminScene = __importDefault(require("./controllers/admin"))

// Middlewares
const updater = require("./middlewares/update-user-timestamp")
const userInfo = require("./middlewares/user-info")
const adminConsole = require("./middlewares/is-admin")

const telegram = __importDefault(require("./telegram"))


// Создаем бота
const bot = new Telegraf.default(process.env.TELEGRAM_TOKEN)

// Создаем первую сцену
const stage = new Stage.default([
    goalsScene.default,
    contractsScene.default,
    startScene.default,
    settingsScene.default,
    adminScene.default
])

// Определяем локализатор
const i18n = new I18n.default({
    defaultLanguage: 'en',
    directory: path.default.resolve(__dirname, 'locales'),
    useSession: true,
    allowMissing: false,
    sessionName: 'session'
})

// Подключаем сессию
bot.use(Session.default())

// Подключаем локализатор
bot.use(i18n.middleware())

// Подключаем сценарии
bot.use(stage.middleware())

// Подключаем связь с пользователем из внешнего API
bot.use(userInfo.getUserInfo)

// Обработчик ошибок
bot.catch((error) => {
    logger.default.error(undefined, 'Global error has happened, %O', error)
})


// ==============================================
// основные сцены/обработчики


// Цели
bot.hears(I18n.match('keyboards.main_keyboard.goals'), updater.updateUserTimestamp, errorHandler.default((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    return yield ctx.scene.enter('goals')
})))

// Контракты
bot.hears(I18n.match('keyboards.main_keyboard.contracts'), updater.updateUserTimestamp, errorHandler.default((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    return yield ctx.scene.enter('contracts')
})))

// Настройки
bot.hears(I18n.match('keyboards.main_keyboard.settings'), updater.updateUserTimestamp, errorHandler.default((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    return yield ctx.scene.enter('settings')
})))

// О сервисе
bot.hears(I18n.match('keyboards.main_keyboard.about'), updater.updateUserTimestamp, errorHandler.default(aboutScene.default))

// Назад
bot.hears(I18n.match('keyboards.back_keyboard.back'), errorHandler.default((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    // If this method was triggered, it means that bot was updated when user was not in the main menu..
    logger.default.debug(ctx, 'Return to the main menu with the back button')
    const { mainKeyboard } = keyboards.getMainKeyboard(ctx)
    yield ctx.reply(ctx.i18n.t('shared.what_next'), mainKeyboard)
})))


// ==============================================
// специальные обработчики


// По /admin Грузим сцену админ-действий
bot.hears(/(.*admin)/, adminConsole.isAdmin, errorHandler.default((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    return yield ctx.scene.enter('admin')
})))

// На любую ошибку отвечаем выводом стартовой страницы
bot.start(errorHandler.default((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    return ctx.scene.enter('start')
})))

// По /admin Грузим сцену админ-действий
bot.hears(/help/, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    // Определяем сцены, для которых мы распознаем короткие команды
    const shortcutsScenes = ['goals', 'contracts']
    
    // Собираем короткие комманды из каждого экшн-контроллера и подключаем их для вызова хэндлера по умолчанию
    const shortCommands = {}
    let actions = {}
    let examples = []
    shortcutsScenes.forEach((scene) => {
        actions[scene] = require('./controllers/' + scene + '/actions')
        shortCommands[scene] = actions[scene].getShortcuts()
        Object.keys(shortCommands[scene]).forEach((key) => {
            examples = examples.concat(shortCommands[scene][key].examples || [])
        })
    })

    let str = ''
    examples.forEach((example) => {
        str += `<code>${example.cmd}</code>\r\n${example.info}\r\n\r\n`
    })
    ctx.replyWithHTML(str)
}))

// Все остальные команды
bot.hears(/(.*?)/, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const text = ctx.match.input
    logger.default.debug(ctx, 'Default handler has fired:', text)

    // Определяем сцены, для которых мы распознаем короткие команды
    const shortcutsScenes = ['goals', 'contracts']
    
    // Собираем короткие комманды из каждого экшн-контроллера и подключаем их для вызова хэндлера по умолчанию
    const shortCommands = {}
    let actions = {}
    shortcutsScenes.forEach((scene) => {
        actions[scene] = require('./controllers/' + scene + '/actions')
        shortCommands[scene] = actions[scene].getShortcuts()
    })

    // Ищем введенную команду через соответствие регулярке по всем возможным короткимм командам каждой сцены
    let handler = null
    Object.keys(shortCommands).forEach((scene) => {
        Object.keys(shortCommands[scene] || {}).forEach((pattern) => {
            const re = new RegExp(pattern)
            if (re.test(text) === true && handler === null) {
                logger.default.debug(ctx, 'Detected required scene:', scene, ', entering scene and calling ' + scene + '.defaultHandler()')
                ctx.scene.enter(scene)
                session.saveToSession(ctx, 'silentSceneChange', true)
                handler = actions[scene].defaultHandler
            }
        })
    })
    
    // Если в какой-то сцене команда найдена - идем в ее defaultHandler
    if (handler !== null && typeof handler === 'function') {
        yield handler.call(this, ctx)
    } else {
        // Иначе выводис сообщение о неправильной команде
        const { mainKeyboard } = keyboards.getMainKeyboard(ctx)
        yield ctx.reply(ctx.i18n.t('other.default_handler'), mainKeyboard)
    }
    return false
}))




// стартуем бота в нужном режиме
process.env.NODE_ENV === 'production' ? startProdMode(bot) : startDevMode(bot)



// Функция старта дев-режима
function startDevMode(bot) {
    logger.default.debug(undefined, 'Starting a bot in development mode')
    reqPromise.default(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/deleteWebhook`).then(() => bot.startPolling())
}

// Функция старта прод-режима
function startProdMode(bot) {
    return __awaiter(this, void 0, void 0, function* () {
        // If webhook not working, check fucking motherfucking UFW that probably blocks a port...
        logger.default.debug(undefined, 'Starting a bot in production mode')
        const tlsOptions = {
            key: fs.default.readFileSync(process.env.PATH_TO_KEY),
            cert: fs.default.readFileSync(process.env.PATH_TO_CERT)
        }
        yield bot.telegram.setWebhook(`https://ngrok.io:${process.env.WEBHOOK_PORT}/${process.env.TELEGRAM_TOKEN}`, {
            source: 'cert.pem'
        })
        yield bot.startWebhook(`/${process.env.TELEGRAM_TOKEN}`, tlsOptions, +process.env.WEBHOOK_PORT)
        const webhookStatus = yield telegram.default.getWebhookInfo()
        logger.default.debug(undefined, 'Webhook status', webhookStatus)
    })
};
