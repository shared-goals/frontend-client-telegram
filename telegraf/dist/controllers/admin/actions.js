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

var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod
    var result = {}
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k]
    result["default"] = mod
    return result
}

Object.defineProperty(exports, "__esModule", { value: true })

require('dotenv').config()

// Main libs
const I18n = require("telegraf-i18n")

const helpers = require("./helpers")
const common = __importDefault(require("../../util/common"))
const logger = __importDefault(require("../../util/logger"))
const session = __importDefault(require("../../util/session"))
const keyboards = require("../../util/keyboards")
const Goal = require("../../models/Goal")
const Contract = require("../../models/Contract")
const User = require("../../models/User")
const req = __importDefault(require("../../util/req"))

let shortcuts = {}
exports.shortcuts = shortcuts

/**
 *
 * @param ctx
 */
const checkTranslationsAction = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const paths = {}
    const missed = {}
    let str = ''

    // Получаем массив всех имеющихся локалей
    const locales = Object.keys(ctx.i18n.repository)
    
    // Составляем флаттен-пути всех ключей с их значениями для переводов каждой локали
    locales.forEach((lang) => {
        paths[lang] = common.flatten(ctx.i18n.repository[lang])
    })
    
    // Составляем массив взаимно отсутствующих в разных локалях ключей и соответствующих значений из других локалей
    locales.forEach((lang1) => {
        locales.forEach((lang2) => {
            if (lang1 !== lang2) {
                missed[lang1] =
                    Object.keys(paths[lang2])
                        .filter((key) => !paths[lang1].hasOwnProperty(key))
                        .map((item) => { return {path: item, exist: paths[lang2][item]()} })
            }
        })
    })
    
    locales.forEach((lang) => {
        if (missed[lang].length > 0) {
            str += `Отсутствуют переводы в locales/<b>${lang}.json</b> для ключей:\r\n\r\n`
            missed[lang].forEach((arr) => {
                str += `<code>${arr.path}</code>: ${arr.exist}\r\n`
            })
        }
    })
    
    // ctx.i18n.repository[lang]
    
    fixTranslationsAction(ctx, {from: 'ru', to: 'en'})
    
    helpers.write(ctx, process.env.TRANSLATOR_ID, missed['en'].length + ' en-переводов отсутствуют')

    ctx.replyWithHTML('<code>' + str + '</code>')
})

exports.checkTranslationsAction = checkTranslationsAction

const fixTranslationsAction = (ctx, what) => {
    const lang_from = what.from
    const lang_to = what.to
    
    const repo = ctx.i18n.repository[lang_from]
    const hashWalk = (obj) => {
        (Object.keys(obj) || []).forEach((item) => {
            console.log(item)
            if (item.isPrototypeOf(Object)) {
                console.log('объект')
            }
        })
        hashWalk(arr)
    }
    hashWalk(ctx.i18n.repository[lang_from])
}

