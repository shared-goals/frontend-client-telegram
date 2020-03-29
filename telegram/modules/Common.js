'use strict'

require('dotenv').config()
const request = require('request-promise');

let logger = require('./Logger').logger
let updateCounter = require('../globals').updateCounter
let currentUser = require('../globals').currentUser
let TGAPI = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`
let SGAPI = `http://127.0.0.1:3030`


/**
 * Вспомогательная функция для использования внешних и внутренних API
 **/
function MakeRequest(method, args = {}) {
    let address = args.external === true ? SGAPI : TGAPI
    return new Promise((resolve, reject) => {
        updateCounter++
        let opt = {
            method: args.method || 'POST',
            url: `${address}/${method}`,
            form: args,
            user_id: currentUser ? currentUser.id : 0
        }
        if (args.external) {
            logger.info(opt)
        }
        request(opt, (error, response, body) => {
            if (!error) {
                resolve(JSON.parse(body))
            } else {
                reject(error)
            }
        })
    })
}

module.exports.MakeRequest = MakeRequest