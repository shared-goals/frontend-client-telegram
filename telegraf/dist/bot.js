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

require('./models')

// Core libs
const fs = __importDefault(require("fs"))
const path = __importDefault(require("path"))
const util = __importDefault(require('util'))

// Main libs
const Telegraf = __importStar(require("telegraf"))
const I18n = __importStar(require("telegraf-i18n"))
const Stage = __importDefault(require("telegraf/stage"))
const Session = __importDefault(require("telegraf/session"))

// DB, http
const Mongoose = __importDefault(require("mongoose"))
const reqPromise = __importDefault(require("request-promise"))
const request = __importDefault(require("./util/req"))

// Models
const User = __importDefault(require("./models/User"))

// Utils
const _logger = __importDefault(require("./util/logger"))
const notifier_1 = require("./util/notifier")
const error_handler_1 = __importDefault(require("./util/error-handler"))
const keyboards_1 = require("./util/keyboards")
const language_1 = require("./util/language")

// Controllers
const about_1 = __importDefault(require("./controllers/about"))
const start_1 = __importDefault(require("./controllers/start"))
const settings_1 = __importDefault(require("./controllers/settings"))
const admin_1 = __importDefault(require("./controllers/admin"))

// Middlewares
const updater = require("./middlewares/update-user-timestamp")
const userInfo = require("./middlewares/user-info")
const adminConsole = require("./middlewares/is-admin")

const telegram = __importDefault(require("./telegram"))


// Создаем бота
const bot = new Telegraf.default(process.env.TELEGRAM_TOKEN)

// Создаем первую сцену
const stage = new Stage.default([
    start_1.default,
    settings_1.default,
    admin_1.default
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

// Определяем команду ресета
bot.command('saveme', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    _logger.default.debug(ctx, 'User uses /saveme command')
    const { mainKeyboard } = keyboards_1.getMainKeyboard(ctx)
    yield ctx.reply(ctx.i18n.t('shared.what_next'), mainKeyboard)
}))

// На любую ошибку отвечаем выводом стартовой страницы
bot.start(error_handler_1.default((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    return ctx.scene.enter('start')
})))

// Основные кнопки
bot.hears(I18n.match('keyboards.main_keyboard.settings'), updater.updateUserTimestamp, error_handler_1.default((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    return yield ctx.scene.enter('settings')
})))
bot.hears(I18n.match('keyboards.main_keyboard.about'), updater.updateUserTimestamp, error_handler_1.default(about_1.default))
bot.hears(I18n.match('keyboards.back_keyboard.back'), error_handler_1.default((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    // If this method was triggered, it means that bot was updated when user was not in the main menu..
    _logger.default.debug(ctx, 'Return to the main menu with the back button')
    const { mainKeyboard } = keyboards_1.getMainKeyboard(ctx)
    yield ctx.reply(ctx.i18n.t('shared.what_next'), mainKeyboard)
})))

// По /admin Грузим сцену админ-действий
bot.hears(/(.*admin)/, adminConsole.isAdmin, error_handler_1.default((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    return yield ctx.scene.enter('admin')
})))

// Все остальные команды
bot.hears(/(.*?)/, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    _logger.default.debug(ctx, 'Default handler has fired')
    const user = yield User.default.findById(ctx.from.id)
    yield language_1.updateLanguage(ctx, user.language)
    const { mainKeyboard } = keyboards_1.getMainKeyboard(ctx)
    yield ctx.reply(ctx.i18n.t('other.default_handler'), mainKeyboard)
}))

// Обработчик ошибок
bot.catch((error) => {
    _logger.default.error(undefined, 'Global error has happened, %O', error)
})

// setInterval(notifier_1.checkUnreleasedMovies, 86400000)

// стартуем бота в нужном режиме
process.env.NODE_ENV === 'production' ? startProdMode(bot) : startDevMode(bot)



// Функция старта дев-режима
function startDevMode(bot) {
    _logger.default.debug(undefined, 'Starting a bot in development mode')
    reqPromise.default(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/deleteWebhook`).then(() => bot.startPolling())
}

// Функция старта прод-режима
function startProdMode(bot) {
    return __awaiter(this, void 0, void 0, function* () {
        // If webhook not working, check fucking motherfucking UFW that probably blocks a port...
        _logger.default.debug(undefined, 'Starting a bot in production mode')
        const tlsOptions = {
            key: fs.default.readFileSync(process.env.PATH_TO_KEY),
            cert: fs.default.readFileSync(process.env.PATH_TO_CERT)
        }
        yield bot.telegram.setWebhook(`https://dmbaranov.io:${process.env.WEBHOOK_PORT}/${process.env.TELEGRAM_TOKEN}`, {
            source: 'cert.pem'
        })
        yield bot.startWebhook(`/${process.env.TELEGRAM_TOKEN}`, tlsOptions, +process.env.WEBHOOK_PORT)
        const webhookStatus = yield telegram.default.getWebhookInfo()
        console.log('Webhook status', webhookStatus)
        notifier_1.checkUnreleasedMovies()
    })
};
