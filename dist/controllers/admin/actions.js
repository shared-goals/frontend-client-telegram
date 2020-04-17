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

require('dotenv').config()

// Main libs
const fs = require('fs')

const helpers = require("./helpers")
const common = __importDefault(require("../../util/common"))

/**
 * Проверяет наличие одних и тех же ключей в файлах переводов различных локалей.
 * При отсутствии где-то каких-то ключей синхронизирует структуры в файлах локалей, вставляя строки
 * из существующих переводов на другом языке. Сохраняет новые файлы поверх старых
 *
 * @param ctx - Объект контекста
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
    
    const translatesTo = convertTranslationsAction(ctx, {from: 'ru', to: 'en'})
    helpers.write(ctx, process.env.TRANSLATOR_ID, missed['en'].length + ' en-переводов отсутствуют')
    fs.writeFile('./dist/locales/en.json', JSON.stringify(translatesTo, ' ', 4)/*, function(error){
        if(error) throw error; // если возникла ошибка
        console.log("Асинхронная запись файла завершена. Содержимое файла:");
        let data = fs.readFileSync("./dist/locales/en.json", "utf8");
        console.log(data);  // выводим считанные данные
    }*/)
})

exports.checkTranslationsAction = checkTranslationsAction

/**
 * Синхронизирует структуры в файлах локалей, вставляя строки из существующих переводов на другом языке.
 * Сохраняет новые файлы поверх старых.
 *
 * @param ctx - Объект контекста
 * @param what - Объект параметров: {from: <lang_from>, to: <lang_to>}
 * @returns {*|{}}
 */
const convertTranslationsAction = (ctx, what) => {
    const lang_from = what.from
    const lang_to = what.to
    
    const repo = ctx.i18n.repository[lang_from]
    const flattenRepos = {
        from: common.magickDataFlatten(ctx.i18n.repository[lang_from], {divider: '/'}),
        to: common.magickDataFlatten(ctx.i18n.repository[lang_to], {divider: '/'})
    }
    
    Object.keys(flattenRepos.from || {}).forEach((key) => {
        flattenRepos.from[key] =
            flattenRepos.to.hasOwnProperty(key) && (typeof flattenRepos.to[key]) !== 'undefined'
                ? ((typeof flattenRepos.to[key]).toLowerCase() === 'function' ? flattenRepos.to[key]() : flattenRepos.to[key])
                : ((typeof flattenRepos.from[key]).toLowerCase() === 'function' ? flattenRepos.from[key]() : flattenRepos.from[key])
    })
    
    return common.magickDataUnFlatten(flattenRepos.from, {divider: '/'})
};
