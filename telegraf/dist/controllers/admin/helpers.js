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

Object.defineProperty(exports, "__esModule", { value: true })

const telegram = __importDefault(require("../../telegram"))
const Telegraf = require("telegraf")

/**
 * Генерирует главное меню сцены "Админ"
 *
 * @param ctx - Объект контекста
 * @returns {*|ExtraEditMessage}
 */
function getInitKeyboard(ctx) {
    return Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard([
        [
            m.callbackButton(ctx.i18n.t('keyboards.admin_keyboard.check_translations'), JSON.stringify({ a: 'checkTranslations' }), false),
        ]
    ], {}))
}

exports.getInitKeyboard = getInitKeyboard

/**
 * Отправляет сообщение конкретному или всем пользователям
 *
 * @param ctx - Объект контекста
 * @param recipient - Идентификатор пользователя для личного сообщения или 'all.language' для общего
 * @param message - Отправляемый текст
 */
function write(ctx, recipient, message) {
    return __awaiter(this, void 0, void 0, function* () {
        // Если айдишник пользователя - число
        if (!Number.isNaN(+recipient) && recipient.length >= 6) {
            // Пишем сообщение пользователю
            yield telegram.default.sendMessage(Number(recipient), message)
            yield ctx.reply(`Successfully sent message to: ${recipient}, content: ${message}`)
        }
        // Иначе, если пишем всем пользователям:
        else if (recipient.includes('all')) {
            // Определяем доступные языки
            const SUPPORTED_LANGUAGES = ['en', 'ru']
            const language = recipient.split('.')[1]
            
            // Если указан недоступный язык - пишем ошибку и выходим
            if (!SUPPORTED_LANGUAGES.includes(language)) {
                yield ctx.reply(`Unsupported language ${language}`)
                return true
            }
            
            // Иначе запрашиваем всех пользователей, имеющих в настройках соответствующий язык
            // const users = yield User_1.default.find({ language }) // Filter by language
            const users = []

            // Если пользователи есть
            if (users.length > 0) {
                
                // Шлем всем сообщения с таймаутом
                users.forEach((user, index) => {
                    setTimeout(() => {
                        telegram.default.sendMessage(Number(user._id), message)
                    }, 200 * (index + 1))
                })
    
                yield ctx.reply(`Sending message to everyone is in process, content: ${message}`)
            }
        }
        else {
            // Recipient wasn't specified correctly
            yield ctx.reply('No messages were sent. Please make sure that the command parameters are correct')
        }
    })
}

exports.write = write

/**
 * Отображает меню админки
 *
 * @param ctx - Объект контекста
 */
function getHelp(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ctx.reply('write | [user_id | all] | message - write message to user\n' +
            'stats - get stats about users\n' +
            'help - get help menu')
    })
}

exports.getHelp = getHelp;
