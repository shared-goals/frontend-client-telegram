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

const _logger = __importDefault(require("./logger"))
const req = __importDefault(require("../util/req"))
const session = require("./session")

/**
 * Function that updates language for the current user in all known places
 * @param ctx - telegram context
 * @param newLang - new language
 */
function updateLanguage(ctx, newLang) {
    return __awaiter(this, void 0, void 0, function* () {
        yield req.make(ctx, 'users/' + ctx.session.SGUser.id, {
            method: 'PUT',
            id: ctx.session.SGUser.id,
            language: newLang
        }).then(() => {
            _logger.default.debug(ctx, 'Updating language for user to %s', newLang)
    
            session.saveToSession(ctx, 'language', newLang)
            ctx.i18n.locale(newLang)
        }).catch((response) => {
            _logger.default.debug(ctx, 'Ошибка установки языка: ', response.message)
        })
    })
}

exports.updateLanguage = updateLanguage;
