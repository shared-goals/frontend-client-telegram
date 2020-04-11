"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value) }) }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)) } catch (e) { reject(e) } }
        function rejected(value) { try { step(generator["throw"](value)) } catch (e) { reject(e) } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected) }
        step((generator = generator.apply(thisArg, _arguments || [])).next())
    });
}

Object.defineProperty(exports, "__esModule", { value: true })

const string_similarity_1 = require("string-similarity")
const lodash = require("lodash")
const session = require("./session")

/**
 * Pauses execution for given amount of seconds
 * @param sec - amount of seconds
 */
function sleep(sec) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000))
}

exports.sleep = sleep

/**
 * Send message and saving it to the session. Later it can be deleted.
 * Used to avoid messages duplication
 * @param ctx - telegram context
 * @param scene - scene key
 * @param translationKey - translation key
 * @param extra - extra for the message, e.g. keyboard
 */
function sendMessageToBeDeletedLater(ctx, scene, translationKey, extra) {
    return __awaiter(this, void 0, void 0, function* () {
        ctx.webhookReply = false
        const message = yield ctx.reply(translationKey && translationKey !== '' ? ctx.i18n.t(translationKey) : '⌛️', extra)
        const messagesToDelete = lodash.get(ctx.session, scene + 'Scene.messagesToDelete', [])
        session.saveToSession(ctx, scene + 'Scene', {
            messagesToDelete: [
                ...messagesToDelete,
                {
                    chatId: message.chat.id,
                    messageId: message.message_id
                }
            ]
        })
    })
}

exports.sendMessageToBeDeletedLater = sendMessageToBeDeletedLater

/**
 * Checks whether given number is in range of base plus/minus step
 * @param number - number to check
 * @param base - base number to compare with
 * @param step - range for a number
 */
function isNumberInRage(number, base, step = 1) {
    return number >= base - step && number <= base + step
}

exports.isNumberInRage = isNumberInRage

/**
 * Lowercases strings and checks whether string 1 is equal to string 2 or
 * whether string 1 contains string 2 or
 * whether string similarity is more than 80%
 * @param a - string to compare
 * @param b - string to compare
 */
function checkStringSimilarity(a, b) {
    const first = a.toLocaleLowerCase()
    const second = b.toLocaleLowerCase()
    if (first === second)
        return true
    return string_similarity_1.compareTwoStrings(first, second) >= 0.75
}

exports.checkStringSimilarity = checkStringSimilarity;
