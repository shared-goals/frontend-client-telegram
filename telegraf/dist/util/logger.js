"use strict";

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

const util_1 = __importDefault(require("util"))
const winston_1 = __importStar(require("winston"))

/**
 * Adds user id and nickname if found. Also formats message to display complex objects
 * @param ctx - telegram context
 * @param msg  - message
 * @param data - object to log
 */
function prepareMessage(ctx, msg, ...data) {
    const formattedMessage = data.length ? util_1.default.format(msg, ...data) : msg
    if (ctx && ctx.from) {
        return `[${ctx.from.id}/${ctx.from.username}]: ${formattedMessage}`
    }
    return `: ${formattedMessage}`
}

const { combine, timestamp, printf } = winston_1.format
const logFormat = printf(info => {
    return `[${info.timestamp}] [${info.level}]${info.message}`
})
const logger = winston_1.default.createLogger({
    transports: [
        new winston_1.default.transports.Console({
            level: process.env.NODE_ENV === 'production' ? 'error' : 'debug'
        }),
        new winston_1.default.transports.File({ filename: 'debug.log', level: 'debug' })
    ],
    format: combine(timestamp(), winston_1.format.splat(), winston_1.format.simple(), logFormat)
})

if (process.env.NODE_ENV !== 'production') {
    logger.debug('Logging initialized at debug level')
}

const loggerWithCtx = {
    debug: (ctx, msg, ...data) => logger.debug(prepareMessage(ctx, msg, ...data)),
    error: (ctx, msg, ...data) => logger.error(prepareMessage(ctx, msg, ...data))
}

exports.default = loggerWithCtx;
