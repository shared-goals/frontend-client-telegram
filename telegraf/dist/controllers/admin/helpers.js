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

const User_1 = __importDefault(require("../../models/User"))
const telegram = __importDefault(require("../../telegram"))

/**
 * Write message to a specific user or to all existing users
 * @param ctx - telegram context
 * @param recipient - id or 'all.language'
 * @param message - text to write
 */
function write(ctx, recipient, message) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!Number.isNaN(+recipient) && recipient.length >= 6) {
            // Write to a single user
            yield telegram.default.sendMessage(Number(recipient), message)
            yield ctx.reply(`Successfully sent message to: ${recipient}, content: ${message}`)
        }
        else if (recipient.includes('all')) {
            // Write to everyone
            const SUPPORTED_LANGUAGES = ['en', 'ru']
            const language = recipient.split('.')[1]
            if (!SUPPORTED_LANGUAGES.includes(language)) {
                yield ctx.reply(`Unsupported language ${language}`)
                return
            }
            const users = yield User_1.default.find({ language }) // Filter by language
            users.forEach((user, index) => {
                setTimeout(() => {
                    telegram.default.sendMessage(Number(user._id), message)
                }, 200 * (index + 1))
            })
            yield ctx.reply(`Sending message to everyone is in process, content: ${message}`)
        }
        else {
            // Recipient wasn't specified correctly
            yield ctx.reply('No messages were sent. Please make sure that the command parameters are correct')
        }
    })
}

exports.write = write

/**
 * Get users statistics
 * @param ctx - telegram context
 */
function getStats(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const date = new Date()
        const year = date.getFullYear()
        const month = date.getMonth()
        const day = date.getDate()
        const epochTime = new Date(year, month, day).getTime()
        const allUsers = yield User_1.default.count({})
        const createdToday = yield User_1.default.find({ created: { $gte: epochTime } }).count()
        const activeToday = yield User_1.default.find({ lastActivity: { $gte: epochTime } }).count()
        yield ctx.reply(`Amount of users: ${allUsers}\n` +
            `New users: ${createdToday}\n` +
            `Active users: ${activeToday}`)
    })
}

exports.getStats = getStats

/**
 * Display help menu
 * @param ctx - telegram context
 */
function getHelp(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ctx.reply('write | [user_id | all] | message - write message to user\n' +
            'stats - get stats about users\n' +
            'help - get help menu')
    })
}

exports.getHelp = getHelp;
