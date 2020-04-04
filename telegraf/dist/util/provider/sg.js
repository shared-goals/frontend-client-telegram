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

var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod
    var result = {}
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k]
    result["default"] = mod
    return result
}

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod }
}

Object.defineProperty(exports, "__esModule", { value: true })

const imdbAPI = __importStar(require("imdb-api"))
const _logger = __importDefault(require("../logger"))
const IMDB_SEARCH_PARAMS = {
    apiKey: process.env.IMDB_API_KEY,
    timeout: 30000
}

/**
 * Returns list of movies from the imdb API
 * @param params - search parameters
 */
function imdb(params) {
    return __awaiter(this, void 0, void 0, function* () {
        let result
        try {
            result = yield imdbAPI.search({ name: params.title, year: params.year }, IMDB_SEARCH_PARAMS)
            return result.results.map(item => ({
                id: item.imdbid,
                title: item.title,
                year: item.year,
                posterUrl: item.poster
            }))
        }
        catch (e) {
            if (e.message && e.message.includes('Movie not found')) {
                // Don't log this 404 message
            }
            else {
                _logger.default.error(undefined, 'Error occurred during imdb searching for movie %O. %O', params, e)
            }
            return []
        }
    })
}

exports.imdb = imdb;
