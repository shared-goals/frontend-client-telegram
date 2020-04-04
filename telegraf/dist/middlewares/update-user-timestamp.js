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

const _logger = __importDefault(require("../util/logger"))
const req = __importDefault(require("../util/req"))

Object.defineProperty(exports, "__esModule", { value: true })

/**
 * Updated last activity timestamp for the user in database
 * @param ctx - telegram context
 * @param next - next function
 */
exports.updateUserTimestamp = (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    yield req.make(ctx, 'users/' + ctx.session.SGUser.id, {
        method: 'PUT',
        id: ctx.session.SGUser.id,
        updatedAt: new Date().getTime()
    }).then(() => {
        _logger.default.debug(ctx, 'Updating timestamp for user to now')
    }).catch((response) => {
        _logger.default.debug(ctx, 'Ошибка апдейта timestamp: ', response.message)
    })
    
    return next()
});
