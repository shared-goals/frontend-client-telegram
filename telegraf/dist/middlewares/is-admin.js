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

Object.defineProperty(exports, "__esModule", { value: true })

/**
 * Checks whether user is admin and can access restricted areas
 * @param ctx - telegram context
 * @param next - next function
 */
exports.isAdmin = (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    const password = ctx.message.text.split(' ')[1]
    if (process.env.ADMIN_IDS.indexOf(ctx.from.id) !== false && password === process.env.ADMIN_PASSWORD) {
        return next()
    }
    return ctx.reply('Sorry, you are not an admin :(')
});
