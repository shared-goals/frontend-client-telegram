'use strict'

let logger = require('./Logger').logger


const sources = {}
const idByKeyMap = {}
const formsMessageIds = {}
let list = {}

/**
 * Класс интерфейсных скринов/экшнов/экранов/кнопок
 * @constructor
 */
function Scenes () {
    let self = this
    
    /**
     *
     * @param action
     */
    let set = (action) => {
        if (!action.hasOwnProperty('key') && action.hasOwnProperty('id')) {
            action.key = action.id
        }
        list[action.key] = action
        sources[action.key] = action
        idByKeyMap[action.id] = action.key
    }
    
    /**
     *
     * @param key
     * @returns {*}
     */
    let get = (key) => {
        let ret = (typeof list[key] !== 'undefined' ? list[key] : list[idByKeyMap[key]])
        if (ret && ret.hasOwnProperty('reply_markup') && typeof ret.reply_markup === 'string') {
            ret.reply_markup = JSON.parse(ret.reply_markup)
        }
        return ret
    }

    /**
     *
     * @param key
     * @param opts
     * @returns {*}
     */
    let getBrief = (key, opts) => {
        opts = opts || {}
        let item = get(key)
        let txtField = opts.hasOwnProperty('use') ? opts.use : 'text'
        let text = opts.hasOwnProperty('text') ? opts.text : item[txtField]
        return typeof item !== 'undefined' ? {text: text, callback_data: item.id} : {}
    }
    
    /**
     *
     * @param key
     */
    let update = (key) => {
        list[key] = sources[key]
    }
    
    /**
     *
     * @param key
     * @param msgid
     */
    self.setMessageId = (key, msgid) => {
        formsMessageIds[key] = msgid
    }
    
    /**
     *
     * @param key
     * @param msgid
     */
    self.getMessageId = (key) => {
        return formsMessageIds[key]
    }
    
    self.set = set
    self.get = get
    self.getBrief = getBrief
    self.update = update
}

let scenes = new Scenes()

logger.info('🔹️  Scenes module initiated')

module.exports.all = scenes
module.exports.sources = sources