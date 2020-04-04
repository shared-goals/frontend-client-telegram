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
const search_providers_1 = require("./provider")
// Filter search result so that only fresh movie will be visible. Used as currentYear - number
const MOVIE_TTL = 3
const movieSearchWrapper = (provider) => (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const currentYear = new Date().getFullYear()
    const { language } = ctx.session
    let title = ctx.message.text
    let year
    const yearSearchResult = ctx.message.text.match(/\[[1,2][0-9]{3}]$/g) // e.g. [2019]
    if (yearSearchResult) {
        year = Number(yearSearchResult[0].slice(1, -1))
        title = title.slice(0, -7)
    }
    const rawResult = yield provider({
        title,
        year,
        language
    })
    const filteredResult = rawResult.filter(movie => movie.year >= currentYear - MOVIE_TTL)
    _logger.default.debug(ctx, 'Movie search: params %O, results length %d', { title, year, language }, filteredResult.length)
    return filteredResult
})

exports.movieSearch = {
    en: movieSearchWrapper(search_providers_1.imdb),
    ru: movieSearchWrapper(search_providers_1.filmopotok)
};
