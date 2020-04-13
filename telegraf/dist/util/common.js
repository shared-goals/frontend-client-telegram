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

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod }
}

Object.defineProperty(exports, "__esModule", { value: true })

const string_similarity_1 = require("string-similarity")
const lodash = require("lodash")

const logger = __importDefault(require("./logger"))
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

/**
 *
 * @param ctx
 * @param text
 * @param shortcuts
 * @returns {boolean}
 */
const checkShortcuts = async(ctx, text, shortcuts) => __awaiter(this, void 0, void 0, function* () {
    const keys = Object.keys(shortcuts || {})
    let pattern
    let ret
    for (let i = 0; i < keys.length; i++) {
        pattern = keys[i]
        if (text.match(new RegExp(pattern)) !== null) {
            logger.default.debug(ctx, 'Detected shortcut:', pattern, ', calling handler')
            ret = yield shortcuts[pattern].handler(ctx, text)
        }
    }
    return ret
})

exports.checkShortcuts = checkShortcuts

/**
 * Flatten a deep object into a one level object with it’s path as key
 *
 * @param  {object} object - The object to be flattened
 * @return {object}        - The resulting flat object
 */
const flatten = object => {
    return Object.assign( {}, ...function _flatten( objectBit, path = '' ) { // spread the result into our return object
        return [].concat(                                                    // concat everything into one level
            ...Object.keys( objectBit ).map(                                 // iterate over object
                key => typeof objectBit[ key ] === 'object' ?                // check if there is a nested object
                    _flatten( objectBit[ key ], `${ path }/${ key }` ) :     // call itself if there is
                    ( { [ `${ path }/${ key }` ]: objectBit[ key ] } )       // append object with it’s path as key
            )
        )
    }( object ) );
}

exports.flatten = flatten;