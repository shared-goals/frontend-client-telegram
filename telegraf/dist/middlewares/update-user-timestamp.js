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

const logger = __importDefault(require("../util/logger"))
const req = __importDefault(require("../util/req"))

Object.defineProperty(exports, "__esModule", { value: true })

/**
 * Сохраняет время последней активности пользователя в БД
 *
 * @param ctx - Объект контекста
 * @param next - next-функция
 */
exports.updateUserTimestamp = (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    yield req.make(ctx, 'users/' + ctx.session.SGUser.get('id'), {
        method: 'PUT',
        id: ctx.session.SGUser.get('id'),
        updatedAt: new Date().getTime()
    }).then(() => {
        logger.default.debug(ctx, 'Updating timestamp for user to now')
    }).catch((response) => {
        logger.default.debug(ctx, 'Ошибка апдейта timestamp: ', response.message)
    })
    
    return next()
});
