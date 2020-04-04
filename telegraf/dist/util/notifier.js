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
const common = require("./common")
const User_1 = __importDefault(require("../models/User"))
const telegram = __importDefault(require("../telegram"))

/**
 * Find all users who observes a movie, notify them and remove movie from observables array
 * @param movie - single movie
 *
function notifyAndUpdateUsers(movie) {
    return __awaiter(this, void 0, void 0, function* () {
        const usersToNotify = yield User_1.default.find({
            observableMovies: movie._id
        })
        for (const user of usersToNotify) {
            _logger.default.debug(undefined, 'Notifying user %s about movie %s', user.username, movie.title)
            // TODO: move text to translations
            const message = user.language === 'en'
                ? `🎉 Movie ${movie.title} has been released!`
                : `🎉 Фильм ${movie.title} вышел и доступен на торрентах!`
            yield common.sleep(0.5)
            try {
                yield telegram.default.sendMessage(user._id, message)
            }
            catch (e) {
                _logger.default.error(undefined, "Can't notify user about released movie, reason: %O", e)
            }
            finally {
                // TODO: check if user blocked the bot and delete him from the DB
                yield User_1.default.findOneAndUpdate({
                    _id: user._id
                }, {
                    $pull: { observableMovies: movie._id },
                    $inc: { totalMovies: 1 }
                }, {
                    new: true
                })
            }
        }
    })
}

exports.checkUnreleasedMovies = checkUnreleasedMovies;*/
