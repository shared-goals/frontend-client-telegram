"use strict";

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

require('dotenv')

const logger = __importDefault(require("./logger"))
const request = __importDefault(require("request-promise"))

/**
 * Вспомогательная функция для использования внешних и внутренних API
 **/
async function make(ctx, url, args = {}) {
    return new Promise((resolve, reject) => {
        args.telegram_id = ctx.from.id
        // if (ctx.session.SGUser && typeof ctx.session.SGUser !== 'undefined') {
        //     args.user = { id: ctx.session.SGUser }
        // }
        let opt = {
            headers: ctx.session.SGAuthToken && typeof ctx.session.SGAuthToken !== 'undefined' ? {
                'Authorization': 'Bearer ' + ctx.session.SGAuthToken
            } : null,
            rejectUnauthorized: false,
            method: args.method || 'POST',
            url: `${process.env.SG_API}/${url}`,
            form: args
        }

        logger.default.debug(ctx, url + ' ' + JSON.stringify(opt))

        request.default(opt, (error, response, body) => {
            if (!error) {
                let responseJSON = null
                try {
                    responseJSON = JSON.parse(body)
                } catch (err) {
                    logger.default.error(err)
                }
                // console.log(error, body)
                if (responseJSON !== null) {
                    if (!responseJSON.hasOwnProperty('error')) {
                        resolve(responseJSON)
                    } else {
                        reject(responseJSON)
                    }
                }
            } else {
                reject(error)
            }
        }).catch(e => reject)
    })
}

exports.make = make;