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
    let match
    for (let i = 0; i < keys.length; i++) {
        pattern = keys[i]
        match = text.match(new RegExp(pattern))
        if (match !== null) {
            logger.default.debug(ctx, 'Detected shortcut:', pattern, ', calling handler')
            ret = yield shortcuts[pattern].handler(ctx, match.groups && match.groups.params || text)
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

exports.flatten = flatten

/**
 * Создает на основе объекта произвольной вложенности список дата-атрибутов с соответствующими именами,
 * содержащими дерево ключей каждого объекта в виде списка, разделенного "-"
 * Например:
 *   > JSON.stringify(magickDataFlatten({a: {b: {c: 1}, d: 2}}, {prefix: 'data-'}))
 *   output: {"data-a-b-c":1,"data-a-d":2}
 *
 * @param {Object} obj Исходный объект
 * @param {Object} opts Опции обработки объекта
 * @returns {Object} Результирующий список данных одного уровня
 * @private
 */
const magickDataFlatten = (obj, opts) => {
    opts = opts || {}
    const arr = {}
    const parkey = (opts.parkey ? opts.parkey + (opts.divider || '-') : '')
    for (let key in obj) {
        if ((typeof obj[key]).toLowerCase() === 'object') {
            Object.assign(arr, magickDataFlatten(obj[key], Object.assign({}, opts, {parkey: parkey + key})))
        } else {
            arr[(opts.prefix || '') + parkey + key] = obj[key]
        }
    }
    return arr
}

exports.magickDataFlatten = magickDataFlatten

/**
 * Рекурсивно модифицирует заданный объект, создавая поля по ключам, соответствующим заданному списку.
 * При указанных опциях forceFill и fillValue - заполняет конечные создаваемые элементы объекта заданным
 * значением. Например:
 *   > let o = {}; createChildsFromKeysArr(o, ['a', 'b', 'd'], {forceFill: true, fillValue: 5});
 *   > JSON.stringify(o)
 *   output: {"a":{"b":{"d":5}}}"
 *   > let o = {a: {b: 0}}; createChildsFromKeysArr(o, ['a', 'c']); JSON.stringify(o)
 *   output: {"a":{"b":0,"c":null}}
 *
 * @param {Object} obj Заданный модифицируемый объект
 * @param {Array} path Массив ключей
 * @param {Object} opts Опции обработки объекта
 * @returns {null}
 * @private
 */
const createChildsFromKeysArr = (obj, path, opts) => {
    opts = opts || {}
    if (!path || path.length === 0) {
        return null
    }
    const key = path.shift()
    if (path.length === 0) {
        if (!obj.hasOwnProperty(key) || (opts.forceFill === true && opts.hasOwnProperty('fillValue'))) {
            obj[key] = opts.fillValue || null
        }
    } else {
        if (!obj.hasOwnProperty(key)) {
            obj[key] = {}
        }
        createChildsFromKeysArr(obj[key], path, opts)
    }
}

exports.createChildsFromKeysArr = createChildsFromKeysArr

/**
 * Создает на основе объекта, содержащего data-атрибуты, объект необходимой вложенности со структурой полей,
 * соответствующей namespace-структуре атрибутов
 * Например:
 *   > JSON.stringify(magickDataUnFlatten({"data-a-b-c":1,"data-a-d":2})['data'])
 *   output: {"a":{"b":{"c":1},"d":2}}
 *
 * @param arr
 * @param {Object} opts Опции обработки объекта
 * @returns {{}}
 * @private
 */
const magickDataUnFlatten = function (arr, opts) {
    const obj = {}
    opts = opts || {}
    Object.keys(arr || {}).forEach( (key) => {
        createChildsFromKeysArr(obj, key.split(opts.divider || '-'), {forceFill: true, fillValue: arr[key] || null})
    })
    return obj
}

exports.magickDataUnFlatten = magickDataUnFlatten

/**
 * Разбираеn переданные через контекст или директ-коллом аргументы и возвращает объект
 *
 * @param ctx
 * @param data
 * @returns {{}}|null
 */
const getCallArguments = (ctx, data) => {
    try {
        data =
            (typeof data).toLowerCase() === 'string'
                ? {p: data}
                : ((typeof data).toLowerCase() === 'object' && data.hasOwnProperty('query')
                    ? {p: data.query}
                    : (ctx.callbackQuery && ctx.callbackQuery.data.match(/^\{.*\}$/)
                        ? JSON.parse(ctx.callbackQuery.data) : null))
    } catch (e) {
        console.error(e)
    }
    return data
}

exports.getCallArguments = getCallArguments;