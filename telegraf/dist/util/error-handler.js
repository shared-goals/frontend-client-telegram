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

/**
 * Wrapper to catch async errors within a stage. Helps to avoid try catch blocks in there
 * @param fn - function to enter a stage
 */
const asyncWrapper = (fn) => {
    return function (ctx, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield fn(ctx)
            }
            catch (error) {
                _logger.default.error(ctx, 'asyncWrapper error, %O', error)
                yield ctx.reply(ctx.i18n.t('shared.something_went_wrong'))
                return next()
            }
        })
    }
}

exports.default = asyncWrapper;
