'use strict'

require('dotenv').config()
const request = require('request-promise');

let logger = require('./Logger').logger
let defaults = require('../globals')
let session = require('../models/Session')
let scenes = require('./Scenes')


/**
 * Вспомогательная функция для использования внешних и внутренних API
 **/
async function MakeRequest(method, args = {}) {
    let address = args.external === true ? defaults.SGAPI : defaults.TGAPI
    return new Promise((resolve, reject) => {
        defaults.updateCounter++
        // Декодируем reply_markup, вставляя вместо единтификаторов объекты кнопок
        if (args.hasOwnProperty('reply_markup')) {
            let markup = args.reply_markup;
            ['keyboard', 'inline_keyboard'].forEach(function (field) {
                if (markup.hasOwnProperty(field)) {
                    markup[field] = markup[field].map(function (obj) {
                        obj = obj.map(function (obj2) {
                            let ret = obj2.hasOwnProperty('id') ? scenes.all.getBrief(obj2.id, obj2) : obj2
                            delete ret.reply_markup
                            return ret
                        })
                        return obj
                    })
                }
            })
            args.reply_markup = JSON.stringify(markup)
        }
        if (session.currentSession) {
            if (session.currentSession.getChat()) {
                args.chat_id = session.currentSession.getChat().chat.id
            }
            if (session.currentSession.getUser()) {
                args.user_id = session.currentSession.getUser().getId()
            }
        }
        args.parse_mode = 'MarkdownV2'
        if (args.text && typeof args.text !== 'undefined') {
            args.text = args.text.replace(/([\|.()])/g, '\\$1')
        }
        let opt = {
            chat_id: args.chat_id,
            method: args.method || 'POST',
            url: `${address}/${method}`,
            form: args
        }
        if (args.external === true && typeof session.currentSession.get().hash !== 'undefined') {
            opt.headers = {
                'Authorization': 'Bearer ' + session.currentSession.get().hash
            }
            opt.rejectUnauthorized = false
        }

        let chat = session.currentSession.getChat() || {chat: {username: 'unknown yet...'}}
        logger.info('='.repeat(80) + `\r\nОтправка сообщения от ${chat.chat.username}\r\n`
            + `POST ${defaults.TGAPI}/sendMessage\r\nBody: ${JSON.stringify(opt, '', 4)}` + '\r\n')

        request(opt, (error, response, body) => {
            if (!error) {
                resolve(JSON.parse(body))
            } else {
                reject(error)
            }
        })
    })
}

logger.info('🔹️  Request module initiated')

module.exports.MakeRequest = MakeRequest